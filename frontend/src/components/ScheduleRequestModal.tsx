import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Repeat } from 'lucide-react';
import { requestsApi, locationsApi, ApiError } from '../services/api';

interface ScheduleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  request?: any; // Request data for edit mode
}

export default function ScheduleRequestModal({ isOpen, onClose, onSuccess, request }: ScheduleRequestModalProps) {
  const isEditMode = !!request;
  const [formData, setFormData] = useState({
    serviceType: '',
    title: '',
    description: '',
    priority: 3,
    locationId: '',
    departmentId: '',
    scheduledDate: '',
    scheduledTime: '',
    recurring: false,
    recurringPattern: '',
    selectedWeekdays: [] as number[]
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
      
      if (isEditMode && request) {
        // Populate form with request data for editing
        let scheduledDate = '';
        if (request.scheduledDate) {
          try {
            // Handle different date formats
            const date = new Date(request.scheduledDate);
            if (!isNaN(date.getTime())) {
              scheduledDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            // If parsing fails, try to extract date from formatted string
            const dateMatch = request.scheduledDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (dateMatch) {
              const [, month, day, year] = dateMatch;
              scheduledDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          }
        }
        
        const scheduledTime = request.scheduledTime || '';
        
        // Parse weekdays from recurringPattern if it's a JSON string
        let selectedWeekdays: number[] = [];
        if (request.recurringPattern) {
          try {
            const parsed = JSON.parse(request.recurringPattern);
            if (parsed.weekdays && Array.isArray(parsed.weekdays)) {
              selectedWeekdays = parsed.weekdays;
            }
          } catch (e) {
            // If not JSON, it's probably the old format (DAILY, WEEKLY, MONTHLY)
          }
        }
        
        setFormData({
          serviceType: request.serviceType || '',
          title: request.title || '',
          description: request.description || '',
          priority: request.priority || 3,
          locationId: request.locationId || request.location?.id || '',
          departmentId: request.departmentId || request.department?.id || '',
          scheduledDate: scheduledDate,
          scheduledTime: scheduledTime,
          recurring: request.recurring === true || request.recurring === 1 || false,
          recurringPattern: request.recurringPattern || '',
          selectedWeekdays: selectedWeekdays
        });
      } else {
        // Set default date to tomorrow for new requests
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFormData(prev => ({
          ...prev,
          scheduledDate: tomorrow.toISOString().split('T')[0],
          scheduledTime: '09:00'
        }));
      }
    }
  }, [isOpen, isEditMode, request]);

  const fetchLocations = async () => {
    try {
      const response = await locationsApi.getLocations();
      const locationsList = response?.locations || response || [];
      setLocations(locationsList);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
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
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
    setError(null);
  };

  const handleWeekdayToggle = (weekday: number) => {
    setFormData(prev => {
      const newWeekdays = prev.selectedWeekdays.includes(weekday)
        ? prev.selectedWeekdays.filter(w => w !== weekday)
        : [...prev.selectedWeekdays, weekday].sort();
      return {
        ...prev,
        selectedWeekdays: newWeekdays
      };
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

    if (!formData.scheduledDate || !formData.scheduledTime) {
      setError('Scheduled date and time are required');
      return;
    }

    if (formData.recurring) {
      if (!formData.recurringPattern) {
        setError('Recurring pattern is required for recurring requests');
        return;
      }
      if (formData.recurringPattern === 'WEEKLY' && formData.selectedWeekdays.length === 0) {
        setError('Please select at least one weekday for weekly recurring requests');
        return;
      }
    }

    setLoading(true);

    try {
      if (isEditMode && request) {
        // Build recurringPattern with weekdays if weekly
        let recurringPattern = formData.recurringPattern;
        if (formData.recurring && formData.recurringPattern === 'WEEKLY' && formData.selectedWeekdays.length > 0) {
          recurringPattern = JSON.stringify({
            pattern: 'WEEKLY',
            weekdays: formData.selectedWeekdays
          });
        }
        
        // Update existing request
        await requestsApi.updateRequest(request.id, {
          serviceType: formData.serviceType,
          title: formData.title,
          description: formData.description || undefined,
          priority: parseInt(formData.priority.toString()),
          locationId: formData.locationId || undefined,
          departmentId: formData.departmentId || undefined,
          scheduledDate: formData.scheduledDate,
          scheduledTime: formData.scheduledTime,
          recurring: formData.recurring,
          recurringPattern: formData.recurring ? recurringPattern : undefined
        });
      } else {
        // Create new scheduled request
        // Build recurringPattern with weekdays if weekly
        let recurringPattern = formData.recurringPattern;
        if (formData.recurring && formData.recurringPattern === 'WEEKLY' && formData.selectedWeekdays.length > 0) {
          recurringPattern = JSON.stringify({
            pattern: 'WEEKLY',
            weekdays: formData.selectedWeekdays
          });
        }
        
        await requestsApi.createRequest({
          serviceType: formData.serviceType,
          title: formData.title,
          description: formData.description || undefined,
          priority: parseInt(formData.priority.toString()),
          locationId: formData.locationId || undefined,
          departmentId: formData.departmentId || undefined,
          scheduledDate: formData.scheduledDate,
          scheduledTime: formData.scheduledTime,
          recurring: formData.recurring,
          recurringPattern: formData.recurring ? recurringPattern : undefined
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        if (!isEditMode) {
          setFormData({
            serviceType: '',
            title: '',
            description: '',
            priority: 3,
            locationId: '',
            departmentId: '',
            scheduledDate: '',
            scheduledTime: '',
            recurring: false,
            recurringPattern: '',
            selectedWeekdays: []
          });
        }
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || 'Failed to create scheduled request');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error creating scheduled request:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Scheduled Request' : 'Schedule Request'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <X className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Request scheduled successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select service type</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="CLEANING">Cleaning</option>
                <option value="IT_SUPPORT">IT Support</option>
                <option value="SECURITY">Security</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>Critical</option>
                <option value={2}>High</option>
                <option value={3}>Medium</option>
                <option value={4}>Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter request title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter request description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.block?.name ? `(${loc.block.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Schedule Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="recurring"
                  checked={formData.recurring}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Recurring Request
                </span>
              </label>

              {formData.recurring && (
                <div className="mt-3 space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recurring Pattern <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="recurringPattern"
                    value={formData.recurringPattern}
                    onChange={handleChange}
                    required={formData.recurring}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select pattern</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                  
                  {formData.recurringPattern === 'WEEKLY' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Weekdays <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 0, label: 'Sunday' },
                          { value: 1, label: 'Monday' },
                          { value: 2, label: 'Tuesday' },
                          { value: 3, label: 'Wednesday' },
                          { value: 4, label: 'Thursday' },
                          { value: 5, label: 'Friday' },
                          { value: 6, label: 'Saturday' }
                        ].map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => handleWeekdayToggle(day.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              formData.selectedWeekdays.includes(day.value)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                      {formData.selectedWeekdays.length > 0 && (
                        <p className="mt-2 text-xs text-gray-500">
                          Selected: {formData.selectedWeekdays.map(w => {
                            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            return days[w];
                          }).join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {loading ? (isEditMode ? 'Updating...' : 'Scheduling...') : (isEditMode ? 'Update Request' : 'Schedule Request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

