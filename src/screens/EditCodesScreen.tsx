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

type ListItem =
  | { type: 'single'; code: BillingCode }
  | { type: 'pair'; codes: [BillingCode, BillingCode] };

function codesToListItems(codes: BillingCode[]): ListItem[] {
  const items: ListItem[] = [];
  let i = 0;
  while (i < codes.length) {
    if (codes[i].id === '4' && codes[i + 1]?.id === '5') {
      items.push({ type: 'pair', codes: [codes[i], codes[i + 1]] });
      i += 2;
    } else {
      items.push({ type: 'single', code: codes[i] });
      i++;
    }
  }
  return items;
}

function listItemsToCodes(items: ListItem[]): BillingCode[] {
  return items.flatMap((item) =>
    item.type === 'pair' ? item.codes : [item.code]
  );
}

type EditingCode = {
  id: string;
  code: string;
  description: string;
  minutesPerUnit: string;
  payPerUnit: string;
};

const WEB_TOP_PAD = Platform.OS === 'web' ? 52 : 0;

export default function EditCodesScreen({ codes, defaultCodes, onSave, onClose }: Props) {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [localCodes, setLocalCodes] = useState<BillingCode[]>(codes);
  const [editing, setEditing] = useState<EditingCode | null>(null);
  const [isNew, setIsNew] = useState(false);

  const listItems = useMemo(() => codesToListItems(localCodes), [localCodes]);

  const moveItem = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= listItems.length) return;
    const updated = [...listItems];
    [updated[index], updated[next]] = [updated[next], updated[index]];
    setLocalCodes(listItemsToCodes(updated));
  };

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
    if (!editing.code.trim()) { Alert.alert('Validation', 'Code name is required.'); return; }
    if (isNaN(minutes) || minutes <= 0) { Alert.alert('Validation', 'Minutes per unit must be a positive number.'); return; }
    const updated: BillingCode = {
      id: editing.id,
      code: editing.code.trim(),
      description: editing.description.trim(),
      minutesPerUnit: minutes,
      payPerUnit: isNaN(pay) ? 0 : pay,
    };
    setLocalCodes(isNew ? [...localCodes, updated] : localCodes.map((c) => (c.id === editing.id ? updated : c)));
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Code', 'Remove this billing code?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setLocalCodes(localCodes.filter((c) => c.id !== id)) },
    ]);
  };

  const handleResetDefaults = () => {
    Alert.alert('Reset to Defaults', 'Replace all codes with defaults?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => setLocalCodes(defaultCodes) },
    ]);
  };

  const renderCodeRow = (code: BillingCode) => (
    <View style={s.codeRow} key={code.id}>
      <View style={s.rowInfo}>
        <Text style={s.rowCode}>{code.code}</Text>
        {!!code.description && <Text style={s.rowDesc} numberOfLines={1}>{code.description}</Text>}
        <Text style={s.rowMin}>{code.minutesPerUnit} min · ${code.payPerUnit.toFixed(2)}/unit</Text>
      </View>
      <View style={s.rowActions}>
        <TouchableOpacity style={s.editBtn} onPress={() => openEdit(code)}>
          <Text style={s.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(code.id)}>
          <Text style={s.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.header, { paddingTop: 8 + WEB_TOP_PAD }]}>
        <TouchableOpacity onPress={onClose} style={s.headerSideBtn}>
          <Text style={s.headerSideBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Codes</Text>
        <TouchableOpacity onPress={() => { onSave(localCodes); onClose(); }} style={s.headerSideBtn}>
          <Text style={[s.headerSideBtnText, s.headerSaveBtnText]}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={s.hint}>Use ▲▼ to reorder. The 03.04 pair always moves together.</Text>

          {listItems.map((item, index) => {
            if (item.type === 'pair') {
              return (
                <View key="pair-4-5" style={[s.row, s.pairRow]}>
                  <View style={s.moveCol}>
                    <TouchableOpacity
                      onPress={() => moveItem(index, -1)}
                      disabled={index === 0}
                      hitSlop={{ top: 8, bottom: 4, left: 10, right: 10 }}
                    >
                      <Text style={[s.moveArrow, index === 0 && s.moveArrowDisabled]}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveItem(index, 1)}
                      disabled={index === listItems.length - 1}
                      hitSlop={{ top: 4, bottom: 8, left: 10, right: 10 }}
                    >
                      <Text style={[s.moveArrow, index === listItems.length - 1 && s.moveArrowDisabled]}>▼</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    {renderCodeRow(item.codes[0])}
                    <View style={s.pairDivider}>
                      <Text style={s.pairDividerText}>⇄ swap linked</Text>
                    </View>
                    {renderCodeRow(item.codes[1])}
                  </View>
                </View>
              );
            }

            return (
              <View key={item.code.id} style={s.row}>
                <View style={s.moveCol}>
                  <TouchableOpacity
                    onPress={() => moveItem(index, -1)}
                    disabled={index === 0}
                    hitSlop={{ top: 8, bottom: 4, left: 10, right: 10 }}
                  >
                    <Text style={[s.moveArrow, index === 0 && s.moveArrowDisabled]}>▲</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveItem(index, 1)}
                    disabled={index === listItems.length - 1}
                    hitSlop={{ top: 4, bottom: 8, left: 10, right: 10 }}
                  >
                    <Text style={[s.moveArrow, index === listItems.length - 1 && s.moveArrowDisabled]}>▼</Text>
                  </TouchableOpacity>
                </View>
                {renderCodeRow(item.code)}
              </View>
            );
          })}

          <TouchableOpacity style={s.addBtn} onPress={openNew}>
            <Text style={s.addBtnText}>+ Add New Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.resetDefaultsBtn} onPress={handleResetDefaults}>
            <Text style={s.resetDefaultsText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={editing !== null} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setEditing(null)}>
            <TouchableOpacity style={s.editModal} activeOpacity={1}>
              <Text style={s.editModalTitle}>{isNew ? 'Add New Code' : 'Edit Code'}</Text>

              <Text style={s.fieldLabel}>CODE</Text>
              <TextInput style={s.fieldInput} value={editing?.code ?? ''} onChangeText={(v) => setEditing((e) => e ? { ...e, code: v } : e)} placeholder="e.g. 90837" placeholderTextColor={theme.textTertiary} autoCapitalize="characters" returnKeyType="next" />

              <Text style={s.fieldLabel}>DESCRIPTION</Text>
              <TextInput style={s.fieldInput} value={editing?.description ?? ''} onChangeText={(v) => setEditing((e) => e ? { ...e, description: v } : e)} placeholder="e.g. Individual Therapy" placeholderTextColor={theme.textTertiary} returnKeyType="next" />

              <Text style={s.fieldLabel}>MINUTES PER UNIT</Text>
              <TextInput style={s.fieldInput} value={editing?.minutesPerUnit ?? ''} onChangeText={(v) => setEditing((e) => e ? { ...e, minutesPerUnit: v } : e)} placeholder="e.g. 7.5" placeholderTextColor={theme.textTertiary} keyboardType="decimal-pad" returnKeyType="next" />

              <Text style={s.fieldLabel}>PAY PER UNIT ($)</Text>
              <TextInput style={s.fieldInput} value={editing?.payPerUnit ?? ''} onChangeText={(v) => setEditing((e) => e ? { ...e, payPerUnit: v } : e)} placeholder="e.g. 58.61" placeholderTextColor={theme.textTertiary} keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={handleSaveEdit} />

              <View style={s.editModalBtns}>
                <TouchableOpacity style={[s.editModalBtn, s.editModalBtnCancel]} onPress={() => setEditing(null)}>
                  <Text style={s.editModalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.editModalBtn, s.editModalBtnSave]} onPress={handleSaveEdit}>
                  <Text style={s.editModalBtnSaveText}>{isNew ? 'Add' : 'Update'}</Text>
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
    safe: { flex: 1, backgroundColor: t.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingBottom: 12,
      backgroundColor: t.headerBg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: t.textPrimary },
    headerSideBtn: { minWidth: 70, paddingVertical: 6, paddingHorizontal: 10 },
    headerSideBtnText: { fontSize: 17, color: t.blue },
    headerSaveBtnText: { fontWeight: '700', textAlign: 'right' },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    hint: { fontSize: 13, color: t.textSecondary, marginBottom: 16, lineHeight: 18 },
    row: {
      backgroundColor: t.cardBg, borderRadius: 12, marginBottom: 10,
      flexDirection: 'row', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    pairRow: { borderWidth: 1.5, borderColor: t.blue + '40' },
    moveCol: { alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8, gap: 10, paddingVertical: 12 },
    moveArrow: { fontSize: 16, color: t.blue },
    moveArrowDisabled: { opacity: 0.2 },
    codeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingRight: 14 },
    pairDivider: {
      paddingVertical: 4, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: t.blue + '30', backgroundColor: t.blueTint,
    },
    pairDividerText: { fontSize: 11, color: t.blue, fontWeight: '600', textAlign: 'center', letterSpacing: 0.5 },
    rowInfo: { flex: 1, marginRight: 8 },
    rowCode: { fontSize: 16, fontWeight: '700', color: t.textPrimary },
    rowDesc: { fontSize: 13, color: t.textSecondary, marginTop: 2 },
    rowMin: { fontSize: 12, color: t.textTertiary, marginTop: 2 },
    rowActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    editBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: t.blueTint, borderRadius: 8 },
    editBtnText: { fontSize: 14, color: t.blue, fontWeight: '600' },
    deleteBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: t.redTint, alignItems: 'center', justifyContent: 'center' },
    deleteBtnText: { fontSize: 14, color: t.red, fontWeight: '700' },
    addBtn: {
      height: 52, backgroundColor: t.cardBg, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
      marginBottom: 16, borderWidth: 2, borderColor: t.blue, borderStyle: 'dashed',
    },
    addBtnText: { fontSize: 16, color: t.blue, fontWeight: '600' },
    resetDefaultsBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
    resetDefaultsText: { fontSize: 15, color: t.orange, fontWeight: '600' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    editModal: { backgroundColor: t.modalBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    editModalTitle: { fontSize: 20, fontWeight: '700', color: t.textPrimary, marginBottom: 20, textAlign: 'center' },
    fieldLabel: { fontSize: 11, fontWeight: '600', color: t.textTertiary, letterSpacing: 0.8, marginBottom: 6, marginTop: 14 },
    fieldInput: { height: 48, backgroundColor: t.inputBg, borderRadius: 10, paddingHorizontal: 14, fontSize: 16, color: t.textPrimary },
    editModalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
    editModalBtn: { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    editModalBtnCancel: { backgroundColor: t.inputBg },
    editModalBtnCancelText: { fontSize: 16, color: t.textSecondary, fontWeight: '600' },
    editModalBtnSave: { backgroundColor: t.blue },
    editModalBtnSaveText: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
  });
}
