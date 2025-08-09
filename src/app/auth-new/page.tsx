'use client'

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface FormData {
  role: 'tenant' | 'owner';
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export default function AuthPageNew() {
  const { user, isAuthenticated, login, register } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState<FormData>({
    role: 'tenant',
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect authenticated users based on role
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'owner') {
        router.push('/owner/dashboard');
      } else if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/search');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role: 'tenant' | 'owner') => {
    setForm({ ...form, role });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        const result = await register({
          email: form.email,
          password: form.password,
          name: form.name,
          role: form.role,
          phone: form.phone,
        });

        if (!result.success) {
          setError(result.error || 'Registration failed');
          return;
        }
      } else {
        const result = await login(form.email, form.password);
        
        if (!result.success) {
          setError(result.error || 'Login failed');
          return;
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      // For now, Google OAuth is not implemented in FastAPI backend
      setError('Google Sign-in not available yet. Please use email/password.');
    } catch (err) {
      setError('Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-700">
        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Image */}
          <div className="lg:w-1/2 relative h-64 lg:h-auto">
            <Image
              src="/pg-sample-1.jpg"
              alt="PG Accommodation"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white p-8">
                <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                  Welcome to PG Finder
                </h1>
                <p className="text-lg opacity-90">
                  Find your perfect paying guest accommodation or list your property
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {isSignup ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-400">
                  {isSignup ? 'Join our community today' : 'Sign in to your account'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignup && (
                  <>
                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        I am a
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleRoleChange('tenant')}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            form.role === 'tenant'
                              ? 'border-purple-500 bg-purple-500/10 text-white'
                              : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-1">🏠</div>
                            <div className="font-medium">Tenant</div>
                            <div className="text-xs opacity-75">Looking for PG</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRoleChange('owner')}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            form.role === 'owner'
                              ? 'border-purple-500 bg-purple-500/10 text-white'
                              : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-1">🏢</div>
                            <div className="font-medium">Owner</div>
                            <div className="text-xs opacity-75">Have PG to rent</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Name Field */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Phone Field */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Enter your password"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
                </button>
              </form>

              {/* Google Sign In */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="mt-4 w-full bg-white text-gray-900 py-3 px-6 rounded-lg font-medium hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              {/* Toggle between sign in and sign up */}
              <div className="mt-8 text-center">
                <p className="text-gray-400">
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(!isSignup);
                      setError('');
                    }}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    {isSignup ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
