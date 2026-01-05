interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'sla';
}

export default function StatusBadge({ status, type = 'status' }: StatusBadgeProps) {
  const statusColors: Record<string, string> = {
    assigned: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    delayed: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    escalated: 'bg-red-100 text-red-700 border-red-200',
    'on hold': 'bg-gray-100 text-gray-700 border-gray-200',
    'on time': 'bg-green-100 text-green-700 border-green-200',
    new: 'bg-blue-100 text-blue-700 border-blue-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  };

  const colorClass = statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
}
