import { createHash } from 'node:crypto';
function decodeEmail(hex) {
  const bytes = Buffer.from(hex,'hex');
  return Buffer.from(bytes.subarray(1).map(byte => byte ^ bytes[0])).toString('utf8');
}
export function pageDigest(text) {
  // Cloudflare changes the XOR key per response. Compare the decoded email,
  // so an actual address/content change still fails the integrity check.
  const stable = text
    .replace(/data-cfemail="([0-9a-f]+)"/gi, (_, hex) => `data-cfemail=${JSON.stringify(decodeEmail(hex))}`)
    .replace(/\/cdn-cgi\/l\/email-protection#([0-9a-f]+)/gi, (_, hex) => `/cdn-cgi/l/email-protection#${decodeEmail(hex)}`);
  return createHash('sha256').update(stable).digest('hex');
}
