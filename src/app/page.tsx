'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          {/* Logo Section */}
          <div className="flex justify-center mb-8">
            <Image
              src="/pg-icon.jpg"
              alt="PG Application Logo"
              width={120}
              height={120}
              className="rounded-full shadow-lg"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Find Your Perfect
            <span className="text-blue-400"> PG Accommodation</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect with property owners and find the ideal paying guest accommodation that suits your needs and budget.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/auth"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Get Started
            </Link>
            <Link
              href="/auth"
              className="border-2 border-blue-600 text-blue-400 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
            >
              List Your Property
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div 
              onClick={() => router.push('/search')}
              className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-blue-500 group"
            >
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:bg-blue-600/30 transition-colors">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors">Easy Search</h3>
              <p className="text-gray-300">Find PG accommodations based on your location, budget, and preferences.</p>
            </div>

            <div 
              onClick={() => router.push('/search?verified=true')}
              className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-green-500 group"
            >
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:bg-green-600/30 transition-colors">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-green-400 transition-colors">Verified Properties</h3>
              <p className="text-gray-300">All properties are verified for authenticity and quality assurance.</p>
            </div>

            <div 
              onClick={() => router.push('/auth')}
              className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-purple-500 group"
            >
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:bg-purple-600/30 transition-colors">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors">Connect Directly</h3>
              <p className="text-gray-300">Direct communication between tenants and property owners.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
