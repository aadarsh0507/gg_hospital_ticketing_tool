import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Building2, Layers, MapPin, Edit } from 'lucide-react';
import { locationsApi, ApiError } from '../services/api';
import CreateBlockModal from '../components/CreateBlockModal';
import CreateLocationModal from '../components/CreateLocationModal';

interface Block {
  id: string;
  name: string;
  description?: string;
  floors: number;
  areas: number;
}

export default function AdminLocations() {
  const [activeTab, setActiveTab] = useState('overview');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'area-types', label: 'Area Types' },
    { id: 'upload-csv', label: 'Upload via CSV' },
    { id: 'qr-codes', label: 'QR Codes' }
  ];

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const response = await locationsApi.getBlocks();
      setBlocks(response.blocks || []);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || 'Failed to load blocks');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error fetching blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Locations Management</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setEditingBlock(null);
              setShowLocationModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Location</span>
          </button>
          <button 
            onClick={() => {
              setEditingBlock(null);
              setShowBlockModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Block</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto" style={{ touchAction: 'pan-x pan-y', overscrollBehaviorX: 'contain' }}>
          <div className="flex min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading locations...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : blocks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Locations Found</h3>
                  <p className="text-gray-600">Add your first location to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <button 
                          onClick={() => {
                            setEditingBlock(block);
                            setShowBlockModal(true);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>

                      <h3 className="font-bold text-lg text-gray-900 mb-3">{block.name}</h3>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Layers className="w-4 h-4" />
                          <span>
                            <strong className="text-gray-900">{block.floors}</strong> Floors
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>
                            <strong className="text-gray-900">{block.areas}</strong> Areas/Rooms
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'area-types' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Area Types Configuration</h3>
              <p className="text-gray-600">Manage different types of areas and their properties</p>
            </div>
          )}

          {activeTab === 'upload-csv' && (
            <div className="text-center py-16">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 bg-gray-50">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Locations Data</h3>
                <p className="text-gray-600 mb-4">Drag and drop CSV file or click to browse</p>
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Choose File
                </button>
              </div>
            </div>
          )}

          {activeTab === 'qr-codes' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Code Management</h3>
              <p className="text-gray-600">Generate and manage QR codes for location-based requests</p>
            </div>
          )}
        </div>
      </div>

      <CreateBlockModal
        isOpen={showBlockModal}
        onClose={() => {
          setShowBlockModal(false);
          setEditingBlock(null);
        }}
        onSuccess={() => {
          fetchBlocks();
          setEditingBlock(null);
        }}
        block={editingBlock}
      />

      <CreateLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSuccess={() => {
          fetchBlocks();
        }}
      />
    </div>
  );
}
