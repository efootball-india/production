import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentPlayer } from '@/lib/player';
import { createTournament } from '../../../actions/tournaments';
import { FORMAT_LABELS, type TournamentFormat } from '@/lib/tournaments';

export default async function NewTournamentPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');
  if (player.role !== 'admin' && player.role !== 'super_admin') {
    redirect('/tournaments');
  }

  const formats: TournamentFormat[] = ['groups_knockout', 'single_elimination', 'round_robin'];

  return (
    <main className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <Link href="/tournaments" style={{ color: 'var(--text-2)', fontSize: 13 }}>Tournaments</Link>
        <div className="auth-eyebrow">Admin</div>
        <h1 className="auth-h1">New tournament</h1>

        {searchParams.error && (
          <div className="auth-error">{searchParams.error}</div>
        )}

        <form action={createTournament} className="auth-form">
          <div className="auth-field">
            <label htmlFor="name" className="auth-label">Name</label>
            <input id="name" name="name" type="text" required minLength={3} maxLength={80} className="auth-input" placeholder="Summer Cup S4" />
          </div>

          <div className="auth-field">
            <label htmlFor="slug" className="auth-label">URL slug (optional)</label>
            <input id="slug" name="slug" type="text" maxLength={64} className="auth-input" placeholder="auto-generated from name" />
          </div>

          <div className="auth-field">
            <label htmlFor="description" className="auth-label">Description (optional)</label>
            <textarea id="description" name="description" rows={3} maxLength={500} className="auth-input" />
          </div>

          <div className="auth-field">
            <label htmlFor="format" className="auth-label">Format</label>
            <select id="format" name="format" required className="auth-input" defaultValue="groups_knockout">
              {formats.map(f => (
                <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="max_participants" className="auth-label">Max players</label>
            <input id="max_participants" name="max_participants" type="number" min={2} max={256} defaultValue={48} className="auth-input" />
          </div>

          <div className="auth-field">
            <label htmlFor="registration_closes_at" className="auth-label">Registration closes (optional)</label>
            <input id="registration_closes_at" name="registration_closes_at" type="datetime-local" className="auth-input" />
          </div>

          <div className="auth-field">
            <label htmlFor="starts_at" className="auth-label">Tournament starts (optional)</label>
            <input id="starts_at" name="starts_at" type="datetime-local" className="auth-input" />
          </div>

          <button type="submit" className="auth-button">Create tournament</button>
        </form>
      </div>
    </main>
  );
}
