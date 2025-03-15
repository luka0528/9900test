import { Search } from "lucide-react"

export const MarketplaceServicesNoResults = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <Search className="w-20 h-20 text-gray-500 mb-8" />
            <h2 className="text-3xl font-semibold text-gray-700 mb-6">No Results Found</h2>
            <p className="text-gray-500 max-w-md text-lg mb-8">
                We couldn't find any services matching your search criteria.
            </p>
        </div>
    )
}