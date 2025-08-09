import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { propertyId, message } = await request.json();

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Check if property exists and is active
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property || !property.isActive) {
      return NextResponse.json(
        { error: 'Property not found or inactive' },
        { status: 404 }
      );
    }

    // Check if user already applied for this property
    const existingApplication = await prisma.application.findUnique({
      where: {
        tenantId_propertyId: {
          tenantId: session.user.id,
          propertyId: propertyId
        }
      }
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this property' },
        { status: 400 }
      );
    }

    // Create new application
    const application = await prisma.application.create({
      data: {
        tenantId: session.user.id,
        propertyId: propertyId,
        message: message || null,
        status: 'PENDING'
      },
      include: {
        property: {
          select: {
            name: true,
            pgNumber: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt,
        property: application.property
      }
    });

  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const applications = await prisma.application.findMany({
      where: {
        tenantId: session.user.id
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            pgNumber: true,
            address: true,
            city: true,
            rentPerMonth: true,
            images: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(applications);

  } catch (error) {
    console.error('Applications fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
