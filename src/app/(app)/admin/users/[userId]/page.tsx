import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import UserDetailClient from './UserDetailClient';

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
    const session = await auth();
    if (!session?.user?.admin) redirect('/login');

    const { userId } = await params;
    return <UserDetailClient userId={userId} />;
}
