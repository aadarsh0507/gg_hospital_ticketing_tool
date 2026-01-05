import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RequestMetrics from './pages/RequestMetrics';
import TeamLeaderboard from './pages/TeamLeaderboard';
import CreateRequestLink from './pages/CreateRequestLink';
import ManageRequests from './pages/ManageRequests';
import MyRequests from './pages/MyRequests';
import AdminLocations from './pages/AdminLocations';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'metrics':
        return <RequestMetrics />;
      case 'leaderboard':
        return <TeamLeaderboard />;
      case 'create-link':
        return <CreateRequestLink />;
      case 'requests':
        return <ManageRequests />;
      case 'my-requests':
        return <MyRequests />;
      case 'locations':
        return <AdminLocations />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activePage={activePage} onPageChange={setActivePage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
