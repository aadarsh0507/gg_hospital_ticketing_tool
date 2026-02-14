import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Users, Search, Edit, Trash2, Mail, Phone, Shield, Building2, MapPin } from 'lucide-react';
import { usersApi, locationsApi, ApiError } from '../services/api';
import CreateUserModal from '../components/CreateUserModal';
import UserLocationModal from '../components/UserLocationModal';
import { useAuth } from '../contexts/AuthContext';

// Power Icon Component for User Status Toggle - Enhanced visibility
const UserPowerIcon = ({ isActive, className = '' }: { isActive: boolean; className?: string }) => {
  if (isActive) {
    // Active state: Filled power icon
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main filled circle */}
        <circle cx="12" cy="12" r="9" fill="currentColor" />
        {/* Power line on top - white for contrast */}
        <line x1="12" y1="2" x2="12" y2="8" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  } else {
    // Inactive state: Outlined power icon with slash
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outlined circle */}
        <circle cx="12" cy="12" r="9" />
        {/* Power line on top */}
        <line x1="12" y1="2" x2="12" y2="8" />
        {/* Slash through to indicate off */}
        <line x1="5" y1="5" x2="19" y2="19" strokeWidth="3" />
      </svg>
    );
  }
};

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
  department?: string | null;
  locationId?: string | null;
  location?: {
    id: string;
    name: string;
    floor?: number;
    areaType?: string;
    blockName?: string;
  } | null;
  isActive: boolean;
  createdAt: string;
}

interface DepartmentGroup {
  name: string | null;
  users: User[];
}

