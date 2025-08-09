import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@pgapp.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@pgapp.com');
      console.log('Password: admin123');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@pgapp.com',
        name: 'PG Admin',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@pgapp.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: ADMIN');
    console.log('🆔 User ID:', admin.id);
    
    // Also create a test tenant user
    const existingTenant = await prisma.user.findUnique({
      where: { email: 'tenant@test.com' }
    });

    if (!existingTenant) {
      const tenantPassword = await bcrypt.hash('tenant123', 12);
      const tenant = await prisma.user.create({
        data: {
          email: 'tenant@test.com',
          name: 'Test Tenant',
          password: tenantPassword,
          role: 'TENANT',
          emailVerified: new Date(),
        }
      });

      console.log('\n✅ Test tenant user created successfully!');
      console.log('📧 Email: tenant@test.com');
      console.log('🔑 Password: tenant123');
      console.log('👤 Role: TENANT');
      console.log('🆔 User ID:', tenant.id);
    }

    // Also create a test owner user
    const existingOwner = await prisma.user.findUnique({
      where: { email: 'owner@test.com' }
    });

    if (!existingOwner) {
      const ownerPassword = await bcrypt.hash('owner123', 12);
      const owner = await prisma.user.create({
        data: {
          email: 'owner@test.com',
          name: 'Test Owner',
          password: ownerPassword,
          role: 'OWNER',
          emailVerified: new Date(),
        }
      });

      console.log('\n✅ Test owner user created successfully!');
      console.log('📧 Email: owner@test.com');
      console.log('🔑 Password: owner123');
      console.log('👤 Role: OWNER');
      console.log('🆔 User ID:', owner.id);
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
