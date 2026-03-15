export default function Flourish({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const widths = { sm: 220, md: 280, lg: 340 };
  const w = widths[size];

  return (
    <svg
      viewBox="0 0 400 24"
      style={{ width: w, height: w * 0.07 }}
      className={`text-button ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="0" y1="12" x2="140" y2="12" stroke="currentColor" strokeWidth="1.2" />
      <line x1="260" y1="12" x2="400" y2="12" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M160 12 Q170 4, 180 8 Q188 11, 196 6 L200 4 L204 6 Q212 11, 220 8 Q230 4, 240 12 Q230 20, 220 16 Q212 13, 204 18 L200 20 L196 18 Q188 13, 180 16 Q170 20, 160 12Z"
        fill="none" stroke="currentColor" strokeWidth="1.4"
      />
      <path d="M196 12 L200 8 L204 12 L200 16Z" fill="currentColor" />
    </svg>
  );
}
