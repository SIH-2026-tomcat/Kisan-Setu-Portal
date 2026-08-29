import { prisma } from '../config/db';

export interface CreateAuditLogParams {
  officerId?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        officerId: params.officerId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details || null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
