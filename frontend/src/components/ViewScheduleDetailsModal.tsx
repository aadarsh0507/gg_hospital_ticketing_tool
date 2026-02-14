import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, MapPin, FileText, Tag, Repeat, AlertCircle } from 'lucide-react';
import { requestsApi, ApiError } from '../services/api';
import StatusBadge from './StatusBadge';

interface ViewScheduleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string | null;
  cachedRequest?: any; // Optional cached request data for instant display
}

interface RequestDetails {
  id: string;
  requestId: string;
  title: string;
  description?: string;
  serviceType: string;
  priority: number;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  recurring: boolean;
  recurringPattern?: string;
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
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ViewScheduleDetailsModal({ isOpen, onClose, requestId, cachedRequest }: ViewScheduleDetailsModalProps) {
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && requestId) {
      // Show cached data immediately if available
      if (cachedRequest) {
        setRequest({
          id: cachedRequest.id,
          requestId: cachedRequest.requestId,
          title: cachedRequest.title,
          description: cachedRequest.description,
          serviceType: cachedRequest.serviceType,
          priority: cachedRequest.priority || 3,
          status: cachedRequest.status,
          scheduledDate: cachedRequest.scheduledDate,
          scheduledTime: cachedRequest.scheduledTime,
          recurring: cachedRequest.recurring || false,
          recurringPattern: cachedRequest.recurringPattern,
          location: cachedRequest.location || (cachedRequest.area ? { name: cachedRequest.area } : undefined),
          department: cachedRequest.department || (cachedRequest.department ? { name: cachedRequest.department } : undefined),
          requestedBy: cachedRequest.requestedBy,
          createdBy: cachedRequest.createdBy,
          assignedTo: cachedRequest.assignedTo,
          createdAt: cachedRequest.createdAt || new Date().toISOString(),
          updatedAt: cachedRequest.updatedAt || new Date().toISOString()
        });
      }
      // Always fetch fresh data in background
      fetchRequestDetails();
    } else {
      setRequest(null);
      setError(null);
    }
  }, [isOpen, requestId]);

  const fetchRequestDetails = async () => {
    if (!requestId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await requestsApi.getRequestById(requestId);
      setRequest(response.request);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || 'Failed to load request details');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error fetching request details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const priorityLabels: { [key: number]: string } = {
    1: 'Critical',
    2: 'High',
    3: 'Medium',
    4: 'Low'
  };

  const priorityColors: { [key: number]: string } = {
    1: 'bg-red-100 text-red-700 border-red-200',
    2: 'bg-orange-100 text-orange-700 border-orange-200',
    3: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    4: 'bg-green-100 text-green-700 border-green-200'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {loading && !request ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading request details...</p>
            </div>
          ) : error && !request ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : request ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">{request.title}</h3>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600">{request.requestId}</span>
                    {request.department && ` • ${request.department.name}`}
                  </p>
                </div>
              </div>

              {/* Schedule Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Schedule Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Scheduled Date</p>
                      <p className="font-semibold text-gray-900">
                        {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Scheduled Time</p>
                      <p className="font-semibold text-gray-900">{request.scheduledTime || 'Not set'}</p>
                    </div>
                  </div>
                  {request.recurring && (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <Repeat className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-600">Recurring Pattern</p>
                        <p className="font-semibold text-gray-900">
                          {request.recurringPattern || 'Recurring'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Request Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600">Service Type</p>
                      <p className="font-medium text-gray-900">{request.serviceType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Priority</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${priorityColors[request.priority] || priorityColors[3]}`}>
                        {priorityLabels[request.priority] || 'Medium'}
                      </span>
                    </div>
                    {request.description && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Description</p>
                        <p className="text-sm text-gray-700">{request.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    Location & Assignment
                  </h4>
                  <div className="space-y-3">
                    {request.location && (
                      <div>
                        <p className="text-xs text-gray-600">Location</p>
                        <p className="font-medium text-gray-900">
                          {request.location.name}
                          {request.location.block && ` (${request.location.block.name})`}
                        </p>
                      </div>
                    )}
                    {request.department && (
                      <div>
                        <p className="text-xs text-gray-600">Department</p>
                        <p className="font-medium text-gray-900">{request.department.name}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-600">Requested By</p>
                      <p className="font-medium text-gray-900">
                        {request.requestedBy || 
                          (request.createdBy ? `${request.createdBy.firstName} ${request.createdBy.lastName}` : 'Unknown')}
                      </p>
                    </div>
                    {request.assignedTo && (
                      <div>
                        <p className="text-xs text-gray-600">Assigned To</p>
                        <p className="font-medium text-gray-900">
                          {request.assignedTo.firstName} {request.assignedTo.lastName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p>{new Date(request.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p>{new Date(request.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

