import { Eyebrow } from "./eyebrow";

interface PageHeadProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHead({ eyebrow, title, subtitle, actions }: PageHeadProps) {
  return (
    <div className="ah-page-head">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="ah-page-title">{title}</h1>
        {subtitle && <p className="ah-page-sub">{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
    </div>
  );
}

export function ThinAccent({ children }: { children: React.ReactNode }) {
  return <span className="cm-thin">{children}</span>;
}

export function DotAccent() {
  return <span className="cm-dot" />;
}
