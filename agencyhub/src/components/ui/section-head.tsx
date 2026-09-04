export function SectionHead({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) {
  return (
    <div className="ah-section-head">
      <h2 className="ah-section-title">{title}</h2>
      {meta && <span className="ah-section-meta">{meta}</span>}
    </div>
  );
}
