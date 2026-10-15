export function Balloon({
  color,
  size = 72
}: {
  color: string;
  size?: number;
}) {
  const w = size;
  const h = size * 1.2;
  return (
    <svg width={w} height={h} viewBox="0 0 60 72" style={{ display: "block" }}>
      <ellipse cx="30" cy="26" rx="22" ry="26" fill={color} stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
      <ellipse cx="22" cy="16" rx="6" ry="9" fill="rgba(255,255,255,0.35)" />
      <polygon points="30,52 26,58 34,58" fill={color} stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
      <path d="M30,58 Q26,64 30,70 Q34,64 30,58" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
    </svg>
  );
}