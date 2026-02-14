import { db, queryRows, queryRow, execute } from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateRequestId } from '../utils/generateRequestId.js';
import { sendScheduleNotification } from '../utils/notificationService.js';
import { getCache, setCache, clearCache } from '../utils/cache.js';

export const createRequest = async (req, res, next) => {
  try {
    const {
      serviceType,
      title,
      description,
      priority,
      locationId,
      departmentId,
      requestedBy,
      assignedToId,
      estimatedTime,
      scheduledDate,
      scheduledTime,
      recurring,
      recurringPattern
    } = req.body;

    // Generate unique request ID
    let requestId = generateRequestId();
    let exists = await db.request.findUnique({ requestId });
    while (exists) {
      requestId = generateRequestId();
      exists = await db.request.findUnique({ requestId });
    }

    // Validate required fields
    if (!serviceType || !title) {
      throw new AppError('Service type and title are required', 400);
    }

    // Get user info for requestedBy
    const user = await db.user.findUnique({ id: req.user.id });
    const requestedByName = requestedBy || (user ? `${user.firstName} ${user.lastName}` : 'Unknown');

    const request = await db.request.create({
      requestId,
      serviceType,
      title,
      description,
      priority: priority || 3,
      locationId: locationId || null,
      departmentId: departmentId || null,
      createdById: req.user.id,
      assignedToId: assignedToId || null,
      requestedBy: requestedByName,
      estimatedTime: estimatedTime || null,
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || null,
      recurring: recurring || false,
      recurringPattern: recurringPattern || null
    });

    // Create activity log
    const { v4: uuidv4 } = await import('uuid');
    const activityId = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await execute(
        'INSERT INTO request_activities (id, "requestId", "userId", action, description, "createdAt") VALUES (?, ?, ?, ?, ?, ?)',
        [activityId, request.id, req.user.id, 'Created', 'Request created', now]
      );
    } catch (activityError) {
      // Log activity error but don't fail the request creation
      console.error('Failed to create activity log:', activityError);
    }

    // Fetch the created request with related data - optimized: select only needed columns
    const createdRequest = await queryRows(`
      SELECT 
        r.id, r."requestId", r."serviceType", r.title, r.description, r.priority, r.status,
        r."locationId", r."departmentId", r."createdById", r."assignedToId", r."requestedBy",
        r."createdAt", r."updatedAt", r."scheduledDate", r."scheduledTime", r.recurring, r."recurringPattern",
        l.name as "locationName", l.floor as "locationFloor", l."areaType" as "locationAreaType",
        b.name as "blockName",
        d.name as "departmentName",
        u1."firstName" as "createdByFirstName", u1."lastName" as "createdByLastName", u1.email as "createdByEmail",
        u2."firstName" as "assignedToFirstName", u2."lastName" as "assignedToLastName", u2.email as "assignedToEmail"
      FROM requests r
      LEFT JOIN locations l ON r."locationId" = l.id
      LEFT JOIN blocks b ON l."blockId" = b.id
      LEFT JOIN departments d ON r."departmentId" = d.id
      LEFT JOIN users u1 ON r."createdById" = u1.id
      LEFT JOIN users u2 ON r."assignedToId" = u2.id
      WHERE r.id = ?
    `, [request.id]);

    const formattedRequest = createdRequest[0] ? {
      ...createdRequest[0],
      location: createdRequest[0].locationName ? {
        id: createdRequest[0].locationId,
        name: createdRequest[0].locationName,
        floor: createdRequest[0].locationFloor,
        areaType: createdRequest[0].locationAreaType,
        block: createdRequest[0].blockName ? { name: createdRequest[0].blockName } : null
      } : null,
      department: createdRequest[0].departmentName ? {
        id: createdRequest[0].departmentId,
        name: createdRequest[0].departmentName
      } : null,
      createdBy: createdRequest[0].createdByFirstName ? {
        id: createdRequest[0].createdById,
        firstName: createdRequest[0].createdByFirstName,
        lastName: createdRequest[0].createdByLastName,
        email: createdRequest[0].createdByEmail
      } : null,
      assignedTo: createdRequest[0].assignedToFirstName ? {
        id: createdRequest[0].assignedToId,
        firstName: createdRequest[0].assignedToFirstName,
        lastName: createdRequest[0].assignedToLastName,
        email: createdRequest[0].assignedToEmail
      } : null
    } : request;

    // Send notification if this is a scheduled request
    if (scheduledDate || scheduledTime) {
      try {
        // Parse weekdays from recurringPattern if it's a JSON string
        let selectedWeekdays = [];
        if (recurring && recurringPattern) {
          try {
            const parsed = JSON.parse(recurringPattern);
            if (parsed.weekdays && Array.isArray(parsed.weekdays)) {
              selectedWeekdays = parsed.weekdays;
            }
          } catch (e) {
            // If not JSON, it's probably the old format (DAILY, WEEKLY, MONTHLY)
            // No weekdays to extract
          }
        }

        // Send notification to the user who created the request
        await sendScheduleNotification({
          user: user || {
            id: req.user.id,
            email: createdRequest[0]?.createdByEmail || 'unknown@example.com',
            firstName: createdRequest[0]?.createdByFirstName || 'User',
            lastName: createdRequest[0]?.createdByLastName || ''
          },
          request: formattedRequest,
          selectedWeekdays
        });
      } catch (notificationError) {
        // Log notification error but don't fail the request creation
        console.error('Failed to send schedule notification:', notificationError);
      }
    }

    // Clear scheduled requests cache when new request is created
    clearCache('scheduled_requests_');
    
    res.status(201).json({ message: 'Request created successfully', request: formattedRequest });
  } catch (error) {
    next(error);
  }
};

