import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from '../entities/policy.entity';
import { CreatePolicyDto } from '../dto/policy/create-policy.dto';
import { UpdatePolicyDto } from '../dto/policy/update-policy.dto';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(Policy)
    private policyRepository: Repository<Policy>,
  ) {}

  async create(createPolicyDto: CreatePolicyDto): Promise<Policy> {
    const existingPolicy = await this.policyRepository.findOne({
      where: { name: createPolicyDto.name },
    });

    if (existingPolicy) {
      throw new ConflictException('Policy with this name already exists');
    }

    const policy = this.policyRepository.create(createPolicyDto);
    return this.policyRepository.save(policy);
  }

  async findAll(): Promise<Policy[]> {
    return this.policyRepository.find();
  }

  async findOne(id: string): Promise<Policy> {
    const policy = await this.policyRepository.findOne({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    return policy;
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto): Promise<Policy> {
    const policy = await this.findOne(id);

    if (updatePolicyDto.name && updatePolicyDto.name !== policy.name) {
      const existingPolicy = await this.policyRepository.findOne({
        where: { name: updatePolicyDto.name },
      });

      if (existingPolicy && existingPolicy.id !== id) {
        throw new ConflictException('Policy with this name already exists');
      }
    }

    // Cập nhật các trường
    Object.assign(policy, updatePolicyDto);

    return this.policyRepository.save(policy);
  }

  async remove(id: string): Promise<void> {
    const result = await this.policyRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }
  }
}
