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
import { PermissionService } from '../services/permission.service';
import { CreatePermissionDto } from '../dto/permission/create-permission.dto';
import { UpdatePermissionDto } from '../dto/permission/update-permission.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permission.guard';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @Permissions('permission:create')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Get()
  @Permissions('permission:read')
  findAll() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  @Permissions('permission:read')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(id);
  }

  @Patch(':id')
  @Permissions('permission:update')
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @Permissions('permission:delete')
  remove(@Param('id') id: string) {
    return this.permissionService.remove(id);
  }
}
