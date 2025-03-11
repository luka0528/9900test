import { MarketplaceSearch } from './MarketplaceSearch';
import { MarketplaceSortSelector } from './MarketplaceSortSelector';


export default function Marketplace() {
  const services = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    name: `Service ${i}`,
  }));

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
          <div className="grid grid-cols-2 grow px-8 pb-8 gap-16 overflow-y-auto">
            {
              services.map((s) => (
                <div key={s.id} className="p-4 h-60 border">
                  <h2>{s.name}</h2>
                </div>
              ))
            }
          </div>
        </div>
      </div>
  );
}
