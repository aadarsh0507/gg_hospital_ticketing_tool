import { Crown, Award, Star } from 'lucide-react';

interface LeaderboardCardProps {
  rank: number;
  name: string;
  points: number;
  achievements: number;
}

export default function LeaderboardCard({ rank, name, points, achievements }: LeaderboardCardProps) {
  const gradients = {
    1: 'from-yellow-300 to-yellow-500',
    2: 'from-gray-300 to-gray-400',
    3: 'from-orange-300 to-orange-500'
  };

  const borderColors = {
    1: 'border-yellow-400',
    2: 'border-gray-400',
    3: 'border-orange-400'
  };

  const isTopThree = rank <= 3;
  const gradient = isTopThree ? gradients[rank as keyof typeof gradients] : '';
  const borderColor = isTopThree ? borderColors[rank as keyof typeof borderColors] : 'border-gray-200';

  return (
    <div
      className={`relative ${
        isTopThree ? `bg-gradient-to-r ${gradient}` : 'bg-white'
      } rounded-xl p-6 shadow-md border-2 ${borderColor} hover:shadow-lg transition-all`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                isTopThree ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {rank}
            </div>
            {rank === 1 && (
              <Crown className="w-6 h-6 text-yellow-600 absolute -top-3 left-6" />
            )}
          </div>

          <div>
            <h3 className={`font-bold text-lg ${isTopThree ? 'text-white' : 'text-gray-900'}`}>
              {name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Award className={`w-4 h-4 ${isTopThree ? 'text-white/80' : 'text-gray-500'}`} />
              <span className={`text-sm ${isTopThree ? 'text-white/90' : 'text-gray-600'}`}>
                {achievements} achievements
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Star className={`w-5 h-5 ${isTopThree ? 'text-white' : 'text-yellow-500'} fill-current`} />
          <span className={`text-2xl font-bold ${isTopThree ? 'text-white' : 'text-gray-900'}`}>
            {points}
          </span>
        </div>
      </div>
    </div>
  );
}
