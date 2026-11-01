import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password === 'helal12345') {
      const response = NextResponse.json({
        success: true,
        user: {
          id: 'admin-helal',
          email: 'helal@mostaqbal-watan.org',
          name: 'محمد هلال',
          username: 'helal',
          avatar: '/leaders/avatar-helal.jpg',
          isSuperAdmin: true,
          role: 'admin',
        },
      });

      // وضع كوكي الجلسة لمدة 30 يوماً
      response.cookies.set('mostaqbal_admin_session', 'helal12345', {
        path: '/',
        httpOnly: false, // للسماح بقراءته من الكلاينت والـ proxy معاً
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'الرقم السري غير صحيح. يرجى إدخال كلمة المرور المعتمدة.' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة الطلب.' },
      { status: 500 }
    );
  }
}
