export default function AideyLogo({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Aidey"
    >
      <circle cx="20" cy="20" r="20" fill="var(--accent-bg)" />
      <path
        d="M20 9C14 9 10 13.5 10 19c0 3.6 1.9 6.2 4.6 7.8-.2 1.3-.8 2.6-1.8 3.7 2-.2 3.9-1 5.4-2.2.6.1 1.2.1 1.8.1 6 0 10-4.5 10-10S26 9 20 9z"
        fill="var(--accent)"
      />
      <circle cx="16.5" cy="19" r="1.6" fill="var(--accent-bg)" />
      <circle cx="23.5" cy="19" r="1.6" fill="var(--accent-bg)" />
    </svg>
  );
}
