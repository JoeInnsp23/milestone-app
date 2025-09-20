// T380-T384: Webhook Integration

interface WebhookPayload {
  event: string;
  data: Record<string, any>;
}

export async function triggerWebhook(payload: WebhookPayload) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('No webhook URL configured');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET || ''
      },
      body: JSON.stringify({
        ...payload,
        source: 'milestone-app',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Webhook error:', error);
    // Don't throw - webhooks should not block UI updates
  }
}