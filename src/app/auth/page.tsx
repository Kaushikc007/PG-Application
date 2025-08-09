'use client'

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface FormData {
  role: 'TENANT' | 'OWNER';
  email: string;
  password: string;
  name: string;
  pgNumber?: string;
  phone?: string;
}

export default function AuthPage() {
  const { data: session, status } = useSession();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState<FormData>({
    role: 'TENANT',
    email: '',
    password: '',
    name: '',
    pgNumber: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect authenticated users based on role
  useEffect(() => {
    if (session && status === 'authenticated') {
      if (session.user.role === 'OWNER') {
        router.push('/owner/dashboard');
      } else if (session.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/search');
      }
    }
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role: 'TENANT' | 'OWNER') => {
    setForm({ ...form, role });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        // Signup flow
        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Signup failed');
        }

        // After successful signup, sign in the user
        const signInResult = await signIn('credentials', {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (signInResult?.error) {
          throw new Error('Login after signup failed');
        }

        // Redirect based on role
        if (form.role === 'OWNER') {
          router.push('/owner/dashboard');
        } else {
          router.push('/search');
        }
      } else {
        // Login flow
        const result = await signIn('credentials', {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error('Invalid credentials');
        }

        // Get session to determine role-based redirect
        window.location.reload(); // This will trigger session update
        setTimeout(() => {
          router.push('/search'); // Default redirect, will be updated by useEffect
        }, 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: false 
      });
      
      if (result?.error) {
        throw new Error('Google authentication failed. Please check your configuration.');
      }
      
      if (result?.url) {
        router.push(result.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  // Check if Google OAuth is configured
  const isGoogleConfigured = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden w-full max-w-4xl">
        {/* Image Section */}
        <div className="md:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center">
            <div className="w-64 h-64 mx-auto mb-6 bg-gray-700/50 rounded-full flex items-center justify-center border border-gray-600">
              <Image 
                src="/pg-icon.jpg" 
                alt="PG Application" 
                width={160} 
                height={160}
                className="rounded-full"
              />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Welcome to PG Application</h3>
            <p className="text-gray-300">Find your perfect paying guest accommodation or list your property</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center bg-gray-800">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              {isSignup ? 'Create Account' : 'Sign In'}
            </h2>

            {/* Role Selection */}
            <div className="flex justify-center gap-2 mb-6">
              <button 
                type="button" 
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  form.role === 'TENANT' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                }`} 
                onClick={() => handleRoleChange('TENANT')}
              >
                Tenant
              </button>
              <button 
                type="button" 
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  form.role === 'OWNER' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                }`} 
                onClick={() => handleRoleChange('OWNER')}
              >
                Owner
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {isSignup && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input 
                    id="name"
                    type="text" 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    placeholder="Enter your full name" 
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    required 
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input 
                  id="email"
                  type="email" 
                  name="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  placeholder="Enter your email" 
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  required 
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input 
                  id="password"
                  type="password" 
                  name="password" 
                  value={form.password} 
                  onChange={handleChange} 
                  placeholder="Enter your password" 
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  required 
                />
              </div>

              {form.role === 'TENANT' && (
                <div>
                  <label htmlFor="pgNumber" className="block text-sm font-medium text-gray-300 mb-2">
                    PG Number {isSignup && <span className="text-red-400">*</span>}
                  </label>
                  <input 
                    id="pgNumber"
                    type="text" 
                    name="pgNumber" 
                    value={form.pgNumber} 
                    onChange={handleChange} 
                    placeholder="Enter PG number" 
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    required={isSignup} 
                  />
                </div>
              )}

              {isSignup && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input 
                    id="phone"
                    type="tel" 
                    name="phone" 
                    value={form.phone} 
                    onChange={handleChange} 
                    placeholder="Enter your phone number" 
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                  <div className="flex">
                    <div className="text-red-200 text-sm">{error}</div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
                </div>
              </div>

              {/* Only show Google button if configured */}
              {isGoogleConfigured ? (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="mt-4 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              ) : (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg text-center">
                  <p className="text-gray-400 text-sm">
                    Google OAuth is not configured. Please use email/password authentication.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <button 
                type="button"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200" 
                onClick={() => setIsSignup(!isSignup)}
              >
                {isSignup ? 'Already have an account? Sign In' : 'Don\'t have an account? Create one'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
