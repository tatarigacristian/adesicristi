export default function CornerOrnament({
  className = "w-[45px] h-[45px] text-button",
}: {
  className?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2 L2 30 Q5 18, 14 12 Q20 7, 30 5 Q38 3, 42 2 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 2 Q9 14, 18 20 Q24 26, 36 30" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M2 8 Q12 12, 16 18 Q20 24, 28 28" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
      <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.8" />
    </svg>
  );
}
