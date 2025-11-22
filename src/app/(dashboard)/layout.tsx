import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar, MobileNav } from "@/components/navigation/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  console.log("Dashboard layout - session:", session?.user?.id);

  if (!session?.user?.id) {
    console.log("No session found, redirecting to login");
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-16 md:pb-0 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
