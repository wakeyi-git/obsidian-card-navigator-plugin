import { ICardConfig } from './CardConfig';
import { ICardSetConfig } from './CardSetConfig';
import { ILayoutConfig } from './LayoutConfig';
import { ISortConfig } from './SortConfig';
import { ISearchConfig } from './SearchConfig';

export interface ISettings {
  card: ICardConfig;
  cardSet: ICardSetConfig;
  layout: ILayoutConfig;
  sort: ISortConfig;
  search: ISearchConfig;
} 