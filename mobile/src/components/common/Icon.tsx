import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {COLORS} from '../../constants/theme';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({name, size = 24, color = COLORS.text}) => {
  return (
    <Text style={[styles.icon, {fontSize: size, color}]}>{name}</Text>
  );
};

const styles = StyleSheet.create({
  icon: {},
});
