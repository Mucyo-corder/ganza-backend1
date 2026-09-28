declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import type {ComponentType} from 'react';
  import type {TextProps} from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  type IconComponent = ComponentType<IconProps> & {
    Button: ComponentType<Record<string, unknown>>;
    getImageSource: (...args: unknown[]) => Promise<unknown>;
    getImageSourceSync: (...args: unknown[]) => unknown;
  };

  const Icon: IconComponent;
  export default Icon;
}