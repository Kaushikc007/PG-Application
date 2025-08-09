'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import ProfileModal from '@/components/ProfileModal';

interface Property {
  id: string;
  pgNumber: string;
  name: string;
  address: string;
  city: string;
  state: string;
  rentPerMonth: number;
  availableRooms: number;
  totalRooms: number;
  images?: string[];
  amenities?: string[];
  rating?: number;
  isVerified?: boolean;
}

interface Filters {
  location: string;
  maxPrice: number;
  sharing: string;
  radius: number;
  amenities: string[];
  pgId: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    location: searchParams.get('location') || '',
    maxPrice: parseInt(searchParams.get('maxPrice') || '50000'),
    sharing: searchParams.get('sharing') || '',
    radius: parseInt(searchParams.get('radius') || '10'),
    amenities: [],
    pgId: searchParams.get('pgId') || ''
  });

  const isVerifiedSearch = searchParams.get('verified') === 'true';

  // Helper function to get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.set('location', filters.location);
      queryParams.set('maxPrice', filters.maxPrice.toString());
      queryParams.set('sharing', filters.sharing);
      queryParams.set('radius', filters.radius.toString());
      queryParams.set('verified', isVerifiedSearch.toString());
      queryParams.set('pgId', filters.pgId);
      
      if (filters.amenities.length > 0) {
        queryParams.set('amenities', filters.amenities.join(','));
      }
      
      const response = await fetch(`/api/properties/search?${queryParams}`);
      
      if (response.ok) {
        const data = await response.json();
        // Ensure we always set an array
        setProperties(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch properties:', response.status);
        setProperties([]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [filters, isVerifiedSearch]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilterChange = (key: keyof Filters, value: string | number | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const amenitiesList = [
    'WiFi', 'AC', 'Laundry', 'Mess', 'Parking', 'Security', 'TV', 'Gym', 'Garden', 'Water Cooler'
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Image src="/pg-icon.jpg" alt="PG Logo" width={40} height={40} className="rounded-lg" />
              <h1 className="text-xl font-bold text-white">
                {isVerifiedSearch ? 'Verified PGs' : 'All PGs'}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Profile Button */}
              {session && (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="relative flex items-center gap-2 bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <div className="relative">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {getInitials(session.user?.name || 'U')}
                        </span>
                      </div>
                    )}
                    {/* Green authentication dot */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                  </div>
                  <span className="hidden sm:block text-sm font-medium">Profile</span>
                </button>
              )}
              
              {/* Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-800 border-b border-gray-700 p-6">
          <div className="max-w-7xl mx-auto">
            {/* PG-ID Search - Priority Search */}
            <div className="mb-6 p-4 bg-gray-700 rounded-lg border-l-4 border-blue-500">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                🔍 Search by PG-ID (Quick Search)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={filters.pgId}
                  onChange={(e) => handleFilterChange('pgId', e.target.value)}
                  placeholder="Enter PG-ID (e.g., PG001, PG002)"
                  className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {filters.pgId && (
                  <button
                    onClick={() => handleFilterChange('pgId', '')}
                    className="px-3 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-colors"
                    title="Clear PG-ID search"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {filters.pgId ? '📍 Searching by PG-ID (other filters disabled)' : 'When PG-ID is entered, other filters will be ignored for faster search'}
              </p>
            </div>

            {/* Other Filters */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${filters.pgId ? 'opacity-50' : ''}`}>
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="Enter city or area"
                  disabled={!!filters.pgId}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Price: ₹{filters.maxPrice}
                </label>
                <input
                  type="range"
                  min="5000"
                  max="50000"
                  step="1000"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value))}
                  disabled={!!filters.pgId}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Sharing Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sharing Type</label>
                <select
                  value={filters.sharing}
                  onChange={(e) => handleFilterChange('sharing', e.target.value)}
                  disabled={!!filters.pgId}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Any</option>
                  <option value="single">Single Sharing</option>
                  <option value="double">Two Sharing</option>
                  <option value="triple">Three Sharing</option>
                  <option value="multiple">Multiple Sharing</option>
                </select>
              </div>

              {/* Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Radius: {filters.radius} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={filters.radius}
                  onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                  disabled={!!filters.pgId}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Amenities */}
            <div className={`mt-6 ${filters.pgId ? 'opacity-50' : ''}`}>
              <label className="block text-sm font-medium text-gray-300 mb-3">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {amenitiesList.map((amenity) => (
                  <button
                    key={amenity}
                    onClick={() => {
                      if (!filters.pgId) {
                        const newAmenities = filters.amenities.includes(amenity)
                          ? filters.amenities.filter(a => a !== amenity)
                          : [...filters.amenities, amenity];
                        handleFilterChange('amenities', newAmenities);
                      }
                    }}
                    disabled={!!filters.pgId}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                      filters.amenities.includes(amenity)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    } ${filters.pgId ? 'opacity-50' : ''}`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-gray-400">
          {loading ? 'Searching...' : `${properties.length} properties found`}
          {filters.pgId && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              PG-ID: {filters.pgId}
            </span>
          )}
          {isVerifiedSearch && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
        </p>
      </div>

      {/* Property Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-700"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              {filters.pgId ? `No PG found with ID "${filters.pgId}"` : 'No properties found'}
            </h3>
            <p className="text-gray-400 mb-4">
              {filters.pgId 
                ? 'Please check the PG-ID and try again. Available PG-IDs: PG001, PG002, PG003, PG004'
                : 'Try adjusting your search filters to find more results.'
              }
            </p>
            <button
              onClick={() => setFilters({
                location: '',
                maxPrice: 50000,
                sharing: '',
                radius: 10,
                amenities: [],
                pgId: ''
              })}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          isOpen={showProfileModal} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const router = useRouter();

  return (
    <div 
      className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
      onClick={() => router.push(`/property/${property.id}`)}
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-700">
        {property.images && property.images.length > 0 ? (
          <Image
            src={property.images[0]}
            alt={property.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        
        {/* Verified Badge */}
        {property.isVerified && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          </div>
        )}

        {/* Heart Icon */}
        <button className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-white text-lg truncate">{property.name}</h3>
          {property.rating && (
            <div className="flex items-center gap-1 text-sm">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white font-medium">{property.rating}</span>
            </div>
          )}
        </div>
        
        <p className="text-gray-400 text-sm mb-2 truncate">{property.address}, {property.city}</p>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">PG #{property.pgNumber}</span>
          <span className="text-gray-400 text-sm">
            {property.availableRooms}/{property.totalRooms} available
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-white font-bold text-lg">₹{property.rentPerMonth.toLocaleString()}</span>
            <span className="text-gray-400 text-sm ml-1">/ month</span>
          </div>
          <button className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
