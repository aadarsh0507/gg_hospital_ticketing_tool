import { Menu, HelpCircle, User, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </button>
            <button className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {showBanner && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-yellow-900 font-bold">!</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-800">
                Your subscription expires on <strong>Jan 15, 2026</strong>
              </span>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium underline">
                Click here to renew
              </a>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="p-1 hover:bg-yellow-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
    </>
  );
}
