import type { Metadata, Viewport } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SWRegister } from "@/components/sw-register";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import "./globals.css";

const sora = Sora({
  variable: "--font-display-family",
  subsets: ["latin"],
  // 800 is the storefront display weight (see money-mastery-code/v3).
  // Without it the browser synthesises a fake bold and the large
  // headings lose the tight, solid edge the type is built around.
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FOS·AI",
  description: "Your AI-powered financial operating system",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FOS·AI",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#695AFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <SWRegister />
        <PWAInstallPrompt />
        <NotificationPrompt />
      </body>
    </html>
  );
}
