// The one inline error treatment (used under action buttons and in place of
// a list). role="alert" so screen readers announce it when it appears.
export function InlineError({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`rounded-md border px-4 py-3 text-sm ${className}`}
      style={{
        borderColor: "var(--color-danger)",
        color: "var(--color-danger)",
      }}
    >
      {children}
    </div>
  );
}
