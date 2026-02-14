import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { systemSettingsApi, usersApi, ApiError } from '../services/api';

// Custom Power Button Icon Component - Changes based on active/inactive status
const PowerIcon = ({ isActive, className = '' }: { isActive: boolean; className?: string }) => {
  if (isActive) {
    // Active state: Filled power icon with glow effect
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outer glow circle */}
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
        {/* Main filled circle */}
        <circle cx="12" cy="12" r="8" fill="currentColor" />
        {/* Power line on top */}
        <line x1="12" y1="2" x2="12" y2="8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outlined circle */}
        <circle cx="12" cy="12" r="8" />
        {/* Power line on top */}
        <line x1="12" y1="2" x2="12" y2="8" />
        {/* Slash through to indicate off */}
        <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2.5" />
      </svg>
    );
  }
};

interface PowerButtonProps {
  className?: string;
}

export default function PowerButton({ className = '' }: PowerButtonProps) {
  const { user, refreshUser } = useAuth();
  const [isActive, setIsActive] = useState<boolean>(user?.isActive ?? true);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // All authenticated users can toggle
  const canToggle = !!user;

  // Fetch user status on mount and when user changes
  useEffect(() => {
    if (user) {
      setIsActive(user.isActive ?? true);
      setLoading(false);
    }
  }, [user?.isActive, user?.id]);

  // Poll for user status updates every 3 seconds
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchUserStatus = async () => {
      try {
        const response = await usersApi.getUsers();
        const currentUser = response.users.find(u => u.id === user.id);
        if (currentUser) {
          // Update state if different
          setIsActive(prev => {
            if (prev !== currentUser.isActive) {
              // Update auth context when status changes
              refreshUser();
              return currentUser.isActive;
            }
            return prev;
          });
        }
      } catch (err) {
        // Silently fail on polling errors
        console.error('Error polling user status:', err);
      }
    };

    // Initial fetch
    fetchUserStatus();

    // Poll every 3 seconds
    const interval = setInterval(fetchUserStatus, 3000);
    return () => clearInterval(interval);
  }, [user?.id, refreshUser]);

  const handleToggle = async () => {
    if (!canToggle || toggling || !user?.id) return;

    try {
      setToggling(true);
      setError(null);
      const newStatus = !isActive;
      
      // Optimistically update UI
      setIsActive(newStatus);
      
      // Update user status
      await usersApi.updateUser(user.id, { isActive: newStatus });
      
      // Refresh user context to sync with server
      await refreshUser();
    } catch (err) {
      console.error('Error updating user status:', err);
      // Revert optimistic update
      setIsActive(!isActive);
      if (err instanceof ApiError) {
        setError(err.data?.message || 'Failed to update status');
      } else {
        setError('Failed to update status');
      }
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Power button - visible and clickable for all authenticated users */}
      <button
        onClick={handleToggle}
        disabled={toggling || !canToggle}
        className={`
          relative flex items-center justify-center w-9 h-9 rounded-full
          transition-all duration-300 transform
          ${isActive
            ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/50'
            : 'bg-red-100 hover:bg-red-200 text-red-600 border-2 border-red-300'
          }
          ${toggling ? 'opacity-50 cursor-not-allowed scale-95' : 'cursor-pointer hover:scale-110 active:scale-95'}
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${isActive ? 'focus:ring-green-500' : 'focus:ring-red-400'}
        `}
        title={isActive ? 'Mark yourself as not available' : 'Mark yourself as available'}
      >
        {toggling ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <PowerIcon isActive={isActive} className="w-4 h-4" />
        )}
      </button>

      {/* Status indicator - visible to all users */}
      <div className="flex items-center gap-2">
        {isActive ? (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-md">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium hidden sm:inline">Available</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-200 text-gray-700 rounded-md">
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
            <span className="text-xs font-medium hidden sm:inline">Not Available</span>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-600 max-w-[150px] truncate" title={error}>
          {error}
        </div>
      )}
    </div>
  );
}

