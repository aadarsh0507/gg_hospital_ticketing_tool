import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RequestMetrics from './pages/RequestMetrics';
import TeamLeaderboard from './pages/TeamLeaderboard';
import CreateRequestLink from './pages/CreateRequestLink';
import ManageRequests from './pages/ManageRequests';
import MyRequests from './pages/MyRequests';
import AdminLocations from './pages/AdminLocations';
import AdminDepartments from './pages/AdminDepartments';
import AdminEscalations from './pages/AdminEscalations';
import AdminFeedbackEscalation from './pages/AdminFeedbackEscalation';
import AdminLabels from './pages/AdminLabels';
import AppDisplay from './pages/AppDisplay';
import ScheduleRequests from './pages/ScheduleRequests';
import Reports from './pages/Reports';

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const { isAuthenticated, loading, user } = useAuth();

  // Wait for user data to load before checking permissions
  const userLoading = loading || (isAuthenticated && !user);

  // Handle hash-based routing for auth pages
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'login' || hash === 'register') {
        setAuthPage(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    // Wait for user data before checking permissions
    if (userLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    const isAdmin = user?.role === 'ADMIN';
    const isRequester = user?.role === 'REQUESTER';

    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'my-requests':
        return <MyRequests />;
      case 'metrics':
        if (!isAdmin && user?.role !== 'STAFF') {
          return <div className="p-6 text-center text-red-600">Insufficient permissions</div>;
        }
        return <RequestMetrics />;
      case 'leaderboard':
        if (!isAdmin && user?.role !== 'STAFF') {
          return <div className="p-6 text-center text-red-600">Insufficient permissions</div>;
        }
        return <TeamLeaderboard />;
      case 'create-link':
        if (!isAdmin && user?.role !== 'STAFF') {
          return <div className="p-6 text-center text-red-600">Insufficient permissions</div>;
        }
        return <CreateRequestLink />;
      case 'requests':
        if (!isAdmin && user?.role !== 'STAFF') {
          return <div className="p-6 text-center text-red-600">Insufficient permissions</div>;
        }
        return <ManageRequests />;
      case 'locations':
        if (!isAdmin) {
          return <div className="p-6 text-center text-red-600">Insufficient permissions</div>;
        }
        return <AdminLocations />;
      case 'departments':
        if (!isAdmin) {
          return <div className="p-6 text-center text-red-600">Insufficient permissions</div>;
        }
        return <AdminDepartments />;
      case 'escalations':
        if (!isAdmin) {
          return <div className="p-6 text-center text-red-600">Insufficient permissions</div>;
        }
        return <AdminEscalations />;
      case 'feedback':
        if (!isAdmin) {
          return <div className="p-6 text-center text-red-600">Insufficient permissions</div>;
        }
        return <AdminFeedbackEscalation />;
      case 'labels':
        if (!isAdmin) {
          return <div className="p-6 text-center text-red-600">Insufficient permissions</div>;
        }
        return <AdminLabels />;
      case 'app-display':
        if (!isAdmin) {
          return <div className="p-6 text-center text-red-600">Insufficient permissions</div>;
        }
        return <AppDisplay />;
      case 'schedule':
        if (!isAdmin && user?.role !== 'STAFF') {
          return <div className="p-6 text-center text-red-600">Insufficient permissions</div>;
        }
        return <ScheduleRequests />;
      case 'reports':
        if (!isAdmin && user?.role !== 'STAFF') {
          return <div className="p-6 text-center text-red-600">Insufficient permissions</div>;
        }
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    return authPage === 'register' ? <Register /> : <Login />;
  }

  // Show main app if authenticated
  return (
    <Layout activePage={activePage} onPageChange={setActivePage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
