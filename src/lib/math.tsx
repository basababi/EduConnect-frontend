"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

function render(latex: string, display: boolean): string {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode: display,
      throwOnError: false,
      output: "html",
    });
  } catch {
    return latex;
  }
}

/**
 * Текст доторх LaTeX-ийг ($...$ инлайн, $$...$$ / \[...\] блок,
 * \(...\) инлайн) KaTeX-ээр рендэрлэнэ. Бусад хэсгийг энгийн текстээр.
 */
export function MathText({
  text,
  className,
}: {
  text?: string | null;
  className?: string;
}) {
  if (!text) return null;

  // Стандарт хязгаарлагчдыг $ хэлбэрт нэгтгэнэ
  const normalized = text
    .replace(/\\\[/g, "$$$$")
    .replace(/\\\]/g, "$$$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$");

  const parts = normalized.split(/(\$\$[^$]*\$\$|\$[^$]+\$)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
          return (
            <span
              key={i}
              className="my-1 block overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: render(part.slice(2, -2), true) }}
            />
          );
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: render(part.slice(1, -1), false) }}
            />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
