// Renders a job description (plain text from a textarea) with the structure
// people type into it: blank lines separate paragraphs, and lines starting
// with "-", "*", "•" or "1." become lists. Plain text only — nothing is
// interpreted as HTML — so it's safe for employer-supplied content.
const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

type Block =
  { type: "p"; text: string } | { type: "ul" | "ol"; items: string[] };

function parse(text: string): Block[] {
  const blocks: Block[] = [];
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n{2,}/);

  for (const paragraph of paragraphs) {
    let textLines: string[] = [];
    let list: { type: "ul" | "ol"; items: string[] } | null = null;

    const flushText = () => {
      if (textLines.length)
        blocks.push({ type: "p", text: textLines.join("\n") });
      textLines = [];
    };
    const flushList = () => {
      if (list) blocks.push(list);
      list = null;
    };

    for (const line of paragraph.split("\n")) {
      const kind = BULLET.test(line) ? "ul" : NUMBERED.test(line) ? "ol" : null;
      if (kind) {
        flushText();
        if (list && list.type !== kind) flushList();
        list ??= { type: kind, items: [] };
        list.items.push(line.replace(kind === "ul" ? BULLET : NUMBERED, ""));
      } else {
        flushList();
        textLines.push(line);
      }
    }
    flushText();
    flushList();
  }
  return blocks;
}

export function JobDescription({ text }: { text: string }) {
  const blocks = parse(text);

  return (
    <div
      className="space-y-4 text-[15px] leading-relaxed wrap-anywhere"
      style={{ color: "var(--color-text)" }}
    >
      {blocks.map((block, i) =>
        block.type === "p" ? (
          <p key={i} className="whitespace-pre-line">
            {block.text}
          </p>
        ) : block.type === "ul" ? (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ) : (
          <ol key={i} className="list-decimal space-y-1 pl-5">
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}
