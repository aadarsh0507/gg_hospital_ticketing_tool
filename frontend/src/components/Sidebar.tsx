import {
  LayoutDashboard,
  BarChart3,
  Trophy,
  Link2,
  FileText,
  ClipboardList,
  Settings,
  MapPin,
  Building2,
  Tag,
  Monitor,
  Calendar,
  FileBarChart,
  Users
} from 'lucide-react';

import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activePage, onPageChange, isOpen = false, onClose }: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isRequester = user?.role === 'REQUESTER';
  const isHOD = user?.role === 'HOD';

  // Base menu items available to all users
  const baseMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['REQUESTER', 'ADMIN', 'STAFF'] },
    { id: 'my-requests', label: 'My Requests', icon: FileText, roles: ['REQUESTER', 'ADMIN', 'STAFF'] },
    { id: 'schedule', label: 'Schedule Requests', icon: Calendar, roles: ['REQUESTER', 'ADMIN', 'STAFF', 'HOD'] }
  ];

  // Admin-only menu items
  const adminMenuItems = [
    {
      id: 'manage',
      label: 'Manage Requests',
      icon: FileText,
      roles: ['ADMIN', 'HOD'],
      submenu: [
        { id: 'my-requests-manage', label: 'My Requests', icon: FileText, roles: ['HOD'] },
        { id: 'requests', label: 'All Requests', icon: ClipboardList, roles: ['ADMIN', 'HOD'] }
      ]
    },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['HOD'] },
    { id: 'create-link', label: 'Create Request Link', icon: Link2, roles: ['ADMIN', 'HOD'] },
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings,
      roles: ['ADMIN', 'HOD'],
      submenu: [
        { id: 'users', label: 'Users', icon: Users, roles: ['ADMIN', 'HOD', 'STAFF', 'REQUESTER'] },
        { id: 'service-creation', label: 'Service Creation', icon: Tag, roles: ['ADMIN', 'HOD'] },
        { id: 'locations', label: 'Locations', icon: MapPin, roles: ['ADMIN'] },
        { id: 'departments', label: 'Departments', icon: Building2, roles: ['ADMIN'] },
        { id: 'labels', label: 'Labels', icon: Tag, roles: ['ADMIN'] }
      ]
    },
    { id: 'reports', label: 'Reports', icon: FileBarChart, roles: ['ADMIN', 'HOD'] },
    { id: 'metrics', label: 'Request Metrics', icon: BarChart3, roles: ['ADMIN'] },
    { id: 'leaderboard', label: 'Team Leaderboard', icon: Trophy, roles: ['ADMIN'] },
    { id: 'app-display', label: 'App Display', icon: Monitor, roles: ['ADMIN'] }
  ];

  // Filter menu items based on user role
  const filterMenuItems = (items: any[]) => {
    return items.filter(item => {
      if (!item.roles || item.roles.includes(user?.role)) {
        if (item.submenu) {
          item.submenu = item.submenu.filter((sub: any) => 
            !sub.roles || sub.roles.includes(user?.role)
          );
          // Only show parent if it has visible submenu items
          return item.submenu.length > 0;
        }
        return true;
      }
      return false;
    });
  };

  const menuItems = filterMenuItems([...baseMenuItems, ...adminMenuItems]);

  return (
    <>
      <div className={`
        w-64 bg-gray-50 h-screen fixed left-0 top-0 border-r border-gray-200 overflow-y-auto z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">MediCare</h1>
                <p className="text-xs text-gray-500">Hospital Portal</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  onPageChange(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activePage === item.id
                    ? 'bg-blue-600 text-white border-l-4 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>

              {item.submenu && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.submenu.map((subitem) => (
                    <button
                      key={subitem.id}
                      onClick={() => {
                        onPageChange(subitem.id);
                        if (onClose) onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${
                        activePage === subitem.id
                          ? 'bg-blue-600 text-white border-l-4 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <subitem.icon className="w-4 h-4" />
                      <span>{subitem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        </div>
      </div>
    </>
  );
}
