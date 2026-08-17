import React, { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CargoStackParamList, RootStackParamList } from '../navigation/types';
import { CargoCompany } from '../data/cargo';
import { CargoAccount, useCargoAccounts } from '../context/CargoAccountsContext';
import { useCargoCompanies } from '../context/CargoCompaniesContext';
import { useCargoSessions } from '../context/CargoSessionsContext';
import { CG_THEME } from '../theme/cargoTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<CargoStackParamList, 'Cargo'>, NativeStackScreenProps<RootStackParamList>>;

const ICON_CHOICES = ['📦', '📮', '🚚', '✈️', '🚢', '🏢'];
const COLOR_CHOICES = ['#2F8FE0', '#E0632F', '#22C55E', '#8B5CF6', '#EAB308', '#EC4899'];

export default function CargoScreen({ navigation }: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { accountsForCompany, addAccount, updateAccount, removeAccount } = useCargoAccounts();
  const { companies, getCompany, addCompany, updateCompany, removeCompany } = useCargoCompanies();
  const { sessionIds, openSession: openSessionContext, closeSession, showOverlay, buttonEnabled, setButtonEnabled } = useCargoSessions();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCompanyId, setPickerCompanyId] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<CargoAccount | { companyId: string } | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const [editingCompany, setEditingCompany] = useState<CargoCompany | 'new' | null>(null);
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formCompanyUrl, setFormCompanyUrl] = useState('');
  const [formCompanyIcon, setFormCompanyIcon] = useState(ICON_CHOICES[0]);
  const [formCompanyColor, setFormCompanyColor] = useState(COLOR_CHOICES[0]);

  const openPicker = (companyId?: string) => {
    setPickerCompanyId(companyId ?? null);
    setPickerOpen(true);
  };

  const openSession = (account: CargoAccount) => {
    openSessionContext(account.id);
    setPickerOpen(false);
    navigation.getParent()?.goBack();
  };

  const startAdd = (companyId: string) => {
    // Close the picker modal first — RN's <Modal> doesn't support two
    // instances visible at once (taps land on the wrong layer and the form
    // becomes unresponsive), so only one can be open at a time.
    setPickerOpen(false);
    setEditingAccount({ companyId });
    setFormLabel('');
    setFormUsername('');
    setFormPassword('');
  };

  const startEdit = (account: CargoAccount) => {
    setPickerOpen(false);
    setEditingAccount(account);
    setFormLabel(account.label);
    setFormUsername(account.username);
    setFormPassword(account.password);
  };

  // After the form closes (save or cancel), reopen the picker back at the
  // same company's account list instead of dropping the user back at the
  // top-level screen — keeps the drill-down feel now that the two modals
  // can't be open at the same time.
  const returnToPicker = (companyId: string) => {
    setPickerCompanyId(companyId);
    setPickerOpen(true);
  };

  const cancelForm = useCallback(() => {
    const companyId = editingAccount?.companyId;
    setEditingAccount(null);
    if (companyId) returnToPicker(companyId);
  }, [editingAccount]);

  const saveForm = () => {
    if (!editingAccount || !formLabel.trim()) return;
    const payload = { companyId: editingAccount.companyId, label: formLabel.trim(), username: formUsername.trim(), password: formPassword };
    if ('id' in editingAccount) {
      updateAccount(editingAccount.id, payload);
    } else {
      addAccount(payload);
    }
    const companyId = editingAccount.companyId;
    setEditingAccount(null);
    returnToPicker(companyId);
  };

  const confirmDelete = (account: CargoAccount) => {
    Alert.alert(t('cargo.deleteConfirmTitle'), t('cargo.deleteConfirmMessage', { label: account.label }), [
      { text: t('cargo.cancel'), style: 'cancel' },
      {
        text: t('cargo.delete'),
        style: 'destructive',
        onPress: () => {
          removeAccount(account.id);
          closeSession(account.id);
        },
      },
    ]);
  };

  const startAddCompany = () => {
    setPickerOpen(false);
    setEditingCompany('new');
    setFormCompanyName('');
    setFormCompanyUrl('https://');
    setFormCompanyIcon(ICON_CHOICES[0]);
    setFormCompanyColor(COLOR_CHOICES[0]);
  };

  const startEditCompany = (company: CargoCompany) => {
    setPickerOpen(false);
    setEditingCompany(company);
    setFormCompanyName(company.name);
    setFormCompanyUrl(company.url);
    setFormCompanyIcon(company.icon);
    setFormCompanyColor(company.color);
  };

  // Unlike the account form, closing this one does NOT reopen the picker —
  // it just closes, returning to whichever screen was already visible
  // behind it (the company grid, or a session if any were open).
  const cancelCompanyForm = useCallback(() => setEditingCompany(null), []);

  const saveCompanyForm = () => {
    if (!editingCompany || !formCompanyName.trim() || !formCompanyUrl.trim()) return;
    const payload = { name: formCompanyName.trim(), url: formCompanyUrl.trim(), icon: formCompanyIcon, color: formCompanyColor };
    if (editingCompany === 'new') {
      addCompany(payload);
    } else {
      updateCompany(editingCompany.id, payload);
    }
    setEditingCompany(null);
  };

  const confirmDeleteCompany = (company: CargoCompany) => {
    Alert.alert(t('cargo.deleteCompanyConfirmTitle'), t('cargo.deleteCompanyConfirmMessage', { name: company.name }), [
      { text: t('cargo.cancel'), style: 'cancel' },
      {
        text: t('cargo.delete'),
        style: 'destructive',
        onPress: () => {
          accountsForCompany(company.id).forEach(account => {
            removeAccount(account.id);
            closeSession(account.id);
          });
          removeCompany(company.id);
          if (pickerCompanyId === company.id) setPickerCompanyId(null);
        },
      },
    ]);
  };

  // Android hardware back button: step back through open modals one level
  // at a time (account list → company list → close picker) instead of
  // immediately exiting the whole Cargo module — only falls through to the
  // default (closing Cargo) once nothing is open.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (editingAccount) {
        cancelForm();
        return true;
      }
      if (editingCompany) {
        cancelCompanyForm();
        return true;
      }
      if (pickerOpen && pickerCompanyId) {
        setPickerCompanyId(null);
        return true;
      }
      if (pickerOpen) {
        setPickerOpen(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [editingAccount, editingCompany, pickerOpen, pickerCompanyId, cancelForm, cancelCompanyForm]);

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.brand}>{t('cargo.entryTitle')}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => openPicker()} hitSlop={10} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>+</Text>
          </Pressable>
          <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={10} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>✕</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.companyGrid} showsVerticalScrollIndicator={false}>
        <Text style={styles.emptyHint}>{t('cargo.emptyHint')}</Text>
        {sessionIds.length > 0 && (
          <>
            <Pressable style={styles.resumeSessionsBtn} onPress={showOverlay}>
              <Text style={styles.resumeSessionsBtnText}>
                {t('cargo.resumeSessions', { count: String(sessionIds.length) })}
              </Text>
            </Pressable>
            <View style={styles.floatingButtonToggleRow}>
              <Text style={styles.floatingButtonToggleLabel}>{t('cargo.floatingButtonToggle')}</Text>
              <Switch
                value={buttonEnabled}
                onValueChange={setButtonEnabled}
                trackColor={{ false: CG_THEME.border, true: CG_THEME.primary }}
                thumbColor={CG_THEME.white}
              />
            </View>
          </>
        )}
        {companies.map(company => (
          <View key={company.id} style={[styles.companyCard, { borderColor: company.color }]}>
            <Pressable style={styles.companyCardMain} onPress={() => openPicker(company.id)}>
              <Text style={styles.companyIcon}>{company.icon}</Text>
              <View style={styles.companyTextWrap}>
                <Text style={styles.companyName}>{company.name}</Text>
                <Text style={styles.companyUrl} numberOfLines={1}>
                  {company.url}
                </Text>
                <Text style={styles.companyAccountsCount}>
                  {t('cargo.accountsCount', { count: String(accountsForCompany(company.id).length) })}
                </Text>
              </View>
              <Text style={styles.companyChevron}>›</Text>
            </Pressable>
            <View style={styles.companyCardActions}>
              <Pressable style={styles.accountActionBtn} onPress={() => startEditCompany(company)} hitSlop={8}>
                <Text style={styles.accountActionText}>✎</Text>
              </Pressable>
              <Pressable style={styles.accountActionBtn} onPress={() => confirmDeleteCompany(company)} hitSlop={8}>
                <Text style={styles.accountActionText}>🗑</Text>
              </Pressable>
            </View>
          </View>
        ))}
        <Pressable style={styles.addAccountBtn} onPress={startAddCompany}>
          <Text style={styles.addAccountBtnText}>+ {t('cargo.addCompany')}</Text>
        </Pressable>
      </ScrollView>

      {/* Account picker: company grid → account list (with inline CRUD) */}
      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            {pickerCompanyId ? (
              <>
                <View style={styles.modalHeaderRow}>
                  <Pressable onPress={() => setPickerCompanyId(null)} hitSlop={8}>
                    <Text style={styles.modalBackText}>← {t('cargo.companies')}</Text>
                  </Pressable>
                </View>
                <Text style={styles.modalTitle}>{getCompany(pickerCompanyId)?.name}</Text>
                <ScrollView>
                  {accountsForCompany(pickerCompanyId).map(account => (
                    <View key={account.id} style={styles.accountRow}>
                      <Pressable style={styles.accountRowMain} onPress={() => openSession(account)}>
                        <Text style={styles.accountLabel}>{account.label}</Text>
                        <Text style={styles.accountSub} numberOfLines={1}>
                          {account.username || t('cargo.notSet')}
                        </Text>
                      </Pressable>
                      <Pressable style={styles.accountActionBtn} onPress={() => startEdit(account)} hitSlop={8}>
                        <Text style={styles.accountActionText}>✎</Text>
                      </Pressable>
                      <Pressable style={styles.accountActionBtn} onPress={() => confirmDelete(account)} hitSlop={8}>
                        <Text style={styles.accountActionText}>🗑</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable style={styles.addAccountBtn} onPress={() => startAdd(pickerCompanyId)}>
                    <Text style={styles.addAccountBtnText}>+ {t('cargo.addAccount')}</Text>
                  </Pressable>
                </ScrollView>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>{t('cargo.companies')}</Text>
                <ScrollView>
                  {companies.map(company => (
                    <View key={company.id} style={styles.pickerCompanyRow}>
                      <Pressable style={styles.accountRowMain} onPress={() => setPickerCompanyId(company.id)}>
                        <View style={styles.pickerCompanyMain}>
                          <Text style={styles.companyIcon}>{company.icon}</Text>
                          <Text style={styles.accountLabel}>{company.name}</Text>
                        </View>
                      </Pressable>
                      <Pressable style={styles.accountActionBtn} onPress={() => startEditCompany(company)} hitSlop={8}>
                        <Text style={styles.accountActionText}>✎</Text>
                      </Pressable>
                      <Pressable style={styles.accountActionBtn} onPress={() => confirmDeleteCompany(company)} hitSlop={8}>
                        <Text style={styles.accountActionText}>🗑</Text>
                      </Pressable>
                      <Pressable onPress={() => setPickerCompanyId(company.id)} hitSlop={8}>
                        <Text style={styles.companyChevron}>›</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable style={styles.addAccountBtn} onPress={startAddCompany}>
                    <Text style={styles.addAccountBtnText}>+ {t('cargo.addCompany')}</Text>
                  </Pressable>
                </ScrollView>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add/edit account form */}
      <Modal visible={!!editingAccount} animationType="slide" transparent onRequestClose={cancelForm}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={cancelForm} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editingAccount && 'id' in editingAccount ? t('cargo.editAccount') : t('cargo.addAccount')}</Text>
            <View style={styles.field}>
              <Text style={styles.label}>{t('cargo.label')}</Text>
              <TextInput value={formLabel} onChangeText={setFormLabel} placeholder={t('cargo.labelPlaceholder')} placeholderTextColor={CG_THEME.textMuted} style={styles.input} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('cargo.username')}</Text>
              <TextInput
                value={formUsername}
                onChangeText={setFormUsername}
                placeholder={t('cargo.usernamePlaceholder')}
                placeholderTextColor={CG_THEME.textMuted}
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('cargo.password')}</Text>
              <TextInput
                value={formPassword}
                onChangeText={setFormPassword}
                placeholder={t('cargo.passwordPlaceholder')}
                placeholderTextColor={CG_THEME.textMuted}
                style={styles.input}
                autoCapitalize="none"
                secureTextEntry
              />
            </View>
            <View style={styles.formActions}>
              <Pressable style={styles.cancelBtn} onPress={cancelForm}>
                <Text style={styles.cancelBtnText}>{t('cargo.cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, !formLabel.trim() && styles.saveBtnDisabled]} onPress={saveForm} disabled={!formLabel.trim()}>
                <Text style={styles.saveBtnText}>{t('cargo.save')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add/edit company form */}
      <Modal visible={!!editingCompany} animationType="slide" transparent onRequestClose={cancelCompanyForm}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={cancelCompanyForm} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editingCompany === 'new' ? t('cargo.addCompany') : t('cargo.editCompany')}</Text>
            <View style={styles.field}>
              <Text style={styles.label}>{t('cargo.companyName')}</Text>
              <TextInput
                value={formCompanyName}
                onChangeText={setFormCompanyName}
                placeholder={t('cargo.companyNamePlaceholder')}
                placeholderTextColor={CG_THEME.textMuted}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('cargo.companyUrlField')}</Text>
              <TextInput
                value={formCompanyUrl}
                onChangeText={setFormCompanyUrl}
                placeholder="https://..."
                placeholderTextColor={CG_THEME.textMuted}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('cargo.icon')}</Text>
              <View style={styles.choiceRow}>
                {ICON_CHOICES.map(icon => (
                  <Pressable key={icon} style={[styles.iconChoice, formCompanyIcon === icon && styles.iconChoiceActive]} onPress={() => setFormCompanyIcon(icon)}>
                    <Text style={styles.iconChoiceText}>{icon}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('cargo.color')}</Text>
              <View style={styles.choiceRow}>
                {COLOR_CHOICES.map(color => (
                  <Pressable
                    key={color}
                    style={[styles.colorChoice, { backgroundColor: color }, formCompanyColor === color && styles.colorChoiceActive]}
                    onPress={() => setFormCompanyColor(color)}
                  />
                ))}
              </View>
            </View>
            <View style={styles.formActions}>
              <Pressable style={styles.cancelBtn} onPress={cancelCompanyForm}>
                <Text style={styles.cancelBtnText}>{t('cargo.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, (!formCompanyName.trim() || !formCompanyUrl.trim()) && styles.saveBtnDisabled]}
                onPress={saveCompanyForm}
                disabled={!formCompanyName.trim() || !formCompanyUrl.trim()}>
                <Text style={styles.saveBtnText}>{t('cargo.save')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CG_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  brand: { fontSize: 22, fontWeight: '900', color: CG_THEME.white },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CG_THEME.card,
    borderWidth: 1,
    borderColor: CG_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: { fontSize: 16, color: CG_THEME.text, fontWeight: '700' },
  companyGrid: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  emptyHint: { fontSize: 12.5, color: CG_THEME.textMuted, marginBottom: 4 },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CG_THEME.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
  },
  companyCardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyCardActions: { flexDirection: 'row', gap: 6 },
  companyIcon: { fontSize: 26 },
  companyTextWrap: { flex: 1, gap: 2 },
  companyName: { fontSize: 15.5, fontWeight: '800', color: CG_THEME.text },
  companyUrl: { fontSize: 11.5, color: CG_THEME.textMuted },
  companyAccountsCount: { fontSize: 11, color: CG_THEME.primary, fontWeight: '600', marginTop: 2 },
  companyChevron: { fontSize: 20, color: CG_THEME.textMuted },
  resumeSessionsBtn: {
    backgroundColor: CG_THEME.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resumeSessionsBtnText: { fontSize: 13.5, fontWeight: '800', color: CG_THEME.white },
  floatingButtonToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CG_THEME.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  floatingButtonToggleLabel: { fontSize: 12.5, fontWeight: '600', color: CG_THEME.textMuted, flex: 1, marginRight: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: CG_THEME.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalHeaderRow: { marginBottom: 6 },
  modalBackText: { fontSize: 13, fontWeight: '700', color: CG_THEME.primary },
  modalTitle: { fontSize: 16, fontWeight: '800', color: CG_THEME.text, marginBottom: 12 },
  pickerCompanyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CG_THEME.border,
  },
  pickerCompanyMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: CG_THEME.border },
  accountRowMain: { flex: 1, gap: 2 },
  accountLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: CG_THEME.text },
  accountSub: { fontSize: 11.5, color: CG_THEME.textMuted },
  accountActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: CG_THEME.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountActionText: { fontSize: 13, color: CG_THEME.text },
  addAccountBtn: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: CG_THEME.border, borderStyle: 'dashed', paddingVertical: 12, alignItems: 'center' },
  addAccountBtnText: { fontSize: 13, fontWeight: '700', color: CG_THEME.primary },
  field: { gap: 6, marginTop: 10 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChoice: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CG_THEME.card,
    borderWidth: 1.5,
    borderColor: CG_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChoiceActive: { borderColor: CG_THEME.primary, backgroundColor: CG_THEME.cardAlt },
  iconChoiceText: { fontSize: 17 },
  colorChoice: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  colorChoiceActive: { borderColor: CG_THEME.white },
  label: { fontSize: 12, color: CG_THEME.textMuted, fontWeight: '600' },
  input: {
    backgroundColor: CG_THEME.card,
    borderWidth: 1,
    borderColor: CG_THEME.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: CG_THEME.text,
    fontSize: 14,
  },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: CG_THEME.cardAlt },
  cancelBtnText: { fontSize: 13.5, fontWeight: '700', color: CG_THEME.textMuted },
  saveBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: CG_THEME.primary },
  saveBtnDisabled: { backgroundColor: CG_THEME.border },
  saveBtnText: { fontSize: 13.5, fontWeight: '700', color: CG_THEME.white },
});
