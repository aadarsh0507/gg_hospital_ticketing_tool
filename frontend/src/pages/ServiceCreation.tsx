import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { servicesApi, ApiError } from '../services/api';
import CreateServiceModal from '../components/CreateServiceModal';

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
  createdAt?: string;
  updatedAt?: string;
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

export default function ServiceCreation() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesApi.getServices();
      setServices(response.services || []);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || 'Failed to load services');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }
    try {
      await servicesApi.deleteService(serviceId);
      fetchServices();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.data?.error || err.data?.message || 'Failed to delete service');
      } else {
        alert('An unexpected error occurred');
      }
      console.error('Error deleting service:', err);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.department?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.location?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSla = (service: Service) => {
    if (!service.slaEnabled) return 'No SLA';
    const hours = service.slaHours || 0;
    const minutes = service.slaMinutes || 0;
    if (hours === 0 && minutes === 0) return 'No SLA';
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(' ');
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Service Management</h1>
          {!loading && (
            <p className="text-sm text-gray-600 mt-1">
              {services.length} {services.length === 1 ? 'service' : 'services'} found
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchServices}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh services"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium hidden sm:inline">Refresh</span>
          </button>
          <button 
            onClick={() => {
              setEditingService(null);
              setShowServiceModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Create Service</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services by name, description, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading services...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search query' : 'Get started by creating your first service'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setEditingService(null);
                  setShowServiceModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Service
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Tag className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingService(service);
                        setShowServiceModal(true);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Edit service"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button 
                      onClick={() => handleDelete(service.id)}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors"
                      title="Delete service"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-gray-900 mb-2">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  {service.department && (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {service.department.name}
                      </span>
                    </div>
                  )}
                  {service.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>
                        {service.location.block?.name ? `${service.location.block.name} - ` : ''}
                        {service.location.name}
                        {service.location.floor ? ` (Floor ${service.location.floor})` : ''}
                      </span>
                    </div>
                  )}
                  {service.slaEnabled && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>SLA: {formatSla(service)}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {service.otpVerificationRequired && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                        OTP Required
                      </span>
                    )}
                    {service.displayToCustomer && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                        Customer Visible
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex flex-col gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      service.isActive !== false
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {service.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                    {service.createdAt && (
                      <span className="text-xs text-gray-500">
                        Created: {new Date(service.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Modal */}
      {showServiceModal && (
        <CreateServiceModal
          isOpen={showServiceModal}
          onClose={() => {
            setShowServiceModal(false);
            setEditingService(null);
          }}
          onSuccess={() => {
            fetchServices();
          }}
          service={editingService}
        />
      )}
    </div>
  );
}
