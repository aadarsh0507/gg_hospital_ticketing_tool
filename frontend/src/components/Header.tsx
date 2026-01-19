import { useState, useRef, useEffect } from 'react';
import { Menu, HelpCircle, User, LogOut, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ServiceRequestModal from './ServiceRequestModal';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    window.location.hash = 'login';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 w-full max-w-full">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="hidden lg:block w-64"></div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>

          {/* Service Request Button */}
          <button
            onClick={() => setShowServiceModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            title="Create Service Request"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Service Request</span>
          </button>
          
          {/* Logout Button - Always Visible */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600 hidden sm:block" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200 sm:hidden">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors sm:hidden"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ServiceRequestModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onSuccess={() => {
          setShowServiceModal(false);
          // Optionally refresh the page or show a success message
          window.location.reload();
        }}
      />
    </header>
  );
}
