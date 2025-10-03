import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectsProvider } from "@/contexts/ProjectsContext";
import { TimerProvider } from "@/contexts/TimerContext";
import { TasksProvider } from "@/contexts/TasksContext";
import PWAInstaller from "@/components/PWAInstaller";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Ambira - Social Productivity Tracker",
  description: "Track your productivity, build streaks, and stay motivated with friends. The social way to achieve your goals.",
  keywords: ["productivity", "tracking", "social", "goals", "habits", "studying", "work"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ambira",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#007AFF",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet" />

        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#007AFF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ambira" />
      </head>
      <body
        className={`${dmSans.variable} antialiased`}
      >
        <PWAInstaller />
        <AuthProvider>
          <ProjectsProvider>
            <TasksProvider>
              <TimerProvider>
                {children}
              </TimerProvider>
            </TasksProvider>
          </ProjectsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
