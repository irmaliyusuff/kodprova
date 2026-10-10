const VISIBLE_PAGES = 5;

function visiblePages(page, totalPages) {
  const half = Math.floor(VISIBLE_PAGES / 2);
  const start = Math.max(
    1,
    Math.min(page - half, totalPages - VISIBLE_PAGES + 1),
  );
  const end = Math.min(totalPages, start + VISIBLE_PAGES - 1);
  const pages = [];
  for (let number = start; number <= end; number += 1) {
    pages.push(number);
  }
  return pages;
}

export function getPageInfo(requestedPage, totalItems, pageSize) {
  const totalPages = Math.max(1, Math.floor(totalItems / pageSize));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);
  return {
    page,
    totalPages,
    label: `${firstItem}–${lastItem} / ${totalItems}`,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
    pages: visiblePages(page, totalPages),
  };
}
