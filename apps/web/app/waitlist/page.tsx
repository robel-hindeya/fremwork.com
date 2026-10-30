import type { Metadata } from 'next';
import { WaitlistScreen } from '@/components/screens/WaitlistScreen';

export const metadata: Metadata = { title: 'Join the waitlist' };

export default function WaitlistPage() {
  return <WaitlistScreen />;
}
