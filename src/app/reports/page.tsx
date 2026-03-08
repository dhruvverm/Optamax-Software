import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in">
      <ReportsClient />
    </div>
  );
}
