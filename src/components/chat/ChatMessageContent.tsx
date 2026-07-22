import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatMessageContent({ content }: { content: string }) {
  return (
    <div className="min-w-0 overflow-hidden text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-2 text-base font-black">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 text-sm font-black">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1.5 text-sm font-bold">{children}</h3>,
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-black text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-primary/40 pl-3 text-muted-foreground last:mb-0">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
            >
              {children}
            </a>
          ),
          pre: ({ children }) => (
            <pre className="mb-3 max-w-full overflow-x-auto rounded-md bg-background/80 p-3 text-xs last:mb-0">
              {children}
            </pre>
          ),
          code: ({ children, className }) => (
            <code
              className={
                className
                  ? `${className} font-mono text-xs`
                  : 'rounded bg-background/80 px-1.5 py-0.5 font-mono text-xs'
              }
            >
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="mb-3 max-w-full overflow-x-auto last:mb-0">
              <table className="w-full min-w-max border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border bg-background/60 px-2 py-1.5 font-black">{children}</th>,
          td: ({ children }) => <td className="border border-border px-2 py-1.5 align-top">{children}</td>,
          hr: () => <hr className="my-3 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
