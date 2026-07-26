import { parse } from 'parse5';
import { z } from 'zod';

type TextFragment = {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
};

export type AiTextRequest = {
  fragments: Array<{ id: string; text: string }>;
  locale: string;
  tone: string;
  instructions?: string;
};

const replacementSchema = z.object({
  replacements: z.array(z.object({
    id: z.string(),
    text: z.string().min(1).max(2000),
  }).strict()).max(120),
}).strict();

const blockedParents = new Set(['script', 'style', 'noscript', 'svg', 'math', 'code', 'pre', 'textarea']);

const collectTextFragments = (html: string) => {
  const document = parse(html, { sourceCodeLocationInfo: true }) as any;
  const fragments: TextFragment[] = [];
  const visit = (node: any, blocked = false) => {
    const tagName = String(node.tagName || '').toLowerCase();
    const nextBlocked = blocked || blockedParents.has(tagName);
    if (!nextBlocked && node.nodeName === '#text' && typeof node.value === 'string') {
      const location = node.sourceCodeLocation;
      const clean = node.value.replace(/\s+/g, ' ').trim();
      if (
        location
        && Number.isInteger(location.startOffset)
        && Number.isInteger(location.endOffset)
        && clean.length >= 2
        && /[\p{L}]/u.test(clean)
        && fragments.length < 120
      ) {
        fragments.push({
          id: `text_${fragments.length + 1}`,
          text: clean.slice(0, 1200),
          startOffset: location.startOffset,
          endOffset: location.endOffset,
        });
      }
    }
    for (const child of node.childNodes || []) visit(child, nextBlocked);
    if (node.content) visit(node.content, nextBlocked);
  };
  visit(document);

  let total = 0;
  return fragments.filter((fragment) => {
    if (total + fragment.text.length > 12_000) return false;
    total += fragment.text.length;
    return true;
  });
};

const escapeHtmlText = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const extractJsonObject = (value: string) => {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fenced || value).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI_TEXT_RESPONSE_INVALID');
  return JSON.parse(candidate.slice(start, end + 1));
};

export const improveVisibleHtmlText = async (
  html: string,
  request: (input: AiTextRequest) => Promise<string>,
  options: { locale: string; tone: string; instructions?: string },
) => {
  const fragments = collectTextFragments(html);
  if (!fragments.length) return { html, changedTextNodes: 0, consideredTextNodes: 0 };

  const raw = await request({
    fragments: fragments.map(({ id, text }) => ({ id, text })),
    locale: options.locale,
    tone: options.tone,
    instructions: options.instructions,
  });
  const parsed = replacementSchema.parse(extractJsonObject(raw));
  const fragmentMap = new Map(fragments.map((fragment) => [fragment.id, fragment]));
  const replacements = parsed.replacements.flatMap((replacement) => {
    const fragment = fragmentMap.get(replacement.id);
    const nextText = replacement.text.replace(/\s+/g, ' ').trim();
    if (!fragment || !nextText || nextText === fragment.text) return [];
    if (nextText.length > Math.max(2000, fragment.text.length * 4)) return [];
    return [{ ...fragment, nextText }];
  });

  let nextHtml = html;
  for (const replacement of replacements.sort((a, b) => b.startOffset - a.startOffset)) {
    const original = html.slice(replacement.startOffset, replacement.endOffset);
    const leading = original.match(/^\s*/)?.[0] || '';
    const trailing = original.match(/\s*$/)?.[0] || '';
    nextHtml = `${nextHtml.slice(0, replacement.startOffset)}${leading}${escapeHtmlText(replacement.nextText)}${trailing}${nextHtml.slice(replacement.endOffset)}`;
  }
  return {
    html: nextHtml,
    changedTextNodes: replacements.length,
    consideredTextNodes: fragments.length,
  };
};

export const buildAiTextPrompt = (request: AiTextRequest) => JSON.stringify({
  task: 'Improve the visible website copy while preserving its exact meaning, facts, product names, prices, legal wording and calls to action.',
  hardRules: [
    'Return valid JSON only in the shape {"replacements":[{"id":"text_1","text":"..."}]}.',
    'Use only IDs provided in fragments.',
    'Return only fragments that materially improve.',
    'Do not add HTML, Markdown, URLs, claims, facts, prices, guarantees or new offers.',
    'Do not translate unless the requested locale differs from the fragment language.',
    'Never include scripts, styles, attributes or structural edits.',
  ],
  locale: request.locale,
  tone: request.tone,
  additionalInstructions: request.instructions || undefined,
  fragments: request.fragments,
});

