import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Stock Projection App",
  description: "Next.js version of your stock projection analyzer"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="main-area">{children}</main>
        </div>
      </body>
    </html>
  );
}
