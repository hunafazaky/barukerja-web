import type { Metadata } from "next";
import { Archivo, Atkinson_Hyperlegible, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// My Import
import { AuthProvider } from "@/context/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";

// Atkinson Hyperlegible is the body/UI face — chosen specifically for
// readability on long job descriptions, not as a stylistic pick (it was
// designed by the Braille Institute for exactly that). Archivo carries
// headlines and job titles. See CLAUDE.md's design token table.
const atkinsonHyperlegible = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BaruKerja",
  description: "Find work, or find the people to do it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        atkinsonHyperlegible.variable,
        archivo.variable,
        geistMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
