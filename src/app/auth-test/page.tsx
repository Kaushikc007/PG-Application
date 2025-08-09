'use client';

import { useState } from 'react';
import { authService } from '@/lib/auth-fastapi';

export default function AuthTest() {
  const [email, setEmail] = useState('tenant@pgapp.com');
  const [password, setPassword] = useState('tenant123');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await authService.login({ email, password });
      setResult({
        type: 'login',
        success: response.success,
        data: response.user || response.error,
        token: authService.getToken()
      });
    } catch (error) {
      setResult({
        type: 'login',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await authService.register({
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New Test User',
        role: 'tenant',
        phone: '+1234567890'
      });
      setResult({
        type: 'register',
        success: response.success,
        data: response.user || response.error,
        token: authService.getToken()
      });
    } catch (error) {
      setResult({
        type: 'register',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setResult({
      type: 'logout',
      success: true,
      message: 'Logged out successfully'
    });
  };

  const getCurrentUser = () => {
    const user = authService.getCurrentUser();
    const isAuth = authService.isAuthenticated();
    setResult({
      type: 'current_user',
      success: true,
      data: {
        user,
        isAuthenticated: isAuth,
        token: authService.getToken()
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-purple-400">
          🔐 Authentication Test Page
        </h1>

        {/* Login Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Test Login</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                placeholder="Enter password"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Test Login'}
            </button>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Test Register'}
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
            <button
              onClick={getCurrentUser}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Get Current User
            </button>
          </div>
        </div>

        {/* Sample Accounts */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Sample Test Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">Admin Account</h3>
              <p className="text-sm text-gray-300">Email: admin@pgapp.com</p>
              <p className="text-sm text-gray-300">Password: admin123</p>
              <p className="text-sm text-gray-300">Role: Admin</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-green-400 mb-2">Owner Account</h3>
              <p className="text-sm text-gray-300">Email: owner@pgapp.com</p>
              <p className="text-sm text-gray-300">Password: owner123</p>
              <p className="text-sm text-gray-300">Role: Owner</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-400 mb-2">Tenant Account</h3>
              <p className="text-sm text-gray-300">Email: tenant@pgapp.com</p>
              <p className="text-sm text-gray-300">Password: tenant123</p>
              <p className="text-sm text-gray-300">Role: Tenant</p>
            </div>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">
              {result.type === 'login' && '🔐 Login Result'}
              {result.type === 'register' && '📝 Registration Result'}
              {result.type === 'logout' && '🚪 Logout Result'}
              {result.type === 'current_user' && '👤 Current User Info'}
            </h2>
            
            <div className={`p-4 rounded-lg mb-4 ${
              result.success 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              <p className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? '✅ Success' : '❌ Failed'}
              </p>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">
            🧪 How to Test Authentication
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Use one of the sample accounts above or the pre-filled tenant account</li>
            <li>Click "Test Login" to authenticate with the FastAPI backend</li>
            <li>Check the result to see the JWT token and user data</li>
            <li>Click "Get Current User" to verify the authentication state</li>
            <li>Click "Test Register" to create a new account (will auto-login)</li>
            <li>Click "Logout" to clear the authentication state</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
