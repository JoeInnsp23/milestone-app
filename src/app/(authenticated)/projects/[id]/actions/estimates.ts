'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { projectEstimates, auditLogs } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import Big from 'big.js';

const estimateSchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  estimate_date: z.string(),
  project_id: z.string(),
  build_phase_id: z.string().optional().nullable(),
  estimate_type: z.enum(['revenue', 'cost', 'materials']).default('revenue'),
  confidence_level: z.number().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createEstimate(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    const data = estimateSchema.parse({
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount') as string),
      estimate_date: formData.get('estimate_date'),
      project_id: formData.get('project_id'),
      build_phase_id: formData.get('build_phase_id') || null,
      estimate_type: formData.get('estimate_type') || 'revenue',
      confidence_level: formData.get('confidence_level') ? parseInt(formData.get('confidence_level') as string) : null,
      notes: formData.get('notes') || null,
    });

    const amountBig = new Big(data.amount);
    const now = new Date();

    const [created] = await db
      .insert(projectEstimates)
      .values({
        project_id: data.project_id,
        build_phase_id: data.build_phase_id,
        description: data.description,
        estimate_type: data.estimate_type,
        amount: amountBig.toString(),
        estimate_date: data.estimate_date,
        confidence_level: data.confidence_level,
        notes: data.notes,
        created_by: userId,
        updated_by: userId,
        created_at: now,
        updated_at: now,
      })
      .returning();

    await db.insert(auditLogs).values({
      event_type: 'estimate_change',
      event_action: 'create',
      entity_id: created.id,
      user_id: userId,
      metadata: { created },
      created_at: now,
    });

    revalidatePath(`/projects/${data.project_id}`);
    return { success: true, estimate: created };
  } catch (error) {
    console.error('Error creating estimate:', error);
    return { success: false, error: 'Failed to create estimate' };
  }
}

export async function updateEstimate(id: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    // Check ownership
    const [existing] = await db
      .select()
      .from(projectEstimates)
      .where(and(
        eq(projectEstimates.id, id),
        eq(projectEstimates.created_by, userId),
        isNull(projectEstimates.valid_until)
      ))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Estimate not found or unauthorized' };
    }

    const data = estimateSchema.parse({
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount') as string),
      estimate_date: formData.get('estimate_date'),
      project_id: existing.project_id,
      build_phase_id: formData.get('build_phase_id') || null,
      estimate_type: formData.get('estimate_type') || 'revenue',
      confidence_level: formData.get('confidence_level') ? parseInt(formData.get('confidence_level') as string) : null,
      notes: formData.get('notes') || null,
    });

    // Convert amount to Big.js string for decimal column
    const amountBig = new Big(data.amount);

    // Update estimate
    const [updated] = await db
      .update(projectEstimates)
      .set({
        build_phase_id: data.build_phase_id,
        description: data.description,
        estimate_type: data.estimate_type,
        amount: amountBig.toString(),
        estimate_date: data.estimate_date,
        confidence_level: data.confidence_level,
        notes: data.notes,
        updated_by: userId,
        updated_at: new Date(),
      })
      .where(eq(projectEstimates.id, id))
      .returning();

    // Log the action
    await db.insert(auditLogs).values({
      event_type: 'estimate_change',
      event_action: 'update',
      entity_id: id,
      user_id: userId,
      metadata: { before: existing, after: updated },
      created_at: new Date(),
    });

    revalidatePath(`/projects/${existing.project_id}`);
    return { success: true, estimate: updated };
  } catch (error) {
    console.error('Error updating estimate:', error);
    return { success: false, error: 'Failed to update estimate' };
  }
}

export async function deleteEstimate(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    // Check ownership
    const [existing] = await db
      .select()
      .from(projectEstimates)
      .where(and(
        eq(projectEstimates.id, id),
        eq(projectEstimates.created_by, userId),
        isNull(projectEstimates.valid_until)
      ))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Estimate not found or unauthorized' };
    }

    // Soft delete by setting valid_until
    await db
      .update(projectEstimates)
      .set({
        valid_until: new Date().toISOString().split('T')[0], // Date string for date column
        updated_by: userId,
        updated_at: new Date(),
      })
      .where(eq(projectEstimates.id, id));

    // Log the action
    await db.insert(auditLogs).values({
      event_type: 'estimate_change',
      event_action: 'delete',
      entity_id: id,
      user_id: userId,
      metadata: { deleted: existing },
      created_at: new Date(),
    });

    revalidatePath(`/projects/${existing.project_id}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting estimate:', error);
    return { success: false, error: 'Failed to delete estimate' };
  }
}
