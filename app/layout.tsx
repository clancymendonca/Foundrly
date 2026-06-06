import type { Metadata, Viewport } from "next";
import  localFont  from "next/font/local";
import "./globals.css";
import 'easymde/dist/easymde.min.css';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import Providers from "@/components/layout/Providers";
import NotificationPermissionPrompt from "@/components/notifications/NotificationPermissionPrompt";
import IOSInstallPrompt from "@/components/notifications/IOSInstallPrompt";

const workSans = localFont({
  src: [ 
    {
      path: './fonts/WorkSans-Black.ttf',
      weight: "900",
      style: "normal",
    },
    {
      path: './fonts/WorkSans-ExtraBold.ttf',
      weight: "800",
      style: "normal",
    },
    {
      path: './fonts/WorkSans-Bold.ttf',
      weight: "700",
      style: "normal",
    },
    {
      path: './fonts/WorkSans-SemiBold.ttf',
      weight: "600",
      style: "normal",
    },
    {
      path: './fonts/WorkSans-Medium.ttf',
      weight: "500",
      style: "normal",
    },
    {
      path: './fonts/WorkSans-Regular.ttf',
      weight: "400",
      style: "normal",
    },
    {
      path: './fonts/WorkSans-Thin.ttf',
      weight: "200",
      style: "normal",
    },
    {
      path: './fonts/WorkSans-ExtraLight.ttf',
      weight: "100",
      style: "normal",
    },
  ],
  variable: "--font-work-sans",
})

export const metadata: Metadata = {
  title: "Foundrly",
  description:
    "Foundrly is a platform to discover startups, connect with founders, track funding updates, and explore job opportunities. Empowering entrepreneurs, investors, and enthusiasts with insights and tools to thrive in the startup ecosystem.",
  generator: "Next.js",
  applicationName: "Foundrly",
  referrer: "origin-when-cross-origin",
  keywords: [
    "startups",
    "founders",
    "funding",
    "jobs",
    "entrepreneurship",
    "investors",
    "platform",
    "ecosystem",
  ],
  authors: [
    { name: "Clancy Mendonca", url: "https://github.com/smartbooty69" },
  ],
  creator: "Clancy Mendonca",
  publisher: "Foundrly",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Foundrly",
    description:
      "Discover startups, connect with founders, track funding updates, and explore job opportunities.",
    url: "https://foundrly.vercel.app/",
    siteName: "Foundrly",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Foundrly Open Graph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foundrly",
    description:
      "Discover startups, connect with founders, track funding updates, and explore job opportunities.",
    site: "@foundrly",
    creator: "@clancymendonca",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5409DA" },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://foundrly.vercel.app/",
    languages: {
      "en": "/en",
      // Add more languages as needed
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#5409DA",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={workSans.variable}
      >
        <Providers>
          <NotificationPermissionPrompt />
          <IOSInstallPrompt />
          {children}
        </Providers>
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
