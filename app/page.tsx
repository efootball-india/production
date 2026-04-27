export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#050a08',
        color: '#e8f5ee',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          background:
            'radial-gradient(circle, rgba(0,255,136,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-100px',
          width: '300px',
          height: '300px',
          background:
            'radial-gradient(circle, rgba(0,255,136,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ textAlign: 'center', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            fontSize: 'clamp(48px, 12vw, 72px)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            margin: '0 0 16px',
            lineHeight: 0.95,
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              color: '#00ff88',
              textShadow: '0 0 32px rgba(0,255,136,0.6)',
            }}
          >
            e
          </span>
          FTBL
        </h1>
        <p
          style={{
            fontSize: 16,
            color: 'rgba(232,245,238,0.7)',
            margin: '0 0 8px',
            lineHeight: 1.5,
          }}
        >
          A tournament platform for the eFootball 1v1 community.
        </p>
        <p
          style={{
            fontSize: 12,
            color: 'rgba(232,245,238,0.4)',
            margin: '0 0 32px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: 'ui-monospace, SF Mono, monospace',
          }}
        >
          We&apos;re building this in public · v0.1
        </p>

        <a
          href="/prototype.html"
          style={{
            display: 'inline-block',
            background: '#00ff88',
            color: '#001a0d',
            padding: '14px 28px',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            boxShadow:
              '0 0 32px rgba(0,255,136,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          ▸ View design preview
        </a>

        <p
          style={{
            marginTop: 56,
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: 10,
            color: 'rgba(232,245,238,0.35)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: 'ui-monospace, SF Mono, monospace',
          }}
        >
          Coming soon · Tournaments · Live brackets · Rankings
        </p>
      </div>
    </main>
  );
}
