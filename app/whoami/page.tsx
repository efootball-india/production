import { createClient } from '@/lib/supabase/server';

export default async function WhoAmIPage() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  let playerRow: any = null;
  let playerError: any = null;
  if (user) {
    const result = await supabase
      .from('players')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    playerRow = result.data;
    playerError = result.error;
  }

  return (
    <main style={{ padding: 32, fontFamily: 'monospace', fontSize: 13, color: '#fff', background: '#000', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 18, marginBottom: 16 }}>whoami debug</h1>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, color: '#0f8' }}>auth.getUser():</h2>
        <pre style={{ background: '#111', padding: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{JSON.stringify({ id: user?.id, email: user?.email, error: authError?.message }, null, 2)}</pre>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, color: '#0f8' }}>players row for that id:</h2>
        <pre style={{ background: '#111', padding: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{JSON.stringify({ row: playerRow, error: playerError?.message }, null, 2)}</pre>
      </div>
      <div>
        <h2 style={{ fontSize: 14, color: '#0f8' }}>role check:</h2>
        <pre style={{ background: '#111', padding: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{JSON.stringify({
  role: playerRow?.role,
  is_admin: playerRow?.role === 'admin',
  is_super: playerRow?.role === 'super_admin',
  would_redirect: !playerRow || (playerRow.role !== 'admin' && playerRow.role !== 'super_admin'),
}, null, 2)}</pre>
      </div>
    </main>
  );
}
