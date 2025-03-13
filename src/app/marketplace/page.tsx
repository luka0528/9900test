import { MarketplaceSearch } from './MarketplaceSearch';
import { MarketplaceSortSelector } from './MarketplaceSortSelector';
import { MarketplaceServices } from './MarketplaceServices';

export default function Marketplace() {
  return (
      <div className="flex w-full h-full xl:max-w-[96rem]">
        <div className="w-48 h-full border-r">
          SideBar
        </div>
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
