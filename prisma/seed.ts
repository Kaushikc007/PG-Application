import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample owner
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      name: 'John Owner',
      password: hashedPassword,
      role: 'OWNER',
      phone: '+91-9876543210',
      address: 'Mumbai, Maharashtra'
    }
  });

  // Create sample properties
  const properties = [
    {
      ownerId: owner.id,
      pgNumber: 'PG001',
      name: 'Sunshine PG',
      address: '123 Main Street, Andheri',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      description: 'Comfortable PG accommodation with all modern amenities',
      totalRooms: 20,
      availableRooms: 5,
      rentPerMonth: 15000,
      securityDeposit: 30000,
      amenities: 'WiFi,AC,Laundry,Mess,Parking',
      rules: 'No smoking, No alcohol, Visitors allowed till 9 PM',
      images: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop,https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
      sharingType: 'Double Sharing',
      isVerified: true,
      rating: 4.5
    },
    {
      ownerId: owner.id,
      pgNumber: 'PG002',
      name: 'City Center PG',
      address: '456 Business District, Bandra',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      description: 'Premium PG in the heart of the city',
      totalRooms: 15,
      availableRooms: 3,
      rentPerMonth: 20000,
      securityDeposit: 40000,
      amenities: 'WiFi,AC,Gym,Mess,Security',
      rules: 'Professional environment, No pets',
      images: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
      sharingType: 'Single Sharing',
      isVerified: true,
      rating: 4.8
    },
    {
      ownerId: owner.id,
      pgNumber: 'PG003',
      name: 'Budget Stay PG',
      address: '789 College Road, Malad',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400064',
      description: 'Affordable accommodation for students and working professionals',
      totalRooms: 30,
      availableRooms: 12,
      rentPerMonth: 8000,
      securityDeposit: 16000,
      amenities: 'WiFi,Laundry,Mess,Water Cooler',
      rules: 'Student friendly, Quiet hours after 10 PM',
      images: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop',
      sharingType: 'Triple Sharing',
      isVerified: false,
      rating: 4.0
    },
    {
      ownerId: owner.id,
      pgNumber: 'PG004',
      name: 'Green Valley PG',
      address: '321 Hill View, Powai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400076',
      description: 'Peaceful PG with garden view and fresh air',
      totalRooms: 25,
      availableRooms: 8,
      rentPerMonth: 18000,
      securityDeposit: 36000,
      amenities: 'WiFi,AC,Garden,Parking,TV',
      rules: 'Nature lovers welcome, Maintain cleanliness',
      images: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      sharingType: 'Double Sharing',
      isVerified: true,
      rating: 4.3
    }
  ];

  for (const propertyData of properties) {
    await prisma.property.upsert({
      where: { pgNumber: propertyData.pgNumber },
      update: {},
      create: propertyData
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
