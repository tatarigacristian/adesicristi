export default function ScrollIndicator({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width="20"
        height="28"
        viewBox="0 0 20 28"
        fill="none"
        className="text-button/40"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Mouse outline */}
        <rect
          x="1"
          y="1"
          width="18"
          height="26"
          rx="9"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        {/* Scroll wheel line */}
        <line
          x1="10"
          y1="7"
          x2="10"
          y2="12"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="scroll-indicator-line"
        />
      </svg>
    </div>
  );
}
