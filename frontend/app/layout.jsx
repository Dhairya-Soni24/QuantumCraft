import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["300", "400", "500", "700"] });
export const metadata = { title: "QuantumCraft", description: "A high-tech quantum computing learning workspace." };
export default function RootLayout({ children }) { return <html lang="en" className="h-full"><body className={`${roboto.className} flex min-h-full flex-col antialiased`}>{children}</body></html>; }