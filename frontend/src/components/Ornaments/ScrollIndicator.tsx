export default function ScrollIndicator({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        className="text-button/60"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Mouse outline */}
        <rect
          x="1.5"
          y="1.5"
          width="21"
          height="33"
          rx="10.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {/* Scroll dot */}
        <circle
          cx="12"
          cy="11"
          r="2"
          fill="currentColor"
          className="scroll-indicator-dot"
        />
      </svg>
      <span className="text-[0.45rem] tracking-[0.2em] uppercase text-button/40">scroll</span>
    </div>
  );
}
