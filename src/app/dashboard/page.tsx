'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {session.user?.name}!
            </h1>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {session.user?.role}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/auth' })}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Dashboard Coming Soon
              </h2>
              <p className="text-gray-600 mb-4">
                {session.user?.role === 'TENANT' 
                  ? 'Here you\'ll be able to search for PG accommodations and manage your applications.'
                  : 'Here you\'ll be able to list your properties and manage tenant applications.'
                }
              </p>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2">Your Profile</h3>
                <p><strong>Email:</strong> {session.user?.email}</p>
                <p><strong>Role:</strong> {session.user?.role}</p>
                <p><strong>ID:</strong> {session.user?.id}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
