import { Search, Plus, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function CreateRequestLink() {
  const [linkType, setLinkType] = useState<'area' | 'common'>('area');
  const [phoneNumbers, setPhoneNumbers] = useState(['']);

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, '']);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Send Request Creation Link</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 max-w-3xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Link Type
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="linkType"
                  value="area"
                  checked={linkType === 'area'}
                  onChange={() => setLinkType('area')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Area Link</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="linkType"
                  value="common"
                  checked={linkType === 'common'}
                  onChange={() => setLinkType('common')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Common Link</span>
              </label>
            </div>
          </div>

          {linkType === 'area' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Area
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for area or room..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex gap-3 mb-3">
                <div className="relative w-32">
                  <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                    <option>+1 (US)</option>
                    <option>+44 (UK)</option>
                    <option>+91 (IN)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => {
                    const newNumbers = [...phoneNumbers];
                    newNumbers[index] = e.target.value;
                    setPhoneNumbers(newNumbers);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
            <button
              onClick={addPhoneNumber}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add another number
            </button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-4 mb-4">
              <button className="flex-1 py-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
                Send via SMS
              </button>
              <button className="flex-1 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                Upload Customer Data (CSV)
              </button>
            </div>
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-sm text-gray-500">
                Click to upload or drag and drop CSV file
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Clear
            </button>
            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
              Send Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
