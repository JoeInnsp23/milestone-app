// T380: Webhook endpoint for n8n phase updates
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const receivedSecret = request.headers.get('X-Webhook-Secret');
      if (receivedSecret !== webhookSecret) {
        return NextResponse.json(
          { error: 'Invalid webhook secret' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();

    // Log webhook data for debugging
    console.log('Webhook received:', {
      event: body.event,
      data: body.data,
      timestamp: new Date().toISOString()
    });

    // Here you could process webhook data from n8n
    // For example, sync phase updates back from n8n if needed

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}