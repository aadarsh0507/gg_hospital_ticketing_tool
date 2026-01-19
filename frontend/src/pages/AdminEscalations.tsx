import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, User, Search, Filter, ChevronDown, CheckCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

interface Escalation {
  id: number;
  requestId: string;
  title: string;
  area: string;
  escalatedBy: string;
  escalatedAt: string;
  priority: string;
  status: string;
  timeSinceEscalation: string;
}

export default function AdminEscalations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch escalations from API when endpoint is available
    setLoading(false);
    setEscalations([]);
  }, []);

  const filteredEscalations = escalations.filter(escalation =>
    escalation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    escalation.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    escalation.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const priorityColors = {
    Critical: 'bg-red-100 text-red-700 border-red-200',
    High: 'bg-orange-100 text-orange-700 border-orange-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Low: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Escalations Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Monitor and manage escalated requests</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-full">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-600">Total Escalations</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{escalations.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {escalations.filter(e => e.status === 'Pending').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {escalations.filter(e => e.status === 'In Progress').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Resolved</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {escalations.filter(e => e.status === 'Resolved').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search escalations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
            <span className="text-sm text-gray-700">Priority</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
            <span className="text-sm text-gray-700">Status</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading escalations...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredEscalations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Escalations Found</h3>
            <p className="text-gray-600">Try adjusting your search query or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEscalations.map((escalation) => (
            <div
              key={escalation.id}
              className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 hover:border-red-300 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 break-words">{escalation.title}</h3>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${
                      priorityColors[escalation.priority as keyof typeof priorityColors] || priorityColors.Medium
                    }`}>
                      {escalation.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium text-blue-600">{escalation.requestId}</span> • {escalation.area}
                  </p>
                </div>
                <StatusBadge status={escalation.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-gray-200 w-full max-w-full">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span className="break-words">
                    Escalated by <strong className="text-gray-900">{escalation.escalatedBy}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span className="break-words">{escalation.escalatedAt}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <span>{escalation.timeSinceEscalation}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-200">
                <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium">
                  View Details
                </button>
                <button className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium">
                  Resolve
                </button>
                <button className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium">
                  Assign
                </button>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

