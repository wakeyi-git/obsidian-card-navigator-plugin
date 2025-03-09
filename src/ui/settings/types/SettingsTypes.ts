import CardNavigatorPlugin from '../../../main';

/**
 * 프리셋 인터페이스
 */
export interface IPreset {
  id: string;
  name: string;
  description?: string;
  settings: Record<string, any>;
}