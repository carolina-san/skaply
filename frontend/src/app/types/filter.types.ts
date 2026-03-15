import { ProviderBasic } from './provider.types';

export interface FilterOptions {
  difficulties?: ('low' | 'medium' | 'high')[];
  provider_ids?: number[];
  category_ids?: number[];
  color_ids?: number[];
  visible?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  order_by?: string;
  order_dir?: string;
}

export type FilterProvider = ProviderBasic;