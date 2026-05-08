import type { Metadata } from 'next';
import AllTimeXIBuilder from '../../components/AllTimeXIBuilder';

export const metadata: Metadata = {
  title: 'Build your all-time XI · eFTBL',
  description: 'Pick the squad that wins everything. Eleven slots, one formation, your call.',
};

export default function AllTimeXIPage() {
  return (
    <main className="bg-bg text-ink min-h-screen">
      <AllTimeXIBuilder />
    </main>
  );
}
