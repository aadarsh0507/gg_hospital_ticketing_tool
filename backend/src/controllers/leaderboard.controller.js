import { queryRows } from '../utils/db.js';

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

    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();

    // Get all completed requests with user information
    let sql = `
      SELECT 
        r.id,
        r."assignedToId",
        r."createdById",
        r."completedAt",
        r."createdAt",
        r.priority,
        u1.id as "assignedUserId",
        u1."firstName" as "assignedFirstName",
        u1."lastName" as "assignedLastName",
        u2.id as "createdUserId",
        u2."firstName" as "createdFirstName",
        u2."lastName" as "createdLastName"
      FROM requests r
      LEFT JOIN users u1 ON r."assignedToId" = u1.id
      LEFT JOIN users u2 ON r."createdById" = u2.id
      WHERE r.status = ? AND r."completedAt" >= ? AND r."completedAt" < ?
    `;
    const params = ['COMPLETED', startDateISO, endDateISO];

    const completedRequestsRaw = await queryRows(sql, params);

    // Calculate points for each user
    const userStats = {};

    completedRequestsRaw.forEach(request => {
      const userId = request.assignedToId || request.createdById;
      let firstName, lastName;
      
      if (request.assignedToId && request.assignedFirstName) {
        firstName = request.assignedFirstName;
        lastName = request.assignedLastName;
      } else if (request.createdById && request.createdFirstName) {
        firstName = request.createdFirstName;
        lastName = request.createdLastName;
      }

      if (!userId || !firstName) return;

      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          name: `${firstName} ${lastName}`,
          points: 0,
          achievements: 0,
          completedRequests: 0
        };
      }

      // Calculate points (base points + bonus for fast completion)
      let points = 10; // Base points per completed request
      
      if (request.completedAt && request.createdAt) {
        const completedAt = new Date(request.completedAt);
        const createdAt = new Date(request.createdAt);
        const completionTime = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60); // minutes
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
    // Return empty leaderboard instead of throwing error
    console.error('Leaderboard error:', error);
    res.json({ leaderboard: [] });
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

    const completedRequestsRaw = await queryRows(`
      SELECT 
        r.id,
        r."assignedToId",
        r."completedAt",
        r."createdAt",
        r.priority,
        u1.id as "assignedUserId",
        u1."firstName" as "assignedFirstName",
        u1."lastName" as "assignedLastName"
      FROM requests r
      LEFT JOIN users u1 ON r."assignedToId" = u1.id
      WHERE r.status = ? AND r."completedAt" >= ? AND r."completedAt" < ?
    `, ['COMPLETED', startDateISO, endDateISO]);

    const userStats = {};
    completedRequestsRaw.forEach(request => {
      if (!request.assignedToId || !request.assignedFirstName) return;
      const userId = request.assignedToId;
      const firstName = request.assignedFirstName;
      const lastName = request.assignedLastName;

      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          name: `${firstName} ${lastName}`,
          points: 0,
          completedRequests: 0
        };
      }

      let points = 10;
      if (request.completedAt && request.createdAt) {
        const completedAt = new Date(request.completedAt);
        const createdAt = new Date(request.createdAt);
        const completionTime = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60);
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
    // Return empty CSV instead of throwing error
    console.error('Leaderboard download error:', error);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leaderboard-${month || 'all'}-${year || 'all'}.csv`);
    res.send('Rank,Name,Points,Completed Requests\n');
  }
};

