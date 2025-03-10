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
import { PolicyService } from '../services/policy.service';
import { Permissions } from '../decorators/permissions.decorator';
import { CreatePolicyDto } from '../dto/policy/create-policy.dto';
import { UpdatePolicyDto } from '../dto/policy/update-policy.dto';

@Controller('policies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Post()
  @Permissions('policy:create')
  create(@Body() createPolicyDto: CreatePolicyDto) {
    return this.policyService.create(createPolicyDto);
  }

  @Get()
  @Permissions('policy:read')
  findAll() {
    return this.policyService.findAll();
  }

  @Get(':id')
  @Permissions('policy:read')
  findOne(@Param('id') id: string) {
    return this.policyService.findOne(id);
  }

  @Patch(':id')
  @Permissions('policy:update')
  update(@Param('id') id: string, @Body() updatePolicyDto: UpdatePolicyDto) {
    return this.policyService.update(id, updatePolicyDto);
  }

  @Delete(':id')
  @Permissions('policy:delete')
  remove(@Param('id') id: string) {
    return this.policyService.remove(id);
  }
}
