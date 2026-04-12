"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check if we're on a dashboard route
  const isDashboard = pathname?.startsWith("/dashboard");

  // For dashboard routes, render only the children (no header/footer)
  if (isDashboard) {
    return <>{children}</>;
  }

  // For all other routes, render with header and footer
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
