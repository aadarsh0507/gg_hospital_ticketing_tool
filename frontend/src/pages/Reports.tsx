import { useState, useEffect } from 'react';
import { FileBarChart, Download, Filter, Search, ChevronDown, X, CheckSquare, Square } from 'lucide-react';
import { requestsApi, locationsApi, ApiError } from '../services/api';
import StatusBadge from '../components/StatusBadge';

interface Activity {
  id: string;
  action: string;
  description?: string;
  createdAt: string;
}

interface Request {
  id: string;
  requestId: string;
  title: string;
  description?: string;
  serviceType: string;
  priority: number;
  status: string;
  location?: {
    name: string;
    block?: {
      name: string;
    };
  };
  department?: {
    name: string;
  };
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  requestedBy?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  recurring: boolean;
  recurringPattern?: string;
  estimatedTime?: number;
  activities?: Activity[];
}

export default function Reports() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  });

  // Available columns for export
  const availableColumns = [
    { key: 'requestId', label: 'Request ID' },
    { key: 'title', label: 'Title' },
    { key: 'serviceType', label: 'Service Type' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'location', label: 'Location' },
    { key: 'department', label: 'Department' },
    { key: 'requestedBy', label: 'Requested By' },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'createdAt', label: 'Created Date' },
    { key: 'updatedAt', label: 'Updated Date' },
    { key: 'completedAt', label: 'Completed Date' },
    { key: 'tatTime', label: 'TAT Time' },
    { key: 'scheduledDate', label: 'Scheduled Date' },
    { key: 'scheduledTime', label: 'Scheduled Time' },
    { key: 'recurring', label: 'Recurring' },
    { key: 'estimatedTime', label: 'Estimated Time (min)' }
  ];

  // Selected columns state - default to all selected
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(availableColumns.map(col => col.key))
  );

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    new: 0,
    cancelled: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    fetchDepartments();
    fetchAllRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, departmentFilter, serviceTypeFilter, dateRange, startDate, endDate, searchQuery, allRequests]);

  const fetchDepartments = async () => {
    try {
      const response = await locationsApi.getDepartments();
      setDepartments(response.departments || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all requests with pagination
      let allFetchedRequests: Request[] = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 100;

      while (hasMore) {
        const response = await requestsApi.getRequests({
          page: currentPage,
          limit: pageSize
        });
        
        if (response.requests && response.requests.length > 0) {
          allFetchedRequests = [...allFetchedRequests, ...response.requests];
          if (response.requests.length < pageSize || currentPage >= response.pagination.pages) {
            hasMore = false;
          } else {
            currentPage++;
          }
        } else {
          hasMore = false;
        }
      }

      // Fetch activities for completed requests only (to calculate TAT excluding ON_HOLD)
      const completedRequests = allFetchedRequests.filter(r => r.status === 'COMPLETED');
      const activitiesMap = new Map<string, Activity[]>();
      
      // Fetch activities in batches to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < completedRequests.length; i += batchSize) {
        const batch = completedRequests.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (req) => {
            try {
              const requestDetail = await requestsApi.getRequestById(req.id);
              if (requestDetail.request?.activities) {
                activitiesMap.set(req.id, requestDetail.request.activities);
              }
            } catch (err) {
              console.warn(`Failed to fetch activities for request ${req.id}:`, err);
            }
          })
        );
      }

      // Attach activities to requests
      allFetchedRequests = allFetchedRequests.map(req => ({
        ...req,
        activities: activitiesMap.get(req.id) || []
      }));

      setAllRequests(allFetchedRequests);
      calculateStats(allFetchedRequests);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || 'Failed to load requests');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requestsList: Request[]) => {
    const total = requestsList.length;
    const completed = requestsList.filter(r => r.status === 'COMPLETED').length;
    const inProgress = requestsList.filter(r => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length;
    const newCount = requestsList.filter(r => r.status === 'NEW').length;
    const cancelled = requestsList.filter(r => r.status === 'CANCELLED').length;

    // Calculate average response time for completed requests
    const completedRequests = requestsList.filter(r => r.status === 'COMPLETED' && r.completedAt && r.createdAt);
    let avgResponseTime = 0;
    if (completedRequests.length > 0) {
      const totalMinutes = completedRequests.reduce((sum, req) => {
        const createdAt = new Date(req.createdAt);
        const completedAt = new Date(req.completedAt!);
        const diff = completedAt.getTime() - createdAt.getTime();
        return sum + Math.round(diff / (1000 * 60));
      }, 0);
      avgResponseTime = Math.round(totalMinutes / completedRequests.length);
    }

    setStats({
      total,
      completed,
      inProgress,
      new: newCount,
      cancelled,
      avgResponseTime
    });
  };

  const applyFilters = () => {
    let filtered = [...allRequests];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(r => r.department?.name === departmentFilter);
    }

    // Service type filter
    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(r => r.serviceType === serviceTypeFilter);
    }

    // Date range filter
    if (dateRange === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => {
        const created = new Date(r.createdAt);
        return created >= start && created <= end;
      });
    } else if (dateRange !== 'all') {
      const now = new Date();
      let start = new Date();
      
      switch (dateRange) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          break;
        case 'last-7-days':
          start.setDate(now.getDate() - 7);
          break;
        case 'last-30-days':
          start.setDate(now.getDate() - 30);
          break;
        case 'last-90-days':
          start.setDate(now.getDate() - 90);
          break;
        case 'this-month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last-month':
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          filtered = filtered.filter(r => {
            const created = new Date(r.createdAt);
            return created >= start && created <= lastMonthEnd;
          });
          break;
      }
      
      if (dateRange !== 'last-month') {
        filtered = filtered.filter(r => {
          const created = new Date(r.createdAt);
          return created >= start && created <= now;
        });
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title?.toLowerCase().includes(query) ||
        r.requestId?.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.serviceType?.toLowerCase().includes(query) ||
        r.requestedBy?.toLowerCase().includes(query) ||
        r.createdBy?.firstName?.toLowerCase().includes(query) ||
        r.createdBy?.lastName?.toLowerCase().includes(query)
      );
    }

    // Update pagination
    const total = filtered.length;
    const pages = Math.ceil(total / pagination.limit);
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedRequests = filtered.slice(startIndex, endIndex);

    setRequests(paginatedRequests);
    setPagination(prev => ({ ...prev, total, pages }));
  };

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  const selectAllColumns = () => {
    setSelectedColumns(new Set(availableColumns.map(col => col.key)));
  };

  const deselectAllColumns = () => {
    setSelectedColumns(new Set());
  };

  const exportToCSV = () => {
    if (selectedColumns.size === 0) {
      alert('Please select at least one column to export.');
      return;
    }

    // Get selected columns in order
    const columnsToExport = availableColumns.filter(col => selectedColumns.has(col.key));
    const headers = columnsToExport.map(col => col.label);

    const rows = allRequests.map(req => {
      const row: any[] = [];
      columnsToExport.forEach(col => {
        switch (col.key) {
          case 'requestId':
            row.push(req.requestId || '');
            break;
          case 'title':
            row.push(req.title || '');
            break;
          case 'serviceType':
            row.push(req.serviceType || '');
            break;
          case 'status':
            row.push(req.status || '');
            break;
          case 'priority':
            row.push(req.priority?.toString() || '');
            break;
          case 'location':
            row.push(req.location?.name || '');
            break;
          case 'department':
            row.push(req.department?.name || '');
            break;
          case 'requestedBy':
            row.push(req.requestedBy || `${req.createdBy?.firstName || ''} ${req.createdBy?.lastName || ''}`.trim() || '');
            break;
          case 'assignedTo':
            row.push(req.assignedTo ? `${req.assignedTo.firstName} ${req.assignedTo.lastName}` : '');
            break;
          case 'createdAt':
            row.push(req.createdAt ? new Date(req.createdAt).toLocaleString() : '');
            break;
          case 'updatedAt':
            row.push(req.updatedAt ? new Date(req.updatedAt).toLocaleString() : '');
            break;
          case 'completedAt':
            row.push(req.completedAt ? new Date(req.completedAt).toLocaleString() : '');
            break;
          case 'tatTime':
            row.push(calculateTAT(req));
            break;
          case 'scheduledDate':
            row.push(req.scheduledDate ? new Date(req.scheduledDate).toLocaleDateString() : '');
            break;
          case 'scheduledTime':
            row.push(req.scheduledTime || '');
            break;
          case 'recurring':
            row.push(req.recurring ? 'Yes' : 'No');
            break;
          case 'estimatedTime':
            row.push(req.estimatedTime?.toString() || '');
            break;
          default:
            row.push('');
        }
      });
      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ticket-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateTAT = (request: Request): string => {
    // Only calculate TAT for completed tickets
    if (request.status !== 'COMPLETED' || !request.createdAt || !request.completedAt) {
      return 'N/A';
    }
    
    const createdAt = new Date(request.createdAt);
    const completedAt = new Date(request.completedAt);
    
    // Calculate total time
    let totalMs = completedAt.getTime() - createdAt.getTime();
    
    if (totalMs < 0) return 'N/A';
    
    // Subtract time spent in ON_HOLD status
    if (request.activities && request.activities.length > 0) {
      // Sort activities by date
      const sortedActivities = [...request.activities].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      let onHoldStart: Date | null = null;
      let totalOnHoldMs = 0;
      let currentStatus = 'NEW'; // Start with initial status
      
      // Track status changes to find ON_HOLD periods
      for (const activity of sortedActivities) {
        const activityDate = new Date(activity.createdAt);
        
        // Parse status from activity description if available
        // Format: "Status changed from X to Y"
        let newStatus = activity.action;
        if (activity.description && activity.description.includes('Status changed from')) {
          const match = activity.description.match(/Status changed from (\w+) to (\w+)/);
          if (match) {
            newStatus = match[2];
          }
        }
        
        // If we were on hold and status changed to something else
        if (onHoldStart && currentStatus === 'ON_HOLD' && newStatus !== 'ON_HOLD') {
          // Calculate time spent in ON_HOLD
          const onHoldEnd = activityDate;
          totalOnHoldMs += onHoldEnd.getTime() - onHoldStart.getTime();
          onHoldStart = null;
        }
        
        // If status changed to ON_HOLD
        if (newStatus === 'ON_HOLD' && !onHoldStart) {
          onHoldStart = activityDate;
        }
        
        currentStatus = newStatus;
      }
      
      // If still on hold when completed (shouldn't happen, but handle it)
      if (onHoldStart && currentStatus === 'ON_HOLD') {
        totalOnHoldMs += completedAt.getTime() - onHoldStart.getTime();
      }
      
      // Subtract ON_HOLD time from total
      totalMs -= totalOnHoldMs;
    }
    
    if (totalMs < 0) return 'N/A';
    
    const diffMinutes = Math.floor(totalMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      return `${diffDays}d ${remainingHours}h`;
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      return `${diffHours}h ${remainingMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const getPriorityLabel = (priority: number) => {
    const labels: { [key: number]: string } = {
      1: 'Critical',
      2: 'High',
      3: 'Medium',
      4: 'Low'
    };
    return labels[priority] || 'Medium';
  };

  const getPriorityColor = (priority: number) => {
    const colors: { [key: number]: string } = {
      1: 'bg-red-100 text-red-700 border-red-200',
      2: 'bg-orange-100 text-orange-700 border-orange-200',
      3: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      4: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[priority] || colors[3];
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ticket Reports</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Comprehensive view of all ticket details</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowColumnSelector(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export CSV</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
          >
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full max-w-full">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Total Tickets</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">New</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.new}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Avg Response</p>
          <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}m</p>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
                </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="NEW">New</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Services</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="CLEANING">Cleaning</option>
                <option value="IT_SUPPORT">IT Support</option>
                <option value="SECURITY">Security</option>
                <option value="OTHER">Other</option>
              </select>
      </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="last-7-days">Last 7 Days</option>
                <option value="last-30-days">Last 30 Days</option>
                <option value="last-90-days">Last 90 Days</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>
              </div>
      )}

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full" style={{ touchAction: 'pan-x pan-y', overscrollBehaviorX: 'contain' }}>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading tickets...</p>
              </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              </div>
          ) : (
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Request ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Service Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Requested By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Updated Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Completed Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">TAT Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Scheduled</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Recurring</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Est. Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="px-6 py-8 text-center text-gray-500">
                      No tickets found
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                        {request.requestId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={request.title}>
                        {request.title}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {request.serviceType}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(request.priority || 3)}`}>
                          {getPriorityLabel(request.priority || 3)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {request.location?.name || 'N/A'}
                        {request.location?.block?.name && ` (${request.location.block.name})`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {request.department?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {request.requestedBy || 
                          (request.createdBy ? `${request.createdBy.firstName} ${request.createdBy.lastName}` : 'N/A')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {request.assignedTo 
                          ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}`
                          : <span className="text-gray-400 italic">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(request.updatedAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {request.completedAt ? formatDate(request.completedAt) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {request.status === 'COMPLETED' && request.completedAt ? (
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                            {calculateTAT(request)}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {request.scheduledDate 
                          ? `${new Date(request.scheduledDate).toLocaleDateString()} ${request.scheduledTime || ''}`
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {request.recurring ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {request.estimatedTime ? `${request.estimatedTime} min` : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
              </div>

        {/* Pagination */}
        {requests.length > 0 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-gray-600">
              Showing <span className="font-medium">
                {requests.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
              </span> to <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span> of{' '}
              <span className="font-medium">{pagination.total}</span> tickets
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4 text-gray-600 rotate-90" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4 text-gray-600 -rotate-90" />
              </button>
          </div>
        </div>
      )}

      {/* Column Selector Modal */}
      {showColumnSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Select Columns to Export</h2>
              <button
                onClick={() => setShowColumnSelector(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">Select the columns you want to include in the CSV export</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllColumns}
                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllColumns}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableColumns.map((column) => {
                  const isSelected = selectedColumns.has(column.key);
                  return (
                    <label
                      key={column.key}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900 flex-1">
                        {column.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleColumn(column.key)}
                        className="sr-only"
                      />
                    </label>
                  );
                })}
              </div>
              
              {selectedColumns.size === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Please select at least one column to export.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowColumnSelector(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedColumns.size > 0) {
                    exportToCSV();
                    setShowColumnSelector(false);
                  }
                }}
                disabled={selectedColumns.size === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV ({selectedColumns.size} {selectedColumns.size === 1 ? 'column' : 'columns'})
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
    </div>
  );
}
