import { useState, useEffect } from 'react';
import { MessageSquareWarning, Star, User, Search, Filter, ChevronDown, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Feedback {
  id: number;
  requestId: string;
  rating: number;
  comment: string;
  submittedBy: string;
  submittedAt: string;
  area: string;
  status: string;
  type: string;
}

export default function AdminFeedbackEscalation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch feedbacks from API when endpoint is available
    setLoading(false);
    setFeedbacks([]);
  }, []);

  const filteredFeedbacks = feedbacks.filter(feedback =>
    feedback.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.submittedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const typeColors = {
    Positive: 'bg-green-100 text-green-700 border-green-200',
    Negative: 'bg-red-100 text-red-700 border-red-200',
    Neutral: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  };

  const statusColors = {
    'Pending Review': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Reviewed': 'bg-green-100 text-green-700 border-green-200',
    'Escalated': 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Feedback Escalation</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Review and manage customer feedback</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-full">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquareWarning className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Total Feedback</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{feedbacks.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <ThumbsUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Positive</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {feedbacks.filter(f => f.type === 'Positive').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <ThumbsDown className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-600">Negative</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {feedbacks.filter(f => f.type === 'Negative').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <MessageSquareWarning className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-600">Escalated</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {feedbacks.filter(f => f.status === 'Escalated').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
            <span className="text-sm text-gray-700">Type</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
            <span className="text-sm text-gray-700">Status</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading feedback...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquareWarning className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feedback Found</h3>
            <p className="text-gray-600">Try adjusting your search query or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquareWarning className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-600">{feedback.requestId}</span>
                    <span className="text-sm text-gray-600">• {feedback.area}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      typeColors[feedback.type as keyof typeof typeColors]
                    }`}>
                      {feedback.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {getRatingStars(feedback.rating)}
                    <span className="text-sm text-gray-600 ml-2">({feedback.rating}/5)</span>
                  </div>
                  <p className="text-gray-700 mb-3">{feedback.comment}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  statusColors[feedback.status as keyof typeof statusColors]
                }`}>
                  {feedback.status}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>
                      <strong className="text-gray-900">{feedback.submittedBy}</strong>
                    </span>
                  </div>
                  <span>{feedback.submittedAt}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    View Details
                  </button>
                  {feedback.status === 'Pending Review' && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                      Mark Reviewed
                    </button>
                  )}
                  {feedback.type === 'Negative' && feedback.status !== 'Escalated' && (
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                      Escalate
                    </button>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

