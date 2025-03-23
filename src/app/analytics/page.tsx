import { AnalyticsSideBar } from "~/components/analytics/AnalyticsSideBar";

export default function Analytics() {
    return (
        <div className="flex w-full h-full xl:max-w-[96rem]">
            <AnalyticsSideBar />
            <div className="flex flex-col grow h-full">
                Analytics
            </div>
        </div>
    );
}
