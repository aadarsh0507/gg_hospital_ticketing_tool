import { useState, useEffect } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import LeaderboardCard from '../components/LeaderboardCard';
import { leaderboardApi, ApiError } from '../services/api';

export default function TeamLeaderboard() {
  const [topPerformers, setTopPerformers] = useState<Array<{
    rank: number;
    name: string;
    points: number;
    achievements: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await leaderboardApi.getLeaderboard();
        // TODO: Map API response to topPerformers when API is ready
        setTopPerformers([]);
        setError(null);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.data?.message || 'Failed to load leaderboard');
        } else {
          setError('An unexpected error occurred');
        }
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Top Performers</h1>
        <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto text-sm">
          <Download className="w-4 h-4" />
          <span className="font-medium">Download Leaderboard</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Month:</label>
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none min-w-0">
              <span className="text-xs sm:text-sm text-gray-700 truncate">January</span>
              <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Year:</label>
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none min-w-0">
              <span className="text-xs sm:text-sm text-gray-700 truncate">2026</span>
              <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Department:</label>
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none min-w-0">
              <span className="text-xs sm:text-sm text-gray-700 truncate">All Departments</span>
              <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : topPerformers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">No leaderboard data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topPerformers.map((performer) => (
              <LeaderboardCard key={performer.rank} {...performer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
