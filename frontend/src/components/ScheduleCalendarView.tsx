import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface ScheduledRequest {
  id: string;
  requestId: string;
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  recurring: boolean;
}

interface ScheduleCalendarViewProps {
  requests: ScheduledRequest[];
  onRequestClick: (requestId: string) => void;
}

export default function ScheduleCalendarView({ requests, onRequestClick }: ScheduleCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Get requests for current month
  const getRequestsForDate = (date: Date) => {
    // Create date string in YYYY-MM-DD format using local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return requests.filter(req => {
      if (!req.scheduledDate) return false;
      
      // scheduledDate should already be in YYYY-MM-DD format from the transformation
      let reqDateStr: string = '';
      
      if (typeof req.scheduledDate === 'string') {
        // If it's already in YYYY-MM-DD format (most common case)
        if (req.scheduledDate.match(/^\d{4}-\d{2}-\d{2}/)) {
          reqDateStr = req.scheduledDate.substring(0, 10);
        } else {
          // Try to parse and normalize
          try {
            const parsed = new Date(req.scheduledDate);
            if (!isNaN(parsed.getTime())) {
              const parsedYear = parsed.getFullYear();
              const parsedMonth = String(parsed.getMonth() + 1).padStart(2, '0');
              const parsedDay = String(parsed.getDate()).padStart(2, '0');
              reqDateStr = `${parsedYear}-${parsedMonth}-${parsedDay}`;
            } else {
              return false;
            }
          } catch (e) {
            return false;
          }
        }
      } else {
        return false;
      }
      
      // Exact match only - no ambiguity
      return reqDateStr === dateStr;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    calendarDays.push(date);
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {monthNames[month]} {year}
        </h2>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {dayNames.map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            if (!date) {
              return (
                <div key={`empty-${index}`} className="min-h-[100px] border-r border-b border-gray-200 last:border-r-0 bg-gray-50" />
              );
            }

            const dayRequests = getRequestsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isPast = date < new Date() && !isToday;

            return (
              <div
                key={date.toISOString()}
                className={`min-h-[100px] border-r border-b border-gray-200 last:border-r-0 p-2 ${
                  isToday ? 'bg-blue-50' : isPast ? 'bg-gray-50' : 'bg-white'
                } ${dayRequests.length > 0 ? 'border-l-4 border-l-blue-400' : ''} hover:bg-gray-100 transition-colors`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </div>
                  {dayRequests.length > 0 && (
                    <div className={`w-2 h-2 rounded-full ${
                      dayRequests.some(r => r.status === 'COMPLETED') 
                        ? 'bg-green-500' 
                        : dayRequests.some(r => r.status === 'CANCELLED')
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`} title={`${dayRequests.length} request(s)`} />
                  )}
                </div>
                <div className="space-y-1 max-h-[70px] overflow-y-auto">
                  {dayRequests.slice(0, 3).map(request => (
                    <button
                      key={request.id}
                      onClick={() => onRequestClick(request.id)}
                      className={`w-full text-left px-2 py-1 rounded text-xs truncate transition-colors ${
                        request.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : request.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                      title={request.title}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="truncate">{request.scheduledTime}</span>
                      </div>
                      <div className="truncate font-medium">{request.title}</div>
                    </button>
                  ))}
                  {dayRequests.length > 3 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{dayRequests.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <span className="text-gray-600">Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded"></div>
          <span className="text-gray-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded"></div>
          <span className="text-gray-600">Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
          <span className="text-gray-600">Today</span>
        </div>
      </div>
    </div>
  );
}

