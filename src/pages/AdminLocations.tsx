import { Plus, MoreVertical, Building2, Layers, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function AdminLocations() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'area-types', label: 'Area Types' },
    { id: 'upload-csv', label: 'Upload via CSV' },
    { id: 'qr-codes', label: 'QR Codes' }
  ];

  const blocks = [
    { name: 'Main Building', floors: 8, areas: 124 },
    { name: 'Emergency Wing', floors: 3, areas: 45 },
    { name: 'Surgery Center', floors: 5, areas: 68 },
    { name: 'Pediatrics Block', floors: 4, areas: 52 },
    { name: 'Outpatient Department', floors: 2, areas: 38 },
    { name: 'Research Building', floors: 6, areas: 89 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Locations Management</h1>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Block</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors relative ${
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

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blocks.map((block, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
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
    </div>
  );
}
