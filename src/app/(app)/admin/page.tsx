import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isTab } from '@/components/admin/tabs';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
    const session = await auth();
    if (!session?.user?.admin) redirect('/login');

    const { tab } = await searchParams;
    const initialTab = isTab(tab) ? tab : 'overview';
    // Keyed so a link to another tab (not the sidebar, which changes tab in place) shows it
    return <AdminDashboardClient key={initialTab} initialTab={initialTab} />;
}
