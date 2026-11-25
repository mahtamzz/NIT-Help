import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CORE_PATTERNS, TicketAccessContextRequest } from '@nit-help/microservice-common';
import { DepartmentsService } from './departments/departments.service';
import { TicketInternalQueriesUseCase } from './tickets/application/use-cases/ticket-internal-queries.use-case';

@Controller()
export class CoreRpcController {
  constructor(
    private readonly ticketQueries: TicketInternalQueriesUseCase,
    private readonly departmentsService: DepartmentsService,
  ) {}

  @MessagePattern(CORE_PATTERNS.GET_TICKET_ACCESS_CONTEXT)
  getTicketAccessContext(@Payload() data: TicketAccessContextRequest) {
    return this.ticketQueries.getAccessContext(data);
  }

  @MessagePattern(CORE_PATTERNS.GET_DEPARTMENT_BY_ID)
  getDepartmentById(@Payload() data: { id: string }) {
    return this.departmentsService.findByIdForRpc(data.id);
  }

  @MessagePattern(CORE_PATTERNS.EXPORT_ANALYTICS_SEED)
  exportAnalyticsSeed() {
    return this.ticketQueries.exportAnalyticsSeed();
  }
}
