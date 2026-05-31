import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar user={session.user} />
      <main className="flex-1 p-4 md:p-6 overflow-auto pt-16 md:pt-6">{children}</main>
    </div>
  );
}
