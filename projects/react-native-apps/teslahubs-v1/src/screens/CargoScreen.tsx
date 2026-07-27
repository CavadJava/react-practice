import React, { useState } from 'react';
import { Alert, Clipboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CargoStackParamList, RootStackParamList } from '../navigation/types';
import { CARGO_COMPANIES, getCargoCompany } from '../data/cargo';
import { CargoAccount, useCargoAccounts } from '../context/CargoAccountsContext';
import { CG_THEME } from '../theme/cargoTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<CargoStackParamList, 'Cargo'>, NativeStackScreenProps<RootStackParamList>>;

export default function CargoScreen({ navigation }: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { accountsForCompany, getAccount, addAccount, updateAccount, removeAccount } = useCargoAccounts();

  // Open WebView "tabs" — kept as local state on this single always-mounted
  // screen (not separate navigator routes) specifically so switching
  // between accounts never unmounts an already-open session: every WebView
  // in `sessionIds` stays mounted, only the active one is made visible.
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCompanyId, setPickerCompanyId] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<CargoAccount | { companyId: string } | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const activeAccount = activeId ? getAccount(activeId) : undefined;
  const activeCompany = activeAccount ? getCargoCompany(activeAccount.companyId) : undefined;

  const openPicker = (companyId?: string) => {
    setPickerCompanyId(companyId ?? null);
    setPickerOpen(true);
  };

  const openSession = (account: CargoAccount) => {
    setSessionIds(prev => (prev.includes(account.id) ? prev : [...prev, account.id]));
    setActiveId(account.id);
    setPickerOpen(false);
  };

  const closeSession = (accountId: string) => {
    setSessionIds(prev => {
      const next = prev.filter(id => id !== accountId);
      if (activeId === accountId) {
        setActiveId(next.length ? next[next.length - 1] : null);
      }
      return next;
    });
  };

  const startAdd = (companyId: string) => {
    setEditingAccount({ companyId });
    setFormLabel('');
    setFormUsername('');
    setFormPassword('');
  };

  const startEdit = (account: CargoAccount) => {
    setEditingAccount(account);
    setFormLabel(account.label);
    setFormUsername(account.username);
    setFormPassword(account.password);
  };

  const cancelForm = () => setEditingAccount(null);

  const saveForm = () => {
    if (!editingAccount || !formLabel.trim()) return;
    const payload = { companyId: editingAccount.companyId, label: formLabel.trim(), username: formUsername.trim(), password: formPassword };
    if ('id' in editingAccount) {
      updateAccount(editingAccount.id, payload);
    } else {
      addAccount(payload);
    }
    setEditingAccount(null);
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

  const copy = (text: string, field: 'username' | 'password') => {
    if (!text) return;
    Clipboard.setString(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

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

      {sessionIds.length === 0 ? (
        <ScrollView contentContainerStyle={styles.companyGrid} showsVerticalScrollIndicator={false}>
          <Text style={styles.emptyHint}>{t('cargo.emptyHint')}</Text>
          {CARGO_COMPANIES.map(company => (
            <Pressable key={company.id} style={[styles.companyCard, { borderColor: company.color }]} onPress={() => openPicker(company.id)}>
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
          ))}
        </ScrollView>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsList} contentContainerStyle={styles.tabsRow}>
            {sessionIds.map(id => {
              const account = getAccount(id);
              const company = account ? getCargoCompany(account.companyId) : undefined;
              if (!account || !company) return null;
              const isActive = activeId === id;
              return (
                <Pressable key={id} style={[styles.tabChip, isActive && { borderColor: company.color, backgroundColor: CG_THEME.cardAlt }]} onPress={() => setActiveId(id)}>
                  <Text style={styles.tabChipIcon}>{company.icon}</Text>
                  <Text style={[styles.tabChipLabel, isActive && styles.tabChipLabelActive]} numberOfLines={1}>
                    {account.label}
                  </Text>
                  <Pressable onPress={() => closeSession(id)} hitSlop={8}>
                    <Text style={styles.tabChipClose}>✕</Text>
                  </Pressable>
                </Pressable>
              );
            })}
            <Pressable style={styles.tabAddChip} onPress={() => openPicker()}>
              <Text style={styles.tabAddChipText}>+</Text>
            </Pressable>
          </ScrollView>

          {activeAccount && activeCompany && (
            <View style={styles.credentialsBar}>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>{t('cargo.username')}</Text>
                <Text style={styles.credentialValue} numberOfLines={1}>
                  {activeAccount.username || t('cargo.notSet')}
                </Text>
                <Pressable style={styles.copyBtn} onPress={() => copy(activeAccount.username, 'username')} disabled={!activeAccount.username}>
                  <Text style={styles.copyBtnText}>{copiedField === 'username' ? `✓ ${t('cargo.copied')}` : t('cargo.copy')}</Text>
                </Pressable>
              </View>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>{t('cargo.password')}</Text>
                <Text style={styles.credentialValue} numberOfLines={1}>
                  {activeAccount.password ? (showPassword ? activeAccount.password : '••••••••') : t('cargo.notSet')}
                </Text>
                {!!activeAccount.password && (
                  <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8} style={styles.eyeBtn}>
                    <Text style={styles.eyeBtnText}>{showPassword ? '🙈' : '👁️'}</Text>
                  </Pressable>
                )}
                <Pressable style={styles.copyBtn} onPress={() => copy(activeAccount.password, 'password')} disabled={!activeAccount.password}>
                  <Text style={styles.copyBtnText}>{copiedField === 'password' ? `✓ ${t('cargo.copied')}` : t('cargo.copy')}</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.webviewStack}>
            {sessionIds.map(id => {
              const account = getAccount(id);
              const company = account ? getCargoCompany(account.companyId) : undefined;
              if (!account || !company) return null;
              const isActive = activeId === id;
              return (
                <View key={id} style={[StyleSheet.absoluteFill, !isActive && styles.hiddenWebview]}>
                  <WebView source={{ uri: company.url }} style={styles.webview} />
                </View>
              );
            })}
          </View>
        </>
      )}

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
                <Text style={styles.modalTitle}>{getCargoCompany(pickerCompanyId)?.name}</Text>
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
                  {CARGO_COMPANIES.map(company => (
                    <Pressable key={company.id} style={styles.pickerCompanyRow} onPress={() => setPickerCompanyId(company.id)}>
                      <Text style={styles.companyIcon}>{company.icon}</Text>
                      <Text style={styles.accountLabel}>{company.name}</Text>
                      <Text style={styles.companyChevron}>›</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add/edit account form */}
      <Modal visible={!!editingAccount} animationType="slide" transparent onRequestClose={cancelForm}>
        <Pressable style={styles.modalBackdrop} onPress={cancelForm}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
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
          </Pressable>
        </Pressable>
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
    gap: 12,
    backgroundColor: CG_THEME.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
  },
  companyIcon: { fontSize: 26 },
  companyTextWrap: { flex: 1, gap: 2 },
  companyName: { fontSize: 15.5, fontWeight: '800', color: CG_THEME.text },
  companyUrl: { fontSize: 11.5, color: CG_THEME.textMuted },
  companyAccountsCount: { fontSize: 11, color: CG_THEME.primary, fontWeight: '600', marginTop: 2 },
  companyChevron: { fontSize: 20, color: CG_THEME.textMuted },
  tabsList: { flexGrow: 0, flexShrink: 0 },
  tabsRow: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 160,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: CG_THEME.border,
    backgroundColor: CG_THEME.card,
  },
  tabChipIcon: { fontSize: 13 },
  tabChipLabel: { fontSize: 12, fontWeight: '600', color: CG_THEME.textMuted, maxWidth: 80 },
  tabChipLabelActive: { color: CG_THEME.text, fontWeight: '700' },
  tabChipClose: { fontSize: 11, color: CG_THEME.textMuted, marginLeft: 2 },
  tabAddChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CG_THEME.border,
    backgroundColor: CG_THEME.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabAddChipText: { fontSize: 16, color: CG_THEME.text, fontWeight: '700' },
  credentialsBar: { paddingHorizontal: 20, paddingBottom: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: CG_THEME.border },
  credentialRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: CG_THEME.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  credentialLabel: { fontSize: 11, color: CG_THEME.textMuted, fontWeight: '700', width: 60 },
  credentialValue: { flex: 1, fontSize: 12.5, color: CG_THEME.text, fontWeight: '600' },
  eyeBtn: { paddingHorizontal: 4 },
  eyeBtnText: { fontSize: 13 },
  copyBtn: { backgroundColor: CG_THEME.cardAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  copyBtnText: { fontSize: 11, fontWeight: '700', color: CG_THEME.primary },
  webviewStack: { flex: 1 },
  webview: { flex: 1, backgroundColor: CG_THEME.bg },
  hiddenWebview: { display: 'none' },
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
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: CG_THEME.border,
  },
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
