export interface SearchFilters {
  term: string;
  category: string;
  page: number;
}

export function buildSearchUrl(base: string, filters: SearchFilters): string {
  const params: string[] = [];
  const term = filters.term.trim();
  if (term !== "") {
    params.push(`q=${term}`);
  }
  if (filters.category !== "") {
    params.push(`category=${filters.category}`);
  }
  if (filters.page > 1) {
    params.push(`page=${filters.page}`);
  }
  if (params.length === 0) {
    return base;
  }
  return `${base}?${params.join("&")}`;
}
