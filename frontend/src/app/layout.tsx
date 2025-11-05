import "./globals.css";
import Providers from "./providers";
import Header from "@/components/Header";
import { TabProvider } from "@/contexts/TabContext";

export const metadata = {
  title: "ArcBond - Decentralized Bond System",
  description: "ArcBond - Bond issuance platform on Arc Network. Earn fixed income with on-chain bonds.",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-primary">
        <Providers>
          <TabProvider>
            <Header />
            <main className="max-w-7xl mx-auto px-6 py-8">
              {children}
            </main>
          </TabProvider>
        </Providers>
      </body>
    </html>
  );
}
