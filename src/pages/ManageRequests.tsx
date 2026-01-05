import { Filter, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function ManageRequests() {
  const requests = [
    {
      slNo: 1,
      status: 'Assigned',
      sla: 'On Time',
      requestId: 'REQ-2024-001',
      area: 'ICU Ward A',
      createdTime: '2024-01-05 09:15 AM',
      service: 'Patient Transport',
      department: 'Nursing',
      requestedBy: 'Dr. Sarah Johnson'
    },
    {
      slNo: 2,
      status: 'Completed',
      sla: 'On Time',
      requestId: 'REQ-2024-002',
      area: 'Emergency Room',
      createdTime: '2024-01-05 08:45 AM',
      service: 'Medical Equipment',
      department: 'Emergency',
      requestedBy: 'Nurse Michael Chen'
    },
    {
      slNo: 3,
      status: 'Delayed',
      sla: 'Delayed',
      requestId: 'REQ-2024-003',
      area: 'Surgery Block 2',
      createdTime: '2024-01-05 07:30 AM',
      service: 'Housekeeping',
      department: 'Facilities',
      requestedBy: 'Dr. Emily Rodriguez'
    },
    {
      slNo: 4,
      status: 'Escalated',
      sla: 'Delayed',
      requestId: 'REQ-2024-004',
      area: 'Pediatrics Ward',
      createdTime: '2024-01-04 11:20 PM',
      service: 'IT Support',
      department: 'Technology',
      requestedBy: 'Nurse Lisa Taylor'
    },
    {
      slNo: 5,
      status: 'On Hold',
      sla: 'On Time',
      requestId: 'REQ-2024-005',
      area: 'Radiology',
      createdTime: '2024-01-04 10:15 PM',
      service: 'Maintenance',
      department: 'Facilities',
      requestedBy: 'Tech James Wilson'
    },
    {
      slNo: 6,
      status: 'Assigned',
      sla: 'On Time',
      requestId: 'REQ-2024-006',
      area: 'Laboratory',
      createdTime: '2024-01-04 09:00 PM',
      service: 'Supply Delivery',
      department: 'Logistics',
      requestedBy: 'Dr. Robert Anderson'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All Requests</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Sl No
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Status
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    SLA
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Request ID
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Created Time
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Requested By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.slNo} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.slNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={request.sla} type="sla" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {request.requestId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.area}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {request.createdTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.service}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.requestedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">1</span> to <span className="font-medium">6</span> of{' '}
            <span className="font-medium">24</span> results
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium">
              1
            </button>
            <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-white transition-colors">
              2
            </button>
            <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-white transition-colors">
              3
            </button>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
