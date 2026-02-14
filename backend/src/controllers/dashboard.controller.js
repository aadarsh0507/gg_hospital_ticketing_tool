import { db, queryRows, queryRow } from '../utils/db.js';
import { getCache, setCache } from '../utils/cache.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    // Check cache first (5 minute TTL for dashboard stats)
    const cacheKey = 'dashboard_stats';
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Optimize: Run all queries in parallel instead of sequentially
    const [
      totalRequestsTodayResult,
      completedRequestsTodayResult,
      activeStaffResult,
      recentActivitiesRaw,
      totalRequestsResult,
      averageResponseTimeRaw
    ] = await Promise.all([
      // Total requests today
      queryRow(
        'SELECT COUNT(*) as count FROM requests WHERE "createdAt" >= ?',
        [todayISO]
      ),
      // Completed requests today
      queryRow(
        'SELECT COUNT(*) as count FROM requests WHERE status = ? AND "completedAt" >= ?',
        ['COMPLETED', todayISO]
      ),
      // Active staff members
      queryRow(
        'SELECT COUNT(*) as count FROM users WHERE role IN (?, ?) AND "isActive" = 1',
        ['STAFF', 'ADMIN']
      ),
      // Recent activities (last 10) - optimized with index and reduced JOIN overhead
      queryRows(`
        SELECT 
          ra.id,
          ra.action,
          ra.description,
          ra."createdAt",
          u."firstName" as "userFirstName",
          u."lastName" as "userLastName",
          r."requestId" as "requestRequestId",
          r."serviceType"
        FROM request_activities ra
        LEFT JOIN users u ON ra."userId" = u.id
        LEFT JOIN requests r ON ra."requestId" = r.id
        ORDER BY ra."createdAt" DESC
        LIMIT 10
      `),
      // Total completed requests
      queryRow(
        'SELECT COUNT(*) as count FROM requests WHERE status = ?',
        ['COMPLETED']
      ),
      // Average response time - optimized: only fetch what we need, limit to 50
      queryRows(
        `SELECT "createdAt", "completedAt" FROM requests 
         WHERE status = ? AND "completedAt" IS NOT NULL AND "createdAt" >= ?
         ORDER BY "completedAt" DESC
         LIMIT 50`,
        ['COMPLETED', todayISO]
      )
    ]);

    const totalRequestsToday = Number(totalRequestsTodayResult?.count) || 0;
    const completedRequestsToday = Number(completedRequestsTodayResult?.count) || 0;
    const activeStaff = Number(activeStaffResult?.count) || 0;
    const totalRequests = Number(totalRequestsResult?.count) || 0;

    // Calculate average response time in minutes
    let avgResponseTime = 0;
    if (averageResponseTimeRaw.length > 0) {
      const totalMinutes = averageResponseTimeRaw.reduce((sum, req) => {
        if (req.completedAt && req.createdAt) {
          const createdAt = new Date(req.createdAt);
          const completedAt = new Date(req.completedAt);
          const diff = completedAt.getTime() - createdAt.getTime();
          return sum + Math.round(diff / (1000 * 60));
        }
        return sum;
      }, 0);
      avgResponseTime = Math.round(totalMinutes / averageResponseTimeRaw.length);
    }

    // Format recent activities
    const formattedActivities = recentActivitiesRaw.map(activity => {
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
        user: `${activity.userFirstName || ''} ${activity.userLastName || ''}`.trim() || 'Unknown User',
        requestId: activity.requestRequestId || activity.requestId,
        serviceType: activity.serviceType || 'Unknown',
        time: timeAgo,
        createdAt: activity.createdAt
      };
    });

    const response = {
      totalRequestsToday,
      completedRequestsToday,
      activeStaff,
      totalRequests,
      averageResponseTime: avgResponseTime || 0,
      recentActivities: formattedActivities
    };

    // Cache the response for 5 minutes
    setCache(cacheKey, response, 300);

    res.json(response);
  } catch (error) {
    next(error);
  }
};

