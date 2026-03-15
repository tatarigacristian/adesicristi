export default function SmallFlourish({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 12"
      style={{ width: 200, height: 12 }}
      className={`text-button ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="0" y1="6" x2="70" y2="6" stroke="currentColor" strokeWidth="0.9" />
      <line x1="130" y1="6" x2="200" y2="6" stroke="currentColor" strokeWidth="0.9" />
      <path d="M80 6 Q90 0, 100 6 Q110 12, 120 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="100" cy="6" r="2.2" fill="currentColor" />
    </svg>
  );
}
