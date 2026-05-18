import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VGI Préstamos",
  description: "Sistema de préstamos de activos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100`}
    >
      <body className="min-h-full flex">
        <Providers>
          <Sidebar />
          <main className="flex-1 flex flex-col p-4 pt-16 md:p-8 overflow-auto h-screen w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
