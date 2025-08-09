import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all properties for this owner
    const properties = await prisma.property.findMany({
      where: {
        ownerId: session.user.id,
      },
      include: {
        tenants: {
          where: {
            isActive: true,
          },
        },
        payments: {
          where: {
            status: 'PENDING',
            dueDate: {
              lte: new Date(),
            },
          },
        },
      },
    });

    const totalProperties = properties.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalTenants = properties.reduce((sum: number, prop: any) => sum + prop.tenants.length, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalRevenue = properties.reduce((sum: number, prop: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return sum + prop.tenants.reduce((tenantSum: number, tenant: any) => tenantSum + tenant.monthlyRent, 0);
    }, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingPayments = properties.reduce((sum: number, prop: any) => sum + prop.payments.length, 0);
    
    // Calculate occupancy rate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalRooms = properties.reduce((sum: number, prop: any) => sum + prop.totalRooms, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const occupiedRooms = totalRooms - properties.reduce((sum: number, prop: any) => sum + prop.availableRooms, 0);
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    const stats = {
      totalProperties,
      totalTenants,
      totalRevenue,
      pendingPayments,
      occupancyRate,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching owner stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
