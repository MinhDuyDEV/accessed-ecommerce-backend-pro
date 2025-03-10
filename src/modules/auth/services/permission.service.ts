import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePermissionDto } from '../dto/permission/create-permission.dto';
import { UpdatePermissionDto } from '../dto/permission/update-permission.dto';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const existingPermission = await this.permissionRepository.findOne({
      where: [
        { name: createPermissionDto.name },
        { code: createPermissionDto.code },
      ],
    });

    if (existingPermission) {
      throw new ConflictException(
        'Permission with this name or code already exists',
      );
    }

    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async findByCode(code: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { code },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with code ${code} not found`);
    }

    return permission;
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findOne(id);

    if (
      updatePermissionDto.name &&
      updatePermissionDto.name !== permission.name
    ) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { name: updatePermissionDto.name },
      });

      if (existingPermission && existingPermission.id !== id) {
        throw new ConflictException('Permission with this name already exists');
      }

      permission.name = updatePermissionDto.name;
    }

    if (
      updatePermissionDto.code &&
      updatePermissionDto.code !== permission.code
    ) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { code: updatePermissionDto.code },
      });

      if (existingPermission && existingPermission.id !== id) {
        throw new ConflictException('Permission with this code already exists');
      }

      permission.code = updatePermissionDto.code;
    }

    if (updatePermissionDto.description) {
      permission.description = updatePermissionDto.description;
    }

    return this.permissionRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const result = await this.permissionRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
  }
}
