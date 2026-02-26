import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, type, status, txSig, memoPayload, errorMsg } = body;

    // Extract IP address securely from headers (works locally and in production like Vercel/Render)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : (realIp || 'Unknown IP');

    // Create a beautifully organized, searchable log object
    const logEntry = {
      timestamp: new Date().toISOString(),
      unix_time: Date.now(),
      ip_address: ip,
      wallet_address: wallet || 'Unconnected',
      action_type: type,
      status: status, // 'successful' | 'failed'
      tx_sig: txSig || null,
      error_message: errorMsg || null,
      memo_payload: memoPayload || null
    };

    // Path to the admin log file (same directory as twirvo_ledger.txt)
    const filePath = path.resolve(process.cwd(), 'admin_log.txt');

    // Append as a single-line JSON string for easy searching/parsing
    fs.appendFileSync(filePath, JSON.stringify(logEntry) + '\n', 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin logging failed:", error);
    return NextResponse.json({ success: false, error: 'Failed to write admin log' }, { status: 500 });
  }
}