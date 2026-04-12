/**
 * API Route: Sumsub webhook handler
 * POST /api/compliance/webhook
 *
 * Receives KYC status updates from Sumsub
 */

import { NextRequest, NextResponse } from 'next/server';
import { ComplianceService } from '@/lib/domains/compliance/service';
import { sumsubWebhookPayloadSchema } from '@/lib/domains/compliance/models';

export async function POST(request: NextRequest) {
  try {
    // TODO: Verify webhook signature from Sumsub
    // const signature = request.headers.get('x-payload-digest');
    // if (!verifySignature(signature, body)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const body = await request.json();

    // Validate payload
    const validationResult = sumsubWebhookPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Invalid webhook payload:', validationResult.error);
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Process webhook
    await ComplianceService.handleSumsubWebhook(validationResult.data);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
