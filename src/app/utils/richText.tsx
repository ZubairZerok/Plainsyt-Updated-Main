import React from 'react';
import { Num } from '../components/Primitives';

export function parseInlineFormatting(text: string): React.ReactNode[] {
  // Tokenize regex for **bold**, *italic*, <u>underline</u>, <mark>highlight</mark>, ==highlight==
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|<u>.*?<\/u>|<mark>.*?<\/mark>|==.*?==)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return <strong key={idx} className="font-bold text-slate-900 dark:text-white">{parseInlineFormatting(inner)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      const inner = part.slice(1, -1);
      return <em key={idx} className="italic text-slate-800 dark:text-slate-200">{parseInlineFormatting(inner)}</em>;
    }
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      const inner = part.slice(3, -4);
      return <span key={idx} className="underline decoration-emerald-500 underline-offset-4 font-medium text-slate-900 dark:text-white">{parseInlineFormatting(inner)}</span>;
    }
    if ((part.startsWith('<mark>') && part.endsWith('</mark>')) || (part.startsWith('==') && part.endsWith('=='))) {
      const inner = part.startsWith('<mark>') ? part.slice(6, -7) : part.slice(2, -2);
      return (
        <mark key={idx} className="bg-amber-200/90 dark:bg-emerald-950/80 text-amber-950 dark:text-[#03EF62] px-1.5 py-0.5 rounded font-semibold border-b border-amber-400 dark:border-[#03EF62]/40">
          {parseInlineFormatting(inner)}
        </mark>
      );
    }

    // Hind Siliguri Bold 700 rule: Ensure all numbers are rendered wrapped in Num or bold
    const numRegex = /([০-৯0-9]+(?:\.[০-৯0-9]+)?)/g;
    const subParts = part.split(numRegex);
    if (subParts.length > 1) {
      return (
        <React.Fragment key={idx}>
          {subParts.map((sp, sIdx) => {
            if (numRegex.test(sp)) {
              return <Num key={sIdx} className="font-bold">{sp}</Num>;
            }
            return sp;
          })}
        </React.Fragment>
      );
    }

    return part;
  });
}

export function RichArticleParagraph({ text, isFirst }: { text: string; isFirst?: boolean }) {
  const trimmed = text.trim();

  // Headings: ## Title
  if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
    const headingText = trimmed.replace(/^#{2,3}\s+/, '');
    return (
      <h3 className="font-sans text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-6 mb-3 border-b border-slate-100 dark:border-white/10 pb-2">
        {parseInlineFormatting(headingText)}
      </h3>
    );
  }

  // Blockquotes: > Quote
  if (trimmed.startsWith('> ') || trimmed.startsWith('» ')) {
    const quoteText = trimmed.replace(/^[>»]\s+/, '');
    return (
      <blockquote className="border-l-4 border-emerald-600 bg-emerald-50/40 dark:bg-white/5 pl-4 py-2 italic text-slate-800 dark:text-slate-200 rounded-r-xl my-4 font-bangla text-base">
        {parseInlineFormatting(quoteText)}
      </blockquote>
    );
  }

  // Bullet list: • Item or - Item
  if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
    const itemText = trimmed.replace(/^[•-]\s+/, '');
    return (
      <li className="ml-5 list-disc font-bangla text-[17px] leading-[1.85] text-slate-800 dark:text-slate-100 my-1">
        {parseInlineFormatting(itemText)}
      </li>
    );
  }

  return (
    <p
      className={
        isFirst
          ? 'first-letter:float-left first-letter:mr-2.5 first-letter:font-display first-letter:text-[50px] first-letter:font-bold first-letter:leading-[0.88] first-letter:text-emerald-700 dark:first-letter:text-emerald-400 font-bangla text-[17px] leading-[1.85] text-slate-800 dark:text-slate-100'
          : 'font-bangla text-[17px] leading-[1.85] text-slate-800 dark:text-slate-100'
      }
    >
      {parseInlineFormatting(text)}
    </p>
  );
}
