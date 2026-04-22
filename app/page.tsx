import { redirect } from 'next/navigation';
import { getHousehold } from '@/lib/sheets';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, validateSessionToken } from '@/lib/auth';

export default async function RootPage() {
  // If already logged in, go straight to dashboard
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token && validateSessionToken(token)) {
    redirect('/dashboard');
  }

  // If no household exists yet, go to first-time setup
  try {
    const household = await getHousehold();
    if (!household) {
      redirect('/setup');
    }
  } catch {
    // Sheets not configured yet — still redirect to setup
    redirect('/setup');
  }

  redirect('/login');
}
