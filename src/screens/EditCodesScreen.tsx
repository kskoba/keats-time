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
};

const blankEditing = (): EditingCode => ({
  id: '',
  code: '',
  description: '',
  minutesPerUnit: '',
});

export default function EditCodesScreen({
  codes,
  defaultCodes,
  onSave,
  onClose,
}: Props) {
  const [localCodes, setLocalCodes] = useState<BillingCode[]>(codes);
  const [editing, setEditing] = useState<EditingCode | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openEdit = (code: BillingCode) => {
    setIsNew(false);
    setEditing({
      id: code.id,
      code: code.code,
      description: code.description,
      minutesPerUnit: code.minutesPerUnit.toString(),
    });
  };

  const openNew = () => {
    setIsNew(true);
    setEditing({ ...blankEditing(), id: Date.now().toString() });
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    const minutes = parseInt(editing.minutesPerUnit, 10);
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
    };
    if (isNew) {
      setLocalCodes([...localCodes, updated]);
    } else {
      setLocalCodes(localCodes.map((c) => (c.id === editing.id ? updated : c)));
    }
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
      'This will replace all your codes with the defaults from billing-codes.json. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setLocalCodes(defaultCodes),
        },
      ]
    );
  };

  const handleSaveAndClose = () => {
    onSave(localCodes);
    onClose();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Codes</Text>
        <TouchableOpacity onPress={handleSaveAndClose} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, styles.headerSaveText]}>Save</Text>
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
          <Text style={styles.hint}>
            Edit these codes here or modify{' '}
            <Text style={styles.hintCode}>assets/billing-codes.json</Text> before
            rebuilding to change defaults.
          </Text>

          {localCodes.map((code) => (
            <View key={code.id} style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowCode}>{code.code}</Text>
                <Text style={styles.rowDesc} numberOfLines={1}>
                  {code.description}
                </Text>
                <Text style={styles.rowMin}>{code.minutesPerUnit} min/unit</Text>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEdit(code)}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(code.id)}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addBtn} onPress={openNew}>
            <Text style={styles.addBtnText}>+ Add New Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetDefaultsBtn}
            onPress={handleResetDefaults}
          >
            <Text style={styles.resetDefaultsText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Edit Modal */}
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
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setEditing(null)}
          >
            <TouchableOpacity style={styles.editModal} activeOpacity={1}>
              <Text style={styles.editModalTitle}>
                {isNew ? 'Add New Code' : 'Edit Code'}
              </Text>

              <Text style={styles.fieldLabel}>CODE</Text>
              <TextInput
                style={styles.fieldInput}
                value={editing?.code ?? ''}
                onChangeText={(v) =>
                  setEditing((e) => (e ? { ...e, code: v } : e))
                }
                placeholder="e.g. 90837"
                placeholderTextColor="#C7C7CC"
                autoCapitalize="characters"
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>DESCRIPTION</Text>
              <TextInput
                style={styles.fieldInput}
                value={editing?.description ?? ''}
                onChangeText={(v) =>
                  setEditing((e) => (e ? { ...e, description: v } : e))
                }
                placeholder="e.g. Individual Therapy (53+ min)"
                placeholderTextColor="#C7C7CC"
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>MINUTES PER UNIT</Text>
              <TextInput
                style={styles.fieldInput}
                value={editing?.minutesPerUnit ?? ''}
                onChangeText={(v) =>
                  setEditing((e) => (e ? { ...e, minutesPerUnit: v } : e))
                }
                placeholder="e.g. 53"
                placeholderTextColor="#C7C7CC"
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={handleSaveEdit}
              />

              <View style={styles.editModalBtns}>
                <TouchableOpacity
                  style={[styles.editModalBtn, styles.editModalBtnCancel]}
                  onPress={() => setEditing(null)}
                >
                  <Text style={styles.editModalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editModalBtn, styles.editModalBtnSave]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.editModalBtnSaveText}>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerBtn: {
    minWidth: 70,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  headerBtnText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerSaveText: {
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
    color: '#636366',
    marginBottom: 16,
    lineHeight: 18,
  },
  hintCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#007AFF',
    fontSize: 12,
  },
  row: {
    backgroundColor: '#FFFFFF',
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
    color: '#1C1C1E',
  },
  rowDesc: {
    fontSize: 13,
    color: '#636366',
    marginTop: 2,
  },
  rowMin: {
    fontSize: 12,
    color: '#8E8E93',
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
    backgroundColor: '#EEF4FF',
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF0EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '700',
  },
  addBtn: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  resetDefaultsBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetDefaultsText: {
    fontSize: 15,
    color: '#FF9500',
    fontWeight: '600',
  },

  // Edit Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  editModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  },
  fieldInput: {
    height: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1C1C1E',
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
  editModalBtnCancel: {
    backgroundColor: '#F2F2F7',
  },
  editModalBtnCancelText: {
    fontSize: 16,
    color: '#636366',
    fontWeight: '600',
  },
  editModalBtnSave: {
    backgroundColor: '#007AFF',
  },
  editModalBtnSaveText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
