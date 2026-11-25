import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IAM_PATTERNS } from '@nit-help/microservice-common';
import { UsersService } from './users/users.service';

@Controller()
export class IamRpcController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(IAM_PATTERNS.GET_USER_BY_ID)
  getUserById(@Payload() data: { id: string }) {
    return this.usersService.findByIdForRpc(data.id);
  }

  @MessagePattern(IAM_PATTERNS.GET_USERS_BY_IDS)
  getUsersByIds(@Payload() data: { ids: string[] }) {
    return this.usersService.findByIdsForRpc(data.ids);
  }

  @MessagePattern(IAM_PATTERNS.GET_USERS_BY_DEPARTMENT)
  getUsersByDepartment(@Payload() data: { departmentId: string }) {
    return this.usersService.findUsersByDepartmentForRpc(data.departmentId);
  }

  @MessagePattern(IAM_PATTERNS.GET_SPECIALISTS)
  getSpecialists(@Payload() data: { departmentId?: string }) {
    return this.usersService.findSpecialists(data?.departmentId);
  }

  @MessagePattern(IAM_PATTERNS.EXPORT_USERS)
  exportUsers() {
    return this.usersService.exportAllForRpc();
  }
}
