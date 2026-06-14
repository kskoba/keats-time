import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BillingCode } from '../types';
import { useTheme, Theme } from '../ThemeContext';
import BillingCodeItem from '../components/BillingCodeItem';

interface Props {
  codes: BillingCode[];
  units: Record<string, number>;
  shiftHours: number;
  onUnitsChange: (units: Record<string, number>) => void;
  onShiftHoursChange: (hours: number) => void;
  onEditCodes: () => void;
}

const WEB_TOP_PAD = Platform.OS === 'web' ? 52 : 0;

export default function HomeScreen({
  codes,
  units,
  shiftHours,
  onUnitsChange,
  onShiftHoursChange,
  onEditCodes,
}: Props) {
  const { theme, isDark, toggleTheme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [hoursInput, setHoursInput] = useState(shiftHours.toString());
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [viewMode, setViewMode] = useState<'minutes' | 'dollars'>('minutes');

  const totalShiftMinutes = Math.round(shiftHours * 60);
  const usedMinutes = codes.reduce(
    (sum, code) => sum + (units[code.id] || 0) * code.minutesPerUnit,
    0
  );
  const leftMinutes = totalShiftMinutes - usedMinutes;
  const isOver = leftMinutes < 0;
  const progressPercent =
    totalShiftMinutes > 0
      ? Math.min(100, (usedMinutes / totalShiftMinutes) * 100)
      : 0;
  const totalEarnings = codes.reduce(
    (sum, code) => sum + (units[code.id] || 0) * (code.payPerUnit || 0),
    0
  );

  const handleHoursBlur = () => {
    const val = parseFloat(hoursInput);
    if (!isNaN(val) && val > 0 && val <= 24) {
      onShiftHoursChange(val);
    } else {
      setHoursInput(shiftHours.toString());
    }
  };

  const handleIncrement = (codeId: string) => {
    onUnitsChange({ ...units, [codeId]: (units[codeId] || 0) + 1 });
  };

  const handleDecrement = (codeId: string) => {
    const current = units[codeId] || 0;
    if (current <= 0) return;
    onUnitsChange({ ...units, [codeId]: current - 1 });
  };

  const handlePressCount = (codeId: string) => {
    setEditingCodeId(codeId);
    setEditValue((units[codeId] || 0).toString());
  };

  const handleSetValue = () => {
    const val = parseInt(editValue, 10);
    if (!isNaN(val) && val >= 0) {
      onUnitsChange({ ...units, [editingCodeId!]: val });
    }
    setEditingCodeId(null);
  };

  const handleResetCode = () => {
    onUnitsChange({ ...units, [editingCodeId!]: 0 });
    setEditingCodeId(null);
  };

  const handleResetAll = () => {
    Alert.alert('Reset All', 'Reset all billing codes to zero?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset All',
        style: 'destructive',
        onPress: () => onUnitsChange({}),
      },
    ]);
  };

  const editingCode = codes.find((c) => c.id === editingCodeId);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={[s.header, { paddingTop: 8 + WEB_TOP_PAD }]}>
        <TouchableOpacity onPress={toggleTheme} style={s.headerBtn}>
          <Text style={s.headerBtnText}>{isDark ? 'Light' : 'Dark'}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Keats Time</Text>
        <TouchableOpacity onPress={onEditCodes} style={s.headerBtn}>
          <Text style={[s.headerBtnText, s.headerBtnRight]}>Edit Codes</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Shift Hours Card */}
          <View style={s.card}>
            <Text style={s.cardLabel}>HOURS ON SHIFT</Text>
            <View style={s.hoursRow}>
              <TextInput
                style={s.hoursInput}
                value={hoursInput}
                onChangeText={setHoursInput}
                onBlur={handleHoursBlur}
                keyboardType="decimal-pad"
                selectTextOnFocus
                returnKeyType="done"
                onSubmitEditing={handleHoursBlur}
              />
              <Text style={s.hoursUnit}>hrs</Text>
              <Text style={s.hoursEquals}>= {totalShiftMinutes} min</Text>
            </View>
          </View>

          {/* Mode Toggle */}
          <View style={s.modeToggleRow}>
            <TouchableOpacity
              style={[s.modeBtn, viewMode === 'minutes' && s.modeBtnActive]}
              onPress={() => setViewMode('minutes')}
            >
              <Text style={[s.modeBtnText, viewMode === 'minutes' && s.modeBtnTextActive]}>
                Min Left
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modeBtn, viewMode === 'dollars' && s.modeBtnActive]}
              onPress={() => setViewMode('dollars')}
            >
              <Text style={[s.modeBtnText, viewMode === 'dollars' && s.modeBtnTextActive]}>
                Est. Earned
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary Cards */}
          <View style={s.summaryRow}>
            <View style={[s.summaryCard, s.summaryUsedCard]}>
              <Text style={s.summaryNumber}>{usedMinutes}</Text>
              <Text style={s.summaryLabel}>min used</Text>
            </View>

            {viewMode === 'minutes' ? (
              <View style={[s.summaryCard, isOver ? s.summaryOverCard : s.summaryLeftCard]}>
                <Text style={[s.summaryNumber, isOver ? s.summaryOverNum : s.summaryLeftNum]}>
                  {Math.abs(leftMinutes)}
                </Text>
                <Text style={[s.summaryLabel, isOver ? s.summaryOverLabel : s.summaryLeftLabel]}>
                  {isOver ? 'min over!' : 'min left'}
                </Text>
              </View>
            ) : (
              <View style={[s.summaryCard, s.summaryEarnedCard]}>
                <Text style={[s.summaryNumber, s.summaryEarnedNum]} numberOfLines={1} adjustsFontSizeToFit>
                  ${totalEarnings.toFixed(2)}
                </Text>
                <Text style={[s.summaryLabel, s.summaryEarnedLabel]}>est. earned</Text>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                {
                  width: `${progressPercent}%` as any,
                  backgroundColor: isOver ? theme.red : theme.green,
                },
              ]}
            />
          </View>

          {/* Billing Codes */}
          <Text style={s.sectionTitle}>BILLING CODES</Text>

          {codes.map((code) => (
            <BillingCodeItem
              key={code.id}
              code={code}
              units={units[code.id] || 0}
              onIncrement={() => handleIncrement(code.id)}
              onDecrement={() => handleDecrement(code.id)}
              onPressCount={() => handlePressCount(code.id)}
            />
          ))}

          {codes.length === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>No billing codes yet.</Text>
              <TouchableOpacity onPress={onEditCodes}>
                <Text style={s.emptyLink}>Tap "Edit Codes" to add some.</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Reset All */}
          <TouchableOpacity
            style={s.resetBtn}
            onPress={handleResetAll}
            activeOpacity={0.7}
          >
            <Text style={s.resetBtnText}>Reset All</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Unit Editor Modal */}
      <Modal
        visible={editingCodeId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingCodeId(null)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setEditingCodeId(null)}
        >
          <TouchableOpacity style={s.modalBox} activeOpacity={1}>
            <Text style={s.modalCode}>{editingCode?.code}</Text>
            <Text style={s.modalDesc}>{editingCode?.description}</Text>
            <Text style={s.modalMeta}>
              {editingCode?.minutesPerUnit} min per unit
            </Text>

            <TextInput
              style={s.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="number-pad"
              selectTextOnFocus
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSetValue}
            />
            <Text style={s.modalInputLabel}>units</Text>

            {editValue !== '' && !isNaN(parseInt(editValue, 10)) && (() => {
              const n = parseInt(editValue, 10);
              return (
                <View style={{ alignItems: 'center' }}>
                  <Text style={s.modalPreview}>
                    = {n * (editingCode?.minutesPerUnit || 0)} min
                  </Text>
                  <Text style={s.modalPreviewDollars}>
                    = ${(n * (editingCode?.payPerUnit || 0)).toFixed(2)}
                  </Text>
                </View>
              );
            })()}

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnReset]}
                onPress={handleResetCode}
              >
                <Text style={s.modalBtnResetText}>Reset to 0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnSet]}
                onPress={handleSetValue}
              >
                <Text style={s.modalBtnSetText}>Set</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={s.modalCancel}
              onPress={() => setEditingCodeId(null)}
            >
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: t.headerBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: t.textPrimary,
    },
    headerBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: t.blueTint,
      borderRadius: 8,
      minWidth: 70,
    },
    headerBtnText: {
      fontSize: 13,
      color: t.blue,
      fontWeight: '600',
    },
    headerBtnRight: {
      textAlign: 'right',
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingBottom: 32,
      paddingTop: 16,
    },
    card: {
      backgroundColor: t.cardBg,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 14,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    cardLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: t.textTertiary,
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    hoursRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    hoursInput: {
      width: 90,
      height: 52,
      fontSize: 32,
      fontWeight: '700',
      color: t.textPrimary,
      backgroundColor: t.inputBg,
      borderRadius: 10,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
    hoursUnit: {
      fontSize: 20,
      color: t.textSecondary,
      fontWeight: '500',
    },
    hoursEquals: {
      fontSize: 16,
      color: t.textTertiary,
      marginLeft: 4,
      fontWeight: '500',
    },
    summaryRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 10,
      gap: 10,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    modeToggleRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 10,
      backgroundColor: t.inputBg,
      borderRadius: 10,
      padding: 3,
    },
    modeBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    modeBtnActive: {
      backgroundColor: t.cardBg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    modeBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textTertiary,
    },
    modeBtnTextActive: {
      color: t.textPrimary,
    },
    summaryUsedCard: { backgroundColor: t.cardBg },
    summaryLeftCard: { backgroundColor: t.greenTint },
    summaryOverCard: { backgroundColor: t.redTint },
    summaryEarnedCard: { backgroundColor: t.blueTint },
    summaryNumber: {
      fontSize: 36,
      fontWeight: '800',
      color: t.textPrimary,
      lineHeight: 42,
    },
    summaryOverNum: { color: t.red },
    summaryLeftNum: { color: t.green },
    summaryEarnedNum: { color: t.blue },
    summaryLabel: {
      fontSize: 13,
      color: t.textSecondary,
      fontWeight: '500',
      marginTop: 2,
    },
    summaryOverLabel: { color: t.red },
    summaryLeftLabel: { color: t.green },
    summaryEarnedLabel: { color: t.blue },
    progressTrack: {
      height: 6,
      backgroundColor: t.progressBg,
      marginHorizontal: 16,
      borderRadius: 3,
      marginBottom: 20,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: t.textTertiary,
      letterSpacing: 0.8,
      marginHorizontal: 20,
      marginBottom: 10,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: 16,
      color: t.textTertiary,
    },
    emptyLink: {
      fontSize: 15,
      color: t.blue,
      marginTop: 8,
    },
    resetBtn: {
      marginHorizontal: 16,
      marginTop: 20,
      height: 52,
      backgroundColor: t.red,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: t.red,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    resetBtnText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    modalBox: {
      backgroundColor: t.modalBg,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 340,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    modalCode: {
      fontSize: 22,
      fontWeight: '800',
      color: t.textPrimary,
      marginBottom: 4,
    },
    modalDesc: {
      fontSize: 14,
      color: t.textSecondary,
      textAlign: 'center',
      marginBottom: 4,
    },
    modalMeta: {
      fontSize: 12,
      color: t.textTertiary,
      marginBottom: 20,
    },
    modalInput: {
      width: 120,
      height: 68,
      fontSize: 44,
      fontWeight: '800',
      color: t.blue,
      backgroundColor: t.inputBg,
      borderRadius: 14,
      textAlign: 'center',
    },
    modalInputLabel: {
      fontSize: 13,
      color: t.textTertiary,
      marginTop: 6,
      marginBottom: 4,
    },
    modalPreview: {
      fontSize: 15,
      color: t.green,
      fontWeight: '600',
      marginBottom: 2,
    },
    modalPreviewDollars: {
      fontSize: 14,
      color: t.blue,
      fontWeight: '600',
      marginBottom: 4,
    },
    modalBtns: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
      width: '100%',
    },
    modalBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBtnReset: { backgroundColor: t.inputBg },
    modalBtnResetText: {
      fontSize: 15,
      color: t.red,
      fontWeight: '600',
    },
    modalBtnSet: { backgroundColor: t.blue },
    modalBtnSetText: {
      fontSize: 15,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    modalCancel: {
      marginTop: 14,
      padding: 8,
    },
    modalCancelText: {
      fontSize: 15,
      color: t.textTertiary,
    },
  });
}
