'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface Property {
  id: string;
  pgNumber: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  description?: string;
  rentPerMonth: number;
  securityDeposit: number;
  availableRooms: number;
  totalRooms: number;
  images?: string[];
  amenities?: string[];
  rules?: string;
  rating?: number;
  isVerified?: boolean;
  sharingType?: string;
  owner: {
    name: string | null;
    email: string;
  };
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const propertyId = params.id as string;

  const fetchPropertyDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (response.ok) {
        const data = await response.json();
        setProperty(data);
      } else {
        router.push('/search');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      router.push('/search');
    } finally {
      setLoading(false);
    }
  }, [propertyId, router]);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId, fetchPropertyDetails]);

  const handleApply = async () => {
    if (!session) {
      router.push('/auth');
      return;
    }

    setApplying(true);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      });

      if (response.ok) {
        alert('Application submitted successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Property not found</h2>
          <button
            onClick={() => router.push('/search')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            <div className="flex items-center gap-4">
              <Image src="/pg-icon.jpg" alt="PG Logo" width={32} height={32} className="rounded-lg" />
              <span className="text-white font-medium">Property Details</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              {property.images && property.images.length > 0 ? (
                <div className="relative">
                  <div className="aspect-video">
                    <Image
                      src={property.images[currentImageIndex]}
                      alt={property.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => 
                          prev === 0 ? property.images!.length - 1 : prev - 1
                        )}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => setCurrentImageIndex((prev) => 
                          prev === property.images!.length - 1 ? 0 : prev + 1
                        )}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {property.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gray-700 flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{property.name}</h1>
                  <p className="text-gray-300">{property.address}, {property.city}, {property.state} - {property.pincode}</p>
                  <p className="text-gray-400 text-sm mt-1">PG Number: {property.pgNumber}</p>
                </div>
                
                <div className="text-right">
                  {property.isVerified && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-2">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                  
                  {property.rating && (
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-white font-medium">{property.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {property.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300 leading-relaxed">{property.description}</p>
                </div>
              )}

              {/* Room Information */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-1">Available Rooms</h4>
                  <p className="text-2xl font-bold text-blue-400">{property.availableRooms}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-1">Total Rooms</h4>
                  <p className="text-2xl font-bold text-gray-300">{property.totalRooms}</p>
                </div>
                {property.sharingType && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-1">Sharing Type</h4>
                    <p className="text-lg font-medium text-green-400 capitalize">{property.sharingType}</p>
                  </div>
                )}
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              {property.rules && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">House Rules</h3>
                  <p className="text-gray-300">{property.rules}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 sticky top-4">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white mb-1">
                  ₹{property.rentPerMonth.toLocaleString()}
                </div>
                <div className="text-gray-400">per month</div>
                
                {property.securityDeposit > 0 && (
                  <div className="text-sm text-gray-400 mt-2">
                    Security Deposit: ₹{property.securityDeposit.toLocaleString()}
                  </div>
                )}
              </div>

              <button
                onClick={handleApply}
                disabled={applying || property.availableRooms === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  property.availableRooms === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } ${applying ? 'opacity-50' : ''}`}
              >
                {applying ? 'Submitting...' : property.availableRooms === 0 ? 'No Rooms Available' : 'Apply Now'}
              </button>

              {/* Owner Info */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-white font-medium mb-2">Property Owner</h4>
                <div className="text-gray-300">
                  <p className="mb-1">{property.owner.name || 'Name not provided'}</p>
                  <p className="text-sm text-gray-400">{property.owner.email}</p>
                </div>
              </div>

              {/* Contact Button */}
              <button
                onClick={() => window.location.href = `mailto:${property.owner.email}?subject=Inquiry about ${property.name}`}
                className="w-full mt-4 py-2 px-4 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Contact Owner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
