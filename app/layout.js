import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Market Arena",
  description: "Competitive stock prediction platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <main className="main-area">
          <div className="page-shell">{children}</div>
        </main>
      </body>
    </html>
  );
}
