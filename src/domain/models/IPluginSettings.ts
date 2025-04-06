import { ISettings } from './ISettings';

export interface IPluginSettings extends ISettings {
  style: {
    card: {
      normal: {
        background: string;
        fontSize: number;
        borderColor: string;
        borderWidth: number;
      };
      active: {
        background: string;
        fontSize: number;
        borderColor: string;
        borderWidth: number;
      };
      focused: {
        background: string;
        fontSize: number;
        borderColor: string;
        borderWidth: number;
      };
    };
    header: {
      background: string;
      fontSize: number;
      borderColor: string;
      borderWidth: number;
    };
    body: {
      background: string;
      fontSize: number;
      borderColor: string;
      borderWidth: number;
    };
    footer: {
      background: string;
      fontSize: number;
      borderColor: string;
      borderWidth: number;
    };
  };
  preset: {
    name: string;
    description: string;
    settings: ISettings;
  }[];
} 