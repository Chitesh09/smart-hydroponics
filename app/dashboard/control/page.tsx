'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ControlRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/devices');
  }, [router]);

  return null;
}
