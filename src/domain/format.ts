export function formatIsoDuration(value?: string): string | undefined {
  if (value == null) return undefined;

  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    value,
  );
  if (match == null) return value;

  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);
  const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;

  if (totalSeconds === 0) return '0:00';

  const displayHours = Math.floor(totalSeconds / 3600);
  const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
  const displaySeconds = totalSeconds % 60;

  if (displayHours > 0) {
    return `${displayHours}:${pad2(displayMinutes)}:${pad2(displaySeconds)}`;
  }

  return `${displayMinutes}:${pad2(displaySeconds)}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
