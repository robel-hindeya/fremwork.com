import type { Metadata } from 'next';
import { WaitlistScreen } from '@/components/screens/WaitlistScreen';

export const metadata: Metadata = {
  title: 'Join the Waitlist',
  description:
    'Reserve your early access to Fremwork. The AI finance team in one chat: Analyst, Accountant, Controller, and automated insights.',
  openGraph: {
    title: 'Join the Waitlist · Fremwork',
    description:
      'Reserve your early access to Fremwork. The AI finance team in one chat: Analyst, Accountant, Controller, and automated insights.',
    url: 'https://www.fremwork.com/waitlist',
  },
};

export default function WaitlistPage() {
  return <WaitlistScreen />;
}
