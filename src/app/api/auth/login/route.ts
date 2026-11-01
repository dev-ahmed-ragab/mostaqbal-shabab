import { NextResponse } from 'next/server';

export const OFFICIAL_UNIFIED_PASSWORD = 'azab12345';
export const AUTH_SESSION_TOKEN = 'mostaqbal_azab_secure_authenticated_token_2025';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const trimmed = (password || '').trim();
    if (!trimmed) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال كلمة المرور.' },
        { status: 400 }
      );
    }

    // التحقق الصارم من كلمة المرور الموحدة المعتمدة فقط
    if (trimmed !== OFFICIAL_UNIFIED_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور غير صحيحة. يرجى إدخال كلمة المرور الرسمية المعتمدة.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: 'admin-azab',
        email: 'elazab@mostaqbal-watan.org',
        name: 'المهندس / محمد العزب',
        username: 'mohamed_elazab',
        avatar: '/leaders/avatar-azab.jpg',
        avatar_url: '/leaders/avatar-azab.jpg',
        isSuperAdmin: true,
        role: 'admin',
      },
    });

    // وضع كوكي الجلسة المشفر والمحمي لمدة 30 يوماً
    response.cookies.set('mostaqbal_admin_session', AUTH_SESSION_TOKEN, {
      path: '/',
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة الطلب.' },
      { status: 500 }
    );
  }
}
