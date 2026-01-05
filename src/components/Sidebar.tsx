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
  AlertTriangle,
  MessageSquareWarning,
  Tag,
  Monitor,
  Calendar,
  FileBarChart
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

export default function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'metrics', label: 'Request Metrics', icon: BarChart3 },
    { id: 'leaderboard', label: 'Team Leaderboard', icon: Trophy },
    { id: 'create-link', label: 'Create Request Link', icon: Link2 },
    {
      id: 'manage',
      label: 'Manage Requests',
      icon: FileText,
      submenu: [
        { id: 'requests', label: 'Requests', icon: ClipboardList },
        { id: 'my-requests', label: 'My Requests', icon: FileText }
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings,
      submenu: [
        { id: 'locations', label: 'Locations', icon: MapPin },
        { id: 'departments', label: 'Departments', icon: Building2 },
        { id: 'escalations', label: 'Escalations', icon: AlertTriangle },
        { id: 'feedback', label: 'Feedback Escalation', icon: MessageSquareWarning },
        { id: 'labels', label: 'Labels', icon: Tag }
      ]
    },
    { id: 'app-display', label: 'App Display', icon: Monitor },
    { id: 'schedule', label: 'Schedule Requests', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: FileBarChart }
  ];

  return (
    <div className="w-64 bg-gray-50 h-screen fixed left-0 top-0 border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">MediCare</h1>
            <p className="text-xs text-gray-500">Hospital Portal</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
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
                      onClick={() => onPageChange(subitem.id)}
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
  );
}
