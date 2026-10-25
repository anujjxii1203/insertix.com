import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Command Center | Insertix Media",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-theme min-h-screen bg-[#F5F4F2] text-[#0A0A0A] font-sans antialiased selection:bg-[#D40000] selection:text-white">
      {children}
    </div>
  );
}
