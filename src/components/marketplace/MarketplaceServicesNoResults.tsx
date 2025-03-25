import { Search } from "lucide-react";

export const MarketplaceServicesNoResults = () => {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <Search className="mb-8 h-20 w-20 text-gray-500" />
      <h2 className="mb-6 text-3xl font-semibold text-gray-700">
        No Results Found
      </h2>
      <p className="mb-8 max-w-md text-lg text-gray-500">
        We couldn&apos;t find any services matching your search criteria.
      </p>
    </div>
  );
};
