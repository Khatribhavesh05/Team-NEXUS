'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Signup is handled via OAuth providers on the login page.
// This page's sole purpose is to redirect.
export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  // Render a minimal loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to login...</p>
    </div>
  );
}
