import type { Metadata } from "next";
import { VT323 } from "next/font/google"; 
import "./globals.css";

// --- THE Y2K TYPOGRAPHY ENGINE ---
const pixelFont = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zenith OS",
  description: "Personal Command Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Applying the pixel font to the entire body! */}
      <body className={pixelFont.className}>{children}</body>
    </html>
  );
}