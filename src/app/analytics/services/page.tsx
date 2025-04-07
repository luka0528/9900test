import { AnalyticsSideBar } from "~/components/analytics/AnalyticsSideBar";

export default function Analytics() {
  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AnalyticsSideBar />
      <div className="flex h-full grow flex-col">Services Table</div>
    </div>
  );
}
