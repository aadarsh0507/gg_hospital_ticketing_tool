import { prisma } from '../utils/prisma.js';

export const getLeaderboard = async (req, res, next) => {
  try {
    const { month, year, department } = req.query;
    
    const startDate = new Date();
    if (year) startDate.setFullYear(parseInt(year));
    if (month) startDate.setMonth(parseInt(month) - 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const where = {
      status: 'COMPLETED',
      completedAt: {
        gte: startDate,
        lt: endDate
      }
    };

    if (department) {
      where.department = {
        name: department
      };
    }

    // Get all completed requests with user information
    const completedRequests = await prisma.request.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true
          }
        }
      }
    });

    // Calculate points for each user
    const userStats = {};

    completedRequests.forEach(request => {
      const userId = request.assignedToId || request.createdById;
      const user = request.assignedTo || request.createdBy;

      if (!user || !userId) return;

      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          name: `${user.firstName} ${user.lastName}`,
          points: 0,
          achievements: 0,
          completedRequests: 0
        };
      }

      // Calculate points (base points + bonus for fast completion)
      let points = 10; // Base points per completed request
      
      if (request.completedAt && request.createdAt) {
        const completionTime = (request.completedAt - request.createdAt) / (1000 * 60); // minutes
        if (completionTime < 30) points += 20; // Fast completion bonus
        else if (completionTime < 60) points += 10;
      }

      // Priority bonus
      if (request.priority === 1) points += 15; // Critical priority
      else if (request.priority === 2) points += 10; // High priority

      userStats[userId].points += points;
      userStats[userId].completedRequests += 1;
      userStats[userId].achievements += 1;
    });

    // Convert to array and sort by points
    const leaderboard = Object.values(userStats)
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({
        rank: index + 1,
        ...user
      }));

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
};

export const downloadLeaderboard = async (req, res, next) => {
  try {
    // CSV export can be implemented here if needed
    // For now, just return the leaderboard data
    const { month, year, department } = req.query;
    
    const startDate = new Date();
    if (year) startDate.setFullYear(parseInt(year));
    if (month) startDate.setMonth(parseInt(month) - 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const where = {
      status: 'COMPLETED',
      completedAt: {
        gte: startDate,
        lt: endDate
      }
    };

    if (department) {
      where.department = {
        name: department
      };
    }

    const completedRequests = await prisma.request.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true
          }
        }
      }
    });

    const userStats = {};
    completedRequests.forEach(request => {
      if (!request.assignedTo) return;
      const userId = request.assignedTo.id;
      const user = request.assignedTo;

      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          name: `${user.firstName} ${user.lastName}`,
          points: 0,
          completedRequests: 0
        };
      }

      let points = 10;
      if (request.completedAt && request.createdAt) {
        const completionTime = (request.completedAt - request.createdAt) / (1000 * 60);
        if (completionTime < 30) points += 20;
        else if (completionTime < 60) points += 10;
      }

      if (request.priority === 1) points += 15;
      else if (request.priority === 2) points += 10;

      userStats[userId].points += points;
      userStats[userId].completedRequests += 1;
    });

    const leaderboard = Object.values(userStats)
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({
        rank: index + 1,
        ...user
      }));

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leaderboard-${month || 'all'}-${year || 'all'}.csv`);
    
    // Simple CSV format
    const csv = [
      ['Rank', 'Name', 'Points', 'Completed Requests'].join(','),
      ...leaderboard.map(user => [user.rank, user.name, user.points, user.completedRequests].join(','))
    ].join('\n');

    res.send(csv);
  } catch (error) {
    next(error);
  }
};

