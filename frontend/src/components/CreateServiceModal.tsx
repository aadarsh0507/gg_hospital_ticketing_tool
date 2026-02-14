import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { servicesApi, locationsApi, ApiError } from '../services/api';

interface Service {
  id: string;
  name: string;
  description?: string;
  areaType?: string;
  departmentId?: string;
  locationId?: string;
  slaEnabled: boolean;
  slaHours: number;
  slaMinutes: number;
  otpVerificationRequired: boolean;
  displayToCustomer: boolean;
  iconUrl?: string;
  isActive?: boolean;
  department?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  location?: {
    id: string;
    name: string;
    floor?: number;
    block?: {
      name: string;
    } | null;
  } | null;
}

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  service?: Service | null;
}

export default function CreateServiceModal({ isOpen, onClose, onSuccess, service }: CreateServiceModalProps) {
  const isEditMode = !!service;
  const [activeTab, setActiveTab] = useState('basic-details');
  const [formData, setFormData] = useState({
    serviceName: '',
    departmentId: '',
    locationId: '',
    description: '',
    slaEnabled: false,
    slaHours: 0,
    slaMinutes: 0,
    otpVerificationRequired: false,
    displayToCustomer: false,
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const tabs = [
    { id: 'basic-details', label: 'Basic Details' },
    { id: 'checklist-config', label: 'Checklist Configuration' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchLocations();
      if (service) {
        setFormData({
          serviceName: service.name || '',
          departmentId: service.departmentId || '',
          locationId: service.locationId || '',
          description: service.description || '',
          slaEnabled: service.slaEnabled || false,
          slaHours: service.slaHours || 0,
          slaMinutes: service.slaMinutes || 0,
          otpVerificationRequired: service.otpVerificationRequired || false,
          displayToCustomer: service.displayToCustomer !== false,
        });
      } else {
        setFormData({
          serviceName: '',
          departmentId: '',
          locationId: '',
          description: '',
          slaEnabled: false,
          slaHours: 0,
          slaMinutes: 0,
          otpVerificationRequired: false,
          displayToCustomer: false,
        });
      }
      setActiveTab('basic-details');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, service]);

  const fetchDepartments = async () => {
    try {
      const response = await locationsApi.getDepartments();
      setDepartments(response.departments || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await locationsApi.getLocations();
      setLocations(response.locations || []);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const handleSlaChange = (field: 'slaHours' | 'slaMinutes', value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const isFormValid = formData.serviceName.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (isEditMode && service) {
        const updateData: any = {
          name: formData.serviceName.trim(),
          description: formData.description.trim() || undefined,
          slaEnabled: formData.slaEnabled,
          slaHours: formData.slaHours,
          slaMinutes: formData.slaMinutes,
          otpVerificationRequired: formData.otpVerificationRequired,
          displayToCustomer: formData.displayToCustomer,
        };
        
        // Only include departmentId and locationId if they have values
        if (formData.departmentId && formData.departmentId.trim()) {
          updateData.departmentId = formData.departmentId;
        }
        if (formData.locationId && formData.locationId.trim()) {
          updateData.locationId = formData.locationId;
        }
        
        await servicesApi.updateService(service.id, updateData);
      } else {
        const createData: any = {
          name: formData.serviceName.trim(),
          description: formData.description.trim() || undefined,
          slaEnabled: formData.slaEnabled,
          slaHours: formData.slaHours,
          slaMinutes: formData.slaMinutes,
          otpVerificationRequired: formData.otpVerificationRequired,
          displayToCustomer: formData.displayToCustomer,
        };
        
        // Only include departmentId and locationId if they have values
        if (formData.departmentId && formData.departmentId.trim()) {
          createData.departmentId = formData.departmentId;
        }
        if (formData.locationId && formData.locationId.trim()) {
          createData.locationId = formData.locationId;
        }
        
        await servicesApi.createService(createData);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || err.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} service`);
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error saving service:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditMode ? 'Edit Service' : 'New Service'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">Service {isEditMode ? 'updated' : 'created'} successfully!</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'basic-details' && (
            <div className="space-y-6">
              {/* Service Name */}
              <div>
                <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="serviceName"
                  name="serviceName"
                  required
                  value={formData.serviceName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter service name"
                  disabled={loading}
                />
              </div>

              {/* Select Department */}
              <div>
                <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Department
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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

              {/* Select Location */}
              <div>
                <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Location
                </label>
                <select
                  id="locationId"
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  disabled={loading}
                >
                  <option value="">Select location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.block?.name ? `${loc.block.name} - ` : ''}{loc.name}
                      {loc.floor ? ` (Floor ${loc.floor})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter service description"
                  disabled={loading}
                />
              </div>

              {/* Display Icons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Icons
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-12 h-12 border border-gray-300 rounded flex items-center justify-center bg-white">
                      <span className="text-lg">品</span>
                    </div>
                    <div className="w-12 h-12 border border-gray-300 rounded flex items-center justify-center bg-white">
                      <span className="text-lg">品</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* SLA Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  SLA
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="slaEnabled"
                      name="slaEnabled"
                      checked={formData.slaEnabled}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={loading}
                    />
                    <label htmlFor="slaEnabled" className="text-sm text-gray-700">
                      SLA
                    </label>
                  </div>
                  {formData.slaEnabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={formData.slaHours}
                        onChange={(e) => handleSlaChange('slaHours', e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        disabled={loading}
                      />
                      <span className="text-sm text-gray-700">Hours</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={formData.slaMinutes}
                        onChange={(e) => handleSlaChange('slaMinutes', e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        disabled={loading}
                      />
                      <span className="text-sm text-gray-700">Minutes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="otpVerificationRequired"
                    name="otpVerificationRequired"
                    checked={formData.otpVerificationRequired}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <label htmlFor="otpVerificationRequired" className="text-sm text-gray-700">
                    OTP Verification required for closing patient initiated requests.
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="displayToCustomer"
                    name="displayToCustomer"
                    checked={formData.displayToCustomer}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <label htmlFor="displayToCustomer" className="text-sm text-gray-700">
                    Display to Customer
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklist-config' && (
            <div className="text-center py-12">
              <p className="text-gray-600">Checklist Configuration content will be implemented here</p>
            </div>
          )}


          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
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
              disabled={!isFormValid || loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Service' : 'Create Service')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

