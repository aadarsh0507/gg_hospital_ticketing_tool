import { useState, useRef, useEffect } from 'react';
import { Menu, HelpCircle, User, LogOut, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ServiceRequestModal from './ServiceRequestModal';
import PowerButton from './PowerButton';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [headerPadding, setHeaderPadding] = useState('15px');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    // Calculate header padding for mobile devices
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform();
      
      if (platform === 'android') {
        // For Android: Use 80px to ensure content is well below status bar
        // Status bar can be 24-48px, plus 15px spacing, plus extra buffer
        const padding = '80px';
        setHeaderPadding(padding);
        
        // Force apply padding immediately with multiple methods
        const applyPadding = () => {
          const headerElement = document.querySelector('header') || document.querySelector('#app-header');
          if (headerElement) {
            const htmlElement = headerElement as HTMLElement;
            htmlElement.style.paddingTop = padding;
            htmlElement.style.setProperty('padding-top', padding, 'important');
            htmlElement.classList.add('mobile-header-padding');
            // Also set as data attribute for CSS targeting
            htmlElement.setAttribute('data-header-padding', padding);
          }
        };
        
        // Apply immediately
        applyPadding();
        
        // Apply after DOM is ready
        setTimeout(applyPadding, 0);
        setTimeout(applyPadding, 50);
        setTimeout(applyPadding, 100);
        setTimeout(applyPadding, 200);
        
        // Also listen for any style changes and reapply
        const observer = new MutationObserver(() => {
          applyPadding();
        });
        
        setTimeout(() => {
          const headerElement = document.querySelector('header') || document.querySelector('#app-header');
          if (headerElement) {
            observer.observe(headerElement, {
              attributes: true,
              attributeFilter: ['style', 'class'],
            });
          }
        }, 300);
      } else if (platform === 'ios') {
        // For iOS: status bar (44px with notch, 20px without) + 15px spacing
        const hasNotch = window.screen.height >= 812;
        const padding = hasNotch ? '59px' : '35px';
        setHeaderPadding(padding);
        
        const headerElement = document.querySelector('header');
        if (headerElement) {
          (headerElement as HTMLElement).style.paddingTop = padding;
        }
      } else {
        setHeaderPadding('15px');
      }
    } else {
      // Web browser - no extra padding needed
      setHeaderPadding('15px');
    }
  }, []);

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
    <header 
      id="app-header"
      className="bg-white border-b border-gray-200 sticky top-0 z-40 w-full max-w-full overflow-visible mobile-header-padding"
      data-header-padding={headerPadding}
      style={{
        paddingTop: headerPadding,
        marginTop: '0',
        position: 'relative',
        minHeight: Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' ? 'calc(80px + 56px)' : 'auto',
      }}
    >
      <div className="flex items-center justify-between px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3 md:py-4 w-full max-w-full min-w-0">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="hidden lg:block w-64"></div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 relative flex-shrink-0 min-w-0">
          {/* Power Button - System Status */}
          <PowerButton />

          <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0" aria-label="Help">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>

          {/* Service Request Button */}
          <button
            onClick={() => setShowServiceModal(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex-shrink-0 text-xs sm:text-sm"
            title="Create Service Request"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline font-medium">Service Request</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative flex-shrink-0 min-w-0" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 hover:bg-gray-100 rounded-lg transition-colors min-w-0"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="hidden sm:block text-left min-w-0 max-w-[120px] md:max-w-none">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate hidden md:block">{user?.email}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 hidden sm:block flex-shrink-0" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[100] min-w-[140px]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
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
