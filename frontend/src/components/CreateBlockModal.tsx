import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { locationsApi, ApiError } from '../services/api';

interface Block {
  id: string;
  name: string;
  description?: string;
}

interface CreateBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  block?: Block | null;
}

export default function CreateBlockModal({ isOpen, onClose, onSuccess, block }: CreateBlockModalProps) {
  const isEditMode = !!block;
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (block) {
        setFormData({
          name: block.name || '',
          description: block.description || ''
        });
      } else {
        setFormData({ name: '', description: '' });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, block]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    if (!formData.name.trim()) {
      setError('Block name is required');
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && block) {
        await locationsApi.updateBlock(block.id, {
          name: formData.name,
          description: formData.description || undefined
        });
      } else {
        await locationsApi.createBlock({
          name: formData.name,
          description: formData.description || undefined
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ name: '', description: '' });
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || err.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} block`);
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Block' : 'Create Block'}</h2>
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
              <p className="text-sm text-green-700">Block {isEditMode ? 'updated' : 'created'} successfully!</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Block Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Building A, Main Block"
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
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional description"
              disabled={loading}
            />
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
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Block' : 'Create Block')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

