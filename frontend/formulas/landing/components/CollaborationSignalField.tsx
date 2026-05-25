const SIGNALS = [
  { className: "collaboration-signal-comment", label: "Comment", value: "Check symbol domain" },
  { className: "collaboration-signal-accept", label: "Accept change", value: "Replace handwritten fraction" },
  { className: "collaboration-signal-cursor", label: "cursor", value: "Ada reviewing line 42" },
];

export function CollaborationSignalField() {
  return (
    <aside className="collaboration-signal-field cinematic-overlay" aria-label="Collaboration signals">
      {SIGNALS.map((signal) => (
        <div className={`collaboration-signal ${signal.className}`} key={signal.label}>
          <span>{signal.label}</span>
          <strong>{signal.value}</strong>
        </div>
      ))}
    </aside>
  );
}
