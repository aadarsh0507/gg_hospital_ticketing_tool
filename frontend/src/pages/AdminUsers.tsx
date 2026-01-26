import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Users, Search, Edit, Trash2, Mail, Phone, Shield, Building2 } from 'lucide-react';
import { usersApi, ApiError } from '../services/api';
import CreateUserModal from '../components/CreateUserModal';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
  department?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface DepartmentGroup {
  name: string | null;
  users: User[];
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [usersByDepartment, setUsersByDepartment] = useState<DepartmentGroup[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getUsers({ search: searchQuery || undefined });
      setUsersByDepartment(response.usersByDepartment || []);
      setAllUsers(response.users || []);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || 'Failed to load users');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredUsersByDepartment = usersByDepartment.filter(dept => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return dept.users.some(user =>
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      (dept.name && dept.name.toLowerCase().includes(searchLower))
    );
  }).map(dept => ({
    ...dept,
    users: dept.users.filter(user =>
      !searchQuery ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(dept => dept.users.length > 0);

  const roleColors = {
    ADMIN: 'bg-purple-100 text-purple-700',
    HOD: 'bg-blue-100 text-blue-700',
    STAFF: 'bg-green-100 text-green-700',
    REQUESTER: 'bg-gray-100 text-gray-700'
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      // TODO: Replace with actual API endpoint when available
      // await usersApi.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Users Management</h1>
        <button 
          onClick={() => {
            setEditingUser(null);
            setShowUserModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add User</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredUsersByDepartment.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-600">Try adjusting your search query or add a new user</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredUsersByDepartment.map((department) => (
              <div key={department.name || 'no-department'} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">
                      {department.name || 'No Department'}
                    </h3>
                    <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">
                      {department.users.length} {department.users.length === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-white">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {department.users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {user.firstName[0]}{user.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              roleColors[user.role as keyof typeof roleColors] || roleColors.REQUESTER
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {user.phoneNumber && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  <span>{user.phoneNumber}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4" />
                                <span>{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setEditingUser(user);
                                  setShowUserModal(true);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                title="Edit user"
                              >
                                <Edit className="w-4 h-4 text-gray-500" />
                              </button>
                              <button 
                                onClick={() => handleDelete(user.id)}
                                className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateUserModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditingUser(null);
        }}
        onSuccess={() => {
          fetchUsers();
        }}
        user={editingUser}
      />
    </div>
  );
}

