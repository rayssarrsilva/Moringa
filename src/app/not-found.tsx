import Link from 'next/link';

// Shown only for paths outside a locale (the proxy redirects almost everything to /pt or /en).
export default function GlobalNotFound() {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 48 }}>
        <h1>Página não encontrada · Page not found</h1>
        <p>
          <Link href="/pt">Ir para o início</Link> · <Link href="/en">Go to the home page</Link>
        </p>
      </body>
    </html>
  );
}
