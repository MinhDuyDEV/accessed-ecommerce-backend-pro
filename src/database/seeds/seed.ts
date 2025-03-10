import { Connection, createConnection } from 'typeorm';
import { seedRBAC } from './rbac.seed';
import { seedAdminUser } from './admin-user.seed';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config();

async function seed() {
  let connection: Connection;

  try {
    console.log('Starting database seed...');

    // Kết nối đến database
    connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
      synchronize: true,
      logging: true,
    });

    console.log('Connected to database');

    // Chạy các seed
    console.log('Running RBAC seed...');
    await seedRBAC(connection);

    console.log('Running Admin User seed...');
    await seedAdminUser(connection);

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error during seed:', error);
  } finally {
    if (connection) {
      await connection.close();
      console.log('Database connection closed');
    }
  }
}

// Chạy hàm seed
seed().catch((error) => {
  console.error('Unhandled error during seed:', error);
  process.exit(1);
});
