import { FileBarChart, Download, Filter, Calendar, TrendingUp, Clock, Users, CheckCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('last-7-days');

  const reportTypes = [
    {
      id: 'performance',
      title: 'Performance Report',
      description: 'Request handling performance metrics',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      id: 'response-time',
      title: 'Response Time Analysis',
      description: 'Average response times by department',
      icon: Clock,
      color: 'green'
    },
    {
      id: 'staff-utilization',
      title: 'Staff Utilization Report',
      description: 'Staff workload and efficiency metrics',
      icon: Users,
      color: 'purple'
    },
    {
      id: 'completion',
      title: 'Completion Report',
      description: 'Request completion rates and trends',
      icon: CheckCircle,
      color: 'orange'
    },
    {
      id: 'department',
      title: 'Department Performance',
      description: 'Department-wise request statistics',
      icon: FileBarChart,
      color: 'red'
    },
    {
      id: 'escalation',
      title: 'Escalation Report',
      description: 'Escalated requests and resolution times',
      icon: TrendingUp,
      color: 'yellow'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600'
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Generate and download detailed reports</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Date Range</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-full">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`bg-white border-2 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer ${
                selectedReport === report.id ? 'border-blue-600' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[report.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{report.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          );
        })}
      </div>

      {selectedReport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {reportTypes.find(r => r.id === selectedReport)?.title}
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="last-7-days">Last 7 Days</option>
                <option value="last-30-days">Last 30 Days</option>
                <option value="last-90-days">Last 90 Days</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Download PDF</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-full">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <FileBarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Preview</h3>
              <p className="text-gray-600 mb-4">
                Select a date range and click "Generate Report" to view detailed analytics
              </p>
              <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedReport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <FileBarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Report Type</h3>
            <p className="text-gray-600">Choose a report type from above to view detailed analytics</p>
          </div>
        </div>
      )}
    </div>
  );
}

