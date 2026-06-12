import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "BiblioCamp — Achète et vends tes manuels scolaires",
  description: "La marketplace étudiante pour acheter et vendre des manuels scolaires d'occasion entre étudiants.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BiblioCamp",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#1a2e4a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ margin: 0, overflowX: 'hidden', colorScheme: 'light', background: '#fff' }}>
        {children}
        <footer style={{ borderTop: '1px solid #e5e7eb', marginTop: '4rem', padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>
          <span>© {new Date().getFullYear()} BiblioCamp</span>
          {' · '}
          <Link href="/confidentialite" style={{ color: '#6b7280' }}>Confidentialité</Link>
          {' · '}
          <Link href="/cgu" style={{ color: '#6b7280' }}>{"Conditions d'utilisation"}</Link>
        </footer>
      </body>
    </html>
  );
}
