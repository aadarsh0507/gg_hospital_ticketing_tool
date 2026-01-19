import { db, queryRows, queryRow, execute } from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateRequestId } from '../utils/generateRequestId.js';

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
      estimatedTime
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
      estimatedTime: estimatedTime || null
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

    // Fetch the created request with related data
    const createdRequest = await queryRows(`
      SELECT r.*,
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

    // Build SQL query
    let sql = `
      SELECT r.*, 
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

    // Get total count
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

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        location: {
          include: {
            block: true,
            department: true
          }
        },
        department: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!request) {
      throw new AppError('Request not found', 404);
    }

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
      estimatedTime
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
      activityDescription = 'Request reassigned';
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

    // Fetch updated request with related data
    const updatedRequestRaw = await queryRows(`
      SELECT r.*,
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

export const getMyRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT r.*, 
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

    // Get total count
    let countSql = 'SELECT COUNT(*) as count FROM requests r WHERE (r."createdById" = ? OR r."assignedToId" = ?)';
    const countParams = [req.user.id, req.user.id];
    if (status) {
      countSql += ' AND r.status = ?';
      countParams.push(status);
    }

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

