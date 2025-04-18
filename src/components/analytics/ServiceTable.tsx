import { api } from "~/trpc/react";
import { AnalyticsSideBar } from "./AnalyticsSideBar";

import { columns } from "~/app/analytics/services/columns";
import { DataTable } from "~/app/analytics/services/data-table";

import { Loader2 } from "lucide-react";

export const ServiceTable = () => {
  const { data, isLoading, isError, isSuccess } =
    api.service.getAllByUserId.useQuery();
  return (
    <>
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        data && (
          <div className="container mx-auto p-4">
            <DataTable columns={columns} data={data} />
          </div>
        )
      )}
    </>
  );
};
