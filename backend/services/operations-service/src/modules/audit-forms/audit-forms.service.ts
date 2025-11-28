import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '../../config/database';
import { CreateAuditFormDto, UpdateAuditFormDto } from './dto/audit-forms.dto';

@Injectable()
export class AuditFormsService {
  /**
   * Crea o actualiza un formulario de auditoría para un cliente
   */
  async upsert(clientId: string, dto: CreateAuditFormDto | UpdateAuditFormDto) {
    // Verificar que el cliente existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Buscar si ya existe un formulario
    const existing = await prisma.auditForm.findUnique({
      where: { clientId },
    });

    const data: any = {
      ...dto,
      clientId,
      fechaTramite: dto.fechaTramite ? new Date(dto.fechaTramite) : undefined,
      fechaVigenciaCobertura: dto.fechaVigenciaCobertura ? new Date(dto.fechaVigenciaCobertura) : undefined,
    };

    if (existing) {
      // Actualizar
      return prisma.auditForm.update({
        where: { clientId },
        data,
      });
    } else {
      // Crear
      return prisma.auditForm.create({
        data,
      });
    }
  }

  /**
   * Obtiene el formulario de auditoría de un cliente
   */
  async findByClientId(clientId: string) {
    const form = await prisma.auditForm.findUnique({
      where: { clientId },
      include: {
        client: true,
        plan: true,
      },
    });

    if (!form) {
      throw new NotFoundException('Audit form not found');
    }

    return form;
  }

  /**
   * Marca el formulario como completado
   */
  async markAsCompleted(clientId: string, completadoPor: string) {
    const form = await prisma.auditForm.findUnique({
      where: { clientId },
    });

    if (!form) {
      throw new NotFoundException('Audit form not found');
    }

    return prisma.auditForm.update({
      where: { clientId },
      data: {
        completado: true,
        fechaCompletado: new Date(),
        completadoPor,
      },
    });
  }

  /**
   * Lista todos los formularios (para admin)
   */
  async findAll(completado?: boolean) {
    const where: any = {};
    if (completado !== undefined) {
      where.completado = completado;
    }

    return prisma.auditForm.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
            estado: true,
          },
        },
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}


