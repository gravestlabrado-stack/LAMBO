/**
 * Format ISO date string into readable tactical timestamp
 * e.g., "25 SEP 2026, 14:30" or "SEP 25, 2026"
 */
export function formatDate(dateString, includeTime = false) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit',
    options.minute = '2-digit';
    options.hour12 = false;
  }

  return new Intl.DateTimeFormat('en-GB', options).format(date).toUpperCase();
}

/**
 * Format relative time (e.g., "2 hours ago", "yesterday")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(dateString);
}

/**
 * Format metric with unit (e.g. 45.2 cm)
 */
export function formatMetric(value, unit = 'cm') {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${Number(value).toFixed(1)} ${unit}`;
}
