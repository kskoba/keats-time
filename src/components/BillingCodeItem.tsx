import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BillingCode } from '../types';
import { useTheme, Theme } from '../ThemeContext';

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
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const totalMinutes = units * code.minutesPerUnit;

  return (
    <View style={[s.container, units > 0 && s.containerActive]}>
      <View style={s.info}>
        <Text style={s.codeText}>{code.code}</Text>
        <Text style={s.descText} numberOfLines={2}>
          {code.description}
        </Text>
        <Text style={s.minuteText}>{code.minutesPerUnit} min/unit</Text>
      </View>

      <View style={s.controls}>
        <TouchableOpacity
          style={[s.btn, units === 0 && s.btnDisabled]}
          onPress={onDecrement}
          disabled={units === 0}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[s.btnText, units === 0 && s.btnTextDisabled]}>−</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.countBadge} onPress={onPressCount}>
          <Text style={s.countText}>{units}</Text>
          {units > 0 && <Text style={s.countMinutes}>{totalMinutes}m</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btn}
          onPress={onIncrement}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      backgroundColor: t.cardBg,
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
      borderLeftColor: t.activeBorder,
    },
    info: {
      flex: 1,
      marginRight: 12,
    },
    codeText: {
      fontSize: 17,
      fontWeight: '700',
      color: t.textPrimary,
      letterSpacing: 0.3,
    },
    descText: {
      fontSize: 13,
      color: t.textSecondary,
      marginTop: 2,
      lineHeight: 18,
    },
    minuteText: {
      fontSize: 12,
      color: t.textTertiary,
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
      backgroundColor: t.controlBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnDisabled: {
      opacity: 0.35,
    },
    btnText: {
      fontSize: 24,
      fontWeight: '400',
      color: t.blue,
      lineHeight: 28,
    },
    btnTextDisabled: {
      color: t.textTertiary,
    },
    countBadge: {
      minWidth: 52,
      height: 52,
      borderRadius: 10,
      backgroundColor: t.countBg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    countText: {
      fontSize: 22,
      fontWeight: '700',
      color: t.countText,
    },
    countMinutes: {
      fontSize: 10,
      color: t.countSubText,
      marginTop: 1,
      fontWeight: '600',
    },
  });
}
