import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BillingCode, TimeEntry } from '../types';
import { useTheme, Theme } from '../ThemeContext';
import BillingCodeItem from '../components/BillingCodeItem';
import WheelPicker from '../components/WheelPicker';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTE_LABELS = ['00', '15', '30', '45'];
const MINUTE_VALS = [0, 15, 30, 45] as const;

function calcShiftMinutes(start: TimeEntry, end: TimeEntry): number {
  const s = start.hour * 60 + start.minute;
  const e = end.hour * 60 + end.minute;
  let diff = e - s;
  if (diff <= 0) diff += 24 * 60;
  return diff;
}

function calcBonusPay(start: TimeEntry, end: TimeEntry, isWeekendStat: boolean): number {
  const s = start.hour * 60 + start.minute;
  let e = end.hour * 60 + end.minute;
  if (e <= s) e += 24 * 60;
  let bonus = 0;
  for (let t = s; t < e; t += 15) {
    const h = Math.floor((t % 1440) / 60);
    if (h >= 17 && h < 22) bonus += 22.79;
    if (h >= 22 || h < 7) bonus += 45.55;
    if (isWeekendStat && h >= 7 && h < 22) bonus += 22.79;
  }
  return bonus;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const WEB_TOP_PAD = Platform.OS === 'web' ? 52 : 0;

interface Props {
  codes: BillingCode[];
  units: Record<string, number>;
  startTime: TimeEntry;
  endTime: TimeEntry;
  isWeekendStat: boolean;
  onUnitsChange: (units: Record<string, number>) => void;
  onStartTimeChange: (t: TimeEntry) => void;
  onEndTimeChange: (t: TimeEntry) => void;
  onWeekendStatChange: (v: boolean) => void;
  onEditCodes: () => void;
}

export default function HomeScreen({
  codes,
  units,
  startTime,
  endTime,
  isWeekendStat,
  onUnitsChange,
  onStartTimeChange,
  onEndTimeChange,
  onWeekendStatChange,
  onEditCodes,
}: Props) {
  const { theme, isDark, toggleTheme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [viewMode, setViewMode] = useState<'minutes' | 'dollars'>('minutes');
  const [pickingTime, setPickingTime] = useState<'start' | 'end' | null>(null);
  const [draftStart, setDraftStart] = useState<TimeEntry>(startTime);
  const [draftEnd, setDraftEnd] = useState<TimeEntry>(endTime);

  const openPicker = (which: 'start' | 'end') => {
    if (which === 'start') setDraftStart(startTime);
    else setDraftEnd(endTime);
    setPickingTime(which);
  };

  const commitPicker = () => {
    if (pickingTime === 'start') onStartTimeChange(draftStart);
    else if (pickingTime === 'end') onEndTimeChange(draftEnd);
    setPickingTime(null);
  };

  const totalShiftMinutes = calcShiftMinutes(startTime, endTime);
  const usedMinutes = codes.reduce(
    (sum, code) => sum + (units[code.id] || 0) * code.minutesPerUnit,
    0
  );
  const leftMinutes = totalShiftMinutes - usedMinutes;
  const isOver = leftMinutes < 0;
  const progressPercent =
    totalShiftMinutes > 0 ? Math.min(100, (usedMinutes / totalShiftMinutes) * 100) : 0;
  const billingEarnings = codes.reduce(
    (sum, code) => sum + (units[code.id] || 0) * (code.payPerUnit || 0),
    0
  );
  const bonusPay = calcBonusPay(startTime, endTime, isWeekendStat);
  const totalEarnings = billingEarnings + bonusPay;

  const handleIncrement = (codeId: string) =>
    onUnitsChange({ ...units, [codeId]: (units[codeId] || 0) + 1 });

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
      { text: 'Reset All', style: 'destructive', onPress: () => onUnitsChange({}) },
    ]);
  };

  const editingCode = codes.find((c) => c.id === editingCodeId);

  const stepHour = (t: TimeEntry, dir: 1 | -1, cb: (t: TimeEntry) => void) =>
    cb({ ...t, hour: (t.hour + dir + 24) % 24 });
  const stepMinute = (t: TimeEntry, dir: 1 | -1, cb: (t: TimeEntry) => void) => {
    const idx = Math.max(0, MINUTE_VALS.indexOf(t.minute as any));
    cb({ ...t, minute: MINUTE_VALS[(idx + dir + 4) % 4] });
  };

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

      {/* Weekend / Stat toggle */}
      <View style={s.subHeader}>
        <TouchableOpacity
          style={[s.wkndBtn, isWeekendStat && s.wkndBtnActive]}
          onPress={() => onWeekendStatChange(!isWeekendStat)}
        >
          <Text style={[s.wkndBtnText, isWeekendStat && s.wkndBtnTextActive]}>
            {isWeekendStat ? '★  Weekend / Stat  ON' : '☆  Weekend / Stat'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sticky summary */}
      <View style={s.stickySection}>
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
              Est. Value
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.summaryRow}>
          <View style={[s.summaryCard, s.summaryUsedCard]}>
            <Text style={s.summaryNumber}>{Math.round(usedMinutes)}</Text>
            <Text style={s.summaryLabel}>min used</Text>
          </View>

          {viewMode === 'minutes' ? (
            <View style={[s.summaryCard, isOver ? s.summaryOverCard : s.summaryLeftCard]}>
              <Text style={[s.summaryNumber, isOver ? s.summaryOverNum : s.summaryLeftNum]}>
                {Math.abs(Math.round(leftMinutes))}
              </Text>
              <Text style={[s.summaryLabel, isOver ? s.summaryOverLabel : s.summaryLeftLabel]}>
                {isOver ? 'min over!' : 'min left'}
              </Text>
            </View>
          ) : (
            <View style={[s.summaryCard, s.summaryEarnedCard]}>
              <Text
                style={[s.summaryNumber, s.summaryEarnedNum]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                ${totalEarnings.toFixed(2)}
              </Text>
              <Text style={[s.summaryLabel, s.summaryEarnedLabel]}>est. value</Text>
            </View>
          )}
        </View>

        <View style={s.progressTrack}>
          <View
            style={[
              s.progressFill,
              { width: `${progressPercent}%` as any, backgroundColor: isOver ? theme.red : theme.green },
            ]}
          />
        </View>
      </View>

      {/* Scrollable content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Shift time picker */}
          <View style={s.card}>
            <Text style={s.cardLabel}>SHIFT TIME  •  {formatDuration(totalShiftMinutes)}</Text>
            <View style={s.timePickerRow}>
              <View style={s.timePickerSide}>
                <Text style={s.timePickerSideLabel}>START</Text>
                {Platform.OS === 'web' ? (
                  <View style={s.stepperRow}>
                    <View style={s.stepperUnit}>
                      <TouchableOpacity onPress={() => stepHour(startTime, 1, onStartTimeChange)} hitSlop={{ top: 8, bottom: 4, left: 12, right: 12 }}>
                        <Text style={s.stepperArrow}>▲</Text>
                      </TouchableOpacity>
                      <Text style={s.stepperVal}>{startTime.hour.toString().padStart(2, '0')}</Text>
                      <TouchableOpacity onPress={() => stepHour(startTime, -1, onStartTimeChange)} hitSlop={{ top: 4, bottom: 8, left: 12, right: 12 }}>
                        <Text style={s.stepperArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={s.timeSep}>:</Text>
                    <View style={s.stepperUnit}>
                      <TouchableOpacity onPress={() => stepMinute(startTime, 1, onStartTimeChange)} hitSlop={{ top: 8, bottom: 4, left: 12, right: 12 }}>
                        <Text style={s.stepperArrow}>▲</Text>
                      </TouchableOpacity>
                      <Text style={s.stepperVal}>{startTime.minute.toString().padStart(2, '0')}</Text>
                      <TouchableOpacity onPress={() => stepMinute(startTime, -1, onStartTimeChange)} hitSlop={{ top: 4, bottom: 8, left: 12, right: 12 }}>
                        <Text style={s.stepperArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={s.timeDisplayBtn} onPress={() => openPicker('start')}>
                    <Text style={s.timeDisplayText}>
                      {startTime.hour.toString().padStart(2, '0')}:{startTime.minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={s.timeArrow}>
                <Text style={s.timeArrowText}>→</Text>
              </View>

              <View style={s.timePickerSide}>
                <Text style={s.timePickerSideLabel}>END</Text>
                {Platform.OS === 'web' ? (
                  <View style={s.stepperRow}>
                    <View style={s.stepperUnit}>
                      <TouchableOpacity onPress={() => stepHour(endTime, 1, onEndTimeChange)} hitSlop={{ top: 8, bottom: 4, left: 12, right: 12 }}>
                        <Text style={s.stepperArrow}>▲</Text>
                      </TouchableOpacity>
                      <Text style={s.stepperVal}>{endTime.hour.toString().padStart(2, '0')}</Text>
                      <TouchableOpacity onPress={() => stepHour(endTime, -1, onEndTimeChange)} hitSlop={{ top: 4, bottom: 8, left: 12, right: 12 }}>
                        <Text style={s.stepperArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={s.timeSep}>:</Text>
                    <View style={s.stepperUnit}>
                      <TouchableOpacity onPress={() => stepMinute(endTime, 1, onEndTimeChange)} hitSlop={{ top: 8, bottom: 4, left: 12, right: 12 }}>
                        <Text style={s.stepperArrow}>▲</Text>
                      </TouchableOpacity>
                      <Text style={s.stepperVal}>{endTime.minute.toString().padStart(2, '0')}</Text>
                      <TouchableOpacity onPress={() => stepMinute(endTime, -1, onEndTimeChange)} hitSlop={{ top: 4, bottom: 8, left: 12, right: 12 }}>
                        <Text style={s.stepperArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={s.timeDisplayBtn} onPress={() => openPicker('end')}>
                    <Text style={s.timeDisplayText}>
                      {endTime.hour.toString().padStart(2, '0')}:{endTime.minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {bonusPay > 0 && (
              <Text style={s.bonusLabel}>+${bonusPay.toFixed(2)} shift premium</Text>
            )}
          </View>

          {/* Billing codes */}
          <Text style={s.sectionTitle}>BILLING CODES</Text>

          {codes.map((code, index) => {
            const nextCode = codes[index + 1];
            const isSwapPair = code.id === '4' && nextCode?.id === '5';
            return (
              <React.Fragment key={code.id}>
                <BillingCodeItem
                  code={code}
                  units={units[code.id] || 0}
                  onIncrement={() => handleIncrement(code.id)}
                  onDecrement={() => handleDecrement(code.id)}
                  onPressCount={() => handlePressCount(code.id)}
                />
                {isSwapPair && (
                  <View style={s.swapRow}>
                    <TouchableOpacity
                      style={[s.swapBtn, s.swapBtnGreen, (units['4'] || 0) === 0 && s.swapBtnDisabled]}
                      disabled={(units['4'] || 0) === 0}
                      onPress={() =>
                        onUnitsChange({
                          ...units,
                          '4': (units['4'] || 0) - 1,
                          '5': (units['5'] || 0) + 1,
                        })
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                    >
                      <Text style={[s.swapBtnText, s.swapBtnTextGreen]}>+CMXV30  ↓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.swapBtn, s.swapBtnRed, (units['5'] || 0) === 0 && s.swapBtnDisabled]}
                      disabled={(units['5'] || 0) === 0}
                      onPress={() =>
                        onUnitsChange({
                          ...units,
                          '5': (units['5'] || 0) - 1,
                          '4': (units['4'] || 0) + 1,
                        })
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                    >
                      <Text style={[s.swapBtnText, s.swapBtnTextRed]}>-CMXV30  ↑</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </React.Fragment>
            );
          })}

          {codes.length === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>No billing codes yet.</Text>
              <TouchableOpacity onPress={onEditCodes}>
                <Text style={s.emptyLink}>Tap "Edit Codes" to add some.</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={s.resetBtn} onPress={handleResetAll} activeOpacity={0.7}>
            <Text style={s.resetBtnText}>Reset All</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Time Picker Modal */}
      <Modal
        visible={pickingTime !== null}
        transparent
        animationType="slide"
        onRequestClose={commitPicker}
      >
        <View style={s.pickerOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={commitPicker} />
          <View style={s.pickerSheet}>
            <View style={s.pickerHeader}>
              <Text style={s.pickerTitle}>
                {pickingTime === 'start' ? 'Start Time' : 'End Time'}
              </Text>
              <TouchableOpacity onPress={commitPicker} style={s.pickerDoneBtn}>
                <Text style={s.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={s.pickerWheelRow}>
              {pickingTime === 'start' ? (
                <>
                  <WheelPicker
                    items={HOURS}
                    selectedIndex={draftStart.hour}
                    onChange={(i) => setDraftStart((d) => ({ ...d, hour: i }))}
                    width={90}
                  />
                  <Text style={s.pickerSep}>:</Text>
                  <WheelPicker
                    items={MINUTE_LABELS}
                    selectedIndex={Math.max(0, MINUTE_VALS.indexOf(draftStart.minute as any))}
                    onChange={(i) => setDraftStart((d) => ({ ...d, minute: MINUTE_VALS[i] }))}
                    width={90}
                  />
                </>
              ) : (
                <>
                  <WheelPicker
                    items={HOURS}
                    selectedIndex={draftEnd.hour}
                    onChange={(i) => setDraftEnd((d) => ({ ...d, hour: i }))}
                    width={90}
                  />
                  <Text style={s.pickerSep}>:</Text>
                  <WheelPicker
                    items={MINUTE_LABELS}
                    selectedIndex={Math.max(0, MINUTE_VALS.indexOf(draftEnd.minute as any))}
                    onChange={(i) => setDraftEnd((d) => ({ ...d, minute: MINUTE_VALS[i] }))}
                    width={90}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

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
            <Text style={s.modalMeta}>{editingCode?.minutesPerUnit} min per unit</Text>

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
              <TouchableOpacity style={[s.modalBtn, s.modalBtnReset]} onPress={handleResetCode}>
                <Text style={s.modalBtnResetText}>Reset to 0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.modalBtnSet]} onPress={handleSetValue}>
                <Text style={s.modalBtnSetText}>Set</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.modalCancel} onPress={() => setEditingCodeId(null)}>
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
    safe: { flex: 1, backgroundColor: t.bg },
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
    headerTitle: { fontSize: 18, fontWeight: '700', color: t.textPrimary },
    headerBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: t.blueTint,
      borderRadius: 8,
      minWidth: 70,
    },
    headerBtnText: { fontSize: 13, color: t.blue, fontWeight: '600' },
    headerBtnRight: { textAlign: 'right' },
    subHeader: {
      backgroundColor: t.headerBg,
      paddingHorizontal: 16,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
      alignItems: 'center',
    },
    wkndBtn: {
      paddingVertical: 6,
      paddingHorizontal: 20,
      borderRadius: 20,
      backgroundColor: t.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    wkndBtnActive: {
      backgroundColor: t.orange + '22',
      borderColor: t.orange,
    },
    wkndBtnText: { fontSize: 13, fontWeight: '600', color: t.textTertiary },
    wkndBtnTextActive: { color: t.orange },
    stickySection: {
      backgroundColor: t.headerBg,
      paddingTop: 10,
      paddingBottom: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
      elevation: 3,
    },
    modeToggleRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: t.inputBg,
      borderRadius: 10,
      padding: 3,
    },
    modeBtn: {
      flex: 1,
      paddingVertical: 7,
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
    modeBtnText: { fontSize: 13, fontWeight: '600', color: t.textTertiary },
    modeBtnTextActive: { color: t.textPrimary },
    summaryRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 8,
      gap: 10,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 12,
      padding: 10,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    summaryUsedCard: { backgroundColor: t.cardBg },
    summaryLeftCard: { backgroundColor: t.greenTint },
    summaryOverCard: { backgroundColor: t.redTint },
    summaryEarnedCard: { backgroundColor: t.blueTint },
    summaryNumber: {
      fontSize: 30,
      fontWeight: '800',
      color: t.textPrimary,
      lineHeight: 36,
    },
    summaryOverNum: { color: t.red },
    summaryLeftNum: { color: t.green },
    summaryEarnedNum: { color: t.blue },
    summaryLabel: { fontSize: 11, color: t.textSecondary, fontWeight: '500', marginTop: 2 },
    summaryOverLabel: { color: t.red },
    summaryLeftLabel: { color: t.green },
    summaryEarnedLabel: { color: t.blue },
    progressTrack: {
      height: 5,
      backgroundColor: t.progressBg,
      marginHorizontal: 16,
      borderRadius: 3,
      marginBottom: 4,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 3 },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 32, paddingTop: 16 },
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
    timePickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timePickerSide: {
      flex: 1,
      alignItems: 'center',
    },
    timePickerSideLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: t.textTertiary,
      letterSpacing: 1,
      marginBottom: 6,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    stepperUnit: {
      alignItems: 'center',
      gap: 2,
    },
    stepperArrow: {
      fontSize: 14,
      color: t.blue,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    stepperVal: {
      fontSize: 28,
      fontWeight: '700',
      color: t.textPrimary,
      minWidth: 44,
      textAlign: 'center',
    },
    timeSep: {
      fontSize: 24,
      fontWeight: '700',
      color: t.textSecondary,
      marginBottom: 2,
      paddingHorizontal: 2,
    },
    timeArrow: {
      paddingHorizontal: 6,
      alignItems: 'center',
    },
    timeArrowText: {
      fontSize: 18,
      color: t.textTertiary,
    },
    bonusLabel: {
      fontSize: 12,
      color: t.orange,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 10,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: t.textTertiary,
      letterSpacing: 0.8,
      marginHorizontal: 20,
      marginBottom: 10,
    },
    swapRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: -4,
      marginBottom: 6,
      gap: 8,
    },
    swapBtn: {
      flex: 1,
      paddingVertical: 7,
      paddingHorizontal: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    swapBtnGreen: { backgroundColor: t.greenTint },
    swapBtnRed: { backgroundColor: t.redTint },
    swapBtnDisabled: { opacity: 0.35 },
    swapBtnText: { fontSize: 13, fontWeight: '700' },
    swapBtnTextGreen: { color: t.green },
    swapBtnTextRed: { color: t.red },
    emptyState: { alignItems: 'center', paddingVertical: 32 },
    emptyText: { fontSize: 16, color: t.textTertiary },
    emptyLink: { fontSize: 15, color: t.blue, marginTop: 8 },
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
    resetBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
    timeDisplayBtn: {
      marginTop: 4,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: t.blueTint,
      borderRadius: 12,
      alignItems: 'center',
    },
    timeDisplayText: {
      fontSize: 32,
      fontWeight: '700',
      color: t.blue,
      letterSpacing: 1,
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    pickerSheet: {
      backgroundColor: t.modalBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 34,
    },
    pickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    pickerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: t.textPrimary,
    },
    pickerDoneBtn: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    pickerDoneText: {
      fontSize: 17,
      fontWeight: '700',
      color: t.blue,
    },
    pickerWheelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      gap: 4,
    },
    pickerSep: {
      fontSize: 32,
      fontWeight: '700',
      color: t.textPrimary,
      paddingHorizontal: 4,
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
    modalCode: { fontSize: 22, fontWeight: '800', color: t.textPrimary, marginBottom: 4 },
    modalDesc: { fontSize: 14, color: t.textSecondary, textAlign: 'center', marginBottom: 4 },
    modalMeta: { fontSize: 12, color: t.textTertiary, marginBottom: 20 },
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
    modalInputLabel: { fontSize: 13, color: t.textTertiary, marginTop: 6, marginBottom: 4 },
    modalPreview: { fontSize: 15, color: t.green, fontWeight: '600', marginBottom: 2 },
    modalPreviewDollars: { fontSize: 14, color: t.blue, fontWeight: '600', marginBottom: 4 },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
    modalBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    modalBtnReset: { backgroundColor: t.inputBg },
    modalBtnResetText: { fontSize: 15, color: t.red, fontWeight: '600' },
    modalBtnSet: { backgroundColor: t.blue },
    modalBtnSetText: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
    modalCancel: { marginTop: 14, padding: 8 },
    modalCancelText: { fontSize: 15, color: t.textTertiary },
  });
}
