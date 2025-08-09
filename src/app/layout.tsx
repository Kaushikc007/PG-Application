import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "PG Application - Find Your Perfect Paying Guest Accommodation",
  description: "Connect tenants and property owners for the best PG accommodation experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${rubik.variable} font-rubik antialiased bg-gray-900 text-white`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
