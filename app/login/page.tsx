'use client';

import { AuthGateway } from '@/components/auth/AuthGateway';

export default function LoginPage() {
  return <AuthGateway initialMode="signin" />;
}
