import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permission.guard';
import { RoleService } from '../services/role.service';
import { Permissions } from '../decorators/permissions.decorator';
import { CreateRoleDto } from '../dto/role/create-role.dto';
import { UpdateRoleDto } from '../dto/role/update-role.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Permissions('role:create')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @Permissions('role:read')
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @Permissions('role:read')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  @Permissions('role:update')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Permissions('role:delete')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  @Post(':roleId/permissions/:permissionId')
  @Permissions('role:update')
  addPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.roleService.addPermissionToRole(roleId, permissionId);
  }

  @Delete(':roleId/permissions/:permissionId')
  @Permissions('role:update')
  removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.roleService.removePermissionFromRole(roleId, permissionId);
  }
}
