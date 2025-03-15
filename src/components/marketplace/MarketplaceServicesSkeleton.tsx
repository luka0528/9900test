
import { Skeleton } from "~/components/ui/skeleton";

import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { TooltipProvider } from "~/components/ui/tooltip"
import { Download, Package, Calendar, Users} from "lucide-react"

export const MarketplaceServicesSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 grow px-8 pb-8 gap-8">
            {Array(12).fill(0).map((_, idx) => (
                <Card key={idx} className="overflow-hidden transition-all duration-300">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-muted" />
                                <Skeleton className="h-8 w-32" />
                            </div>
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <div className="mt-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="mt-2 h-4 w-4/5" />
                        </div>
                    </CardHeader>
                    <CardContent className="pb-2 pt-3">
                        <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex items-center gap-1.5">
                                <Download className="h-4 w-4 text-muted" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-muted" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                        <div className="mt-6 mb-2 flex flex-wrap gap-1">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-14" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                        <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                <Skeleton className="h-3.5 w-20" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
      );
}