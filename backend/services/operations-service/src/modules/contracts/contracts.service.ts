import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Result, Logger } from '@aaron/common';
import { prisma } from '../../config/database';
import { 
  CreateContractDto, 
  SignContractDto, 
  UpdateContractStatusDto,
  ContractFiltersDto,
  EstadoContrato 
} from './dto/contracts.dto';

const logger = new Logger('ContractsService');

@Injectable()
export class ContractsService {
  
  /**
   * Crea un contrato en estado BORRADOR
   * Usado cuando el auditor inicia el proceso de alta
   */
  async create(dto: CreateContractDto, auditorUserId: string) {
    try {
      // Verificar que el cliente existe
      const client = await prisma.client.findUnique({
        where: { id: dto.clientId },
      });

      if (!client) {
        return Result.error(new Error('Client not found'));
      }

      // Generar número de contrato
      const nroContrato = await this.generateContractNumber();

      const contract = await prisma.contract.create({
        data: {
          nroContrato,
          clientId: dto.clientId,
          propertyId: dto.propertyId,
          tipoTramite: dto.tipoTramite || 'ALTA',
          planId: dto.planId,
          ciudadFirma: dto.ciudadFirma,
          ejecutivoId: auditorUserId,
          estado: 'BORRADOR',
        },
        include: {
          client: true,
          plan: true,
          property: true,
        },
      });

      logger.info(`Contract created: ${nroContrato} for client ${dto.clientId}`);
      return Result.ok(contract);
    } catch (error) {
      logger.error('Create contract error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to create contract'));
    }
  }

  /**
   * Firma el contrato completamente
   * Este es el endpoint principal usado por el auditor in-situ
   */
  async signContract(contractId: string, dto: SignContractDto, auditorUserId: string) {
    try {
      // Obtener contrato existente
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { client: true, plan: true },
      });

      if (!contract) {
        return Result.error(new Error('Contract not found'));
      }

      if (contract.estado !== 'BORRADOR' && contract.estado !== 'PENDIENTE_FIRMA') {
        return Result.error(new Error(`Contract cannot be signed in state: ${contract.estado}`));
      }

      // Obtener plan
      const plan = await prisma.plan.findUnique({ where: { id: dto.planId } });
      if (!plan) {
        return Result.error(new Error('Plan not found'));
      }

      // Calcular fecha de vigencia (24 meses por defecto)
      const fechaVigenciaInicio = dto.fechaVigenciaInicio 
        ? new Date(dto.fechaVigenciaInicio) 
        : new Date();
      
      const fechaVigenciaFin = dto.fechaVigenciaFin 
        ? new Date(dto.fechaVigenciaFin)
        : new Date(fechaVigenciaInicio.getTime() + (24 * 30 * 24 * 60 * 60 * 1000)); // 24 meses

      // Actualizar datos del cliente
      await prisma.client.update({
        where: { id: contract.clientId },
        data: {
          nombreCompleto: dto.nombreCompleto || contract.client.nombreCompleto,
          tipoDocumento: dto.tipoDocumento as any || contract.client.tipoDocumento,
          documento: dto.documento || contract.client.documento,
          cuilCuit: dto.cuilCuit || contract.client.cuilCuit,
          sexo: dto.sexo as any || contract.client.sexo,
          fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : contract.client.fechaNacimiento,
          nacionalidad: dto.nacionalidad || contract.client.nacionalidad,
          estadoCivil: dto.estadoCivil as any || contract.client.estadoCivil,
          discapacitado: dto.discapacitado ?? contract.client.discapacitado,
          cargo: dto.cargo || contract.client.cargo,
          telefono: dto.telefono || contract.client.telefono,
          telefonoCelular: dto.telefonoCelular || contract.client.telefonoCelular,
          telefonoEmergencia: dto.telefonoEmergencia || contract.client.telefonoEmergencia,
          calle: dto.calle || contract.client.calle,
          numero: dto.numero || contract.client.numero,
          piso: dto.piso || contract.client.piso,
          departamento: dto.departamento || contract.client.departamento,
          localidad: dto.localidad || contract.client.localidad,
          partido: dto.partido || contract.client.partido,
          provincia: dto.provincia || contract.client.provincia,
          codigoPostal: dto.codigoPostal || contract.client.codigoPostal,
          razonSocial: dto.razonSocial || contract.client.razonSocial,
          cuitEmpresa: dto.cuitEmpresa || contract.client.cuitEmpresa,
          // Activar cliente
          estado: 'ACTIVO',
        },
      });

      // Actualizar contrato
      const updatedContract = await prisma.contract.update({
        where: { id: contractId },
        data: {
          planId: dto.planId,
          planNombre: plan.name,
          formaPago: dto.formaPago as any,
          valorCuotaInicial: dto.valorCuotaInicial,
          valorCuotaMensual: dto.valorCuotaMensual,
          especificaciones: dto.especificaciones ? dto.especificaciones as any : null,
          clausulasAceptadas: dto.clausulas ? dto.clausulas as any : null,
          // Firma del cliente
          firmaClienteData: dto.firmaCliente.firmaData,
          firmaClienteFecha: new Date(),
          firmaClienteIP: dto.firmaCliente.ip,
          firmaClienteDispositivo: dto.firmaCliente.dispositivo,
          // Firma de la empresa
          firmaEmpresaData: dto.firmaEmpresa.firmaData,
          firmaEmpresaFecha: new Date(),
          firmaEmpresaNombre: dto.firmaEmpresa.nombreFirmante,
          firmaEmpresaCargo: dto.firmaEmpresa.cargoFirmante,
          // Ubicación y fecha
          ciudadFirma: dto.ciudadFirma,
          fechaFirma: new Date(),
          latFirma: dto.latFirma,
          lngFirma: dto.lngFirma,
          // Vigencia
          fechaVigenciaInicio,
          fechaVigenciaFin,
          // Estado
          estado: 'FIRMADO',
          ejecutivoId: auditorUserId,
          observaciones: dto.observaciones,
        },
        include: {
          client: true,
          plan: true,
          property: true,
        },
      });

      // Crear o actualizar suscripción
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          clientId: contract.clientId,
          status: { in: ['REVISION', 'ACTIVE'] },
        },
      });

      if (existingSubscription) {
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            planId: dto.planId,
            status: 'ACTIVE',
            montoMensual: dto.valorCuotaMensual,
            fechaInicio: fechaVigenciaInicio,
            fechaFin: fechaVigenciaFin,
            planSnapshot: {
              name: plan.name,
              price: plan.price,
              currency: plan.currency,
            },
          },
        });

        // Vincular contrato con suscripción
        await prisma.contract.update({
          where: { id: contractId },
          data: { subscriptionId: existingSubscription.id },
        });
      } else {
        // Crear nueva suscripción
        const subscription = await prisma.subscription.create({
          data: {
            clientId: contract.clientId,
            userId: contract.client.userId,
            propertyId: contract.propertyId,
            planId: dto.planId,
            status: 'ACTIVE',
            montoMensual: dto.valorCuotaMensual,
            fechaInicio: fechaVigenciaInicio,
            fechaFin: fechaVigenciaFin,
            planSnapshot: {
              name: plan.name,
              price: plan.price,
              currency: plan.currency,
            },
          },
        });

        // Vincular contrato con suscripción
        await prisma.contract.update({
          where: { id: contractId },
          data: { subscriptionId: subscription.id },
        });
      }

      // Actualizar propiedad si existe
      if (contract.propertyId) {
        await prisma.customerProperty.update({
          where: { id: contract.propertyId },
          data: { status: 'ACTIVE' },
        });
      }

      logger.info(`Contract signed: ${contract.nroContrato}`);

      return Result.ok({
        contract: updatedContract,
        message: 'Contrato firmado exitosamente. Cliente activado.',
      });
    } catch (error) {
      logger.error('Sign contract error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to sign contract'));
    }
  }

  /**
   * Obtiene un contrato por ID
   */
  async findById(id: string) {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id },
        include: {
          client: true,
          plan: true,
          property: true,
          subscription: true,
        },
      });

      if (!contract) {
        return Result.error(new Error('Contract not found'));
      }

      return Result.ok(contract);
    } catch (error) {
      logger.error('Find contract error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to find contract'));
    }
  }

  /**
   * Lista contratos con filtros
   */
  async findAll(filters?: ContractFiltersDto) {
    try {
      const where: any = {};

      if (filters?.clientId) where.clientId = filters.clientId;
      if (filters?.estado) where.estado = filters.estado;
      if (filters?.tipoTramite) where.tipoTramite = filters.tipoTramite;

      if (filters?.desde || filters?.hasta) {
        where.fechaFirma = {};
        if (filters.desde) where.fechaFirma.gte = new Date(filters.desde);
        if (filters.hasta) where.fechaFirma.lte = new Date(filters.hasta);
      }

      const contracts = await prisma.contract.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              nombreCompleto: true,
              documento: true,
              email: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return Result.ok(contracts);
    } catch (error) {
      logger.error('List contracts error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to list contracts'));
    }
  }

  /**
   * Actualiza el estado del contrato
   */
  async updateStatus(id: string, dto: UpdateContractStatusDto) {
    try {
      const contract = await prisma.contract.findUnique({ where: { id } });
      if (!contract) {
        return Result.error(new Error('Contract not found'));
      }

      const updated = await prisma.contract.update({
        where: { id },
        data: {
          estado: dto.estado as any,
          ...(dto.motivo && { observaciones: dto.motivo }),
        },
      });

      return Result.ok(updated);
    } catch (error) {
      logger.error('Update contract status error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update contract'));
    }
  }

  /**
   * Obtiene contratos de un cliente
   */
  async findByClientId(clientId: string) {
    try {
      const contracts = await prisma.contract.findMany({
        where: { clientId },
        include: {
          plan: true,
          property: {
            select: { id: true, alias: true, address: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return Result.ok(contracts);
    } catch (error) {
      logger.error('Find contracts by client error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to find contracts'));
    }
  }

  /**
   * Genera número de contrato único
   */
  private async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.contract.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    
    const sequence = (count + 1).toString().padStart(6, '0');
    return `AARON-${year}-${sequence}`;
  }
}

