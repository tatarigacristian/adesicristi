import { MouseScroll, ArrowsDownUp } from "@phosphor-icons/react";

export default function ScrollIndicator({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      {/* Desktop: mouse with scroll animation */}
      <div className="hidden sm:flex flex-col items-center gap-1.5">
        <MouseScroll size={30} weight="duotone" className="text-button/60 animate-scroll-mouse" />
        <span className="text-[0.45rem] tracking-[0.2em] uppercase text-button/40">scroll</span>
      </div>
      {/* Mobile: hand swipe with vertical animation */}
      <div className="flex sm:hidden flex-col items-center gap-1.5">
        <ArrowsDownUp size={28} weight="duotone" className="text-button/60 animate-swipe-hand" />
        <span className="text-[0.45rem] tracking-[0.2em] uppercase text-button/40">swipe</span>
      </div>
    </div>
  );
}
