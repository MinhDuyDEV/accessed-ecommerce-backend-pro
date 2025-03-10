import { Connection } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/auth/entities/role.entity';

export const seedAdminUser = async (connection: Connection) => {
  const userRepository = connection.getRepository(User);
  const roleRepository = connection.getRepository(Role);

  // Kiểm tra xem đã có admin user chưa
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@example.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    return;
  }

  // Lấy admin role
  const adminRole = await roleRepository.findOne({
    where: { name: 'admin' },
  });

  if (!adminRole) {
    console.log('Admin role not found. Please run RBAC seed first.');
    return;
  }

  // Tạo admin user
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash('admin123', salt);

  const adminUser = userRepository.create({
    email: 'admin@example.com',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    status: UserStatus.ACTIVE,
    emailVerified: true,
    roles: [adminRole],
  });

  await userRepository.save(adminUser);
  console.log('Admin user created successfully');
};
