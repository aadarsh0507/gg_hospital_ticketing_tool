import { FileText, Clock, AlertTriangle, Pause, Search, ChevronDown, Plus, Calendar } from 'lucide-react';

export default function MyRequests() {
  const summaryCards = [
    { label: 'New Requests', count: 8, icon: FileText, color: 'blue' },
    { label: 'Delayed Requests', count: 3, icon: Clock, color: 'yellow' },
    { label: 'Escalated Requests', count: 2, icon: AlertTriangle, color: 'red' },
    { label: 'On-Hold Requests', count: 1, icon: Pause, color: 'gray' }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Service Request</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`${
              colorClasses[card.color as keyof typeof colorClasses]
            } rounded-xl p-6 border-2 hover:shadow-md transition-all cursor-pointer`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`p-3 rounded-lg ${
                  card.color === 'blue'
                    ? 'bg-blue-100'
                    : card.color === 'yellow'
                    ? 'bg-yellow-100'
                    : card.color === 'red'
                    ? 'bg-red-100'
                    : 'bg-gray-100'
                }`}
              >
                <card.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{card.count}</p>
            <p className="text-sm font-medium opacity-80">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-700">Department</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Date Range</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <span className="text-sm font-medium">Apply Filters</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-48 h-48 mb-6 flex items-center justify-center">
            <div className="relative">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-16 h-16 text-gray-300" />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Requests Found
          </h3>
          <p className="text-gray-600 text-center max-w-md">
            No requests for the selected date range. Try adjusting your filters or create a new service request.
          </p>
        </div>
      </div>
    </div>
  );
}
