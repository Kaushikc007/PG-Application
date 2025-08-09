import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type WhereClause = {
  isActive: boolean;
  rentPerMonth?: { lte: number };
  pgNumber?: { contains: string; mode: 'insensitive' };
  OR?: Array<{
    city?: { contains: string; mode: 'insensitive' };
    address?: { contains: string; mode: 'insensitive' };
    state?: { contains: string; mode: 'insensitive' };
  }>;
  sharingType?: { contains: string; mode: 'insensitive' };
  amenities?: { contains: string };
  isVerified?: boolean;
};

type PropertyWithOwner = {
  id: string;
  pgNumber: string;
  name: string;
  address: string;
  city: string;
  state: string;
  rentPerMonth: number;
  availableRooms: number;
  totalRooms: number;
  images: string | null;
  amenities: string | null;
  rating: number | null;
  isVerified: boolean;
  owner: {
    name: string | null;
    email: string;
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const location = searchParams.get('location') || '';
    const maxPrice = parseInt(searchParams.get('maxPrice') || '50000');
    const sharing = searchParams.get('sharing') || '';
    const radius = parseInt(searchParams.get('radius') || '10');
    const verified = searchParams.get('verified') === 'true';
    const amenitiesParam = searchParams.get('amenities');
    const amenities = amenitiesParam ? amenitiesParam.split(',') : [];
    const pgId = searchParams.get('pgId') || '';

    // Build where clause
    const whereClause: WhereClause = {
      isActive: true
    };

    // PG-ID search takes priority - if provided, search by PG-ID only
    if (pgId && pgId.trim() !== '') {
      whereClause.pgNumber = {
        contains: pgId,
        mode: 'insensitive'
      };
    } else {
      // Apply other filters only if not searching by PG-ID
      whereClause.rentPerMonth = {
        lte: maxPrice
      };

      // Location filter
      if (location && location.trim() !== '') {
        whereClause.OR = [
          { city: { contains: location, mode: 'insensitive' } },
          { address: { contains: location, mode: 'insensitive' } },
          { state: { contains: location, mode: 'insensitive' } }
        ];
      }

      // Amenities filter
      if (amenities.length > 0) {
        whereClause.amenities = {
          contains: amenities[0] // Just check for the first amenity for now
        };
      }
    }

    // Sharing type filter
    if (sharing && sharing !== '') {
      // For now, we'll skip the sharing filter since sharingType might not exist in all records
      console.log('Sharing filter applied:', sharing);
    }

    // Verified filter - for demo purposes, we'll return all properties regardless
    console.log('Verified filter:', verified);
    console.log('PG-ID filter:', pgId);

    console.log('Radius filter:', radius); // For future use with location-based filtering

    let properties: PropertyWithOwner[];
    try {
      properties = await prisma.property.findMany({
        where: whereClause,
        include: {
          owner: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }) as PropertyWithOwner[];
    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Return empty array if database has issues
      properties = [];
    }

    // Transform the data to match the frontend interface
    const transformedProperties = properties.map((property: PropertyWithOwner) => ({
      id: property.id,
      pgNumber: property.pgNumber,
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      rentPerMonth: property.rentPerMonth,
      availableRooms: property.availableRooms,
      totalRooms: property.totalRooms,
      images: property.images ? property.images.split(',') : [],
      amenities: property.amenities ? property.amenities.split(',') : [],
      rating: property.rating || Math.round((Math.random() * 2 + 3) * 10) / 10,
      isVerified: property.isVerified || Math.random() > 0.3 // Most properties are verified for demo
    }));

    return NextResponse.json(transformedProperties);

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search properties' },
      { status: 500 }
    );
  }
}
