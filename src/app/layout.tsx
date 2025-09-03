
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers";
import { Header } from "@/components/header";
import { MobileFooter } from "@/components/mobile-footer";
import { BottomBar } from "@/components/bottom-bar";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/lib/i18n.tsx";
import { SettingsProvider } from "@/lib/settings-provider";
import { AuthProvider } from "@/lib/auth-provider";
import { GoogleAnalytics } from "@/components/google-analytics";

export const metadata: Metadata = {
  title: "Timeflow",
  description: "A high-quality timer for work and study.",
  icons: {
    icon: "/Icon-No-BG.png",
    shortcut: "/Icon-No-BG.png",
    apple: "/Icon-No-BG.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              <SettingsProvider>
                {process.env.NEXT_PUBLIC_GA_ID && (
                  <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
                )}
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <main className="flex-1 flex flex-col pb-16 md:pb-0">
                    {children}
                  </main>
                  <MobileFooter />
                  <BottomBar />
                  <Toaster />
                </div>
              </SettingsProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
