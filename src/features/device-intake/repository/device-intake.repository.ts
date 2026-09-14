import { desc, eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { deviceIntakes, deviceIntakePhotos } from '@/lib/db/schema';
import type { DeviceIntakeInput, DeviceIntakeUpdateInput, DeviceIntakeDiagnosisInput } from '@/features/device-intake/domain/device-intake.schema';
import { ConcurrencyError } from '@/lib/errors';

export class DeviceIntakeRepository {
  async getAllDeviceIntakes(dbtx: any = db) {
    return await dbtx.query.deviceIntakes.findMany({
      orderBy: [desc(deviceIntakes.createdAt)],
      with: {
        customer: { columns: { id: true, name: true, documentNumber: true, phone: true } },
        photos: { columns: { publicId: true, url: true } },
      },
    });
  }

  async getDeviceIntakeById(id: string, dbtx: any = db) {
    return await dbtx.query.deviceIntakes.findFirst({
      where: (d: any, { eq }: any) => eq(d.id, id),
      with: {
        customer: { columns: { id: true, name: true, documentNumber: true, phone: true } },
        photos: { columns: { publicId: true, url: true } },
      },
    });
  }

  async createDeviceIntake(input: DeviceIntakeInput, dbtx: any = db) {
    const result = await dbtx
      .insert(deviceIntakes)
      .values({
        equipmentType: input.equipmentType,
        customerId: input.customerId,
        receivedByName: input.receivedByName,
        description: input.description,
        intakeReason: input.intakeReason,
        observations: input.observations,
        specs: input.specs,
        version: 1,
      })
      .returning();
    return result[0];
  }

  async updateDeviceIntake(id: string, input: DeviceIntakeUpdateInput, dbtx: any = db) {
    const updateData: any = {
      updatedAt: sql`NOW()`,
      version: sql`${deviceIntakes.version} + 1`,
    };
    if (input.customerId !== undefined) updateData.customerId = input.customerId;
    if (input.receivedByName !== undefined) updateData.receivedByName = input.receivedByName;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.intakeReason !== undefined) updateData.intakeReason = input.intakeReason;
    if (input.observations !== undefined) updateData.observations = input.observations;
    if (input.specs !== undefined) updateData.specs = input.specs;

    const result = await dbtx
      .update(deviceIntakes)
      .set(updateData)
      .where(and(eq(deviceIntakes.id, id), eq(deviceIntakes.version, input.version)))
      .returning();

    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }

  async submitDiagnosis(id: string, input: DeviceIntakeDiagnosisInput, dbtx: any = db) {
    const result = await dbtx
      .update(deviceIntakes)
      .set({
        diagnosisAuthorName: input.diagnosisAuthorName,
        diagnosisDetail: input.diagnosisDetail,
        diagnosedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
        version: sql`${deviceIntakes.version} + 1`,
      })
      .where(and(eq(deviceIntakes.id, id), eq(deviceIntakes.version, input.version)))
      .returning();

    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }

  async updateActiveStatus(id: string, isActive: boolean, dbtx: any = db) {
    const result = await dbtx
      .update(deviceIntakes)
      .set({
        isActive,
        updatedAt: sql`NOW()`,
        version: sql`${deviceIntakes.version} + 1`,
      })
      .where(eq(deviceIntakes.id, id))
      .returning();
    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }

  async deleteDeviceIntake(id: string, dbtx: any = db) {
    // Las fotos del estado inicial no tienen valor propio sin la recepción — se borran en cascada
    // para no bloquear la eliminación (mismo criterio que products/productImages).
    await dbtx.delete(deviceIntakePhotos).where(eq(deviceIntakePhotos.deviceIntakeId, id));

    const result = await dbtx.delete(deviceIntakes).where(eq(deviceIntakes.id, id)).returning();
    if (result.length === 0) throw new ConcurrencyError();
  }
}

export const deviceIntakeRepository = new DeviceIntakeRepository();
