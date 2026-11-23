/**
 * Exit 0 when the Sentry API answers with a 2xx within the timeout, 1 otherwise.
 *
 * The request carries SENTRY_AUTH_TOKEN, so a 401/403 also means "not usable":
 * the upload would fail on every call. A connection error, a DNS failure, a TLS
 * failure or the abort signal mean the same thing.
 *
 * usage: node sentry-reachable.mjs <sentry-url> [timeout-seconds]
 */
const [url, seconds = '8'] = process.argv.slice(2);

if (!url) {
  console.error('usage: sentry-reachable.mjs <sentry-url> [timeout-seconds]');
  process.exit(1);
}

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), Number(seconds) * 1000);

try {
  const response = await fetch(new URL('/api/0/', url), {
    signal: controller.signal,
    headers: { Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN ?? ''}` },
  });
  if (!response.ok) {
    console.error(`${url} answered HTTP ${response.status}`);
    process.exit(1);
  }
  process.exit(0);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
} finally {
  clearTimeout(timer);
}
