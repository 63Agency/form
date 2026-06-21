import type { Metadata, Viewport } from "next";
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

export const metadata: Metadata = {
  title: "Votre Projet d'Études à l'Étranger Commence Ici",
  description:
    "Formulaire multi-étapes : projet d'études à l'étranger — orientation et consultation.",
  icons: {
    icon: [{ url: "/logo/Unicoach.jpg", type: "image/jpeg" }],
    shortcut: [{ url: "/logo/Unicoach.jpg", type: "image/jpeg" }],
    apple: [{ url: "/logo/Unicoach.jpg", type: "image/jpeg" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f1b2a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">{children}</body>
    </html>
  );
}
