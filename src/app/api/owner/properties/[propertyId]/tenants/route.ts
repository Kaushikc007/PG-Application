import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId } = await params;

    // Verify that the property belongs to the authenticated owner
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Get tenants for this property
    const tenants = await prisma.tenant.findMany({
      where: {
        propertyId: propertyId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
            roomType: true,
          },
        },
        payments: {
          orderBy: {
            dueDate: 'desc',
          },
          take: 3, // Get last 3 payments
        },
      },
      orderBy: {
        moveInDate: 'asc',
      },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Error fetching property tenants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
