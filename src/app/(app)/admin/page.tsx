import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage() {
    const session = await auth();
    if (!session?.user?.admin) redirect('/login');

    return <AdminDashboardClient />;
}
