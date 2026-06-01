import { SocketProvider } from "./SocketProvider";
import AdminV2Shell from "./AdminV2Shell";

export default function AdminV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <AdminV2Shell>
        {children}
      </AdminV2Shell>
    </SocketProvider>
  );
}
