import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminDashboardClient from './AdminDashboardClient';
import { ToastProvider } from '@/components/ui';
import Nav from '@/components/layout/Nav';

export default async function AdminPage() {
    const session = await auth();
    if (!session?.user?.admin) redirect('/login');

    return (
        <ToastProvider>
            <Nav />
            <AdminDashboardClient />
        </ToastProvider>
    );
}
