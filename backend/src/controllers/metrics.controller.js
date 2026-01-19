import { prisma } from '../utils/prisma.js';

export const getRequestMetrics = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const [
      totalRequests,
      completedRequests,
      requestsByDay,
      requestsByServiceType,
      averageRequestsPerStaff
    ] = await Promise.all([
      // Total requests
      prisma.request.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),

      // Completed requests
      prisma.request.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate }
        }
      }),

      // Requests by day
      prisma.request.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: true
      }),

      // Requests by service type
      prisma.request.groupBy({
        by: ['serviceType'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: true
      }),

      // Calculate average requests per staff
      prisma.request.findMany({
        where: {
          createdAt: { gte: startDate },
          assignedToId: { not: null }
        },
        select: {
          assignedToId: true,
          completedAt: true,
          createdAt: true
        }
      })
    ]);

    // Calculate work hours (assuming 8 hours per day)
    const activeStaff = await prisma.user.count({
      where: {
        role: { in: ['STAFF', 'ADMIN'] },
        isActive: true
      }
    });
    const workHours = activeStaff * parseInt(days) * 8;

    // Format daily data
    const dailyData = [];
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayRequests = requestsByDay.filter(req => {
        const reqDate = new Date(req.createdAt);
        reqDate.setHours(0, 0, 0, 0);
        return reqDate.getTime() === date.getTime();
      });

      const count = dayRequests.reduce((sum, req) => sum + req._count, 0);
      
      const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyData.push({
        date: dayName,
        value: count
      });
    }

    // Calculate average requests per staff
    const staffRequestCounts = {};
    requestsByDay.forEach(req => {
      const staffId = req.assignedToId || 'unassigned';
      staffRequestCounts[staffId] = (staffRequestCounts[staffId] || 0) + req._count;
    });

    const avgRequestsPerStaff = activeStaff > 0 
      ? (totalRequests / activeStaff).toFixed(1)
      : '0.0';

    res.json({
      totalRequests,
      completedRequests,
      workHours,
      averageRequestsPerStaff: parseFloat(avgRequestsPerStaff),
      chartData: dailyData,
      requestsByServiceType: requestsByServiceType.map(item => ({
        type: item.serviceType,
        count: item._count
      }))
    });
  } catch (error) {
    next(error);
  }
};

