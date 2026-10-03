import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata = {
  title: "VN30 Value Investing OS",
  description: "Không gian quản lý đầu tư giá trị cá nhân.",
};
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="vi"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
