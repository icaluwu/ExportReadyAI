import sanitizeHtmlLibrary from 'sanitize-html';

const allowedTags = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote',
  'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'hr',
  'figure', 'figcaption', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtmlLibrary(html, {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      th: ['scope'],
      td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
        },
      }),
      img: (_tagName, attribs) => ({
        tagName: 'img',
        attribs: { ...attribs, loading: 'lazy' },
      }),
    },
    disallowedTagsMode: 'discard',
    enforceHtmlBoundary: true,
  });
}
