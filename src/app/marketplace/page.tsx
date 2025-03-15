import { MarketplaceSearch } from '~/components/marketplace/MarketplaceSearch';
import { MarketplaceSortSelector } from '~/components/marketplace/MarketplaceSortSelector';
import { MarketplaceServices } from '~/components/marketplace/MarketplaceServices';
import { MarketplaceSideBar } from '~/components/marketplace/MarketplaceSidebar';

export default function Marketplace() {
  return (
      <div className="flex w-full h-full xl:max-w-[96rem]">
        <MarketplaceSideBar />
        <div className="flex flex-col grow h-full">
          <div className="flex min-h-20 justify-between items-center">
            <MarketplaceSortSelector />
            <MarketplaceSearch />
          </div>
          <MarketplaceServices />
        </div>
      </div>
  );
}
