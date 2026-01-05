import { TrendingUp, Clock, Users, ChevronDown } from 'lucide-react';
import StatCard from '../components/StatCard';

export default function RequestMetrics() {
  const chartData = [
    { date: 'Jan 1', value: 4.2 },
    { date: 'Jan 2', value: 5.1 },
    { date: 'Jan 3', value: 4.8 },
    { date: 'Jan 4', value: 6.2 },
    { date: 'Jan 5', value: 5.5 },
    { date: 'Jan 6', value: 7.1 },
    { date: 'Jan 7', value: 6.8 }
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Requests Handled and Staff Utilisation Graph
        </h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <span className="text-sm font-medium text-gray-700">Last 7 days</span>
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Requests"
          value="1,284"
          icon={TrendingUp}
          variant="green"
        />
        <StatCard
          title="Work Hours"
          value="342"
          icon={Clock}
          variant="blue"
        />
        <StatCard
          title="Avg Requests per Staff"
          value="6.4"
          icon={Users}
          variant="green"
        />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Average Requests per Staff
        </h2>

        <div className="relative h-80">
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-4">
            <span>8.0</span>
            <span>6.0</span>
            <span>4.0</span>
            <span>2.0</span>
            <span>0.0</span>
          </div>

          <div className="ml-12 h-full flex items-end justify-between gap-8 border-l border-b border-gray-200 pl-8 pb-8">
            {chartData.map((point, index) => {
              const height = (point.value / maxValue) * 100;
              return (
                <div key={point.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full" style={{ height: '260px' }}>
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
