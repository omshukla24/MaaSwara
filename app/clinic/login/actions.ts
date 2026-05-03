'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAsProvider(prevState: any, formData: FormData) {
  const password = formData.get('password');
  
  // Hardcoded fallback password for the demo if not set in env
  const correctPassword = process.env.CLINIC_DEMO_PASSWORD || 'maaswara2026';

  if (password === correctPassword) {
    // Set a secure, HTTP-only cookie
    (await cookies()).set({
      name: 'maaswara_clinic_auth',
      value: 'authenticated',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    redirect('/clinic');
  } else {
    return { error: 'Invalid provider password.' };
  }
}
