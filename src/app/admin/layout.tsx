import Sidebar from "@/components/admin/Sidebar";
import { requireAdminPageSession } from "@/lib/admin-auth";

export const metadata = { title: { default: "Admin", template: "%s | MT Admin" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPageSession();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
