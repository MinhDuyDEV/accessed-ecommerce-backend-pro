import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { CreateRoleDto } from '../dto/role/create-role.dto';
import { UpdateRoleDto } from '../dto/role/update-role.dto';
import { PermissionCacheService } from './permission-cache.service';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private permissionCacheService: PermissionCacheService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
    });

    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      const permissions = await this.permissionRepository.findByIds(
        createRoleDto.permissionIds,
      );
      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({ relations: ['permissions'] });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async findByName(name: string): Promise<Role> {
    console.log('name', name);
    const role = await this.roleRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with name ${name} not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existingRole && existingRole.id !== id) {
        throw new ConflictException('Role with this name already exists');
      }

      role.name = updateRoleDto.name;
    }

    if (updateRoleDto.description) {
      role.description = updateRoleDto.description;
    }

    if (updateRoleDto.permissionIds) {
      const permissions = await this.permissionRepository.findByIds(
        updateRoleDto.permissionIds,
      );
      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const result = await this.roleRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }

  async addPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<Role> {
    const role = await this.findOne(roleId);
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });

    if (!role || !permission) {
      throw new NotFoundException('Role or permission not found');
    }

    if (!role.permissions) {
      role.permissions = [];
    }

    // Kiểm tra xem permission đã tồn tại trong role chưa
    const existingPermission = role.permissions.find(
      (p) => p.id === permissionId,
    );

    if (existingPermission) {
      throw new ConflictException('Permission already exists in this role');
    }

    role.permissions.push(permission);
    await this.roleRepository.save(role);

    // Xóa cache của tất cả users có role này
    const usersWithRole = await this.usersService.findByRoleId(roleId);
    for (const user of usersWithRole) {
      await this.permissionCacheService.invalidateUserPermissions(user.id);
    }

    return role;
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<Role> {
    const role = await this.findOne(roleId);

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    if (!role.permissions) {
      throw new NotFoundException('Role has no permissions');
    }

    // Kiểm tra xem permission có tồn tại trong role không
    const permissionIndex = role.permissions.findIndex(
      (p) => p.id === permissionId,
    );

    if (permissionIndex === -1) {
      throw new NotFoundException('Permission not found in this role');
    }

    role.permissions.splice(permissionIndex, 1);
    await this.roleRepository.save(role);

    // Xóa cache của tất cả users có role này
    const usersWithRole = await this.usersService.findByRoleId(roleId);
    for (const user of usersWithRole) {
      await this.permissionCacheService.invalidateUserPermissions(user.id);
    }

    return role;
  }
}
