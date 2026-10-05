import DesktopDashboard from "./DesktopDashboard";
import MobileDashboard from "./MobileDashboard";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <>
      {/* Desktop Dashboard */}
      <div className="hidden md:block">
        <DesktopDashboard params={params} />
      </div>

      {/* Mobile Dashboard */}
      <div className="block md:hidden">
        <MobileDashboard params={params} />
      </div>
    </>
  );
}