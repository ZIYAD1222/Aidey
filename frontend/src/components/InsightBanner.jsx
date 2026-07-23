export default function InsightBanner({ text }) {
  if (!text) return null;

  return (
    <div
      style={{
        background: 'var(--accent-bg)',
        border: '0.5px solid var(--accent-border)',
        borderRadius: 'var(--radius)',
        padding: '10px 14px',
        marginBottom: 20,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ color: 'var(--accent)', fontSize: 15, lineHeight: 1.4 }}>✦</span>
      <p style={{ color: 'var(--accent-strong)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
        {text}
      </p>
    </div>
  );
}
