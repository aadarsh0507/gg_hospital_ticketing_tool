import { Monitor, Smartphone, Tablet, Save, Eye, Palette, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

export default function AppDisplay() {
  const [activeDevice, setActiveDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [theme, setTheme] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    logo: null as string | null
  });

  const colorPresets = [
    { name: 'Blue', primary: '#3B82F6', secondary: '#10B981' },
    { name: 'Purple', primary: '#8B5CF6', secondary: '#EC4899' },
    { name: 'Green', primary: '#10B981', secondary: '#3B82F6' },
    { name: 'Orange', primary: '#F97316', secondary: '#F59E0B' },
    { name: 'Red', primary: '#EF4444', secondary: '#DC2626' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">App Display Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Customize the appearance of your mobile app</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Preview</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex-1 sm:flex-none">
            <Save className="w-4 h-4" />
            <span className="text-sm font-medium">Save Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Monitor className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Device Preview</h2>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setActiveDevice('mobile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeDevice === 'mobile'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">Mobile</span>
              </button>
              <button
                onClick={() => setActiveDevice('tablet')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeDevice === 'tablet'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Tablet className="w-4 h-4" />
                <span className="text-sm font-medium">Tablet</span>
              </button>
              <button
                onClick={() => setActiveDevice('desktop')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeDevice === 'desktop'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-medium">Desktop</span>
              </button>
            </div>

            <div className="flex items-center justify-center">
              <div
                className={`bg-gray-100 rounded-xl p-8 ${
                  activeDevice === 'mobile' ? 'w-64' : activeDevice === 'tablet' ? 'w-96' : 'w-full'
                }`}
                style={{ minHeight: '500px' }}
              >
                <div
                  className="rounded-lg overflow-hidden shadow-lg"
                  style={{
                    backgroundColor: theme.backgroundColor,
                    color: theme.textColor
                  }}
                >
                  <div
                    className="p-4"
                    style={{ backgroundColor: theme.primaryColor, color: 'white' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <Monitor className="w-5 h-5" style={{ color: theme.primaryColor }} />
                      </div>
                      <span className="font-bold">MediCare</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 rounded" style={{ backgroundColor: theme.primaryColor, opacity: 0.2 }} />
                    <div className="h-4 rounded" style={{ backgroundColor: theme.primaryColor, opacity: 0.1 }} />
                    <div className="h-4 rounded w-3/4" style={{ backgroundColor: theme.primaryColor, opacity: 0.1 }} />
                    <div className="mt-6">
                      <div
                        className="px-4 py-2 rounded-lg text-white text-center font-medium"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        Sample Button
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Theme Colors</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                    className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor}
                    onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                    className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.backgroundColor}
                    onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.textColor}
                    onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                    className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.textColor}
                    onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">Color Presets</label>
              <div className="grid grid-cols-5 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setTheme({
                      ...theme,
                      primaryColor: preset.primary,
                      secondaryColor: preset.secondary
                    })}
                    className="flex flex-col items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: preset.secondary }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <ImageIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Logo & Branding</h2>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">Upload your logo</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Choose File
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

