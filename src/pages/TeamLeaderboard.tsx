import { ChevronDown, Download } from 'lucide-react';
import LeaderboardCard from '../components/LeaderboardCard';

export default function TeamLeaderboard() {
  const topPerformers = [
    { rank: 1, name: 'Dr. Sarah Johnson', points: 2850, achievements: 24 },
    { rank: 2, name: 'Nurse Michael Chen', points: 2640, achievements: 21 },
    { rank: 3, name: 'Dr. Emily Rodriguez', points: 2510, achievements: 19 },
    { rank: 4, name: 'Technician James Wilson', points: 2280, achievements: 17 },
    { rank: 5, name: 'Dr. Patricia Martinez', points: 2150, achievements: 16 },
    { rank: 6, name: 'Nurse David Thompson', points: 2040, achievements: 15 },
    { rank: 7, name: 'Dr. Robert Anderson', points: 1920, achievements: 14 },
    { rank: 8, name: 'Nurse Lisa Taylor', points: 1850, achievements: 13 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Top Performers</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Download Leaderboard</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Month:</label>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm text-gray-700">January</span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm text-gray-700">2026</span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Department:</label>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm text-gray-700">All Departments</span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {topPerformers.map((performer) => (
            <LeaderboardCard key={performer.rank} {...performer} />
          ))}
        </div>
      </div>
    </div>
  );
}
