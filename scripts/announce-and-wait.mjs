import process from 'node:process';

const message = process.argv[2] ?? 'Running command...';
const delayMs = Number.parseInt(process.argv[3] ?? '0', 10);
const safeDelayMs = Number.isFinite(delayMs) && delayMs > 0 ? delayMs : 0;

console.log(message);

if (safeDelayMs > 0) {
  await new Promise((resolve) => setTimeout(resolve, safeDelayMs));
}
