import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Users, ChevronDown } from 'lucide-react';
import StatCard from '../components/StatCard';
import { metricsApi, ApiError } from '../services/api';

export default function RequestMetrics() {
  const [chartData, setChartData] = useState<Array<{ date: string; value: number }>>([]);
  const [stats, setStats] = useState({
    totalRequests: '0',
    workHours: '0',
    avgRequestsPerStaff: '0'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await metricsApi.getMetrics();
        // TODO: Map API response to chartData and stats when API is ready
        setChartData([]);
        setStats({
          totalRequests: '0',
          workHours: '0',
          avgRequestsPerStaff: '0'
        });
        setError(null);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.data?.message || 'Failed to load metrics');
        } else {
          setError('An unexpected error occurred');
        }
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const maxValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 1;

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
          Requests Handled and Staff Utilisation Graph
        </h1>
        <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto text-sm">
          <span className="font-medium text-gray-700">Last 7 days</span>
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading metrics...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            title="Total Requests"
            value={stats.totalRequests}
            icon={TrendingUp}
            variant="green"
          />
          <StatCard
            title="Work Hours"
            value={stats.workHours}
            icon={Clock}
            variant="blue"
          />
          <StatCard
            title="Avg Requests per Staff"
            value={stats.avgRequestsPerStaff}
            icon={Users}
            variant="green"
          />
        </div>
      )}

      <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-200 overflow-x-auto w-full max-w-full" style={{ touchAction: 'pan-x pan-y', overscrollBehaviorX: 'contain' }}>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
          Average Requests per Staff
        </h2>

        <div className="relative h-64 sm:h-80 min-w-[500px] sm:min-w-0">
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2 sm:pr-4">
            <span>8.0</span>
            <span>6.0</span>
            <span>4.0</span>
            <span>2.0</span>
            <span>0.0</span>
          </div>

          <div className="ml-8 sm:ml-12 h-full flex items-end justify-between gap-4 sm:gap-8 border-l border-b border-gray-200 pl-4 sm:pl-8 pb-4 sm:pb-8">
            {chartData.length === 0 ? (
              <div className="w-full text-center py-8 text-gray-500">
                No data available
              </div>
            ) : (
              chartData.map((point, index) => {
              const height = (point.value / maxValue) * 100;
              return (
                <div key={point.date} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                  <div className="relative w-full" style={{ height: '200px' }}>
                    <div
                      className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors cursor-pointer"
                      style={{ height: `${height}%` }}
                    />
                    <div
                      className="absolute left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg"
                      style={{ bottom: `${height}%`, marginBottom: '8px' }}
                    >
                      {point.value}
                    </div>
                    {index > 0 && (
                      <svg
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        style={{ overflow: 'visible' }}
                      >
                        <line
                          x1="-100%"
                          y1={`${100 - (chartData[index - 1].value / maxValue) * 100}%`}
                          x2="50%"
                          y2={`${100 - height}%`}
                          stroke="#3B82F6"
                          strokeWidth="2"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-medium mt-2">{point.date}</span>
                </div>
              );
            })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
