import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";


const generateSlug = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

const HeadingRenderer = ({ level, children, ...props }: any) => {
  const text = Array.isArray(children) ? children.map((c: any) => typeof c === 'string' ? c : '').join('') : (typeof children === 'string' ? children : '');
  const slug = generateSlug(text);
  const Tag = `h${level}` as any;
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
