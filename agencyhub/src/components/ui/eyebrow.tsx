interface EyebrowProps {
  children: React.ReactNode;
}

export function Eyebrow({ children }: EyebrowProps) {
  return (
    <div className="ah-eyebrow">
      <span className="ah-eyebrow-line" />
      {children}
    </div>
  );
}
