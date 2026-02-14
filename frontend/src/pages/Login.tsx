import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Mail, Lock, AlertCircle, Moon, User } from 'lucide-react';
import { ApiError } from '../services/api';
// import GGHospitalLogo from '../components/GGHospitalLogo';
// Uncomment and update the path when you have your logo image:
// Use public asset path instead of importing
const logoImage = '/assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // Navigation will happen automatically via App.tsx
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || err.data?.message || 'Invalid email or password');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col align-center lg:flex-row">
      {/* Left Panel - Marketing Content */}
      <div className="w-full lg:w-1/2 bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col justify-center gap-5 p-8 lg:p-12 text-white relative overflow-hidden">
        {/* Logo */}
        <div className="mb-8 lg:mb-0">
          <div className="bg-white rounded-xl p-4 inline-block shadow-lg">
            {/* To use your image, replace the line below with: */}
            {/* <GGHospitalLogo src={logoImage} width={180} height={100} /> */}
            <img src={logoImage} alt="GG Hospital Logo" width={120} height={75} />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center max-w-md">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Streamlining Healthcare Support.
          </h2>
          <p className="text-lg lg:text-xl text-blue-100 leading-relaxed mb-8">
            Welcome back to the Hospital Ticketing System. Manage requests, track resolutions, and ensure patient care excellence.
          </p>
        </div>

        {/* Trust Indicator */}
        <div className="flex items-center gap-3 mt-8 lg:mt-0">
          <div className="flex -space-x-2">
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>
          <p className="text-blue-100 text-sm lg:text-base">
            Trusted by 500+ medical professionals
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-6 lg:p-12 relative">
        {/* Dark Mode Toggle */}
        <button
          className="absolute top-6 right-6 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Toggle dark mode"
        >
          <Moon className="w-5 h-5 text-gray-600" />
        </button>

        <div className="w-full max-w-md">
          {/* Header Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center">
              <ArrowRight className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 text-center">
            Welcome Back.
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Sign in to your account to continue.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400"
                  placeholder="name@hospital.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400"
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New here?{' '}
              <button
                type="button"
                onClick={() => {
                  window.location.hash = 'register';
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Don't have an account? Sign up
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-400">
              HOSPITAL TICKETING SYSTEM • V2.4.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

