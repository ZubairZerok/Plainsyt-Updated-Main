import { describe, expect, it } from 'vitest';
import { formatRelativeBn, fromCommentRows, fromPostRow, safeUrl, totalOf } from './mappers';
import { csvCell } from './csv';

describe('safeUrl', () => {
  it('accepts http(s) only', () => {
    expect(safeUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(safeUrl('http://example.com')).toBe('http://example.com/');
  });
  it('rejects script and data URLs', () => {
    expect(safeUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeUrl('JaVaScRiPt:alert(1)')).toBeUndefined();
    expect(safeUrl('data:text/html,<script>1</script>')).toBeUndefined();
    expect(safeUrl('vbscript:x')).toBeUndefined();
  });
  it('handles empty values', () => {
    expect(safeUrl('')).toBeUndefined();
    expect(safeUrl(undefined)).toBeUndefined();
  });
});

describe('csvCell', () => {
  it('quotes and escapes', () => expect(csvCell('a"b')).toBe('"a""b"'));
  it('neutralises formula injection', () => {
    for (const bad of ['=1+1', '+SUM(A1)', '-2', '@cmd']) expect(csvCell(bad)).toBe(`"'${bad}"`);
  });
});

describe('formatRelativeBn', () => {
  const now = new Date('2026-11-08T12:00:00Z');
  it('is relative for recent times', () => {
    expect(formatRelativeBn('2026-11-08T11:59:50Z', now)).toBe('এইমাত্র');
    expect(formatRelativeBn('2026-11-08T11:30:00Z', now)).toContain('মিনিট আগে');
    expect(formatRelativeBn('2026-11-08T09:00:00Z', now)).toContain('ঘণ্টা আগে');
    expect(formatRelativeBn('2026-11-05T12:00:00Z', now)).toContain('দিন আগে');
  });
  it('shows a date for old items and survives bad input', () => {
    expect(formatRelativeBn('2026-01-01T00:00:00Z', now)).toMatch(/২০২৬/);
    expect(formatRelativeBn('not a date', now)).toBe('not a date');
    expect(formatRelativeBn(undefined, now)).toBe('');
  });
});

describe('comment mapping', () => {
  const rows = [
    { id: 'p', target_type: 'post', target_id: 'x', author_id: 'u1', author: 'Rafi', text: 'hi', created_at: '2026-11-01T00:00:00Z', reaction_counts: { like: 2, insightful: 1 } },
    { id: 'r', target_type: 'post', target_id: 'x', author_id: 'u2', author: 'Mim', text: 're', created_at: '2026-11-01T01:00:00Z', parent_id: 'p', reaction_counts: {} },
  ];
  it('derives reply target, likes and own reaction from server data', () => {
    const out = fromCommentRows(rows, new Map([['comment:p', 'like' as const]]));
    expect(out[1].parentId).toBe('p');
    expect(out[1].replyToAuthor).toBe('Rafi');
    expect(out[0].likes).toBe(3);
    expect(out[0].userReaction).toBe('like');
    expect(out[1].userReaction).toBeNull();
  });
  it('totalOf ignores junk', () => expect(totalOf({ like: 2, love: undefined })).toBe(2));
  it('post rows keep only safe links and server counts', () => {
    const post = fromPostRow(
      { id: 'p1', author_id: 'u', content: 'c', external_link: 'javascript:alert(1)', reaction_counts: { like: 4 }, created_at: '2026-11-01T00:00:00Z' },
      [], new Map(), new Set(['p1']),
    );
    expect(post.externalLink).toBeUndefined();
    expect(post.stats.likes).toBe(4);
    expect(post.userSaved).toBe(true);
  });
});
