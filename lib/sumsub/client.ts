/**
 * Sumsub Backend Client
 * 
 * Used for generating access tokens and interacting with the Sumsub API.
 * Docs: https://developers.sumsub.com/
 */

import crypto from 'crypto';

const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN;
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY;
const SUMSUB_BASE_URL = 'https://api.sumsub.com';

export class SumsubClient {
  /**
   * Generates a signature for Sumsub API requests
   */
  private static createSignature(timestamp: number, method: string, url: string, body?: string): string {
    const data = timestamp + method.toUpperCase() + url + (body || '');
    return crypto
      .createHmac('sha256', SUMSUB_SECRET_KEY || '')
      .update(data)
      .digest('hex');
  }

  /**
   * Generates an access token for the Sumsub Web SDK
   * @param externalUserId The unique identifier for the user in our system
   * @param levelName The verification level created in Sumsub dashboard (e.g., 'basic-kyc-level')
   */
  static async getAccessToken(externalUserId: string, levelName: string = 'basic-kyc-level'): Promise<{ token: string; userId: string }> {
    if (!SUMSUB_APP_TOKEN || !SUMSUB_SECRET_KEY) {
      throw new Error('Sumsub configuration missing in environment variables');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const method = 'POST';
    const url = `/resources/accessTokens?userId=${externalUserId}&levelName=${levelName}`;
    
    const signature = this.createSignature(timestamp, method, url);

    const response = await fetch(`${SUMSUB_BASE_URL}${url}`, {
      method,
      headers: {
        'X-App-Token': SUMSUB_APP_TOKEN,
        'X-App-Access-Sig': signature,
        'X-App-Access-Ts': timestamp.toString(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sumsub token generation failed:', errorText);
      throw new Error(`Sumsub API error: ${response.statusText}`);
    }

    return await response.json();
  }
}
