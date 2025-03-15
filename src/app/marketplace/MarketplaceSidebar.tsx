import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "~/components/ui/accordion";

import { MarketplaceTagsFilter } from "./MarketplaceTagsFilter";
import { MarketplacePriceFilter } from "./MarketplacePriceFilter";
import { MarketplaceDateFilter } from "./MarketplaceDateFilter";

export const MarketplaceSideBar = () => {
    return (
        <div className="min-w-48 lg:min-w-60 h-full border-r max-w-60">
            <Accordion type="multiple" className="w-full p-4">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Tags</AccordionTrigger>
                    <AccordionContent >
                        <MarketplaceTagsFilter />
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Price</AccordionTrigger>
                    <AccordionContent >
                        <MarketplacePriceFilter />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}