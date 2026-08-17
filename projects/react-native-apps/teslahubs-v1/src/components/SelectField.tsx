import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

type Option = { label: string; value: string };

type Props = {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

export default function SelectField({ label, value, options, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.control} onPress={() => setOpen(true)}>
        <Text style={styles.controlValue}>{selected?.label ?? ''}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={styles.optionList} showsVerticalScrollIndicator={false}>
              {options.map(o => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.optionPressed]}>
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{o.label}</Text>
                    {active && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    field: { gap: 6 },
    label: { fontSize: 12.5, color: colors.textFaded, fontWeight: '600' },
    control: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    controlValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
    chevron: { color: colors.textFaded, fontSize: 15, fontWeight: '700' },
    backdrop: { flex: 1, backgroundColor: 'rgba(10,5,5,0.55)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderBottomWidth: 0,
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingBottom: 34,
      maxHeight: '65%',
    },
    sheetTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: spacing.sm },
    optionList: { flexGrow: 0 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 13,
      paddingHorizontal: 10,
      borderRadius: radius.sm,
    },
    optionActive: { backgroundColor: colors.cardAlt },
    optionPressed: { opacity: 0.6 },
    optionText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
    optionTextActive: { color: colors.text },
    check: { color: colors.brandLight, fontSize: 15, fontWeight: '800' },
  });
