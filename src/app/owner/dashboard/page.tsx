'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProfileModal from '@/components/ProfileModal';
import dynamic from 'next/dynamic';

// Load QR component client-side only (it uses window for canvas indirectly)
const CreateInviteQR = dynamic(() => import('@/components/CreateInviteQR'), { ssr: false });

interface Property {
  id: string;
  pgNumber: string;
  name: string;
  address: string;
  city: string;
  totalRooms: number;
  availableRooms: number;
  rentPerMonth: number;
  isActive: boolean;
  isVerified: boolean;
  _count: {
    tenants: number;
    rooms: number;
  };
}

interface Tenant {
  id: string;
  moveInDate: string;
  monthlyRent: number;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    image?: string;
  };
  room?: {
    id: string;
    roomNumber: string;
    roomType: string;
  };
  payments: {
    id: string;
    amount: number;
    dueDate: string;
    paidDate?: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    paymentType: string;
  }[];
}

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  totalRevenue: number;
  pendingPayments: number;
  occupancyRate: number;
}

export default function OwnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'tenants' | 'payments'>('overview');

  // Redirect non-owners
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'OWNER') {
      router.push('/auth');
    }
  }, [session, status, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (session?.user.role === 'OWNER') {
      fetchDashboardData();
    }
  }, [session]);

  // Fetch tenants when property is selected
  useEffect(() => {
    if (selectedProperty) {
      fetchTenants(selectedProperty);
    }
  }, [selectedProperty]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [propertiesRes, statsRes] = await Promise.all([
        fetch('/api/owner/properties'),
        fetch('/api/owner/stats')
      ]);

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        setProperties(propertiesData);
        if (propertiesData.length > 0) {
          setSelectedProperty(propertiesData[0].id);
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/owner/properties/${propertyId}/tenants`);
      if (response.ok) {
        const tenantsData = await response.json();
        setTenants(tenantsData);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const getPaymentStatus = (tenant: Tenant) => {
    const latestPayment = tenant.payments[0]; // Assuming payments are sorted by dueDate desc
    if (!latestPayment) return { status: 'NO_PAYMENT', color: 'gray' };
    
    if (latestPayment.status === 'PAID') return { status: 'PAID', color: 'green' };
    if (latestPayment.status === 'OVERDUE') return { status: 'OVERDUE', color: 'red' };
    
    const dueDate = new Date(latestPayment.dueDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return { status: 'OVERDUE', color: 'red' };
    if (diffDays > -7) return { status: 'DUE_SOON', color: 'yellow' };
    return { status: 'PENDING', color: 'blue' };
  };

  const getStayDuration = (moveInDate: string) => {
    const moveIn = new Date(moveInDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - moveIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    
    if (months === 0) return `${days} days`;
    return `${months} months, ${days} days`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'OWNER') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Image src="/pg-icon.jpg" alt="PG Logo" width={40} height={40} className="rounded-lg" />
              <h1 className="text-xl font-bold text-white">Owner Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Profile Button */}
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
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                </div>
                <span className="hidden sm:block text-sm font-medium">Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview' as const, label: 'Overview', icon: '📊' },
              { id: 'properties' as const, label: 'Properties', icon: '🏠' },
              { id: 'tenants' as const, label: 'Tenants', icon: '👥' },
              { id: 'payments' as const, label: 'Payments', icon: '💰' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🏠</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-400">Properties</p>
                      <p className="text-2xl font-semibold text-white">{stats.totalProperties}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">👥</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-400">Total Tenants</p>
                      <p className="text-2xl font-semibold text-white">{stats.totalTenants}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">💰</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-400">Monthly Revenue</p>
                      <p className="text-2xl font-semibold text-white">₹{stats.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">⚠️</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-400">Pending Payments</p>
                      <p className="text-2xl font-semibold text-white">{stats.pendingPayments}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">📈</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-400">Occupancy Rate</p>
                      <p className="text-2xl font-semibold text-white">{stats.occupancyRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Properties Quick View */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Properties</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <div key={property.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white">{property.name}</h4>
                      {property.isVerified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">PG #{property.pgNumber}</p>
                    <p className="text-sm text-gray-400 mb-3">{property.address}, {property.city}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Occupancy: {property.totalRooms - property.availableRooms}/{property.totalRooms}</span>
                      <span className="text-green-400">₹{property.rentPerMonth}/month</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="space-y-6">
            {/* Property Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Select Property</h3>
              <select
                value={selectedProperty || ''}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full md:w-auto px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name} (PG #{property.pgNumber})
                  </option>
                ))}
              </select>
              {selectedProperty && (
                <div className="mt-6">
                  <CreateInviteQR propertyId={selectedProperty} />
                </div>
              )}
            </div>

            {/* Tenants List */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Tenants</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Room
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Stay Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Monthly Rent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {tenants.map((tenant) => {
                      const paymentStatus = getPaymentStatus(tenant);
                      return (
                        <tr key={tenant.id} className="hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {tenant.user.image ? (
                                  <Image
                                    src={tenant.user.image}
                                    alt={tenant.user.name}
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <span className="text-white font-medium">
                                      {getInitials(tenant.user.name)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">{tenant.user.name}</div>
                                <div className="text-sm text-gray-400">{tenant.user.email}</div>
                                {tenant.user.phone && (
                                  <div className="text-sm text-gray-400">{tenant.user.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">
                              {tenant.room ? `Room ${tenant.room.roomNumber}` : 'Not assigned'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {tenant.room?.roomType || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">
                              {getStayDuration(tenant.moveInDate)}
                            </div>
                            <div className="text-sm text-gray-400">
                              Since {new Date(tenant.moveInDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              ₹{tenant.monthlyRent.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              paymentStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                              paymentStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                              paymentStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              paymentStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {paymentStatus.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-indigo-400 hover:text-indigo-300 mr-3">
                              View Details
                            </button>
                            <button className="text-red-400 hover:text-red-300">
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
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
