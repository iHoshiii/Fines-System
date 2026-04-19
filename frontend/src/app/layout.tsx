import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";

export const metadata: Metadata = {
  title: "NVSU Fines System",
  description: "Nueva Vizcaya State University Student Fines Management System — track, manage, and monitor student fines across all organizations.",
  keywords: ["NVSU", "fines system", "student", "Nueva Vizcaya State University"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
