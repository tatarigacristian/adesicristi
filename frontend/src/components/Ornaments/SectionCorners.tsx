import CornerOrnament from "./CornerOrnament";

export default function SectionCorners({
  size = "w-[40px] h-[40px]",
  offset = 6,
}: {
  size?: string;
  offset?: number;
}) {
  const base = `absolute ${size} text-button/80`;
  const px = `${offset}px`;
  return (
    <>
      <div className={base} style={{ top: px, left: px }}>
        <CornerOrnament className="w-full h-full text-current" />
      </div>
      <div className={`${base} -scale-x-100`} style={{ top: px, right: px }}>
        <CornerOrnament className="w-full h-full text-current" />
      </div>
      <div className={`${base} -scale-y-100`} style={{ bottom: px, left: px }}>
        <CornerOrnament className="w-full h-full text-current" />
      </div>
      <div className={`${base} -scale-100`} style={{ bottom: px, right: px }}>
        <CornerOrnament className="w-full h-full text-current" />
      </div>
    </>
  );
}
