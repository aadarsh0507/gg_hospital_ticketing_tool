import { prisma } from '../utils/prisma.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalRequestsToday,
      completedRequestsToday,
      activeStaff,
      recentActivities,
      totalRequests,
      averageResponseTime
    ] = await Promise.all([
      // Total requests today
      prisma.request.count({
        where: {
          createdAt: {
            gte: today
          }
        }
      }),

      // Completed requests today
      prisma.request.count({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: today
          }
        }
      }),

      // Active staff members
      prisma.user.count({
        where: {
          role: { in: ['STAFF', 'ADMIN'] },
          isActive: true
        }
      }),

      // Recent activities (last 10)
      prisma.requestActivity.findMany({
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          request: {
            select: {
              id: true,
              requestId: true,
              serviceType: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Total completed requests
      prisma.request.count({
        where: {
          status: 'COMPLETED'
        }
      }),

      // Average response time
      prisma.request.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: { not: null },
          createdAt: { gte: today }
        },
        select: {
          createdAt: true,
          completedAt: true
        }
      })
    ]);

    // Calculate average response time in minutes
    let avgResponseTime = 0;
    if (averageResponseTime.length > 0) {
      const totalMinutes = averageResponseTime.reduce((sum, req) => {
        if (req.completedAt && req.createdAt) {
          const diff = req.completedAt - req.createdAt;
          return sum + Math.round(diff / (1000 * 60));
        }
        return sum;
      }, 0);
      avgResponseTime = Math.round(totalMinutes / averageResponseTime.length);
    }

    // Format recent activities
    const formattedActivities = recentActivities.map(activity => {
      const timeDiff = Date.now() - new Date(activity.createdAt).getTime();
      const minutes = Math.floor(timeDiff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      
      let timeAgo;
      if (minutes < 1) timeAgo = 'Just now';
      else if (minutes < 60) timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      else if (hours < 24) timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      else timeAgo = `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`;

      return {
        id: activity.id,
        action: activity.action,
        description: activity.description || activity.action,
        user: `${activity.user.firstName} ${activity.user.lastName}`,
        requestId: activity.request.requestId,
        serviceType: activity.request.serviceType,
        time: timeAgo,
        createdAt: activity.createdAt
      };
    });

    res.json({
      totalRequestsToday,
      completedRequestsToday,
      activeStaff,
      totalRequests,
      averageResponseTime: avgResponseTime || 0,
      recentActivities: formattedActivities
    });
  } catch (error) {
    next(error);
  }
};

