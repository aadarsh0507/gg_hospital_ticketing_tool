import { useState } from 'react';
import { X, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { requestsApi, ApiError } from '../services/api';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  currentStatus: string;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New', description: 'Request is newly created' },
  { value: 'ASSIGNED', label: 'Assigned', description: 'Request has been assigned to staff' },
  { value: 'IN_PROGRESS', label: 'In Progress', description: 'Work is currently being done' },
  { value: 'ACTION_TAKEN', label: 'Action Taken', description: 'Action has been taken on the request' },
  { value: 'COMPLETED', label: 'Completed', description: 'Request has been completed' },
  { value: 'CLOSED', label: 'Closed', description: 'Request has been closed' },
  { value: 'ON_HOLD', label: 'On Hold', description: 'Request is temporarily on hold' },
  { value: 'CANCELLED', label: 'Cancelled', description: 'Request has been cancelled' }
];

export default function StatusUpdateModal({
  isOpen,
  onClose,
  requestId,
  currentStatus,
  onSuccess
}: StatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (selectedStatus === currentStatus) {
      setError('Please select a different status');
      return;
    }

    setLoading(true);

    try {
      await requestsApi.updateRequest(requestId, { status: selectedStatus });
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess(false);
      }, 1000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || err.data?.message || 'Failed to update status');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStatusOption = STATUS_OPTIONS.find(opt => opt.value === currentStatus);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Update Request Status</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">Status updated successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Current Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Status</p>
            <p className="text-lg font-semibold text-gray-900">
              {currentStatusOption?.label || currentStatus}
            </p>
            {currentStatusOption?.description && (
              <p className="text-xs text-gray-500 mt-1">{currentStatusOption.description}</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status Selection */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <div className="relative">
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10"
                  disabled={loading}
                  required
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {STATUS_OPTIONS.find(opt => opt.value === selectedStatus)?.description && (
                <p className="mt-2 text-xs text-gray-500">
                  {STATUS_OPTIONS.find(opt => opt.value === selectedStatus)?.description}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || selectedStatus === currentStatus}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