export default function AdminUsers() {
  const { user: currentUser, refreshUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [usersByDepartment, setUsersByDepartment] = useState<DepartmentGroup[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [togglingUsers, setTogglingUsers] = useState<Set<string>>(new Set());
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedUserForLocation, setSelectedUserForLocation] = useState<User | null>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // All users can toggle their own status, ADMIN and HOD can toggle any user's status
  const canToggleAnyUserStatus = currentUser?.role === 'ADMIN' || currentUser?.role === 'HOD';
  const canToggleOwnStatus = (userId: string) => currentUser?.id === userId;

  useEffect(() => {
    fetchUsers();
    
    // Poll for updates every 10 seconds to reflect status changes from other users
    // Reduced frequency from 3s to 10s to improve performance
    const interval = setInterval(() => {
      fetchUsers(false); // Don't show loading spinner on polling updates
    }, 10000);
    
    return () => clearInterval(interval);
  }, [canToggleAnyUserStatus, currentUser?.id]);

  const fetchUsers = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await usersApi.getUsers({ search: searchQuery || undefined });
      
      // If user is not admin/HOD, filter to show only their own user
      if (!canToggleAnyUserStatus && currentUser?.id) {
        const ownUser = response.users.find(u => u.id === currentUser.id);
        if (ownUser) {
          setUsersByDepartment([{ name: ownUser.department || null, users: [ownUser] }]);
          setAllUsers([ownUser]);
        } else {
          setUsersByDepartment([]);
          setAllUsers([]);
        }
      } else {
        setUsersByDepartment(response.usersByDepartment || []);
        setAllUsers(response.users || []);
      }
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || 'Failed to load users');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error fetching users:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
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
  }, [searchQuery, canToggleAnyUserStatus, currentUser?.id]);

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

  const handleToggleUserStatus = async (user: User) => {
    // Check if user can toggle this status
    const canToggle = canToggleAnyUserStatus || canToggleOwnStatus(user.id);
    
    if (!canToggle) {
      alert('You can only change your own availability status');
      return;
    }

    if (togglingUsers.has(user.id)) return;

    const newStatus = !user.isActive;
    console.log(`Toggling user ${user.id} status from ${user.isActive} to ${newStatus}`);
    
    // Optimistically update the UI immediately for better UX
    const updateUserInState = (users: User[]) => 
      users.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u);
    
    setUsersByDepartment(prev => 
      prev.map(dept => ({
        ...dept,
        users: updateUserInState(dept.users)
      }))
    );
    setAllUsers(prev => updateUserInState(prev));

    try {
      setTogglingUsers(prev => new Set(prev).add(user.id));
      const response = await usersApi.updateUser(user.id, { isActive: newStatus });
      console.log('Status update response:', response);
      
      // If updating own status, refresh auth context to update header
      if (user.id === currentUser?.id) {
        await refreshUser();
      }
      
      // Refresh the entire user list to ensure consistency and reflect changes to all users
      // This ensures all users see the updated status in real-time
      await fetchUsers(false);
    } catch (err) {
      console.error('Error toggling user status:', err);
      
      // Revert optimistic update on error
      const revertUserInState = (users: User[]) => 
        users.map(u => u.id === user.id ? { ...u, isActive: !newStatus } : u);
      
      setUsersByDepartment(prev => 
        prev.map(dept => ({
          ...dept,
          users: revertUserInState(dept.users)
        }))
      );
      setAllUsers(prev => revertUserInState(prev));
      
      if (err instanceof ApiError) {
        alert(err.data?.message || 'Failed to update user status');
      } else {
        alert('Failed to update user status');
      }
      // Refresh on error to ensure consistency
      fetchUsers(false);
    } finally {
      setTogglingUsers(prev => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
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
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-white">
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">User</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Role</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">Contact</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Location</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {department.users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-semibold text-xs sm:text-sm">
                                  {user.firstName[0]}{user.lastName[0]}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                              roleColors[user.role as keyof typeof roleColors] || roleColors.REQUESTER
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4 hidden sm:table-cell">
                            <div className="space-y-1">
                              {user.phoneNumber && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  <span>{user.phoneNumber}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4" />
                                <span className="truncate max-w-[200px]">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4">
                            {user.location ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {user.location.blockName ? `${user.location.blockName} - ` : ''}
                                    {user.location.name}
                                  </p>
                                  {user.location.floor && (
                                    <p className="text-xs text-gray-500">Floor {user.location.floor}</p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">No location</span>
                            )}
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit ${
                              user.isActive 
                                ? 'bg-green-100 text-green-700 border border-green-300' 
                                : 'bg-gray-200 text-gray-700 border border-gray-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                              {user.isActive ? 'Available' : 'Not Available'}
                            </span>
                          </td>
                          <td className="py-4 px-2 sm:px-4">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              {/* Power button - always show for users who can toggle (own status or admin/HOD) */}
                              {(canToggleAnyUserStatus || canToggleOwnStatus(user.id)) && (
                                <button 
                                  onClick={() => handleToggleUserStatus(user)}
                                  disabled={togglingUsers.has(user.id)}
                                  className={`
                                    p-2 sm:p-2.5 rounded-lg transition-all duration-200 flex-shrink-0
                                    ${user.isActive
                                      ? 'bg-green-500 hover:bg-green-600 text-white border border-green-600'
                                      : 'bg-gray-400 hover:bg-gray-500 text-white border border-gray-500'
                                    }
                                    ${togglingUsers.has(user.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}
                                    shadow-md
                                  `}
                                  title={user.isActive ? 'User is actively working - Click to mark as not available' : 'User is not available - Click to mark as actively working'}
                                  aria-label={user.isActive ? 'Mark user as not available' : 'Mark user as available'}
                                >
                                  {togglingUsers.has(user.id) ? (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <UserPowerIcon isActive={user.isActive} className="w-5 h-5 sm:w-6 sm:h-6" />
                                  )}
                                </button>
                              )}
                              {/* Location button - show for all users */}
                              <button 
                                onClick={() => {
                                  setSelectedUserForLocation(user);
                                  setShowLocationModal(true);
                                }}
                                className="p-2 sm:p-2.5 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                                title={user.location ? `Location: ${user.location.blockName ? `${user.location.blockName} - ` : ''}${user.location.name}` : 'Set user location'}
                              >
                                <MapPin className={`w-5 h-5 sm:w-6 sm:h-6 ${user.location ? 'text-blue-600' : 'text-gray-400'}`} />
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingUser(user);
                                  setShowUserModal(true);
                                }}
                                className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                                title="Edit user"
                              >
                                <Edit className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                              </button>
                              <button 
                                onClick={() => handleDelete(user.id)}
                                className="p-2 sm:p-2.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                title="Delete user"
                              >
                                <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
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

      <UserLocationModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          setSelectedUserForLocation(null);
        }}
        onSuccess={() => {
          fetchUsers(false);
        }}
        user={selectedUserForLocation}
      />
    </div>
  );
}

