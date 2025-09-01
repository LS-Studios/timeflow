import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/lib/i18n.tsx";
import { SettingsProvider } from "@/lib/settings-provider";

export const metadata: Metadata = {
  title: "Timeflow",
  description: "A high-quality timer for work and study.",
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
        <LanguageProvider>
          <SettingsProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 flex flex-col">
                  {children}
                </main>
                <Toaster />
              </div>
            </ThemeProvider>
          </SettingsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
