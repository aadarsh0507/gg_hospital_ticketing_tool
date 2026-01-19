import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateToken } from '../utils/generateRequestId.js';

export const createRequestLink = async (req, res, next) => {
  try {
    const { linkType, locationId, phoneNumbers } = req.body;

    // Create a temporary request for the link
    const request = await prisma.request.create({
      data: {
        requestId: `TEMP-${Date.now()}`,
        serviceType: 'OTHER',
        title: 'Request from link',
        createdById: req.user.id,
        status: 'NEW'
      }
    });

    // Create the link
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const requestLink = await prisma.requestLink.create({
      data: {
        requestId: request.id,
        linkType,
        locationId,
        phoneNumber: phoneNumbers?.[0] || null,
        token,
        expiresAt
      },
      include: {
        request: {
          include: {
            location: {
              include: {
                block: true
              }
            }
          }
        }
      }
    });

    // Generate the actual link URL
    const linkUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/request/${token}`;

    res.status(201).json({
      message: 'Request link created successfully',
      link: {
        id: requestLink.id,
        token: requestLink.token,
        url: linkUrl,
        linkType: requestLink.linkType,
        expiresAt: requestLink.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRequestLinkByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const requestLink = await prisma.requestLink.findUnique({
      where: { token },
      include: {
        request: {
          include: {
            location: {
              include: {
                block: true
              }
            }
          }
        }
      }
    });

    if (!requestLink) {
      throw new AppError('Invalid request link', 404);
    }

    if (requestLink.isUsed) {
      throw new AppError('This link has already been used', 400);
    }

    if (requestLink.expiresAt && new Date() > requestLink.expiresAt) {
      throw new AppError('This link has expired', 400);
    }

    res.json({ requestLink });
  } catch (error) {
    next(error);
  }
};

export const submitRequestViaLink = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { serviceType, title, description, priority } = req.body;

    const requestLink = await prisma.requestLink.findUnique({
      where: { token },
      include: {
        request: true
      }
    });

    if (!requestLink) {
      throw new AppError('Invalid request link', 404);
    }

    if (requestLink.isUsed) {
      throw new AppError('This link has already been used', 400);
    }

    if (requestLink.expiresAt && new Date() > requestLink.expiresAt) {
      throw new AppError('This link has expired', 400);
    }

    // Update the request with actual data
    const updatedRequest = await prisma.request.update({
      where: { id: requestLink.requestId },
      data: {
        serviceType,
        title,
        description,
        priority: priority || 3,
        status: 'NEW'
      },
      include: {
        location: {
          include: {
            block: true
          }
        }
      }
    });

    // Mark link as used
    await prisma.requestLink.update({
      where: { id: requestLink.id },
      data: { isUsed: true }
    });

    res.json({
      message: 'Request submitted successfully',
      request: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};

