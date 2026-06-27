import type { SearchResult } from '../domain/search.ts';

export function formatSearchResult(result: SearchResult): string {
  return JSON.stringify(result, null, 2);
}

export function jsonToolResult(value: object) {
  return {
    structuredContent: value as Record<string, unknown>,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}
