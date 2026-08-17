import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCargoSessions } from '../context/CargoSessionsContext';
import { CG_THEME } from '../theme/cargoTheme';

// The "dynamic field" the user asked for, as a floating button: shown
// app-wide whenever Cargo sessions exist but the overlay is currently
// hidden, so the user can jump back into their open WebView tabs from
// anywhere in the app. Dynamic in that its badge count reflects live
// session count.
export default function CargoResumeButton() {
  const { sessionIds, overlayVisible, buttonEnabled, showOverlay, setButtonEnabled } = useCargoSessions();
  const insets = useSafeAreaInsets();

  if (sessionIds.length === 0 || overlayVisible || !buttonEnabled) return null;

  // Long-press turns the button off (yandır/söndür) without closing the
  // sessions themselves — it can be turned back on from the Cargo screen.
  return (
    <Pressable style={[styles.button, { bottom: insets.bottom + 24 }]} onPress={showOverlay} onLongPress={() => setButtonEnabled(false)} delayLongPress={400}>
      <Text style={styles.icon}>📦</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{sessionIds.length}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 18,
    zIndex: 999,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: CG_THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  icon: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: CG_THEME.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: CG_THEME.bg,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: CG_THEME.white },
});
