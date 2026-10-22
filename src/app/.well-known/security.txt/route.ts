import { siteUrl } from '@/lib/seo';

/** RFC 9116: where to report a vulnerability. Expires must stay within a year; CI checks it. */
export const securityTxtExpires = '2027-10-21T00:00:00.000Z';

export function GET() {
  const body = [
    'Contact: https://github.com/rayssarrsilva/Moringa/security/advisories/new',
    `Expires: ${securityTxtExpires}`,
    'Preferred-Languages: pt, en',
    `Canonical: ${siteUrl()}/.well-known/security.txt`,
    'Policy: https://github.com/rayssarrsilva/Moringa/blob/main/SECURITY.md',
    '',
  ].join('\n');
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
