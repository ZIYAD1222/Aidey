import AideyLogo from './AideyLogo';
import PrefsToggle from './PrefsToggle';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <PrefsToggle />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <AideyLogo size={36} />
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>Aidey</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px' }}>{title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 24px' }}>
          {subtitle}
        </p>
        {children}
        {footer && <div style={{ marginTop: 20, fontSize: 13.5 }}>{footer}</div>}
      </div>
    </div>
  );
}
