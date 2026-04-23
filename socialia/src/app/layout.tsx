import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SocialIA - Inteligencia em Social Media",
  description:
    "Gere imagens e legendas profissionais para o Instagram com inteligencia artificial.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          richColors
          position="top-center"
          toastOptions={{
            style: {
              fontSize: "15px",
              padding: "16px 20px",
              borderRadius: "22px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              maxWidth: "420px",
            },
          }}
        />
      </body>
    </html>
  );
}
