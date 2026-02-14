import { useState, useEffect } from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { locationsApi, usersApi, ApiError } from '../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  locationId?: string | null;
  location?: {
    id: string;
    name: string;
    floor?: number;
    areaType?: string;
    blockName?: string;
  } | null;
}

interface Block {
  id: string;
  name: string;
  locations: Array<{
    id: string;
    name: string;
    floor?: number;
    areaType?: string;
  }>;
}

interface UserLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user: User | null;
}

export default function UserLocationModal({ isOpen, onClose, onSuccess, user }: UserLocationModalProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchBlocks();
      setSelectedLocationId(user.locationId || '');
      setError(null);
    }
  }, [isOpen, user]);

  const fetchBlocks = async () => {
    try {
      const response = await locationsApi.getBlocks();
      setBlocks(response.blocks || []);
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
      setError('Failed to load locations');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await usersApi.updateUser(user.id, { locationId: selectedLocationId || null });
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error updating user location:', err);
      if (err instanceof ApiError) {
        setError(err.data?.message || 'Failed to update location');
      } else {
        setError('Failed to update location');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const selectedLocation = blocks
    .flatMap(block => block.locations || [])
    .find(loc => loc.id === selectedLocationId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Update User Location</h2>
              <p className="text-sm text-gray-500">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Current Location */}
          {user.location && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Current Location:</p>
              <p className="text-sm text-gray-900">
                {user.location.blockName ? `${user.location.blockName} - ` : ''}
                {user.location.name}
                {user.location.floor ? ` (Floor ${user.location.floor})` : ''}
              </p>
            </div>
          )}

          {/* Location Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Location
            </label>
            
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">No Location</option>
              {blocks.map((block) => (
                <optgroup key={block.id} label={block.name}>
                  {(block.locations || []).map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                      {location.floor ? ` (Floor ${location.floor})` : ''}
                      {location.areaType ? ` - ${location.areaType}` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* Selected Location Preview */}
            {selectedLocation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Selected:</p>
                <p className="text-sm text-blue-700">
                  {selectedLocation.name}
                  {selectedLocation.floor ? ` (Floor ${selectedLocation.floor})` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Update Location
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

