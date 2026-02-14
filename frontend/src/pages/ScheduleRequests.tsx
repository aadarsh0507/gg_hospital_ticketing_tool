import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, User, MapPin, Search, Filter, ChevronDown, Edit, Trash2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ScheduleRequestModal from '../components/ScheduleRequestModal';
import ViewScheduleDetailsModal from '../components/ViewScheduleDetailsModal';
import ScheduleCalendarView from '../components/ScheduleCalendarView';
import { requestsApi, ApiError } from '../services/api';

interface ScheduledRequest {
  id: string;
  requestId: string;
  title: string;
  area: string;
  scheduledDate: string;
  scheduledTime: string;
  requestedBy: string;
  department: string;
  status: string;
  recurring: boolean;
}

export default function ScheduleRequests() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [scheduledRequests, setScheduledRequests] = useState<ScheduledRequest[]>([]);
  const [loading, setLoading] = useState(false); // Start with false to show UI immediately
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequestData, setSelectedRequestData] = useState<any | null>(null);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);

  const fetchScheduledRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from scheduled requests endpoint
      try {
        // Optimize: Use server-side search, reduced limit for faster initial load
        const response = await requestsApi.getScheduledRequests({
          page: 1,
          limit: 20,  // Reduced for faster initial load
          search: searchQuery || undefined  // Server-side search
        });
        
        // Optimized: Minimal transformation, use data as-is from backend
        const transformed = (response.scheduledRequests || []).map((req: any) => {
          // Fast date extraction - backend already provides ISO format
          let scheduledDateISO = '';
          if (req.scheduledDate) {
            const dateStr = String(req.scheduledDate);
            // Extract YYYY-MM-DD from ISO string
            const isoMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
            scheduledDateISO = isoMatch ? isoMatch[1] : dateStr.substring(0, 10);
          }
          
          // Fast time extraction
          let scheduledTime = req.scheduledTime || '09:00';
          if (scheduledTime && scheduledTime.includes(':')) {
            const timeMatch = scheduledTime.match(/(\d{1,2}:\d{2})/);
            if (timeMatch) scheduledTime = timeMatch[1];
          }
          
          // Fast name formatting
          const requestedByName = req.requestedBy || 
            (req.createdByFirstName && req.createdByLastName
              ? `${req.createdByFirstName} ${req.createdByLastName}`
              : 'Unknown');

          return {
            id: req.id,
            requestId: req.requestId || req.id,
            title: req.title || 'Untitled Request',
            area: req.locationName || req.location?.name || 'N/A',
            scheduledDate: scheduledDateISO,
            scheduledDateFormatted: scheduledDateISO ? new Date(scheduledDateISO).toLocaleDateString() : '',
            scheduledTime: scheduledTime,
            requestedBy: requestedByName,
            department: req.departmentName || req.department?.name || 'N/A',
            status: req.status || 'NEW',
            recurring: req.recurring === true || req.recurring === 1 || false,
            locationId: req.locationId || req.location?.id,
            departmentId: req.departmentId || req.department?.id,
            serviceType: req.serviceType,
            description: req.description,
            priority: req.priority,
            recurringPattern: req.recurringPattern
          };
        });
        
        setScheduledRequests(transformed);
      } catch (apiError) {
        // If endpoint doesn't exist (404), use regular requests filtered by status
        if (apiError instanceof ApiError && apiError.status === 404) {
          // Fallback: fetch all requests and filter for scheduled ones
          // For now, show empty state until backend endpoint is implemented
          setScheduledRequests([]);
        } else {
          throw apiError;
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || 'Failed to load scheduled requests');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error fetching scheduled requests:', err);
      setScheduledRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Show UI immediately, fetch data in background
    fetchScheduledRequests();
  }, []);

  // Refetch when search query changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchScheduledRequests();
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Note: Filtering is now done server-side via the search parameter
  // Only apply client-side filter if search query is empty (show all)
  const filteredRequests = searchQuery 
    ? scheduledRequests  // Server already filtered
    : scheduledRequests;  // Show all when no search

  // Calculate statistics
  const totalScheduled = scheduledRequests.length;
  const upcoming = scheduledRequests.filter(r => {
    const status = r.status?.toUpperCase();
    return status === 'SCHEDULED' || status === 'NEW' || status === 'IN_PROGRESS';
  }).length;
  const recurring = scheduledRequests.filter(r => r.recurring).length;
  const completed = scheduledRequests.filter(r => r.status?.toUpperCase() === 'COMPLETED').length;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Schedule Requests</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage scheduled and recurring requests</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium transition-colors flex-1 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm font-medium transition-colors flex-1 ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Calendar
            </button>
          </div>
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Schedule Request</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-full">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Total Scheduled</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalScheduled}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Upcoming</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{upcoming}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Recurring</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{recurring}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{completed}</p>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search scheduled requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm text-gray-700">Date Range</span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {loading && scheduledRequests.length === 0 ? (
            <div className="space-y-4">
              {/* Skeleton loaders for faster perceived performance */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-2 border-gray-200 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Requests Found</h3>
              <p className="text-gray-600">Try adjusting your search query or schedule a new request</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-lg text-gray-900">{request.title}</h3>
                      {request.recurring && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                          Recurring
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium text-blue-600">{request.requestId}</span> • {request.department}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 w-full max-w-full">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      <strong className="text-gray-900">{request.scheduledDateFormatted || request.scheduledDate}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      <strong className="text-gray-900">{request.scheduledTime}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{request.area}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{request.requestedBy}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => {
                      setSelectedRequestId(request.id);
                      setSelectedRequestData(request); // Cache request data for instant display
                      setShowViewModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        // Fetch full request details for editing
                        const response = await requestsApi.getRequestById(request.id);
                        setEditingRequest(response.request);
                        setShowScheduleModal(true);
                      } catch (err) {
                        console.error('Error fetching request details:', err);
                        alert('Failed to load request details for editing');
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button 
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to cancel this scheduled request?')) {
                        try {
                          await requestsApi.updateRequest(request.id, { status: 'CANCELLED' });
                          fetchScheduledRequests();
                        } catch (err) {
                          console.error('Error cancelling request:', err);
                          alert('Failed to cancel request. Please try again.');
                        }
                      }
                    }}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading calendar...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : scheduledRequests.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Requests</h3>
              <p className="text-gray-600">Schedule a new request to see it on the calendar</p>
            </div>
          ) : (
            <ScheduleCalendarView
              requests={scheduledRequests}
              onRequestClick={(requestId) => {
                setSelectedRequestId(requestId);
                setShowViewModal(true);
              }}
            />
          )}
        </div>
      )}

      <ScheduleRequestModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setEditingRequest(null);
        }}
        onSuccess={() => {
          setShowScheduleModal(false);
          setEditingRequest(null);
          fetchScheduledRequests();
        }}
        request={editingRequest || undefined}
      />

      <ViewScheduleDetailsModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRequestId(null);
          setSelectedRequestData(null);
        }}
        requestId={selectedRequestId}
        cachedRequest={selectedRequestData}
      />
    </div>
  );
}

