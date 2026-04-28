export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-ZM', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
