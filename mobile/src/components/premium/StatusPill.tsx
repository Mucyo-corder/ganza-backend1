import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COLORS} from '../../constants/theme';

export const StatusPill: React.FC<{
  status: 'active' | 'idle' | 'busy' | 'offline' | 'success' | 'warning' | 'error';
  label: string;
  dot?: boolean;
}> = ({status, label, dot = true}) => {
  const cfg = {
    active: {bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.14)', dot: '#D4D4D4', text: '#F5F5F5'},
    idle: {bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.10)', dot: '#A3A3A3', text: '#D4D4D4'},
    busy: {bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.12)', dot: '#F5F5F5', text: '#F5F5F5'},
    offline: {bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.18)', dot: '#6B7280', text: '#9CA3AF'},
    success: {bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.22)', dot: '#22C55E', text: '#86EFAC'},
    warning: {bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.22)', dot: '#F59E0B', text: '#FCD34D'},
    error: {bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.18)', dot: '#EF4444', text: '#FCA5A5'},
  }[status];

  return (
    <View style={[styles.pill, {backgroundColor: cfg.bg, borderColor: cfg.border}]}>
      {dot && <View style={[styles.dot, {backgroundColor: cfg.dot, shadowColor: cfg.dot}]} />}
      <Text style={[styles.label, {color: cfg.text}]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
