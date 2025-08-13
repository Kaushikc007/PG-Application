import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedProperty = {
      id: property.id,
      pgNumber: property.pgNumber,
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      pincode: property.pincode,
      description: property.description,
      rentPerMonth: property.rentPerMonth,
      securityDeposit: property.securityDeposit,
      availableRooms: property.availableRooms,
      totalRooms: property.totalRooms,
      images: property.images ? property.images.split(',') : [],
      amenities: property.amenities ? property.amenities.split(',') : [],
      rules: property.rules,
      rating: 4.2, // Mock rating for now
      isVerified: true, // Mock verification for now
      sharingType: 'Double Sharing', // Mock sharing type
      owner: property.owner
    };

    return NextResponse.json(transformedProperty);

  } catch (error) {
    console.error('Property fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}
