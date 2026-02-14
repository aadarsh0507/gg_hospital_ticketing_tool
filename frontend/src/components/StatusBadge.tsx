interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'sla';
}

export default function StatusBadge({ status, type = 'status' }: StatusBadgeProps) {
  const statusColors: Record<string, string> = {
    // New statuses
    new: 'bg-blue-100 text-blue-700 border-blue-200',
    assigned: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'in_progress': 'bg-purple-100 text-purple-700 border-purple-200',
    'in progress': 'bg-purple-100 text-purple-700 border-purple-200',
    'action_taken': 'bg-orange-100 text-orange-700 border-orange-200',
    'action taken': 'bg-orange-100 text-orange-700 border-orange-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    closed: 'bg-gray-100 text-gray-700 border-gray-200',
    // Legacy statuses
    delayed: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'on hold': 'bg-gray-100 text-gray-700 border-gray-200',
    'on_hold': 'bg-gray-100 text-gray-700 border-gray-200',
    'on time': 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  // Normalize status: convert to lowercase and replace underscores with spaces
  const normalizedStatus = status.toLowerCase().replace(/_/g, ' ');
  const colorClass = statusColors[normalizedStatus] || 'bg-gray-100 text-gray-700 border-gray-200';
  
  // Format display text
  const displayText = type === 'sla' 
    ? status 
    : status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {displayText}
    </span>
  );
}
