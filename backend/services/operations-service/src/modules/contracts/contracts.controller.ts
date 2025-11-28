import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import {
  CreateContractDto,
  SignContractDto,
  UpdateContractStatusDto,
  ContractFiltersDto,
} from './dto/contracts.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  /**
   * Crea un contrato nuevo (estado BORRADOR)
   * POST /ops/contracts
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'AUDITOR')
  async create(
    @Body() dto: CreateContractDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.contractsService.create(dto, user.userId);
  }

  /**
   * Firma un contrato completo (proceso de alta in-situ)
   * POST /ops/contracts/:id/sign
   * 
   * Este es el endpoint principal que usa el auditor para:
   * - Completar datos del cliente
   * - Seleccionar plan
   * - Capturar firmas digitales
   * - Activar cliente y suscripción
   */
  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'AUDITOR')
  async signContract(
    @Param('id') id: string,
    @Body() dto: SignContractDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.contractsService.signContract(id, dto, user.userId);
  }

  /**
   * Lista todos los contratos
   * GET /ops/contracts
   */
  @Get()
  @Roles('ADMIN', 'OPERATOR')
  async findAll(@Query() filters: ContractFiltersDto) {
    return this.contractsService.findAll(filters);
  }

  /**
   * Obtiene un contrato por ID
   * GET /ops/contracts/:id
   */
  @Get(':id')
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async findById(@Param('id') id: string) {
    return this.contractsService.findById(id);
  }

  /**
   * Obtiene contratos de un cliente
   * GET /ops/contracts/client/:clientId
   */
  @Get('client/:clientId')
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR', 'CUSTOMER')
  async findByClient(@Param('clientId') clientId: string) {
    return this.contractsService.findByClientId(clientId);
  }

  /**
   * Actualiza estado del contrato
   * PATCH /ops/contracts/:id/status
   */
  @Patch(':id/status')
  @Roles('ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContractStatusDto,
  ) {
    return this.contractsService.updateStatus(id, dto);
  }
}

