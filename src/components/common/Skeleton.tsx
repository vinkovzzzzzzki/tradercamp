import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: any;
}

export const SkeletonBlock: React.FC<SkeletonProps> = ({ width = '100%', height = 12, radius = 8, style }) => {
  return <View style={[styles.block, { width, height, borderRadius: radius }, style]} />;
};

export const SkeletonLine: React.FC<SkeletonProps> = ({ width = '100%', height = 12, style }) => {
  return <SkeletonBlock width={width} height={height} radius={6} style={style} />;
};

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#1b2430',
    borderWidth: 1,
    borderColor: '#1f2a36'
  }
});

export default SkeletonBlock;


