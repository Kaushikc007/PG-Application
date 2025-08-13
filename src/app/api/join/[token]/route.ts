import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/join/:token -> convert invitation token into tenancy (requires authenticated tenant)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { token } = await params;

    const invitation = await prisma.invitation.findUnique({ where: { token }, include: { property: true, room: true } });
    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
    }

    if (invitation.useCount >= invitation.maxUses) {
      return NextResponse.json({ error: 'Invitation already used' }, { status: 400 });
    }

    // Check if user already a tenant of this property
    const existingTenancy = await prisma.tenant.findFirst({ where: { userId, propertyId: invitation.propertyId, isActive: true } });
    if (existingTenancy) {
      return NextResponse.json({ message: 'Already linked', tenantId: existingTenancy.id });
    }

    // Create tenant record (basic, can be updated later)
    const tenant = await prisma.tenant.create({
      data: {
        userId,
        propertyId: invitation.propertyId,
        roomId: invitation.roomId || null,
        moveInDate: new Date(),
        securityDeposit: invitation.property.securityDeposit || 0,
        monthlyRent: invitation.property.rentPerMonth,
      }
    });

    await prisma.invitation.update({ where: { id: invitation.id }, data: { useCount: { increment: 1 }, usedAt: invitation.usedAt ?? new Date() } });

    return NextResponse.json({ message: 'Tenant linked successfully', tenantId: tenant.id, propertyId: invitation.propertyId });
  } catch (e) {
    console.error('Join token redeem error', e);
    return NextResponse.json({ error: 'Failed to join property' }, { status: 500 });
  }
}
