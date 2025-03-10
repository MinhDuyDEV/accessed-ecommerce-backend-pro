import { Connection, createConnection } from 'typeorm';
import { seedRBAC } from './rbac.seed';
import { seedAdminUser } from './admin-user.seed';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function seed() {
  let connection: Connection;

  try {
    // Kết nối đến database
    connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
      synchronize: true,
    });

    console.log('Connected to database');

    // Chạy các seed
    await seedRBAC(connection);
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

seed();
