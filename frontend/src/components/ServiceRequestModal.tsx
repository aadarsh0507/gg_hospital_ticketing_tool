import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { requestsApi, locationsApi, ApiError } from '../services/api';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ServiceRequestModal({ isOpen, onClose, onSuccess }: ServiceRequestModalProps) {
  const [formData, setFormData] = useState({
    serviceType: '',
    title: '',
    description: '',
    priority: 3,
    locationId: '',
    departmentId: ''
  });
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
      fetchDepartments();
    }
  }, [isOpen]);

  const fetchLocations = async () => {
    try {
      console.log('Fetching locations...');
      const response = await locationsApi.getLocations();
      console.log('Locations API response:', response);
      const locationsList = response?.locations || response || [];
      console.log('Setting locations:', locationsList);
      setLocations(locationsList);
      if (locationsList.length === 0) {
        console.warn('No locations found in response');
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      if (err instanceof ApiError) {
        console.error('API Error details:', err.data);
      }
      setError('Failed to load locations. Please try again.');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await locationsApi.getDepartments();
      setDepartments(response.departments || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.serviceType || !formData.title) {
      setError('Service type and title are required');
      return;
    }

    setLoading(true);

    try {
      await requestsApi.createRequest({
        serviceType: formData.serviceType,
        title: formData.title,
        description: formData.description || undefined,
        priority: parseInt(formData.priority.toString()),
        locationId: formData.locationId || undefined,
        departmentId: formData.departmentId || undefined
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          serviceType: '',
          title: '',
          description: '',
          priority: 3,
          locationId: '',
          departmentId: ''
        });
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || err.data?.message || 'Failed to create request');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create Service Request</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">Request created successfully!</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
              Service Type <span className="text-red-500">*</span>
            </label>
            <select
              id="serviceType"
              name="serviceType"
              required
              value={formData.serviceType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select service type</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="CLEANING">Cleaning</option>
              <option value="IT_SUPPORT">IT Support</option>
              <option value="SECURITY">Security</option>
              <option value="MEDICAL">Medical</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter request title"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter request description"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value={1}>Critical</option>
                <option value={2}>High</option>
                <option value={3}>Medium</option>
                <option value={4}>Low</option>
              </select>
            </div>

            <div>
              <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                id="locationId"
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.block?.name ? `${loc.block.name} - ` : ''}{loc.name} {loc.floor ? `(Floor ${loc.floor})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              id="departmentId"
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

