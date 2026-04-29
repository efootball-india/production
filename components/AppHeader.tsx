// PASS-28-APP-HEADER
import { getCurrentPlayer } from '@/lib/player';
import { getActiveTournamentSlug } from '@/lib/match';
import AppHeaderClient from './AppHeaderClient';
import BottomNav from './BottomNav';

export default async function AppHeader() {
  const player = await getCurrentPlayer();
  const isAdmin = player?.role === 'admin' || player?.role === 'super_admin';
  const isLoggedIn = !!player;
  const username = player?.username ?? null;
  const displayName = player?.display_name ?? null;
  const activeSlug = player ? await getActiveTournamentSlug(player.id) : null;

  return (
    <>
      <AppHeaderClient
        username={username}
        displayName={displayName}
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
      />
      {isLoggedIn && <BottomNav activeSlug={activeSlug} />}
    </>
  );
}
