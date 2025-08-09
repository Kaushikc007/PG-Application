import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedOwnerData() {
  try {
    // Check if owner test user exists
    let owner = await prisma.user.findUnique({
      where: { email: 'owner@test.com' }
    });

    if (!owner) {
      console.log('Owner test user not found. Please run create-admin.js first.');
      return;
    }

    console.log('Found owner:', owner.name);

    // Create test properties
    const property1 = await prisma.property.upsert({
      where: { pgNumber: 'PG001' },
      update: {},
      create: {
        ownerId: owner.id,
        pgNumber: 'PG001',
        name: 'Sunrise PG',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        description: 'Modern PG with all amenities',
        totalRooms: 20,
        availableRooms: 5,
        rentPerMonth: 15000,
        securityDeposit: 30000,
        amenities: 'WiFi,AC,Laundry,Mess,Parking',
        sharingType: 'double',
        isVerified: true,
        rating: 4.5,
      },
    });

    const property2 = await prisma.property.upsert({
      where: { pgNumber: 'PG002' },
      update: {},
      create: {
        ownerId: owner.id,
        pgNumber: 'PG002',
        name: 'Comfort Homes',
        address: '456 Park Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
        description: 'Affordable PG for students',
        totalRooms: 15,
        availableRooms: 3,
        rentPerMonth: 12000,
        securityDeposit: 24000,
        amenities: 'WiFi,Mess,Security',
        sharingType: 'triple',
        isVerified: true,
        rating: 4.2,
      },
    });

    console.log('✅ Properties created');

    // Create rooms for Property 1
    const rooms1 = [];
    for (let i = 1; i <= 20; i++) {
      const room = await prisma.room.upsert({
        where: {
          id: `room-${property1.id}-${i}`,
        },
        update: {},
        create: {
          id: `room-${property1.id}-${i}`,
          propertyId: property1.id,
          roomNumber: `R${i.toString().padStart(3, '0')}`,
          roomType: i <= 10 ? 'DOUBLE' : 'SINGLE',
          capacity: i <= 10 ? 2 : 1,
          isOccupied: i <= 15, // First 15 rooms are occupied
          rentAmount: i <= 10 ? 15000 : 18000,
        },
      });
      rooms1.push(room);
    }

    // Create rooms for Property 2
    const rooms2 = [];
    for (let i = 1; i <= 15; i++) {
      const room = await prisma.room.upsert({
        where: {
          id: `room-${property2.id}-${i}`,
        },
        update: {},
        create: {
          id: `room-${property2.id}-${i}`,
          propertyId: property2.id,
          roomNumber: `R${i.toString().padStart(3, '0')}`,
          roomType: 'TRIPLE',
          capacity: 3,
          isOccupied: i <= 12, // First 12 rooms are occupied
          rentAmount: 12000,
        },
      });
      rooms2.push(room);
    }

    console.log('✅ Rooms created');

    // Create test tenants
    const tenantUsers = [];
    for (let i = 1; i <= 30; i++) { // Create more tenant users
      const hashedPassword = await bcrypt.hash('tenant123', 12);
      const tenantUser = await prisma.user.upsert({
        where: { email: `tenant${i}@test.com` },
        update: {},
        create: {
          email: `tenant${i}@test.com`,
          name: `Tenant ${i}`,
          password: hashedPassword,
          role: 'TENANT',
          phone: `+91${9000000000 + i}`,
          emailVerified: new Date(),
        },
      });
      tenantUsers.push(tenantUser);
    }

    console.log('✅ Tenant users created');

    // Create tenancies for Property 1 (15 tenants)
    for (let i = 0; i < 15; i++) {
      const moveInDate = new Date();
      moveInDate.setMonth(moveInDate.getMonth() - Math.floor(Math.random() * 12)); // Random move-in date in last 12 months

      const tenant = await prisma.tenant.upsert({
        where: {
          id: `tenant-${property1.id}-${i}`,
        },
        update: {},
        create: {
          id: `tenant-${property1.id}-${i}`,
          userId: tenantUsers[i].id,
          propertyId: property1.id,
          roomId: rooms1[i].id,
          moveInDate: moveInDate,
          securityDeposit: 30000,
          monthlyRent: rooms1[i].rentAmount,
          isActive: true,
        },
      });

      // Create payment history
      for (let month = 0; month < 6; month++) {
        const dueDate = new Date(moveInDate);
        dueDate.setMonth(dueDate.getMonth() + month + 1);
        
        const isPaid = Math.random() > 0.2; // 80% chance of being paid
        const isOverdue = !isPaid && dueDate < new Date();

        await prisma.payment.upsert({
          where: {
            id: `payment-${tenant.id}-${month}`,
          },
          update: {},
          create: {
            id: `payment-${tenant.id}-${month}`,
            tenantId: tenant.id,
            propertyId: property1.id,
            amount: tenant.monthlyRent,
            dueDate: dueDate,
            paidDate: isPaid ? new Date(dueDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
            status: isOverdue ? 'OVERDUE' : isPaid ? 'PAID' : 'PENDING',
            paymentType: 'RENT',
            description: `Rent for ${dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          },
        });
      }
    }

    // Create tenancies for Property 2 (12 tenants)
    for (let i = 0; i < 12; i++) {
      const tenantUserIndex = i + 15;
      if (tenantUserIndex >= tenantUsers.length) {
        console.log(`Skipping tenant ${tenantUserIndex} - not enough tenant users`);
        continue;
      }

      const moveInDate = new Date();
      moveInDate.setMonth(moveInDate.getMonth() - Math.floor(Math.random() * 8));

      const tenant = await prisma.tenant.upsert({
        where: {
          id: `tenant-${property2.id}-${i}`,
        },
        update: {},
        create: {
          id: `tenant-${property2.id}-${i}`,
          userId: tenantUsers[tenantUserIndex].id,
          propertyId: property2.id,
          roomId: rooms2[i].id,
          moveInDate: moveInDate,
          securityDeposit: 24000,
          monthlyRent: 12000,
          isActive: true,
        },
      });

      // Create payment history
      for (let month = 0; month < 4; month++) {
        const dueDate = new Date(moveInDate);
        dueDate.setMonth(dueDate.getMonth() + month + 1);
        
        const isPaid = Math.random() > 0.15; // 85% chance of being paid
        const isOverdue = !isPaid && dueDate < new Date();

        await prisma.payment.upsert({
          where: {
            id: `payment-${tenant.id}-${month}`,
          },
          update: {},
          create: {
            id: `payment-${tenant.id}-${month}`,
            tenantId: tenant.id,
            propertyId: property2.id,
            amount: tenant.monthlyRent,
            dueDate: dueDate,
            paidDate: isPaid ? new Date(dueDate.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000) : null,
            status: isOverdue ? 'OVERDUE' : isPaid ? 'PAID' : 'PENDING',
            paymentType: 'RENT',
            description: `Rent for ${dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          },
        });
      }
    }

    console.log('✅ Tenants and payments created');
    console.log('\n🎉 Owner dashboard data seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('📧 Owner Email: owner@test.com');
    console.log('🔑 Owner Password: owner123');
    console.log('\nYou can now login and test the owner dashboard at /owner/dashboard');

  } catch (error) {
    console.error('❌ Error seeding owner data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedOwnerData();
