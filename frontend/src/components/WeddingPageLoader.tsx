/** Loader cu blur până se încarcă wedding-settings (și, pe [slug], invitatul). */
export default function WeddingPageLoader() {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: "rgba(253, 248, 247, 0.55)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="text-center max-w-sm">
        <p className="script-font text-3xl sm:text-4xl text-[#2c2622] mb-8 tracking-wide opacity-90">
          Ade &amp; Cristi
        </p>
        <div className="flex justify-center items-center gap-2 mb-5" aria-hidden>
          <span className="w-2 h-2 rounded-full bg-[#7f9f84] wedding-loader-dot" />
          <span className="w-2 h-2 rounded-full bg-[#7f9f84] wedding-loader-dot" />
          <span className="w-2 h-2 rounded-full bg-[#7f9f84] wedding-loader-dot" />
        </div>
        <p className="text-[0.65rem] text-[#6b6560] tracking-[0.35em] uppercase font-medium">
          Se încarcă
        </p>
      </div>
    </div>
  );
}
