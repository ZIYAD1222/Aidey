const ICONS = {
  work: (
    <path d="M4 7h16v11a1 1 0 01-1 1H5a1 1 0 01-1-1V7zm4-3h8a1 1 0 011 1v2H7V5a1 1 0 011-1z" />
  ),
  health: (
    <path d="M12 21s-7.5-4.6-10-9.1C.6 8.4 2.3 5 5.7 5c2 0 3.4 1.1 4.3 2.4C10.9 6.1 12.3 5 14.3 5c3.4 0 5.1 3.4 3.7 6.9C19.5 16.4 12 21 12 21z" />
  ),
  sports: (
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2c1.2 0 2.3.3 3.3.8L12 8.5 8.7 4.8C9.7 4.3 10.8 4 12 4zm-5.7 2.2L9.7 10 5.2 12.2A8 8 0 016.3 6.2zM4.2 14l5.1-2.5 2.7 4L9.3 20A8 8 0 014.2 14zm7.8 6l-2.3-4.5L12 13l2.3 2.5L12 20zm2.7-.8l2.7-4L19.8 14a8 8 0 01-5.1 5.2zM18.8 12.2L14.3 10l2.7-3.8a8 8 0 011.8 6z" />
  ),
  shopping: (
    <path d="M6 8V6a6 6 0 1112 0v2h2l-1 13H5L4 8h2zm2 0h8V6a4 4 0 10-8 0v2z" />
  ),
  personal: (
    <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4 0-8 2-8 5v2h16v-2c0-3-4-5-8-5z" />
  ),
};

export default function CategoryIcon({ category, size = 18 }) {
  return (
    <svg
      className="category-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="var(--cat)"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {ICONS[category] || ICONS.personal}
    </svg>
  );
}
