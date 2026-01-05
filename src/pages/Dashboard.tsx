import { TrendingUp, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'Total Requests Today', value: '48', change: '+12%', icon: TrendingUp, color: 'blue' },
    { label: 'Average Response Time', value: '8m', change: '-3m', icon: Clock, color: 'green' },
    { label: 'Active Staff Members', value: '24', change: '+2', icon: Users, color: 'purple' },
    { label: 'Completed Requests', value: '156', change: '+18', icon: CheckCircle, color: 'green' }
  ];

  const recentActivity = [
    { time: '2 minutes ago', action: 'New request created', user: 'Dr. Sarah Johnson', type: 'Patient Transport' },
    { time: '15 minutes ago', action: 'Request completed', user: 'Nurse Michael Chen', type: 'Medical Equipment' },
    { time: '28 minutes ago', action: 'Request escalated', user: 'Dr. Emily Rodriguez', type: 'Housekeeping' },
    { time: '45 minutes ago', action: 'New request assigned', user: 'Tech James Wilson', type: 'IT Support' }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-blue-600'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
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

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
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
