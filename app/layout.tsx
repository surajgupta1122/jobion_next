import type { Metadata } from "next";
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
  title: {
    default: "Jobion",
    template: "%s | Jobion",
  },
  description: "Find jobs and hire talent on Jobion.",
};

import GuestLayout from "./components/layout/guest-layout/GuestLayout.jsx";
import { ToastProvider } from "./components/toast";
import Script from "next/script";
import GoogleAnalytics from "./components/analytics/GoogleAnalytics";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics />
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ToastProvider>
          <GuestLayout>{children}</GuestLayout>
        </ToastProvider>
      </body>
    </html>
  );
}
