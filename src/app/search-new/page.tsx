'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Image from 'next/image';

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
  owner?: {
    name: string;
    email: string;
  };
}

interface SearchFilters {
  location: string;
  maxPrice: string;
  sharing: string;
  verified: boolean;
  amenities: string[];
}

export default function SearchPageNew() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    maxPrice: '',
    sharing: '',
    verified: false,
    amenities: [],
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth-new');
      return;
    }

    fetchProperties();
  }, [isAuthenticated, router]);

  const fetchProperties = async (searchFilters?: Partial<SearchFilters>) => {
    try {
      setLoading(true);
      setError('');

      const params: any = {};
      
      if (searchFilters?.location) {
        params.location = searchFilters.location;
      }
      
      if (searchFilters?.maxPrice) {
        params.maxPrice = parseInt(searchFilters.maxPrice);
      }
      
      if (searchFilters?.sharing) {
        params.sharing = searchFilters.sharing;
      }
      
      if (searchFilters?.verified) {
        params.verified = true;
      }
      
      if (searchFilters?.amenities && searchFilters.amenities.length > 0) {
        params.amenities = searchFilters.amenities;
      }

      const response = await apiClient.getProperties(params);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data && Array.isArray(response.data)) {
        setProperties(response.data as Property[]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties(filters);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const parseAmenities = (amenitiesStr?: string): string[] => {
    if (!amenitiesStr) return [];
    try {
      return JSON.parse(amenitiesStr);
    } catch {
      return amenitiesStr.split(',').map(a => a.trim());
    }
  };

  const handleApply = async (propertyId: string) => {
    try {
      const response = await apiClient.createApplication({
        property_id: propertyId,
        message: 'I am interested in this property.',
      });

      if (response.error) {
        alert('Failed to submit application: ' + response.error);
        return;
      }

      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Application error:', err);
      alert('Failed to submit application');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-purple-400">
                PG Search
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.name}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="City, area, or pin code"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Budget
              </label>
              <select
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
              >
                <option value="">Any Budget</option>
                <option value="5000">Under ₹5,000</option>
                <option value="10000">Under ₹10,000</option>
                <option value="15000">Under ₹15,000</option>
                <option value="20000">Under ₹20,000</option>
                <option value="30000">Under ₹30,000</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sharing Type
              </label>
              <select
                value={filters.sharing}
                onChange={(e) => handleFilterChange('sharing', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
              >
                <option value="">Any Sharing</option>
                <option value="single">Single Occupancy</option>
                <option value="double">Double Sharing</option>
                <option value="triple">Triple Sharing</option>
                <option value="dormitory">Dormitory</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => handleFilterChange('verified', e.target.checked)}
                  className="mr-2 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Verified Only</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search Properties'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-6">
            {properties.length > 0 ? `${properties.length} Properties Found` : 'No Properties Found'}
          </h2>

          {properties.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No Properties Found
              </h3>
              <p className="text-gray-400">
                Try adjusting your search filters or check back later for new listings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-purple-500 transition-colors"
                >
                  {/* Property Image */}
                  <div className="relative h-48 bg-gray-700">
                    {property.images ? (
                      <Image
                        src={`/api/v1/uploads/${property.images.split(',')[0]}`}
                        alt={property.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          // Fallback to placeholder
                          e.currentTarget.src = '/pg-sample-1.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-gray-400 text-4xl">🏠</div>
                      </div>
                    )}
                    
                    {property.is_verified && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        ✓ Verified
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 truncate">
                      {property.name}
                    </h3>
                    
                    <p className="text-gray-400 text-sm mb-3">
                      {property.address}, {property.city}, {property.state}
                    </p>
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-purple-400 font-semibold text-lg">
                        {formatCurrency(property.rent_per_month)}/month
                      </span>
                      <span className="text-gray-400 text-sm">
                        {property.available_rooms}/{property.total_rooms} rooms
                      </span>
                    </div>

                    {/* Amenities */}
                    {property.amenities && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {parseAmenities(property.amenities).slice(0, 3).map((amenity, index) => (
                            <span
                              key={index}
                              className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs"
                            >
                              {amenity}
                            </span>
                          ))}
                          {parseAmenities(property.amenities).length > 3 && (
                            <span className="text-gray-400 text-xs">
                              +{parseAmenities(property.amenities).length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Owner Info */}
                    {property.owner && (
                      <p className="text-gray-400 text-xs mb-3">
                        Listed by: {property.owner.name}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/property/${property.id}`)}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        View Details
                      </button>
                      {user?.role === 'tenant' && (
                        <button
                          onClick={() => handleApply(property.id)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                          Apply
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
    </div>
  );
}
