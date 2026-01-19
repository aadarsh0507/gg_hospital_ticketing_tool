import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Building2, Users, Search, Edit, Trash2 } from 'lucide-react';
import { locationsApi, ApiError } from '../services/api';
import CreateDepartmentModal from '../components/CreateDepartmentModal';

interface Department {
  id: string;
  name: string;
  description?: string;
  staffCount: number;
  head: string;
  status: string;
}

export default function AdminDepartments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await locationsApi.getDepartments();
      const depts = (response.departments || []).map((dept: any) => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        staffCount: 0, // TODO: Calculate from users
        head: '', // TODO: Add department head field
        status: 'Active'
      }));
      setDepartments(depts);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || 'Failed to load departments');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.head.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Departments Management</h1>
        <button 
          onClick={() => {
            setEditingDepartment(null);
            setShowDepartmentModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Department</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading departments...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Departments Found</h3>
            <p className="text-gray-600">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingDepartment(dept);
                      setShowDepartmentModal(true);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-lg text-gray-900 mb-3">{dept.name}</h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>
                    <strong className="text-gray-900">{dept.staffCount}</strong> Staff Members
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="text-gray-500">Head: </span>
                  <strong className="text-gray-900">{dept.head}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {dept.status}
                </span>
                <button className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>

      <CreateDepartmentModal
        isOpen={showDepartmentModal}
        onClose={() => {
          setShowDepartmentModal(false);
          setEditingDepartment(null);
        }}
        onSuccess={() => {
          fetchDepartments();
          setEditingDepartment(null);
        }}
        department={editingDepartment}
      />
    </div>
  );
}

