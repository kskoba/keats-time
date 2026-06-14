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

interface Props {
  codes: BillingCode[];
  defaultCodes: BillingCode[];
  onSave: (codes: BillingCode[]) => void;
  onClose: () => void;
}

type EditingCode = {
  id: string;
  code: string;
  description: string;
  minutesPerUnit: string;
  payPerUnit: string;
};

const WEB_TOP_PAD = Platform.OS === 'web' ? 52 : 0;

export default function EditCodesScreen({
  codes,
  defaultCodes,
  onSave,
  onClose,
}: Props) {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [localCodes, setLocalCodes] = useState<BillingCode[]>(codes);
  const [editing, setEditing] = useState<EditingCode | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openEdit = (code: BillingCode) => {
    setIsNew(false);
    setEditing({
      id: code.id,
      code: code.code,
      description: code.description ?? '',
      minutesPerUnit: code.minutesPerUnit.toString(),
      payPerUnit: (code.payPerUnit ?? 0).toString(),
    });
  };

  const openNew = () => {
    setIsNew(true);
    setEditing({ id: Date.now().toString(), code: '', description: '', minutesPerUnit: '', payPerUnit: '' });
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    const minutes = parseFloat(editing.minutesPerUnit);
    const pay = parseFloat(editing.payPerUnit);
    if (!editing.code.trim()) {
      Alert.alert('Validation', 'Code name is required.');
      return;
    }
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert('Validation', 'Minutes per unit must be a positive number.');
      return;
    }
    const updated: BillingCode = {
      id: editing.id,
      code: editing.code.trim(),
      description: editing.description.trim(),
      minutesPerUnit: minutes,
      payPerUnit: isNaN(pay) ? 0 : pay,
    };
    setLocalCodes(
      isNew
        ? [...localCodes, updated]
        : localCodes.map((c) => (c.id === editing.id ? updated : c))
    );
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Code', 'Remove this billing code?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setLocalCodes(localCodes.filter((c) => c.id !== id)),
      },
    ]);
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Replace all codes with defaults from billing-codes.json?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => setLocalCodes(defaultCodes) },
      ]
    );
  };

  const handleSaveAndClose = () => {
    onSave(localCodes);
    onClose();
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.header, { paddingTop: 8 + WEB_TOP_PAD }]}>
        <TouchableOpacity onPress={onClose} style={s.headerSideBtn}>
          <Text style={s.headerSideBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Codes</Text>
        <TouchableOpacity onPress={handleSaveAndClose} style={s.headerSideBtn}>
          <Text style={[s.headerSideBtnText, s.headerSaveBtnText]}>Save</Text>
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
          <Text style={s.hint}>
            Edit codes here, or modify{' '}
            <Text style={s.hintCode}>assets/billing-codes.json</Text> before
            rebuilding to change defaults.
          </Text>

          {localCodes.map((code) => (
            <View key={code.id} style={s.row}>
              <View style={s.rowInfo}>
                <Text style={s.rowCode}>{code.code}</Text>
                <Text style={s.rowDesc} numberOfLines={1}>
                  {code.description}
                </Text>
                <Text style={s.rowMin}>{code.minutesPerUnit} min · ${code.payPerUnit.toFixed(2)}/unit</Text>
              </View>
              <View style={s.rowActions}>
                <TouchableOpacity style={s.editBtn} onPress={() => openEdit(code)}>
                  <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => handleDelete(code.id)}
                >
                  <Text style={s.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={s.addBtn} onPress={openNew}>
            <Text style={s.addBtnText}>+ Add New Code</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.resetDefaultsBtn} onPress={handleResetDefaults}>
            <Text style={s.resetDefaultsText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Edit / Add Modal */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={s.overlay}
            activeOpacity={1}
            onPress={() => setEditing(null)}
          >
            <TouchableOpacity style={s.editModal} activeOpacity={1}>
              <Text style={s.editModalTitle}>
                {isNew ? 'Add New Code' : 'Edit Code'}
              </Text>

              <Text style={s.fieldLabel}>CODE</Text>
              <TextInput
                style={s.fieldInput}
                value={editing?.code ?? ''}
                onChangeText={(v) => setEditing((e) => (e ? { ...e, code: v } : e))}
                placeholder="e.g. 90837"
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="characters"
                returnKeyType="next"
              />

              <Text style={s.fieldLabel}>DESCRIPTION</Text>
              <TextInput
                style={s.fieldInput}
                value={editing?.description ?? ''}
                onChangeText={(v) =>
                  setEditing((e) => (e ? { ...e, description: v } : e))
                }
                placeholder="e.g. Individual Therapy (53+ min)"
                placeholderTextColor={theme.textTertiary}
                returnKeyType="next"
              />

              <Text style={s.fieldLabel}>MINUTES PER UNIT</Text>
              <TextInput
                style={s.fieldInput}
                value={editing?.minutesPerUnit ?? ''}
                onChangeText={(v) =>
                  setEditing((e) => (e ? { ...e, minutesPerUnit: v } : e))
                }
                placeholder="e.g. 7.5"
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />

              <Text style={s.fieldLabel}>PAY PER UNIT ($)</Text>
              <TextInput
                style={s.fieldInput}
                value={editing?.payPerUnit ?? ''}
                onChangeText={(v) =>
                  setEditing((e) => (e ? { ...e, payPerUnit: v } : e))
                }
                placeholder="e.g. 58.61"
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleSaveEdit}
              />

              <View style={s.editModalBtns}>
                <TouchableOpacity
                  style={[s.editModalBtn, s.editModalBtnCancel]}
                  onPress={() => setEditing(null)}
                >
                  <Text style={s.editModalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.editModalBtn, s.editModalBtnSave]}
                  onPress={handleSaveEdit}
                >
                  <Text style={s.editModalBtnSaveText}>
                    {isNew ? 'Add' : 'Update'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
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
      fontSize: 17,
      fontWeight: '700',
      color: t.textPrimary,
    },
    headerSideBtn: {
      minWidth: 70,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    headerSideBtnText: {
      fontSize: 17,
      color: t.blue,
    },
    headerSaveBtnText: {
      fontWeight: '700',
      textAlign: 'right',
    },
    scroll: { flex: 1 },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    hint: {
      fontSize: 13,
      color: t.textSecondary,
      marginBottom: 16,
      lineHeight: 18,
    },
    hintCode: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: t.blue,
      fontSize: 12,
    },
    row: {
      backgroundColor: t.cardBg,
      borderRadius: 12,
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
    rowInfo: { flex: 1, marginRight: 8 },
    rowCode: {
      fontSize: 16,
      fontWeight: '700',
      color: t.textPrimary,
    },
    rowDesc: {
      fontSize: 13,
      color: t.textSecondary,
      marginTop: 2,
    },
    rowMin: {
      fontSize: 12,
      color: t.textTertiary,
      marginTop: 2,
    },
    rowActions: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    editBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: t.blueTint,
      borderRadius: 8,
    },
    editBtnText: {
      fontSize: 14,
      color: t.blue,
      fontWeight: '600',
    },
    deleteBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: t.redTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteBtnText: {
      fontSize: 14,
      color: t.red,
      fontWeight: '700',
    },
    addBtn: {
      height: 52,
      backgroundColor: t.cardBg,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: t.blue,
      borderStyle: 'dashed',
    },
    addBtnText: {
      fontSize: 16,
      color: t.blue,
      fontWeight: '600',
    },
    resetDefaultsBtn: {
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetDefaultsText: {
      fontSize: 15,
      color: t.orange,
      fontWeight: '600',
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    editModal: {
      backgroundColor: t.modalBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 24,
      paddingBottom: 40,
    },
    editModalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: t.textPrimary,
      marginBottom: 20,
      textAlign: 'center',
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: t.textTertiary,
      letterSpacing: 0.8,
      marginBottom: 6,
      marginTop: 14,
    },
    fieldInput: {
      height: 48,
      backgroundColor: t.inputBg,
      borderRadius: 10,
      paddingHorizontal: 14,
      fontSize: 16,
      color: t.textPrimary,
    },
    editModalBtns: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    editModalBtn: {
      flex: 1,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editModalBtnCancel: { backgroundColor: t.inputBg },
    editModalBtnCancelText: {
      fontSize: 16,
      color: t.textSecondary,
      fontWeight: '600',
    },
    editModalBtnSave: { backgroundColor: t.blue },
    editModalBtnSaveText: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
}
