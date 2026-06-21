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
  title: "BiblioCamp — Achète et vends tes manuels scolaires",
  description: "La marketplace étudiante pour acheter et vendre des manuels scolaires d'occasion entre étudiants.",
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
  maximumScale: 1,
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
