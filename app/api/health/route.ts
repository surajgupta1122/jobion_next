// app/api/health/route.ts
import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    return NextResponse.json({ status: 'MySQL Connected ✅' });
  } catch (error) {
    return NextResponse.json({ status: 'Connection Failed ❌', error }, { status: 500 });
  }
}
