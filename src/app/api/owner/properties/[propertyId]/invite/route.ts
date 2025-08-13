import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Owner creates an invitation token (encoded in QR) for a property (optionally room)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId } = await params;
    const body = await request.json().catch(() => ({}));
    const { roomId, maxUses = 1, expiresInHours, metadata } = body;

    // Verify property belongs to owner
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: session.user.id }
    });
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (roomId) {
      const room = await prisma.room.findFirst({ where: { id: roomId, propertyId } });
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 400 });
      }
    }

    const token = crypto.randomBytes(16).toString('base64url');
    const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 3600 * 1000) : null;

    const invitation = await prisma.invitation.create({
      data: {
        token,
        propertyId,
        ownerId: session.user.id,
        roomId: roomId || null,
        maxUses: Math.max(1, Math.min(50, maxUses)),
        expiresAt,
        metadata: metadata ? JSON.stringify(metadata) : null
      },
      include: { property: { select: { name: true, address: true, city: true, pgNumber: true } }, room: { select: { roomNumber: true, roomType: true } } }
    });

    // For now return token; frontend can generate QR using a library (e.g., qrcode.react)
    const joinUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/join/${invitation.token}`;

    return NextResponse.json({
      message: 'Invitation created',
      invitation: {
        id: invitation.id,
        token: invitation.token,
        joinUrl,
        property: invitation.property,
        room: invitation.room,
        expiresAt: invitation.expiresAt,
        maxUses: invitation.maxUses
      }
    });
  } catch (e) {
    console.error('Create invitation error', e);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
