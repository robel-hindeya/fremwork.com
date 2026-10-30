import type { Metadata } from 'next';
import { AdminScreen } from '@/components/screens/AdminScreen';

export const metadata: Metadata = { title: 'Admin', robots: { index: false } };

// The middleware sends signed-out visitors to /login; the API checks the admin role.
export default function AdminPage() {
  return <AdminScreen />;
}
