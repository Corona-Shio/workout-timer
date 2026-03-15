function formatGCalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function openGoogleCalendar() {
  const now = new Date();
  // Estimate workout duration: warmup(5) + 4x exercise(4) + 3x rest(3) + cooldown(5) = 35 min
  const start = new Date(now.getTime() - 35 * 60 * 1000);

  const dates = `${formatGCalDate(start)}/${formatGCalDate(now)}`;
  const url =
    'https://calendar.google.com/calendar/render' +
    '?action=TEMPLATE' +
    '&text=' + encodeURIComponent('Norwegian 4x4 HIIT') +
    '&dates=' + dates +
    '&details=' + encodeURIComponent('Completed Norwegian 4x4 interval training.');

  window.open(url, '_blank');
}
