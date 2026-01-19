import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant: 'green' | 'blue' | 'purple';
}

export default function StatCard({ title, value, icon: Icon, variant }: StatCardProps) {
  const gradients = {
    green: 'from-emerald-400 to-green-600',
    blue: 'from-blue-400 to-blue-600',
    purple: 'from-purple-400 to-purple-600'
  };

  return (
    <div className={`bg-gradient-to-br ${gradients[variant]} rounded-xl p-6 shadow-lg text-white`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium mb-2">{title}</p>
          <p className="text-4xl font-bold">{value}</p>
        </div>
        <div className="bg-white/20 p-3 rounded-lg">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
