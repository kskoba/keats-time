import React, { useState } from 'react';
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
import BillingCodeItem from '../components/BillingCodeItem';

interface Props {
  codes: BillingCode[];
  units: Record<string, number>;
  shiftHours: number;
  onUnitsChange: (units: Record<string, number>) => void;
  onShiftHoursChange: (hours: number) => void;
  onEditCodes: () => void;
}

export default function HomeScreen({
  codes,
  units,
  shiftHours,
  onUnitsChange,
  onShiftHoursChange,
  onEditCodes,
}: Props) {
  const [hoursInput, setHoursInput] = useState(shiftHours.toString());
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const totalShiftMinutes = Math.round(shiftHours * 60);
  const usedMinutes = codes.reduce(
    (sum, code) => sum + (units[code.id] || 0) * code.minutesPerUnit,
    0
  );
  const leftMinutes = totalShiftMinutes - usedMinutes;
  const isOver = leftMinutes < 0;
  const progressPercent = totalShiftMinutes > 0
    ? Math.min(100, (usedMinutes / totalShiftMinutes) * 100)
    : 0;

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
    Alert.alert(
      'Reset All',
      'Reset all billing codes to zero?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset All', style: 'destructive', onPress: () => onUnitsChange({}) },
      ]
    );
  };

  const editingCode = codes.find((c) => c.id === editingCodeId);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Keats Time</Text>
        <TouchableOpacity onPress={onEditCodes} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Edit Codes</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Shift Hours Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>HOURS ON SHIFT</Text>
            <View style={styles.hoursRow}>
              <TextInput
                style={styles.hoursInput}
                value={hoursInput}
                onChangeText={setHoursInput}
                onBlur={handleHoursBlur}
                keyboardType="decimal-pad"
                selectTextOnFocus
                returnKeyType="done"
                onSubmitEditing={handleHoursBlur}
              />
              <Text style={styles.hoursUnit}>hrs</Text>
              <Text style={styles.hoursEquals}>= {totalShiftMinutes} min</Text>
            </View>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryUsedCard]}>
              <Text style={styles.summaryNumber}>{usedMinutes}</Text>
              <Text style={styles.summaryLabel}>min used</Text>
            </View>
            <View
              style={[
                styles.summaryCard,
                isOver ? styles.summaryOverCard : styles.summaryLeftCard,
              ]}
            >
              <Text
                style={[
                  styles.summaryNumber,
                  isOver ? styles.summaryOverNum : styles.summaryLeftNum,
                ]}
              >
                {Math.abs(leftMinutes)}
              </Text>
              <Text
                style={[
                  styles.summaryLabel,
                  isOver ? styles.summaryOverLabel : styles.summaryLeftLabel,
                ]}
              >
                {isOver ? 'min over!' : 'min left'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%` as any,
                  backgroundColor: isOver ? '#FF3B30' : '#34C759',
                },
              ]}
            />
          </View>

          {/* Billing Codes */}
          <Text style={styles.sectionTitle}>BILLING CODES</Text>

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
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No billing codes yet.</Text>
              <TouchableOpacity onPress={onEditCodes}>
                <Text style={styles.emptyLink}>Tap "Edit Codes" to add some.</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Reset All */}
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleResetAll}
            activeOpacity={0.7}
          >
            <Text style={styles.resetBtnText}>Reset All</Text>
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
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setEditingCodeId(null)}
        >
          <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <Text style={styles.modalCode}>{editingCode?.code}</Text>
            <Text style={styles.modalDesc}>{editingCode?.description}</Text>
            <Text style={styles.modalMeta}>
              {editingCode?.minutesPerUnit} min per unit
            </Text>

            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="number-pad"
              selectTextOnFocus
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSetValue}
            />
            <Text style={styles.modalInputLabel}>units</Text>

            {editValue !== '' && !isNaN(parseInt(editValue, 10)) && (
              <Text style={styles.modalPreview}>
                = {parseInt(editValue, 10) * (editingCode?.minutesPerUnit || 0)} minutes
              </Text>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnReset]}
                onPress={handleResetCode}
              >
                <Text style={styles.modalBtnResetText}>Reset to 0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSet]}
                onPress={handleSetValue}
              >
                <Text style={styles.modalBtnSetText}>Set</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setEditingCodeId(null)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#EEF4FF',
    borderRadius: 8,
  },
  headerBtnText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
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
    color: '#8E8E93',
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
    color: '#1C1C1E',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  hoursUnit: {
    fontSize: 20,
    color: '#636366',
    fontWeight: '500',
  },
  hoursEquals: {
    fontSize: 16,
    color: '#8E8E93',
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
  summaryUsedCard: {
    backgroundColor: '#FFFFFF',
  },
  summaryLeftCard: {
    backgroundColor: '#F0FBF0',
  },
  summaryOverCard: {
    backgroundColor: '#FFF2F0',
  },
  summaryNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1C1C1E',
    lineHeight: 42,
  },
  summaryOverNum: {
    color: '#FF3B30',
  },
  summaryLeftNum: {
    color: '#34C759',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#636366',
    fontWeight: '500',
    marginTop: 2,
  },
  summaryOverLabel: {
    color: '#FF3B30',
  },
  summaryLeftLabel: {
    color: '#34C759',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E5EA',
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
    color: '#8E8E93',
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
    color: '#8E8E93',
  },
  emptyLink: {
    fontSize: 15,
    color: '#007AFF',
    marginTop: 8,
  },
  resetBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    height: 52,
    backgroundColor: '#FF3B30',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCode: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 14,
    color: '#636366',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 20,
  },
  modalInput: {
    width: 120,
    height: 68,
    fontSize: 44,
    fontWeight: '800',
    color: '#007AFF',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    textAlign: 'center',
  },
  modalInputLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 6,
    marginBottom: 4,
  },
  modalPreview: {
    fontSize: 15,
    color: '#34C759',
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
  modalBtnReset: {
    backgroundColor: '#F2F2F7',
  },
  modalBtnResetText: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '600',
  },
  modalBtnSet: {
    backgroundColor: '#007AFF',
  },
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
    color: '#8E8E93',
  },
});
