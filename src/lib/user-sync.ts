import { db } from '@/db';
import { auditLogs } from '@/db/schema';

export async function logUserAction(
  userId: string,
  userEmail: string,
  action: 'SIGN_IN' | 'SIGN_OUT' | 'SIGN_UP',
  metadata?: Record<string, unknown>
) {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      event_type: 'AUTH',
      event_action: action,
      entity_id: userId,
      user_id: userId,
      user_email: userEmail,
      metadata: metadata || {},
      created_at: new Date(),
    });
  } catch (error) {
    console.error('Failed to log user action:', error);
  }
}