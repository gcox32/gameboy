'use client';

import { useRouter } from 'next/navigation';
import { navigateWithTransition } from '@/lib/transition';

interface HomeLinkProps {
  children: React.ReactNode;
  className?: string;
}

export default function HomeLink({ children, className }: HomeLinkProps) {
  const router = useRouter();

  return (
    <button
      className={className}
      onClick={() => navigateWithTransition(router.push, '/', 'down')}
    >
      {children}
    </button>
  );
}
