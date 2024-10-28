import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OAuth Example",
  description: "Log in with your Bluesky handle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
