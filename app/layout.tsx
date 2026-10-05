import type { Metadata, Viewport } from "next";
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

// viewport-fit=cover is what makes env(safe-area-inset-*) report real values
// on notched phones; without it the bottom tab bar's safe-area padding was
// always 0 and the tabs sat under the iOS home indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  // Pages set only their own part ("Find work"); this adds the brand.
  title: { default: "BaruKerja", template: "%s · BaruKerja" },
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