export const getRequests = async (req, res, next) => {
  try {
    const {
      status,
      departmentId,
      assignedToId,
      locationId,
      serviceType,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (locationId) where.locationId = locationId;
    if (serviceType) where.serviceType = serviceType;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { requestId: { contains: search } }
      ];
    }

    // Build SQL query - optimized: select only needed columns
    let sql = `
      SELECT 
        r.id, r."requestId", r."serviceType", r.title, r.description, r.priority, r.status,
        r."locationId", r."departmentId", r."createdById", r."assignedToId", r."requestedBy",
        r."createdAt", r."updatedAt", r."completedAt", r."scheduledDate", r."scheduledTime", 
        r.recurring, r."recurringPattern", r."estimatedTime",
        l.name as "locationName", l.floor as "locationFloor", l."areaType" as "locationAreaType",
        b.name as "blockName",
        d.name as "departmentName",
        u1."firstName" as "createdByFirstName", u1."lastName" as "createdByLastName",
        u2."firstName" as "assignedToFirstName", u2."lastName" as "assignedToLastName"
      FROM requests r
      LEFT JOIN locations l ON r."locationId" = l.id
      LEFT JOIN blocks b ON l."blockId" = b.id
      LEFT JOIN departments d ON r."departmentId" = d.id
      LEFT JOIN users u1 ON r."createdById" = u1.id
      LEFT JOIN users u2 ON r."assignedToId" = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (departmentId) {
      sql += ' AND r."departmentId" = ?';
      params.push(departmentId);
    }
    if (assignedToId) {
      sql += ' AND r."assignedToId" = ?';
      params.push(assignedToId);
    }
    if (locationId) {
      sql += ' AND r."locationId" = ?';
      params.push(locationId);
    }
    if (serviceType) {
      sql += ' AND r."serviceType" = ?';
      params.push(serviceType);
    }
    if (search) {
      sql += ' AND (r.title LIKE ? OR r.description LIKE ? OR r."requestId" LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ' ORDER BY r."createdAt" DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), skip);

    // Optimized: Count query doesn't need JOINs - much faster
    let countSql = 'SELECT COUNT(*) as count FROM requests r WHERE 1=1';
    const countParams = [];
    if (status) {
      countSql += ' AND r.status = ?';
      countParams.push(status);
    }
    if (departmentId) {
      countSql += ' AND r."departmentId" = ?';
      countParams.push(departmentId);
    }
    if (assignedToId) {
      countSql += ' AND r."assignedToId" = ?';
      countParams.push(assignedToId);
    }
    if (locationId) {
      countSql += ' AND r."locationId" = ?';
      countParams.push(locationId);
    }
    if (serviceType) {
      countSql += ' AND r."serviceType" = ?';
      countParams.push(serviceType);
    }
    if (search) {
      countSql += ' AND (r.title LIKE ? OR r.description LIKE ? OR r."requestId" LIKE ?)';
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Execute queries in parallel
    const [requestsRaw, totalResult] = await Promise.all([
      queryRows(sql, params),
      queryRow(countSql, countParams)
    ]);

    const total = Number(totalResult?.count) || 0;
    const requests = requestsRaw.map(req => ({
      ...req,
      location: req.locationName ? {
        id: req.locationId,
        name: req.locationName,
        floor: req.locationFloor,
        areaType: req.locationAreaType,
        block: req.blockName ? { name: req.blockName } : null
      } : null,
      department: req.departmentName ? {
        id: req.departmentId,
        name: req.departmentName
      } : null,
      createdBy: req.createdByFirstName ? {
        id: req.createdById,
        firstName: req.createdByFirstName,
        lastName: req.createdByLastName
      } : null,
      assignedTo: req.assignedToFirstName ? {
        id: req.assignedToId,
        firstName: req.assignedToFirstName,
        lastName: req.assignedToLastName
      } : null
    }));

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.json({
      requests: [],
      pagination: {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        total: 0,
        pages: 0
      }
    });
  }
};

export const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Optimized: Single query with JOINs instead of multiple sequential queries
    const requestSql = `
      SELECT 
        r.*,
        l.id as "location_id", l.name as "location_name", l.floor as "location_floor",
        l."areaType" as "location_areaType", l."blockId" as "location_blockId",
        b.id as "block_id", b.name as "block_name", b.description as "block_description",
        d.id as "department_id", d.name as "department_name", d.description as "department_description",
        u1.id as "createdBy_id", u1."firstName" as "createdBy_firstName", 
        u1."lastName" as "createdBy_lastName", u1.email as "createdBy_email",
        u2.id as "assignedTo_id", u2."firstName" as "assignedTo_firstName",
        u2."lastName" as "assignedTo_lastName", u2.email as "assignedTo_email"
      FROM requests r
      LEFT JOIN locations l ON r."locationId" = l.id
      LEFT JOIN blocks b ON l."blockId" = b.id
      LEFT JOIN departments d ON r."departmentId" = d.id
      LEFT JOIN users u1 ON r."createdById" = u1.id
      LEFT JOIN users u2 ON r."assignedToId" = u2.id
      WHERE r.id = ?
    `;

    const requestRaw = await queryRow(requestSql, [id]);

    if (!requestRaw) {
      throw new AppError('Request not found', 404);
    }

    // Get activities in parallel (optional, can be lazy-loaded)
    let activities = [];
    try {
      const activitiesSql = `
        SELECT ra.*, 
               u.id as "userId", u."firstName" as "userFirstName", u."lastName" as "userLastName"
        FROM request_activities ra
        LEFT JOIN users u ON ra."userId" = u.id
        WHERE ra."requestId" = ?
        ORDER BY ra."createdAt" DESC
        LIMIT 50
      `;
      activities = await queryRows(activitiesSql, [id]);
    } catch (err) {
      // Activities table might not exist or have issues, just continue without them
      console.warn('Could not fetch activities:', err.message);
    }

    // Format the response to match expected structure
    const request = {
      ...requestRaw,
      location: requestRaw.location_id ? {
        id: requestRaw.location_id,
        name: requestRaw.location_name,
        floor: requestRaw.location_floor,
        areaType: requestRaw.location_areaType,
        block: requestRaw.block_id ? {
          id: requestRaw.block_id,
          name: requestRaw.block_name,
          description: requestRaw.block_description
        } : null
      } : null,
      department: requestRaw.department_id ? {
        id: requestRaw.department_id,
        name: requestRaw.department_name,
        description: requestRaw.department_description
      } : null,
      createdBy: requestRaw.createdBy_id ? {
        id: requestRaw.createdBy_id,
        firstName: requestRaw.createdBy_firstName,
        lastName: requestRaw.createdBy_lastName,
        email: requestRaw.createdBy_email
      } : null,
      assignedTo: requestRaw.assignedTo_id ? {
        id: requestRaw.assignedTo_id,
        firstName: requestRaw.assignedTo_firstName,
        lastName: requestRaw.assignedTo_lastName,
        email: requestRaw.assignedTo_email
      } : null,
      activities: activities.map(act => ({
        id: act.id,
        requestId: act.requestId,
        action: act.action,
        description: act.description,
        createdAt: act.createdAt,
        user: act.userId ? {
          id: act.userId,
          firstName: act.userFirstName,
          lastName: act.userLastName
        } : null
      }))
    };

    res.json({ request });
  } catch (error) {
    next(error);
  }
};

export const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      assignedToId,
      locationId,
      departmentId,
      description,
      estimatedTime,
      serviceType,
      title,
      scheduledDate,
      scheduledTime,
      recurring,
      recurringPattern
    } = req.body;

    // Get existing request
    const existingRequestRaw = await queryRows(
      'SELECT * FROM requests WHERE id = ?',
      [id]
    );

    if (!existingRequestRaw || existingRequestRaw.length === 0) {
      throw new AppError('Request not found', 404);
    }

    const existingRequest = existingRequestRaw[0];

    // Validate status if provided
    const validStatuses = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ACTION_TAKEN', 'COMPLETED', 'CLOSED', 'ON_HOLD', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Validate assignment permissions if assignedToId is being updated
    if (assignedToId !== undefined) {
      const currentUserRole = req.user?.role?.toUpperCase();
      const isAdminOrHOD = currentUserRole === 'ADMIN' || currentUserRole === 'HOD';
      const isStaff = currentUserRole === 'STAFF';

      // If assigning to a user (not null), validate permissions
      if (assignedToId) {
        // Check if the assigned user exists and is active
        const assignedUser = await queryRow(
          'SELECT id, role, "isActive" FROM users WHERE id = ?',
          [assignedToId]
        );

        if (!assignedUser) {
          throw new AppError('Assigned user not found', 404);
        }

        if (assignedUser.isActive !== 1 && assignedUser.isActive !== true) {
          throw new AppError('Cannot assign to an inactive user', 400);
        }

        // Permission checks:
        // - HOD and Admin can assign to any user
        // - Staff can only assign to themselves or other staff users
        if (!isAdminOrHOD && isStaff) {
          const assignedUserRole = assignedUser.role?.toUpperCase();
          const isAssigningToSelf = assignedToId === req.user.id;
          const isAssigningToStaff = assignedUserRole === 'STAFF';

          if (!isAssigningToSelf && !isAssigningToStaff) {
            throw new AppError('Staff users can only assign tickets to themselves or other staff members', 403);
          }
        } else if (!isAdminOrHOD && !isStaff) {
          throw new AppError('You do not have permission to assign tickets', 403);
        }
      }
    }

    // Build update query
    const updateFields = [];
    const updateParams = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }
    if (priority !== undefined) {
      updateFields.push('priority = ?');
      updateParams.push(priority);
    }
    if (assignedToId !== undefined) {
      updateFields.push('"assignedToId" = ?');
      updateParams.push(assignedToId || null);
    }
    if (locationId !== undefined) {
      updateFields.push('"locationId" = ?');
      updateParams.push(locationId || null);
    }
    if (departmentId !== undefined) {
      updateFields.push('"departmentId" = ?');
      updateParams.push(departmentId || null);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description);
    }
    if (estimatedTime !== undefined) {
      updateFields.push('"estimatedTime" = ?');
      updateParams.push(estimatedTime || null);
    }
    if (serviceType !== undefined) {
      updateFields.push('"serviceType" = ?');
      updateParams.push(serviceType);
    }
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateParams.push(title);
    }
    if (scheduledDate !== undefined) {
      updateFields.push('"scheduledDate" = ?');
      updateParams.push(scheduledDate || null);
    }
    if (scheduledTime !== undefined) {
      updateFields.push('"scheduledTime" = ?');
      updateParams.push(scheduledTime || null);
    }
    if (recurring !== undefined) {
      updateFields.push('"recurring" = ?');
      updateParams.push(recurring ? 1 : 0);
    }
    if (recurringPattern !== undefined) {
      updateFields.push('"recurringPattern" = ?');
      updateParams.push(recurringPattern || null);
    }

    if (status === 'COMPLETED' || status === 'CLOSED') {
      updateFields.push('"completedAt" = ?');
      updateParams.push(new Date().toISOString());
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updateFields.push('"updatedAt" = ?');
    updateParams.push(new Date().toISOString());
    updateParams.push(id);

    // Update request
    await execute(
      `UPDATE requests SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    // Log activity
    const { v4: uuidv4 } = await import('uuid');
    const activityId = uuidv4();
    const now = new Date().toISOString();
    
    let activityDescription = 'Request updated';
    let activityAction = 'Updated';
    
    if (status && status !== existingRequest.status) {
      activityDescription = `Status changed from ${existingRequest.status} to ${status}`;
      activityAction = status;
    }
    if (assignedToId !== undefined && assignedToId !== existingRequest.assignedToId) {
      if (assignedToId) {
        // Get assigned user name for activity log
        try {
          const assignedUser = await queryRow(
            'SELECT "firstName", "lastName" FROM users WHERE id = ?',
            [assignedToId]
          );
          const assignedUserName = assignedUser 
            ? `${assignedUser.firstName} ${assignedUser.lastName}`
            : 'Unknown User';
          activityDescription = `Request assigned to ${assignedUserName}`;
        } catch (err) {
          // If user lookup fails, just log assignment without name
          activityDescription = 'Request assigned';
        }
      } else {
        activityDescription = 'Request unassigned';
      }
      activityAction = 'Reassigned';
    }

    try {
      await execute(
        'INSERT INTO request_activities (id, "requestId", "userId", action, description, "createdAt") VALUES (?, ?, ?, ?, ?, ?)',
        [activityId, id, req.user.id, activityAction, activityDescription, now]
      );
    } catch (activityError) {
      console.error('Failed to create activity log:', activityError);
    }

    // Fetch updated request with related data - optimized: select only needed columns
    const updatedRequestRaw = await queryRows(`
      SELECT 
        r.id, r."requestId", r."serviceType", r.title, r.description, r.priority, r.status,
        r."locationId", r."departmentId", r."createdById", r."assignedToId", r."requestedBy",
        r."createdAt", r."updatedAt", r."scheduledDate", r."scheduledTime", r.recurring, r."recurringPattern",
        l.name as "locationName", l.floor as "locationFloor", l."areaType" as "locationAreaType",
        b.name as "blockName",
        d.name as "departmentName",
        u1."firstName" as "createdByFirstName", u1."lastName" as "createdByLastName", u1.email as "createdByEmail",
        u2."firstName" as "assignedToFirstName", u2."lastName" as "assignedToLastName", u2.email as "assignedToEmail"
      FROM requests r
      LEFT JOIN locations l ON r."locationId" = l.id
      LEFT JOIN blocks b ON l."blockId" = b.id
      LEFT JOIN departments d ON r."departmentId" = d.id
      LEFT JOIN users u1 ON r."createdById" = u1.id
      LEFT JOIN users u2 ON r."assignedToId" = u2.id
      WHERE r.id = ?
    `, [id]);

    if (!updatedRequestRaw || updatedRequestRaw.length === 0) {
      throw new AppError('Failed to fetch updated request', 500);
    }

    const updatedRequest = updatedRequestRaw[0];
    const formattedRequest = {
      ...updatedRequest,
      location: updatedRequest.locationName ? {
        id: updatedRequest.locationId,
        name: updatedRequest.locationName,
        floor: updatedRequest.locationFloor,
        areaType: updatedRequest.locationAreaType,
        block: updatedRequest.blockName ? { name: updatedRequest.blockName } : null
      } : null,
      department: updatedRequest.departmentName ? {
        id: updatedRequest.departmentId,
        name: updatedRequest.departmentName
      } : null,
      createdBy: updatedRequest.createdByFirstName ? {
        id: updatedRequest.createdById,
        firstName: updatedRequest.createdByFirstName,
        lastName: updatedRequest.createdByLastName,
        email: updatedRequest.createdByEmail
      } : null,
      assignedTo: updatedRequest.assignedToFirstName ? {
        id: updatedRequest.assignedToId,
        firstName: updatedRequest.assignedToFirstName,
        lastName: updatedRequest.assignedToLastName,
        email: updatedRequest.assignedToEmail
      } : null
    };

    // Clear scheduled requests cache when request is updated
    clearCache('scheduled_requests_');
    
    res.json({ message: 'Request updated successfully', request: formattedRequest });
  } catch (error) {
    console.error('Update request error:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError(error.message || 'Failed to update request', 500));
  }
};

