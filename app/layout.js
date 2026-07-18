import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://www.bibliocamp.ca"),
  title: "BiblioCamp — Achète et vends tes manuels scolaires",
  description: "La marketplace étudiante pour acheter et vendre des manuels scolaires d'occasion entre étudiants.",
  openGraph: {
    type: "website",
    siteName: "BiblioCamp",
    locale: "fr_CA",
    url: "https://www.bibliocamp.ca",
    title: "BiblioCamp — la marketplace étudiante québécoise",
    description: "Achète et vends tes manuels d'occasion, trouve un tuteur ou une coloc — entre étudiants du Québec.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BiblioCamp — la marketplace étudiante québécoise",
    description: "Manuels d'occasion, tuteurs et colocs entre étudiants du Québec.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BiblioCamp",
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    google: "VG97iB-rEyAXruV8Va_wH6UbzjfInJq0j6GHtF0WZK0",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
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
      </body>
    </html>
  );
}
