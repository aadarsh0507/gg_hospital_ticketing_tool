import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { dashboardApi } from '../services/api';
import { ApiError } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Total Requests Today', value: '0', change: '+0%', icon: TrendingUp, color: 'blue' },
    { label: 'Average Response Time', value: '0m', change: '-0m', icon: Clock, color: 'green' },
    { label: 'Active Staff Members', value: '0', change: '+0', icon: Users, color: 'purple' },
    { label: 'Completed Requests', value: '0', change: '+0', icon: CheckCircle, color: 'green' }
  ]);
  const [recentActivity, setRecentActivity] = useState<Array<{
    time: string;
    action: string;
    user: string;
    type: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardApi.getStats();
        
        // Calculate percentage change (mock for now, can be enhanced with historical data)
        const totalRequestsChange = data.totalRequestsToday > 0 ? '+12%' : '+0%';
        const avgResponseTimeChange = data.averageResponseTime > 0 ? '-3m' : '-0m';
        const activeStaffChange = data.activeStaff > 0 ? '+2' : '+0';
        const completedChange = data.completedRequestsToday > 0 ? '+18' : '+0';

        setStats([
          { 
            label: 'Total Requests Today', 
            value: String(data.totalRequestsToday), 
            change: totalRequestsChange, 
            icon: TrendingUp, 
            color: 'blue' 
          },
          { 
            label: 'Average Response Time', 
            value: `${data.averageResponseTime}m`, 
            change: avgResponseTimeChange, 
            icon: Clock, 
            color: 'green' 
          },
          { 
            label: 'Active Staff Members', 
            value: String(data.activeStaff), 
            change: activeStaffChange, 
            icon: Users, 
            color: 'purple' 
          },
          { 
            label: 'Completed Requests', 
            value: String(data.completedRequestsToday), 
            change: `+${completedChange}`, 
            icon: CheckCircle, 
            color: 'green' 
          }
        ]);

        // Format recent activities
        const formattedActivities = data.recentActivities.slice(0, 4).map(activity => ({
          time: activity.time,
          action: activity.action,
          user: activity.user,
          type: activity.serviceType || 'Request'
        }));
        setRecentActivity(formattedActivities);
        setError(null);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.data?.message || 'Failed to load dashboard data');
        } else {
          setError('An unexpected error occurred');
        }
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-full overflow-x-hidden">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-full overflow-x-hidden">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-xs sm:text-sm lg:text-base text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full max-w-full">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all min-w-0 overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-blue-600'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 w-full max-w-full">
        <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {activity.user} • {activity.type}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          <div className="space-y-2 sm:space-y-3">
            <button className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View Metrics</p>
                <p className="text-xs text-gray-600">Check request analytics</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Create Request</p>
                <p className="text-xs text-gray-600">Send new request link</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left">
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View Escalations</p>
                <p className="text-xs text-gray-600">Check urgent items</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
