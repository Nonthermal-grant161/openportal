import { cn } from "@/lib/utils";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

function makeResolve(baseUrl: string) {
	return (url: string | undefined): string | undefined => {
		if (!url) return url;
		if (/^(https?:|mailto:|tel:|#|data:)/i.test(url)) return url;
		try {
			return new URL(url, baseUrl).href;
		} catch {
			return url;
		}
	};
}

export function MarkdownRenderer({
	markdown,
	baseUrl,
}: {
	markdown: string;
	baseUrl: string;
}) {
	const resolve = makeResolve(baseUrl);

	const components: Components = {
		h1: ({ node, ...p }) => (
			<h2 className="mb-3 mt-6 text-xl font-bold" {...p} />
		),
		h2: ({ node, ...p }) => (
			<h3
				className="mb-2 mt-6 border-b border-border pb-1 text-lg font-semibold"
				{...p}
			/>
		),
		h3: ({ node, ...p }) => (
			<h4 className="mb-2 mt-4 text-base font-semibold" {...p} />
		),
		p: ({ node, ...p }) => (
			<p className="my-3 text-sm leading-relaxed text-foreground" {...p} />
		),
		a: ({ node, ...p }) => (
			<a
				className="font-medium underline underline-offset-2 hover:opacity-80"
				target="_blank"
				rel="noreferrer"
				{...p}
			/>
		),
		ul: ({ node, ...p }) => (
			<ul className="my-3 ml-5 list-disc space-y-1 text-sm" {...p} />
		),
		ol: ({ node, ...p }) => (
			<ol className="my-3 ml-5 list-decimal space-y-1 text-sm" {...p} />
		),
		li: ({ node, ...p }) => <li className="text-foreground" {...p} />,
		code: ({ node, className, ...p }) => (
			<code
				className={cn(
					"rounded bg-secondary px-1 py-0.5 font-mono text-[0.85em]",
					className,
				)}
				{...p}
			/>
		),
		pre: ({ node, ...p }) => (
			<pre
				className="my-3 overflow-x-auto rounded-lg bg-secondary p-3 text-xs [&>code]:bg-transparent [&>code]:p-0"
				{...p}
			/>
		),
		blockquote: ({ node, ...p }) => (
			<blockquote
				className="my-3 border-l-2 border-border pl-3 text-muted-foreground"
				{...p}
			/>
		),
		img: ({ node, src, alt, ...p }) => (
			<img
				className="my-3 inline-block max-w-full rounded-lg"
				src={resolve(typeof src === "string" ? src : undefined)}
				{...p}
				alt={alt ?? ""}
			/>
		),
		table: ({ node, ...p }) => (
			<div className="my-3 overflow-x-auto">
				<table className="w-full border-collapse text-sm" {...p} />
			</div>
		),
		th: ({ node, ...p }) => (
			<th
				className="border border-border bg-secondary px-3 py-1.5 text-left font-semibold"
				{...p}
			/>
		),
		td: ({ node, ...p }) => (
			<td className="border border-border px-3 py-1.5" {...p} />
		),
		hr: () => <hr className="my-6 border-border" />,
	};

	return (
		<div className="break-words">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeRaw, rehypeSanitize]}
				urlTransform={(url) => resolve(url) ?? ""}
				components={components}
			>
				{markdown}
			</ReactMarkdown>
		</div>
	);
}
