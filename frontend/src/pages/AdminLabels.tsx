import { useState, useEffect } from 'react';
import { Plus, Tag, Edit, Trash2, Search, X } from 'lucide-react';

interface Label {
  id: number;
  name: string;
  color: string;
  description: string;
  count: number;
}

export default function AdminLabels() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: '', color: '#3B82F6', description: '' });
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch labels from API when endpoint is available
    setLoading(false);
    setLabels([]);
  }, []);

  const filteredLabels = labels.filter(label =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    label.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const colorOptions = [
    { name: 'Red', value: '#EF4444' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Orange', value: '#F97316' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Labels Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Create and manage request labels</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Label</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search labels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading labels...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredLabels.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Labels Found</h3>
            <p className="text-gray-600">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLabels.map((label) => (
            <div
              key={label.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: label.color }}
                  >
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{label.name}</h3>
                    <p className="text-sm text-gray-600">{label.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  <strong className="text-gray-900">{label.count}</strong> requests
                </span>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Label</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Label Name</label>
                <input
                  type="text"
                  value={newLabel.name}
                  onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                  placeholder="Enter label name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={newLabel.description}
                  onChange={(e) => setNewLabel({ ...newLabel, description: e.target.value })}
                  placeholder="Enter description"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewLabel({ ...newLabel, color: color.value })}
                      className={`h-10 rounded-lg border-2 transition-all ${
                        newLabel.color === color.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle add label logic here
                  setShowAddModal(false);
                  setNewLabel({ name: '', color: '#3B82F6', description: '' });
                }}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

