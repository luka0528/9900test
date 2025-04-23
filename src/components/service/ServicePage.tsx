import { Package } from "lucide-react";
import { api } from "~/trpc/react";
import { ServiceCard } from "~/components/service/ServiceCard";
import { Loading } from "../ui/loading";

export const ServicePage = () => {
    const {
        data: services,
        isLoading,
        error,
      } = api.service.getAllByUserId.useQuery();

    return (
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <Loading />
          ) : error ? (
            <div className="p-4 text-center text-destructive">
              Error loading services. Please try again.
            </div>
          ) : services?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Package className="mb-2 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No services found</h3>
              <p className="text-muted-foreground">
                You haven&apos;t created any services yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services?.map((service, index) => (
                <ServiceCard
                  key={index}
                  service={{
                    id: service.id,
                    name: service.name,
                    owner: service.owners[0] ?? "No Name",
                    tags: service.tags,
                    latestVersionId: service.latestVersion.id,
                    latestVersion: service.latestVersion.version,
                  }}
                />
              ))}
            </div>
          )}
        </div>
    )
}