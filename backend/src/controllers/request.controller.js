import { prisma } from '../utils/prisma.js';
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
    let exists = await prisma.request.findUnique({ where: { requestId } });
    while (exists) {
      requestId = generateRequestId();
      exists = await prisma.request.findUnique({ where: { requestId } });
    }

    const request = await prisma.request.create({
      data: {
        requestId,
        serviceType,
        title,
        description,
        priority: priority || 3,
        locationId,
        departmentId,
        createdById: req.user.id,
        assignedToId,
        requestedBy: requestedBy || `${req.user.firstName} ${req.user.lastName}`,
        estimatedTime
      },
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
        }
      }
    });

    // Create activity log
    await prisma.requestActivity.create({
      data: {
        requestId: request.id,
        userId: req.user.id,
        action: 'Created',
        description: 'Request created'
      }
    });

    res.status(201).json({ message: 'Request created successfully', request });
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

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          location: {
            include: {
              block: true
            }
          },
          department: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.request.count({ where })
    ]);

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

    const existingRequest = await prisma.request.findUnique({
      where: { id }
    });

    if (!existingRequest) {
      throw new AppError('Request not found', 404);
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (locationId !== undefined) updateData.locationId = locationId;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (description !== undefined) updateData.description = description;
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime;
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const request = await prisma.request.update({
      where: { id },
      data: updateData,
      include: {
        location: {
          include: {
            block: true
          }
        },
        department: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Log activity
    let activityDescription = 'Request updated';
    if (status && status !== existingRequest.status) {
      activityDescription = `Status changed to ${status}`;
    }
    if (assignedToId && assignedToId !== existingRequest.assignedToId) {
      activityDescription = 'Request reassigned';
    }

    await prisma.requestActivity.create({
      data: {
        requestId: request.id,
        userId: req.user.id,
        action: status || 'Updated',
        description: activityDescription
      }
    });

    res.json({ message: 'Request updated successfully', request });
  } catch (error) {
    next(error);
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

    const where = {
      OR: [
        { createdById: req.user.id },
        { assignedToId: req.user.id }
      ]
    };

    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          location: {
            include: {
              block: true
            }
          },
          department: true,
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.request.count({ where })
    ]);

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

