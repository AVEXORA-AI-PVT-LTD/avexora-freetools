import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type HeadingRendererProps = ComponentPropsWithoutRef<"h1"> & { level: HeadingLevel };


const generateSlug = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

const HeadingRenderer = ({ level, children, ...props }: HeadingRendererProps) => {
  const text = Array.isArray(children) ? children.map((c: ReactNode) => typeof c === 'string' ? c : '').join('') : (typeof children === 'string' ? children : '');
  const slug = generateSlug(text);
  const Tag = `h${level}` as `h${HeadingLevel}`;
  return <Tag id={slug} {...props}>{children}</Tag>;
};

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none prose-a:text-orange-600 hover:prose-a:text-orange-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Custom renderers if needed
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
