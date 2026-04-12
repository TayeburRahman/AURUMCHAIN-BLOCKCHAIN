import type { Metadata } from "next";
import "./globals.css";
import LayoutWrapper from "./components/LayoutWrapper";
import { Web3Provider } from "./components/Web3Provider";

export const metadata: Metadata = {
  title: "GoldenFleece | Own Your Own Gold Mine",
  description: "A blockchain-powered crowdfunding platform for small-scale and junior gold mines. Making mining investment accessible for everyday investors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Web3Provider>
      </body>
    </html>
  );
}
