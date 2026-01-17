import { db } from './index';
import { organisations, users, projects } from './schema';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('Seeding database...');

  try {
    // Create demo organisation
    const [org] = await db
      .insert(organisations)
      .values({
        name: 'Demo Organisation',
        slug: 'demo',
      })
      .returning();

    console.log('Created organisation:', org.name);

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('password123', 10);
    const [admin] = await db
      .insert(users)
      .values({
        organisationId: org.id,
        email: 'admin@demo.com',
        passwordHash: adminPasswordHash,
        name: 'Demo Admin',
        role: 'admin',
      })
      .returning();

    console.log('Created admin user:', admin.email);

    // Create member user
    const memberPasswordHash = await bcrypt.hash('password123', 10);
    const [member] = await db
      .insert(users)
      .values({
        organisationId: org.id,
        email: 'member@demo.com',
        passwordHash: memberPasswordHash,
        name: 'Demo Member',
        role: 'member',
      })
      .returning();

    console.log('Created member user:', member.email);

    // Create sample project
    const [project] = await db
      .insert(projects)
      .values({
        organisationId: org.id,
        name: 'Sample Project',
        description: 'A sample project for demonstration purposes',
        createdById: admin.id,
      })
      .returning();

    console.log('Created project:', project.name);

    console.log('\nSeed completed successfully!');
    console.log('\nDemo credentials:');
    console.log('  Admin: admin@demo.com / password123');
    console.log('  Member: member@demo.com / password123');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
