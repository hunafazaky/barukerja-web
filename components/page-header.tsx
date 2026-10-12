// The one page-title treatment for every page in the app shell, so a
// heading looks the same whether you're browsing jobs or managing them.
// (Public pages used a big display heading while the dashboard pages used
// a small toolbar-style title; that was one of the visible seams.)
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-4xl leading-[1.05] font-black tracking-tight md:text-5xl">
          {title}
        </h1>
        {description && (
          <p
            className="mt-2 text-lg italic"
            style={{ color: "var(--color-text-muted)" }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
