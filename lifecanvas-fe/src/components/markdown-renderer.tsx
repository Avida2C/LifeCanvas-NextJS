"use client";

import type { CSSProperties, ReactNode } from "react";
import { useTheme } from "@/components/providers/theme-provider";

function parseInlineFormatting(
  text: string,
  keyBase: number,
  textColor: string,
): ReactNode[] {
  const parts: ReactNode[] = [];
  let currentIndex = 0;
  let partKey = 0;
  const combinedRegex = /\*\*(.*?)\*\*|__(.*?)__|\*(.*?)\*/g;
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      const beforeText = text.substring(currentIndex, match.index);
      if (beforeText) {
        parts.push(
          <span key={`${keyBase}-t-${partKey++}`} style={{ color: textColor }}>
            {beforeText}
          </span>,
        );
      }
    }
    const [, bold, underline, italic] = match;
    if (bold !== undefined) {
      parts.push(
        <strong key={`${keyBase}-b-${partKey++}`}>{bold}</strong>,
      );
    } else if (underline !== undefined) {
      parts.push(
        <span key={`${keyBase}-u-${partKey++}`} className="underline">
          {underline}
        </span>,
      );
    } else if (italic !== undefined) {
      parts.push(
        <em key={`${keyBase}-i-${partKey++}`}>{italic}</em>,
      );
    }
    currentIndex = match.index + match[0].length;
  }
  if (currentIndex < text.length) {
    const remaining = text.substring(currentIndex);
    if (remaining) {
      parts.push(
        <span key={`${keyBase}-e-${partKey++}`} style={{ color: textColor }}>
          {remaining}
        </span>,
      );
    }
  }
  return parts.length > 0 ? parts : [<span key={`${keyBase}-x`}>{text}</span>];
}

export function MarkdownRenderer({
  content,
  imageSources,
  className,
  style,
}: {
  content: string;
  /** Data URLs (or https) for placeholders `![alt](lcimg:0)` in content. */
  imageSources?: string[];
  className?: string;
  style?: CSSProperties;
}) {
  const { theme } = useTheme();
  if (!content) return null;

  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let key = 0;

  lines.forEach((line) => {
    if (line.trim() === "") {
      blocks.push(<div key={key++} className="h-4" />);
      return;
    }

    const trimmed = line.trim();
    const lcImg = trimmed.match(/^!\[([^\]]*)\]\(lcimg:(\d+)\)\s*$/);
    if (lcImg) {
      const altText = lcImg[1];
      const idx = Number.parseInt(lcImg[2], 10);
      const src = imageSources?.[idx];
      if (src) {
        blocks.push(
          <figure key={key++} className="my-2 flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={altText || "Image"}
              className="max-h-[min(420px,70vh)] w-full max-w-full rounded-lg border-2 object-contain"
              style={{ borderColor: theme.border }}
            />
            {altText ? (
              <figcaption
                className="mt-1 text-center text-xs italic"
                style={{ color: theme.textSecondary }}
              >
                {altText}
              </figcaption>
            ) : null}
          </figure>,
        );
      } else {
        blocks.push(
          <p
            key={key++}
            className="mb-1 text-sm italic"
            style={{ color: theme.textSecondary }}
          >
            [Image unavailable]
          </p>,
        );
      }
      return;
    }
    if (line.startsWith("# ")) {
      blocks.push(
        <h2
          key={key++}
          className="mb-3 mt-4 text-2xl font-bold"
          style={{ color: theme.text }}
        >
          {parseInlineFormatting(line.slice(2), key, theme.text)}
        </h2>,
      );
      return;
    }
    if (line.startsWith("### ")) {
      blocks.push(
        <h3
          key={key++}
          className="mb-2 mt-3 text-lg font-bold"
          style={{ color: theme.text }}
        >
          {parseInlineFormatting(line.slice(4), key, theme.text)}
        </h3>,
      );
      return;
    }
    if (line.startsWith("• ") || line.startsWith("- ")) {
      blocks.push(
        <p
          key={key++}
          className="mb-1 ml-4 text-base leading-relaxed"
          style={{ color: theme.text }}
        >
          {parseInlineFormatting(line, key, theme.text)}
        </p>,
      );
      return;
    }
    if (/^\d+\.\s/.test(line)) {
      blocks.push(
        <p
          key={key++}
          className="mb-1 ml-4 text-base leading-relaxed"
          style={{ color: theme.text }}
        >
          {parseInlineFormatting(line, key, theme.text)}
        </p>,
      );
      return;
    }
    /** Legacy / fallback: `![alt](url)` where url may contain `)` (e.g. SVG data URLs). */
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\((.+)\)\s*$/);
    if (imageMatch) {
      const [, altText, imageUrl] = imageMatch;
      blocks.push(
        <figure key={key++} className="my-2 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={altText || "Image"}
            className="max-h-[min(420px,70vh)] w-full max-w-full rounded-lg border-2 object-contain"
            style={{ borderColor: theme.border }}
          />
          {altText ? (
            <figcaption
              className="mt-1 text-center text-xs italic"
              style={{ color: theme.textSecondary }}
            >
              {altText}
            </figcaption>
          ) : null}
        </figure>,
      );
      return;
    }
    blocks.push(
      <p
        key={key++}
        className="mb-1 text-base leading-relaxed"
        style={{ color: theme.text }}
      >
        {parseInlineFormatting(line, key, theme.text)}
      </p>,
    );
  });

  return (
    <div className={className} style={style}>
      {blocks}
    </div>
  );
}
