import { Service } from "@prisma/client";

import { Badge } from "~/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { Download, Package, Calendar, Users} from "lucide-react"
import { Button } from "~/components/ui/button";

interface MarketplaceServiceProps {
    service?: {
        name: string;
        description: string;
        version: string;
        stats: {
            downloads: string;
            stars: number;
        };
        creator: { name: string; url: string };
        lastUpdated: string;
        license: string;
        price: number,
        keywords: string[];
    }
}
export const MarketplaceService = ({ service }: MarketplaceServiceProps) => {
    const { name, description, version, stats, creator, lastUpdated, price, keywords } = service || {
        name: "react",
        description: "React is a JavaScript library for building user interfaces.",
        version: "18.2.0",
        stats: {
            downloads: "20M/week",
            stars: 213000,
        },
        creator: { name: "Meta Open Source", url: "https://github.com/facebook" },
        lastUpdated: "2023-10-15",
        price: 0.00,
        keywords: ["react", "javascript", "library", "ui"],
    }
    return (
        <TooltipProvider>
          <Card
            className="overflow-hidden transition-all duration-300 hover:shadow-md"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold">{name}</CardTitle>
                </div>
                <Badge variant="outline">{version}</Badge>
              </div>
              <CardDescription className="line-clamp-2 h-10 text-sm">{description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2 ">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span>{stats.downloads}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{lastUpdated}</span>
                </div>
              </div>
    
              {keywords && keywords.length > 0 && (
                <div className="mt-6 mb-2 flex flex-wrap gap-1">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        {creator.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                    <ul className="list-disc pl-5">
                        <li key={creator.name}>{creator.name}</li>
                    </ul>
                    </TooltipContent>
                  </Tooltip>
                </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-500 min-w-20 text-sm font-medium hover:bg-blue-50 hover:text-blue-600"
                    >
                        {Number(price) === 0 ? "Free" : "$" + price.toFixed(2)}
                    </Button>
              </div>
            </CardFooter>
          </Card>
        </TooltipProvider>
      );
}