'use client';

import { AuthGateway } from '@/components/auth/AuthGateway';

export default function EntryPage() {
  return <AuthGateway initialMode="signin" />;
}
