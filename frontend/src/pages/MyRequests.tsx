import { useState, useEffect, useRef } from 'react';
import { FileText, Clock, AlertTriangle, Pause, Search, ChevronDown, Plus, Calendar, X } from 'lucide-react';
import { requestsApi, locationsApi, ApiError } from '../services/api';
import ServiceRequestModal from '../components/ServiceRequestModal';
import StatusBadge from '../components/StatusBadge';

interface Request {
  id: string;
  requestId: string;
  status: string;
  createdAt: string;
  serviceType: string;
  title: string;
  description?: string;
  priority?: number;
  location?: {
    name: string;
    block?: {
      name: string;
    };
  };
  department?: {
    name: string;
  };
  requestedBy?: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

export default function MyRequests() {
  const [summaryCards, setSummaryCards] = useState([
    { label: 'New Requests', count: 0, icon: FileText, color: 'blue' },
    { label: 'Delayed Requests', count: 0, icon: Clock, color: 'yellow' },
    { label: 'Escalated Requests', count: 0, icon: AlertTriangle, color: 'red' },
    { label: 'On-Hold Requests', count: 0, icon: Pause, color: 'gray' }
  ]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [allRequests, setAllRequests] = useState<Request[]>([]); // Store all requests for filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const departmentDropdownRef = useRef<HTMLDivElement>(null);
  const dateRangeDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await locationsApi.getDepartments();
        setDepartments(response.departments || []);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target as Node)) {
        setShowDepartmentDropdown(false);
      }
      if (dateRangeDropdownRef.current && !dateRangeDropdownRef.current.contains(event.target as Node)) {
        setShowDateRangeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch requests
  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await requestsApi.getMyRequests({ limit: 100 });
      
      // Store all requests
      const allReqs = response.requests || [];
      setAllRequests(allReqs);
      
      // Apply filters
      applyFilters(allReqs);
      
      // Count requests by status (from all requests, not filtered)
      const newCount = allReqs.filter(r => r.status === 'NEW' || r.status === 'ASSIGNED').length;
      const delayedCount = allReqs.filter(r => r.status === 'DELAYED').length;
      const escalatedCount = allReqs.filter(r => r.status === 'ESCALATED').length;
      const onHoldCount = allReqs.filter(r => r.status === 'ON_HOLD').length;

      setSummaryCards([
        { label: 'New Requests', count: newCount, icon: FileText, color: 'blue' },
        { label: 'Delayed Requests', count: delayedCount, icon: Clock, color: 'yellow' },
        { label: 'Escalated Requests', count: escalatedCount, icon: AlertTriangle, color: 'red' },
        { label: 'On-Hold Requests', count: onHoldCount, icon: Pause, color: 'gray' }
      ]);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || 'Failed to load requests');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error fetching my requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  // Apply filters function
  const applyFilters = (requestsToFilter: Request[] = allRequests) => {
    let filtered = [...requestsToFilter];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.requestId.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.serviceType.toLowerCase().includes(query)
      );
    }

    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(r => 
        r.department?.name === selectedDepartment || r.department?.id === selectedDepartment
      );
    }

    // Date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(r => {
        try {
          const requestDate = new Date(r.createdAt);
          requestDate.setHours(0, 0, 0, 0);
          return requestDate.getTime() >= startDate.getTime();
        } catch (e) {
          console.error('Error parsing request date:', r.createdAt, e);
          return false;
        }
      });
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => {
        try {
          const requestDate = new Date(r.createdAt);
          return requestDate.getTime() <= endDate.getTime();
        } catch (e) {
          console.error('Error parsing request date:', r.createdAt, e);
          return false;
        }
      });
    }

    console.log('Date range filter:', { 
      start: dateRange.start, 
      end: dateRange.end,
      allRequestsCount: requestsToFilter.length,
      filteredCount: filtered.length
    });
    setRequests(filtered);
  };

  const handleApplyFilters = () => {
    applyFilters();
    setShowDepartmentDropdown(false);
    setShowDateRangeDropdown(false);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('');
    setDateRange({ start: '', end: '' });
    setRequests(allRequests);
  };

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">My Requests</h1>
        <button 
          onClick={() => setShowServiceModal(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Service Request</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 w-full max-w-full">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`${
              colorClasses[card.color as keyof typeof colorClasses]
            } rounded-xl p-3 sm:p-4 lg:p-6 border-2 hover:shadow-md transition-all cursor-pointer min-w-0 overflow-hidden`}
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
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{card.count}</p>
            <p className="text-xs sm:text-sm font-medium opacity-80 break-words">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-200 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Apply search filter in real-time
                setTimeout(() => applyFilters(), 300);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative" ref={departmentDropdownRef}>
            <button 
              onClick={() => {
                setShowDepartmentDropdown(!showDepartmentDropdown);
                setShowDateRangeDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[150px] justify-between"
            >
              <span className="text-sm text-gray-700">
                {selectedDepartment 
                  ? departments.find(d => d.id === selectedDepartment || d.name === selectedDepartment)?.name || 'Department'
                  : 'Department'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showDepartmentDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showDepartmentDropdown && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                <div 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    setSelectedDepartment('');
                    setShowDepartmentDropdown(false);
                  }}
                >
                  All Departments
                </div>
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                      selectedDepartment === dept.id || selectedDepartment === dept.name ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedDepartment(dept.id);
                      setShowDepartmentDropdown(false);
                    }}
                  >
                    {dept.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={dateRangeDropdownRef}>
            <button 
              onClick={() => {
                setShowDateRangeDropdown(!showDateRangeDropdown);
                setShowDepartmentDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[180px] justify-between"
            >
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {dateRange.start || dateRange.end 
                  ? `${dateRange.start ? new Date(dateRange.start).toLocaleDateString() : 'Start'} - ${dateRange.end ? new Date(dateRange.end).toLocaleDateString() : 'End'}`
                  : 'Date Range'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showDateRangeDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showDateRangeDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 min-w-[300px]">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      min={dateRange.start}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setDateRange({ start: '', end: '' });
                        setShowDateRangeDropdown(false);
                        // Reapply filters without date range
                        setTimeout(() => applyFilters(), 100);
                      }}
                      className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        setShowDateRangeDropdown(false);
                        // Apply filters when closing the dropdown
                        setTimeout(() => applyFilters(), 100);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleApplyFilters}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="text-sm font-medium">Apply Filters</span>
          </button>

          {(searchQuery || selectedDepartment || dateRange.start || dateRange.end) && (
            <button 
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Clear</span>
            </button>
          )}
        </div>

        {requests.length === 0 ? (
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
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{request.requestId}</p>
                    {request.description && (
                      <p className="text-sm text-gray-700 mb-2">{request.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Service:</span> {request.serviceType}
                  </span>
                  {request.location && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Location:</span> 
                      {request.location.block?.name && `${request.location.block.name} - `}
                      {request.location.name}
                    </span>
                  )}
                  {request.department && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Department:</span> {request.department.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ServiceRequestModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onSuccess={() => {
          // Refresh requests after successful creation
          const fetchMyRequests = async () => {
            try {
              setLoading(true);
              const response = await requestsApi.getMyRequests({ limit: 100 });
              
              // Store all requests
              const allReqs = response.requests || [];
              setAllRequests(allReqs);
              
              // Apply current filters
              applyFilters(allReqs);
              
              const newCount = response.requests.filter(r => r.status === 'NEW' || r.status === 'ASSIGNED').length;
              const delayedCount = response.requests.filter(r => r.status === 'DELAYED').length;
              const escalatedCount = response.requests.filter(r => r.status === 'ESCALATED').length;
              const onHoldCount = response.requests.filter(r => r.status === 'ON_HOLD').length;

              setSummaryCards([
                { label: 'New Requests', count: newCount, icon: FileText, color: 'blue' },
                { label: 'Delayed Requests', count: delayedCount, icon: Clock, color: 'yellow' },
                { label: 'Escalated Requests', count: escalatedCount, icon: AlertTriangle, color: 'red' },
                { label: 'On-Hold Requests', count: onHoldCount, icon: Pause, color: 'gray' }
              ]);
              setError(null);
            } catch (err) {
              if (err instanceof ApiError) {
                setError(err.data?.message || 'Failed to load requests');
              } else {
                setError('An unexpected error occurred');
              }
            } finally {
              setLoading(false);
            }
          };
          fetchMyRequests();
        }}
      />
    </div>
  );
}
