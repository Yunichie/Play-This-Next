import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Sidebar,
  MobileNav,
  SidebarProvider,
  MainContent,
} from "@/components/navigation/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <MainContent>{children}</MainContent>
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}
