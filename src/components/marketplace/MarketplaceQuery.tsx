import type { MarketplaceSortType } from '~/components/marketplace/MarketplaceSortSelector';

export interface Query {
  search: string;
  sort: MarketplaceSortType;
  tags: string[];
  price: number[];
  dates: number[];
}

export const DEFAULT_QUERY: Query = {
  search: '',
  sort: 'Popularity',
  tags: [],
  price: [0, 12],
  dates: [],
};