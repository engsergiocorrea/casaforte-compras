import type { Metadata } from "next";
import { CarregandoEntrePaginas } from '@/components/cf-carregando/entre-paginas';
import { Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Casa Forte Compras",
  description: "Sistema interno de compras e pedidos de materiais da Casa Forte Construtora.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <CarregandoEntrePaginas />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
