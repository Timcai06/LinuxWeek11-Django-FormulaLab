const DECODE_LINES = [
  { label: "LaTeX candidate", value: String.raw`\int_\Omega \nabla u \cdot \nabla v\,dx` },
  { label: "Structure", value: "integral -> gradient -> bilinear form" },
  { label: "Confidence", value: "0.94" },
];

export function DecodeChamberOverlay() {
  return (
    <aside className="decode-chamber cinematic-overlay" aria-label="Formula decode chamber">
      <span className="cinematic-kicker">Decode Chamber</span>
      <div className="decode-chamber-core">
        {DECODE_LINES.map((line) => (
          <div className="decode-chamber-row" key={line.label}>
            <span>{line.label}</span>
            <code>{line.value}</code>
          </div>
        ))}
      </div>
      <p className="decode-chamber-note">Candidate repair ready for review inbox.</p>
    </aside>
  );
}
