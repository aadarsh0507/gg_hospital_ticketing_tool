import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { locationsApi, ApiError } from '../services/api';

interface Location {
  id: string;
  blockId: string;
  name: string;
  floor?: number;
  areaType?: string;
  departmentId?: string;
}

interface CreateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  location?: Location | null;
}

export default function CreateLocationModal({ isOpen, onClose, onSuccess, location }: CreateLocationModalProps) {
  const isEditMode = !!location;
  const [formData, setFormData] = useState({
    blockId: '',
    name: '',
    floor: '',
    areaType: '',
    departmentId: ''
  });
  const [blocks, setBlocks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBlocks();
      fetchDepartments();
      if (location) {
        setFormData({
          blockId: location.blockId || '',
          name: location.name || '',
          floor: location.floor?.toString() || '',
          areaType: location.areaType || '',
          departmentId: location.departmentId || ''
        });
      } else {
        setFormData({ blockId: '', name: '', floor: '', areaType: '', departmentId: '' });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, location]);

  const fetchBlocks = async () => {
    try {
      const response = await locationsApi.getBlocks();
      setBlocks(response.blocks || []);
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    if (!formData.blockId || !formData.name.trim()) {
      setError('Block and location name are required');
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && location) {
        await locationsApi.updateLocation(location.id, {
          name: formData.name,
          floor: formData.floor ? parseInt(formData.floor) : undefined,
          areaType: formData.areaType || undefined,
          departmentId: formData.departmentId || undefined
        });
      } else {
        await locationsApi.createLocation({
          blockId: formData.blockId,
          name: formData.name,
          floor: formData.floor ? parseInt(formData.floor) : undefined,
          areaType: formData.areaType || undefined,
          departmentId: formData.departmentId || undefined
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ blockId: '', name: '', floor: '', areaType: '', departmentId: '' });
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || err.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} location`);
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Location' : 'Create Location'}</h2>
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
              <p className="text-sm text-green-700">Location {isEditMode ? 'updated' : 'created'} successfully!</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="blockId" className="block text-sm font-medium text-gray-700 mb-2">
              Block <span className="text-red-500">*</span>
            </label>
            <select
              id="blockId"
              name="blockId"
              required={!isEditMode}
              value={formData.blockId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || isEditMode}
            >
              <option value="">Select block</option>
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Location Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Room 101, Ward A"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-2">
                Floor
              </label>
              <input
                id="floor"
                name="floor"
                type="number"
                value={formData.floor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Floor number"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="areaType" className="block text-sm font-medium text-gray-700 mb-2">
                Area Type
              </label>
              <select
                id="areaType"
                name="areaType"
                value={formData.areaType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select type</option>
                <option value="ROOM">Room</option>
                <option value="WARD">Ward</option>
                <option value="OFFICE">Office</option>
                <option value="LAB">Lab</option>
                <option value="OPERATION_THEATER">Operation Theater</option>
                <option value="ICU">ICU</option>
                <option value="OTHER">Other</option>
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
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Location' : 'Create Location')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

