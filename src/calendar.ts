function formatGCalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function openGoogleCalendar(startedAt: Date) {
  const now = new Date();
  const dates = `${formatGCalDate(startedAt)}/${formatGCalDate(now)}`;
  const url =
    'https://calendar.google.com/calendar/render' +
    '?action=TEMPLATE' +
    '&text=' + encodeURIComponent('ノルウェー式 HIIT') +
    '&dates=' + dates;

  window.open(url, '_blank');
}
