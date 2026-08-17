import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ENGLISH_LEVELS, EnglishLevel, EnglishNote, useEnglishNotes } from '../context/EnglishNotesContext';
import { CO_THEME } from '../theme/coursesTheme';
import { useLocale } from '../context/LocaleContext';

// The interactive body of the "Daily English Notes" lesson — a personal
// CRUD notebook (word + complex sentence + level) backed by
// EnglishNotesContext (AsyncStorage), independent of course progress.
export default function EnglishNotesPanel() {
  const { t } = useLocale();
  const { notes, addNote, updateNote, removeNote } = useEnglishNotes();

  const [filterLevel, setFilterLevel] = useState<EnglishLevel | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [word, setWord] = useState('');
  const [sentences, setSentences] = useState<string[]>([]);
  const [sentenceDraft, setSentenceDraft] = useState('');
  const [level, setLevel] = useState<EnglishLevel>('A1');

  const filteredNotes = filterLevel ? notes.filter(n => n.level === filterLevel) : notes;

  const resetForm = () => {
    setEditingId(null);
    setWord('');
    setSentences([]);
    setSentenceDraft('');
    setLevel('A1');
    setFormOpen(false);
  };

  const startAdd = () => {
    resetForm();
    setFormOpen(true);
  };

  const startEdit = (note: EnglishNote) => {
    setEditingId(note.id);
    setWord(note.word);
    setSentences(note.sentences);
    setSentenceDraft('');
    setLevel(note.level);
    setFormOpen(true);
  };

  const addSentenceDraft = () => {
    if (!sentenceDraft.trim()) return;
    setSentences(prev => [...prev, sentenceDraft.trim()]);
    setSentenceDraft('');
  };

  const removeSentenceAt = (index: number) => {
    setSentences(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const allSentences = sentenceDraft.trim() ? [...sentences, sentenceDraft.trim()] : sentences;
    if (!word.trim() || allSentences.length === 0) return;
    const payload = { word: word.trim(), sentences: allSentences, level };
    if (editingId) {
      updateNote(editingId, payload);
    } else {
      addNote(payload);
    }
    resetForm();
  };

  const canSave = !!(word.trim() && (sentences.length > 0 || sentenceDraft.trim()));

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <Pressable style={[styles.filterChip, !filterLevel && styles.filterChipActive]} onPress={() => setFilterLevel(null)}>
          <Text style={[styles.filterChipText, !filterLevel && styles.filterChipTextActive]}>{t('charging.filterAll')}</Text>
        </Pressable>
        {ENGLISH_LEVELS.map(lvl => (
          <Pressable key={lvl} style={[styles.filterChip, filterLevel === lvl && styles.filterChipActive]} onPress={() => setFilterLevel(lvl)}>
            <Text style={[styles.filterChipText, filterLevel === lvl && styles.filterChipTextActive]}>{lvl}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {filteredNotes.length === 0 && !formOpen && <Text style={styles.emptyText}>{t('englishNotes.empty')}</Text>}

      {filteredNotes.map(note => (
        <View key={note.id} style={styles.noteCard}>
          <View style={styles.noteHeaderRow}>
            <Text style={styles.noteWord}>{note.word}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{note.level}</Text>
            </View>
          </View>
          {note.sentences.map((s, i) => (
            <Text key={i} style={styles.noteSentence}>
              {note.sentences.length > 1 ? `${i + 1}. ` : ''}
              {s}
            </Text>
          ))}
          <View style={styles.noteActions}>
            <Pressable style={styles.noteActionBtn} onPress={() => startEdit(note)} hitSlop={8}>
              <Text style={styles.noteActionText}>✎ {t('englishNotes.edit')}</Text>
            </Pressable>
            <Pressable style={styles.noteActionBtn} onPress={() => removeNote(note.id)} hitSlop={8}>
              <Text style={styles.noteActionText}>🗑 {t('englishNotes.delete')}</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {formOpen ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingId ? t('englishNotes.editTitle') : t('englishNotes.addTitle')}</Text>
          <View style={styles.field}>
            <Text style={styles.label}>{t('englishNotes.word')}</Text>
            <TextInput
              value={word}
              onChangeText={setWord}
              placeholder={t('englishNotes.wordPlaceholder')}
              placeholderTextColor={CO_THEME.textMuted}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('englishNotes.sentence')}</Text>
            {sentences.map((s, i) => (
              <View key={i} style={styles.sentenceRow}>
                <Text style={styles.sentenceRowText} numberOfLines={2}>
                  {i + 1}. {s}
                </Text>
                <Pressable onPress={() => removeSentenceAt(i)} hitSlop={8}>
                  <Text style={styles.sentenceRowRemove}>✕</Text>
                </Pressable>
              </View>
            ))}
            <View style={styles.sentenceDraftRow}>
              <TextInput
                value={sentenceDraft}
                onChangeText={setSentenceDraft}
                placeholder={t('englishNotes.sentencePlaceholder')}
                placeholderTextColor={CO_THEME.textMuted}
                style={[styles.input, styles.textarea, styles.sentenceDraftInput]}
                multiline
                numberOfLines={2}
              />
              <Pressable style={[styles.addSentenceBtn, !sentenceDraft.trim() && styles.addSentenceBtnDisabled]} onPress={addSentenceDraft} disabled={!sentenceDraft.trim()}>
                <Text style={styles.addSentenceBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('englishNotes.level')}</Text>
            <View style={styles.levelPickerRow}>
              {ENGLISH_LEVELS.map(lvl => (
                <Pressable key={lvl} style={[styles.levelOption, level === lvl && styles.levelOptionActive]} onPress={() => setLevel(lvl)}>
                  <Text style={[styles.levelOptionText, level === lvl && styles.levelOptionTextActive]}>{lvl}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.formActions}>
            <Pressable style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelBtnText}>{t('englishNotes.cancel')}</Text>
            </Pressable>
            <Pressable style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} onPress={handleSave} disabled={!canSave}>
              <Text style={styles.saveBtnText}>{t('englishNotes.save')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.addBtn} onPress={startAdd}>
          <Text style={styles.addBtnText}>+ {t('englishNotes.addTitle')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14, gap: 10 },
  filterRow: { gap: 8, paddingBottom: 2 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: CO_THEME.border, backgroundColor: CO_THEME.card },
  filterChipActive: { backgroundColor: CO_THEME.primary, borderColor: CO_THEME.primary },
  filterChipText: { fontSize: 12, fontWeight: '700', color: CO_THEME.textMuted },
  filterChipTextActive: { color: CO_THEME.white },
  emptyText: { fontSize: 12.5, color: CO_THEME.textMuted, textAlign: 'center', marginTop: 10 },
  noteCard: { backgroundColor: CO_THEME.card, borderRadius: 14, borderWidth: 1, borderColor: CO_THEME.border, padding: 14, gap: 6 },
  noteHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noteWord: { fontSize: 15.5, fontWeight: '800', color: CO_THEME.text },
  levelBadge: { backgroundColor: CO_THEME.cardAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  levelBadgeText: { fontSize: 11, fontWeight: '700', color: CO_THEME.primary },
  noteSentence: { fontSize: 13, color: CO_THEME.text, lineHeight: 19 },
  noteActions: { flexDirection: 'row', gap: 14, marginTop: 2 },
  noteActionBtn: {},
  noteActionText: { fontSize: 12, fontWeight: '600', color: CO_THEME.textMuted },
  form: { backgroundColor: CO_THEME.card, borderRadius: 16, borderWidth: 1, borderColor: CO_THEME.primary, padding: 16, gap: 10 },
  formTitle: { fontSize: 14.5, fontWeight: '800', color: CO_THEME.text },
  field: { gap: 6 },
  label: { fontSize: 12, color: CO_THEME.textMuted, fontWeight: '600' },
  input: {
    backgroundColor: CO_THEME.cardAlt,
    borderWidth: 1,
    borderColor: CO_THEME.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: CO_THEME.text,
    fontSize: 14,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CO_THEME.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  sentenceRowText: { flex: 1, fontSize: 12.5, color: CO_THEME.text, lineHeight: 17 },
  sentenceRowRemove: { fontSize: 13, color: CO_THEME.textMuted },
  sentenceDraftRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  sentenceDraftInput: { flex: 1 },
  addSentenceBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: CO_THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSentenceBtnDisabled: { backgroundColor: CO_THEME.border },
  addSentenceBtnText: { fontSize: 18, fontWeight: '700', color: CO_THEME.white },
  levelPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelOption: {
    width: 44,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CO_THEME.border,
    backgroundColor: CO_THEME.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelOptionActive: { backgroundColor: CO_THEME.primary, borderColor: CO_THEME.primary },
  levelOptionText: { fontSize: 12.5, fontWeight: '700', color: CO_THEME.textMuted },
  levelOptionTextActive: { color: CO_THEME.white },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: CO_THEME.cardAlt },
  cancelBtnText: { fontSize: 13.5, fontWeight: '700', color: CO_THEME.textMuted },
  saveBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: CO_THEME.primary },
  saveBtnDisabled: { backgroundColor: CO_THEME.border },
  saveBtnText: { fontSize: 13.5, fontWeight: '700', color: CO_THEME.white },
  addBtn: { borderRadius: 12, borderWidth: 1, borderColor: CO_THEME.border, borderStyle: 'dashed', paddingVertical: 14, alignItems: 'center' },
  addBtnText: { fontSize: 13.5, fontWeight: '700', color: CO_THEME.primary },
});
