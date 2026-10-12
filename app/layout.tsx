import { ServerWakeupNotice } from "@/components/server-wakeup-notice";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

// My Import
import { AuthProvider } from "@/context/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";

// Fonts are self-hosted variable fonts imported in globals.css (Playfair
// Display, Newsreader, Source Serif 4, Fraunces).

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
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <ServerWakeupNotice />
        </AuthProvider>
      </body>
    </html>
  );
}
