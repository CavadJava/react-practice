import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Clipboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useCargoAccounts } from '../context/CargoAccountsContext';
import { useCargoCompanies } from '../context/CargoCompaniesContext';
import { useCargoSessions } from '../context/CargoSessionsContext';
import { CG_THEME } from '../theme/cargoTheme';
import { useLocale } from '../context/LocaleContext';

// Mounted once at the App root, as a sibling of RootNavigator — this is what
// lets Cargo WebView sessions survive leaving the Cargo screen (and the
// Cargo module entirely). The whole overlay is shown/hidden via
// pointerEvents + opacity (never unmounted, never display:'none') so every
// WebView inside keeps its native surface alive and its login state intact.
export default function CargoWebViewOverlay() {
  const { t } = useLocale();
  const { getAccount } = useCargoAccounts();
  const { getCompany } = useCargoCompanies();
  const { sessionIds, activeId, overlayVisible, closeSession, setActiveId, hideOverlay } = useCargoSessions();
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const webviewRefs = useRef<Record<string, { goBack: () => void } | null>>({});
  const canGoBackRef = useRef<Record<string, boolean>>({});

  const activeAccount = activeId ? getAccount(activeId) : undefined;
  const activeCompany = activeAccount ? getCompany(activeAccount.companyId) : undefined;

  const copy = (text: string, field: 'username' | 'password') => {
    if (!text) return;
    Clipboard.setString(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // While the overlay is open, hardware back should feel like stepping back
  // inside the active site first (like a browser tab), and only fall back
  // to hiding the overlay — never exiting the app — once there's nowhere
  // left to go within the WebView.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!overlayVisible) return false;
      const activeWebview = activeId ? webviewRefs.current[activeId] : null;
      if (activeId && canGoBackRef.current[activeId] && activeWebview) {
        activeWebview.goBack();
        return true;
      }
      hideOverlay();
      return true;
    });
    return () => sub.remove();
  }, [overlayVisible, activeId, hideOverlay]);

  if (sessionIds.length === 0) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: overlayVisible ? 1000 : -1 }]} pointerEvents={overlayVisible ? 'auto' : 'none'}>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.brand}>{t('cargo.entryTitle')}</Text>
          <Pressable onPress={hideOverlay} hitSlop={10} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>﹀</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsList} contentContainerStyle={styles.tabsRow}>
          {sessionIds.map(id => {
            const account = getAccount(id);
            const company = account ? getCompany(account.companyId) : undefined;
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
            const company = account ? getCompany(account.companyId) : undefined;
            if (!account || !company) return null;
            const isActive = activeId === id;
            return (
              <View key={id} style={[StyleSheet.absoluteFill, { zIndex: isActive ? 1 : 0 }]} pointerEvents={isActive ? 'auto' : 'none'}>
                <WebView
                  ref={ref => {
                    webviewRefs.current[id] = ref;
                  }}
                  incognito
                  source={{ uri: company.url }}
                  style={styles.webview}
                  javaScriptEnabled
                  domStorageEnabled
                  startInLoadingState
                  renderLoading={() => (
                    <View style={styles.webviewLoading}>
                      <ActivityIndicator color={CG_THEME.primary} size="large" />
                    </View>
                  )}
                  originWhitelist={['*']}
                  cacheEnabled
                  mixedContentMode="always"
                  setSupportMultipleWindows={false}
                  allowsInlineMediaPlayback
                  onShouldStartLoadWithRequest={() => true}
                  onNavigationStateChange={(navState: { canGoBack: boolean }) => {
                    canGoBackRef.current[id] = navState.canGoBack;
                  }}
                />
              </View>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CG_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  brand: { fontSize: 18, fontWeight: '900', color: CG_THEME.white },
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
  webviewLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: CG_THEME.bg },
});
