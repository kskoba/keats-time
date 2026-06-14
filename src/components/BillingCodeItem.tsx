import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BillingCode } from '../types';

interface Props {
  code: BillingCode;
  units: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onPressCount: () => void;
}

export default function BillingCodeItem({
  code,
  units,
  onIncrement,
  onDecrement,
  onPressCount,
}: Props) {
  const totalMinutes = units * code.minutesPerUnit;

  return (
    <View style={[styles.container, units > 0 && styles.containerActive]}>
      <View style={styles.info}>
        <Text style={styles.codeText}>{code.code}</Text>
        <Text style={styles.descText} numberOfLines={2}>
          {code.description}
        </Text>
        <Text style={styles.minuteText}>{code.minutesPerUnit} min/unit</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, units === 0 && styles.btnDisabled]}
          onPress={onDecrement}
          disabled={units === 0}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.btnText, units === 0 && styles.btnTextDisabled]}>
            −
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.countBadge} onPress={onPressCount}>
          <Text style={styles.countText}>{units}</Text>
          {units > 0 && (
            <Text style={styles.countMinutes}>{totalMinutes}m</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={onIncrement}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  containerActive: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  codeText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: 0.3,
  },
  descText: {
    fontSize: 13,
    color: '#636366',
    marginTop: 2,
    lineHeight: 18,
  },
  minuteText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: '#F9F9F9',
  },
  btnText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#007AFF',
    lineHeight: 28,
  },
  btnTextDisabled: {
    color: '#C7C7CC',
  },
  countBadge: {
    minWidth: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007AFF',
  },
  countMinutes: {
    fontSize: 10,
    color: '#5A9FFF',
    marginTop: 1,
    fontWeight: '600',
  },
});
