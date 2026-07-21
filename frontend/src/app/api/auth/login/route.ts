import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const res = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
        { status: res.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: { username: data.username, role: data.role },
    });

    // Security Best Practice: Set HttpOnly, Secure, SameSite=Strict cookie
    response.cookies.set({
      name: 'admin_token',
      value: data.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours session
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}
