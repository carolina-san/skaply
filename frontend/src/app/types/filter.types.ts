import { ProviderBasic } from './provider.types';

export interface FilterOptions {
  colors: string[];
  difficulties: ('low' | 'medium' | 'high')[];
  provider_ids: number[];
  category_ids: number[];
}

export type FilterProvider = ProviderBasic;