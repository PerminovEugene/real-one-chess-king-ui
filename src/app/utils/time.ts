export function formatMillisecondsToMMSS(milliseconds: number): string {
  // Convert total milliseconds to total seconds (integer)
  if (milliseconds < 0) {
    return "00:00";
  }
  const totalSeconds = Math.floor(milliseconds / 1000);

  // Determine whole minutes
  const minutes = Math.floor(totalSeconds / 60);

  // Remainder seconds
  const seconds = totalSeconds % 60;

  // Use String.padStart to ensure two-digit formatting
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${mm}:${ss}`;
}
