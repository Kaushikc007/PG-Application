'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface Property {
  id: string;
  pg_number: string;
  name: string;
  address: string;
  city: string;
  state: string;
  rent_per_month: number;
  available_rooms: number;
  total_rooms: number;
  images?: string;
  amenities?: string;
  rating?: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

interface DashboardStats {
  total_properties: number;
  active_properties: number;
  total_applications: number;
  pending_applications: number;
  total_tenants: number;
  monthly_revenue: number;
}

export default function OwnerDashboardNew() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth-new');
      return;
    }

    if (user?.role !== 'owner') {
      router.push('/search');
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch properties
      const propertiesResponse = await apiClient.getProperties();
      if (propertiesResponse.data && Array.isArray(propertiesResponse.data)) {
        setProperties(propertiesResponse.data as Property[]);
        
        // Calculate basic stats from properties
        const totalProperties = propertiesResponse.data.length;
        const activeProperties = propertiesResponse.data.filter((p: Property) => p.is_active).length;
        
        setStats({
          total_properties: totalProperties,
          active_properties: activeProperties,
          total_applications: 0, // Would come from applications API
          pending_applications: 0, // Would come from applications API
          total_tenants: 0, // Would come from tenants API
          monthly_revenue: 0, // Would come from payments API
        });
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth-new');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-purple-400">
                PG Owner Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Properties</p>
                  <p className="text-3xl font-bold text-white">{stats.total_properties}</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-lg">
                  <div className="text-blue-400 text-2xl">🏢</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Properties</p>
                  <p className="text-3xl font-bold text-green-400">{stats.active_properties}</p>
                </div>
                <div className="bg-green-500/10 p-3 rounded-lg">
                  <div className="text-green-400 text-2xl">✅</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Applications</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.total_applications}</p>
                </div>
                <div className="bg-yellow-500/10 p-3 rounded-lg">
                  <div className="text-yellow-400 text-2xl">📋</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Properties List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Your Properties</h2>
              <button
                onClick={() => router.push('/owner/properties/new')}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Add New Property
              </button>
            </div>
          </div>

          <div className="p-6">
            {properties.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  No Properties Yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Start by adding your first property to begin managing your PG business.
                </p>
                <button
                  onClick={() => router.push('/owner/properties/new')}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Add Your First Property
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="bg-gray-700/50 rounded-lg border border-gray-600 overflow-hidden hover:border-purple-500 transition-colors"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-white truncate">
                          {property.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            property.is_active
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {property.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-2">
                        {property.city}, {property.state}
                      </p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-purple-400 font-semibold">
                          {formatCurrency(property.rent_per_month)}/month
                        </span>
                        <span className="text-gray-400 text-sm">
                          {property.available_rooms}/{property.total_rooms} rooms
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/owner/properties/${property.id}`)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => router.push(`/property/${property.id}`)}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