export const deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.request.findUnique({
      where: { id }
    });

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    await prisma.request.delete({
      where: { id }
    });

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getScheduledRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;  // Further reduced limit for faster initial load
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userRole = req.user.role?.toUpperCase();
    
    // Cache key based on user and filters (2 minute TTL for scheduled requests)
    const cacheKey = `scheduled_requests_${req.user.id}_${userRole}_${page}_${limit}_${search || ''}`;
    const cached = getCache(cacheKey);
    if (cached && !search) {  // Only cache when not searching
      return res.json(cached);
    }

    // Build SQL query - optimized: select only needed columns
    let sql = `
      SELECT 
        r.id, r."requestId", r."serviceType", r.title, r.description, r.priority, r.status,
        r."locationId", r."departmentId", r."createdById", r."assignedToId", r."requestedBy",
        r."createdAt", r."updatedAt", r."scheduledDate", r."scheduledTime", r.recurring, r."recurringPattern",
        l.name as "locationName", l.floor as "locationFloor", l."areaType" as "locationAreaType",
        b.name as "blockName",
        d.name as "departmentName",
        u1."firstName" as "createdByFirstName", u1."lastName" as "createdByLastName",
        u2."firstName" as "assignedToFirstName", u2."lastName" as "assignedToLastName"
      FROM requests r
      LEFT JOIN locations l ON r."locationId" = l.id
      LEFT JOIN blocks b ON l."blockId" = b.id
      LEFT JOIN departments d ON r."departmentId" = d.id
      LEFT JOIN users u1 ON r."createdById" = u1.id
      LEFT JOIN users u2 ON r."assignedToId" = u2.id
      WHERE r."scheduledDate" IS NOT NULL
    `;
    const params = [];

    // Filter by user role: REQUESTER sees only their own, HOD and ADMIN see all
    if (userRole === 'REQUESTER') {
      sql += ' AND r."createdById" = ?';
      params.push(req.user.id);
    }
    // HOD and ADMIN see all scheduled requests (no additional filter)

    if (search) {
      sql += ' AND (r.title LIKE ? OR r.description LIKE ? OR r."requestId" LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Use index-friendly ordering
    sql += ' ORDER BY r."scheduledDate" ASC, r."scheduledTime" ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), skip);

    // Get total count
    let countSql = 'SELECT COUNT(*) as count FROM requests r WHERE r."scheduledDate" IS NOT NULL';
    const countParams = [];
    
    if (userRole === 'REQUESTER') {
      countSql += ' AND r."createdById" = ?';
      countParams.push(req.user.id);
    }

    if (search) {
      countSql += ' AND (r.title LIKE ? OR r.description LIKE ? OR r."requestId" LIKE ?)';
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const [requestsRaw, totalResult] = await Promise.all([
      queryRows(sql, params),
      queryRow(countSql, countParams)
    ]);

    const total = Number(totalResult?.count) || 0;
    // Optimized: Minimal transformation, let frontend handle formatting
    const scheduledRequests = requestsRaw.map(req => ({
      id: req.id,
      requestId: req.requestId,
      serviceType: req.serviceType,
      title: req.title,
      description: req.description,
      priority: req.priority,
      status: req.status,
      locationId: req.locationId,
      departmentId: req.departmentId,
      createdById: req.createdById,
      assignedToId: req.assignedToId,
      requestedBy: req.requestedBy,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      scheduledDate: req.scheduledDate, // Keep as ISO string for frontend
      scheduledTime: req.scheduledTime,
      recurring: req.recurring === 1 || req.recurring === true,
      recurringPattern: req.recurringPattern,
      // Include related data in flat format for faster processing
      locationName: req.locationName,
      locationFloor: req.locationFloor,
      locationAreaType: req.locationAreaType,
      blockName: req.blockName,
      departmentName: req.departmentName,
      createdByFirstName: req.createdByFirstName,
      createdByLastName: req.createdByLastName,
      assignedToFirstName: req.assignedToFirstName,
      assignedToLastName: req.assignedToLastName,
      // Also include nested format for backward compatibility
      location: req.locationName ? {
        id: req.locationId,
        name: req.locationName,
        floor: req.locationFloor,
        areaType: req.locationAreaType,
        block: req.blockName ? { name: req.blockName } : null
      } : null,
      department: req.departmentName ? {
        id: req.departmentId,
        name: req.departmentName
      } : null,
      createdBy: req.createdByFirstName ? {
        id: req.createdById,
        firstName: req.createdByFirstName,
        lastName: req.createdByLastName
      } : null,
      assignedTo: req.assignedToFirstName ? {
        id: req.assignedToId,
        firstName: req.assignedToFirstName,
        lastName: req.assignedToLastName
      } : null
    }));

    const response = {
      scheduledRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
    
    // Cache response for 2 minutes (only if not searching)
    if (!search) {
      setCache(cacheKey, response, 120);
    }
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getMyRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Optimized: select only needed columns
    let sql = `
      SELECT 
        r.id, r."requestId", r."serviceType", r.title, r.description, r.priority, r.status,
        r."locationId", r."departmentId", r."createdById", r."assignedToId", r."requestedBy",
        r."createdAt", r."updatedAt", r."scheduledDate", r."scheduledTime", r.recurring, r."recurringPattern",
        l.name as "locationName", l.floor as "locationFloor", l."areaType" as "locationAreaType",
        b.name as "blockName",
        d.name as "departmentName",
        u2."firstName" as "assignedToFirstName", u2."lastName" as "assignedToLastName"
      FROM requests r
      LEFT JOIN locations l ON r."locationId" = l.id
      LEFT JOIN blocks b ON l."blockId" = b.id
      LEFT JOIN departments d ON r."departmentId" = d.id
      LEFT JOIN users u2 ON r."assignedToId" = u2.id
      WHERE (r."createdById" = ? OR r."assignedToId" = ?)
    `;
    const params = [req.user.id, req.user.id];

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY r."createdAt" DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), skip);

    // Optimized: Count query without JOINs
    let countSql = 'SELECT COUNT(*) as count FROM requests r WHERE (r."createdById" = ? OR r."assignedToId" = ?)';
    const countParams = [req.user.id, req.user.id];
    if (status) {
      countSql += ' AND r.status = ?';
      countParams.push(status);
    }

    // Execute queries in parallel
    const [requestsRaw, totalResult] = await Promise.all([
      queryRows(sql, params),
      queryRow(countSql, countParams)
    ]);

    const total = Number(totalResult?.count) || 0;
    const requests = requestsRaw.map(req => ({
      ...req,
      location: req.locationName ? {
        id: req.locationId,
        name: req.locationName,
        floor: req.locationFloor,
        areaType: req.locationAreaType,
        block: req.blockName ? { name: req.blockName } : null
      } : null,
      department: req.departmentName ? {
        id: req.departmentId,
        name: req.departmentName
      } : null,
      assignedTo: req.assignedToFirstName ? {
        id: req.assignedToId,
        firstName: req.assignedToFirstName,
        lastName: req.assignedToLastName
      } : null
    }));

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

