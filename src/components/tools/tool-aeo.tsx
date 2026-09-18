import type { ToolConfig } from "@/types/tools";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700">
        {children}
      </div>
    </section>
  );
}

export function ToolAeoBlocks({ tool }: { tool: ToolConfig }) {
  const { formula, example, steps } = tool;
  return (
    <>
      {formula && (
        <Section title="Formula">
          <p>
            <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[14px] text-slate-800">
              {formula}
            </code>
          </p>
        </Section>
      )}
      {example && <Section title="Example">{example.split("\n").map((line, i) => <p key={i}>{line}</p>)}</Section>}
      {steps && steps.length > 0 && (
        <Section title="How it works">
          <ol className="list-decimal space-y-2 pl-5">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Section>
      )}
    </>
  );
}