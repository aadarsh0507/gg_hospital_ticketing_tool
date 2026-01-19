import { queryRow, queryRows } from '../utils/db.js';

export const getRequestMetrics = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);
    const startDateISO = startDate.toISOString();

    // Total requests
    const totalRequestsResult = await queryRow(
      'SELECT COUNT(*) as count FROM requests WHERE "createdAt" >= ?',
      [startDateISO]
    );
    const totalRequests = Number(totalRequestsResult?.count) || 0;

    // Completed requests
    const completedRequestsResult = await queryRow(
      'SELECT COUNT(*) as count FROM requests WHERE status = ? AND "completedAt" >= ?',
      ['COMPLETED', startDateISO]
    );
    const completedRequests = Number(completedRequestsResult?.count) || 0;

    // All requests for grouping
    const allRequests = await queryRows(
      'SELECT "createdAt", "serviceType", "assignedToId" FROM requests WHERE "createdAt" >= ?',
      [startDateISO]
    );

    // Group by day
    const requestsByDay = {};
    allRequests.forEach(req => {
      const date = new Date(req.createdAt);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      requestsByDay[dateKey] = (requestsByDay[dateKey] || 0) + 1;
    });

    // Group by service type
    const requestsByServiceType = {};
    allRequests.forEach(req => {
      const type = req.serviceType || 'Unknown';
      requestsByServiceType[type] = (requestsByServiceType[type] || 0) + 1;
    });

    // Calculate work hours (assuming 8 hours per day)
    const activeStaffResult = await queryRow(
      'SELECT COUNT(*) as count FROM users WHERE role IN (?, ?) AND "isActive" = 1',
      ['STAFF', 'ADMIN']
    );
    const activeStaff = Number(activeStaffResult?.count) || 0;
    const workHours = activeStaff * parseInt(days) * 8;

    // Format daily data
    const dailyData = [];
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      
      const count = requestsByDay[dateKey] || 0;
      const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyData.push({
        date: dayName,
        value: count
      });
    }

    const avgRequestsPerStaff = activeStaff > 0 
      ? (totalRequests / activeStaff).toFixed(1)
      : '0.0';

    res.json({
      totalRequests,
      completedRequests,
      workHours,
      averageRequestsPerStaff: parseFloat(avgRequestsPerStaff),
      chartData: dailyData,
      requestsByServiceType: Object.entries(requestsByServiceType).map(([type, count]) => ({
        type,
        count
      }))
    });
  } catch (error) {
    // Return empty data instead of throwing error
    console.error('Metrics error:', error);
    res.json({
      totalRequests: 0,
      completedRequests: 0,
      workHours: 0,
      averageRequestsPerStaff: 0,
      chartData: [],
      requestsByServiceType: []
    });
  }
};

