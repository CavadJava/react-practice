# Qulaq As — React Web App Design

**Status:** Draft, awaiting spec review
**Date:** 2026-08-14
**Related:** [Qulaq As artifact](https://claude.ai/code/artifact/268f70f6-7eaa-4525-be48-9ba73ddf4f2f) (the single-file HTML predecessor this app builds on and extends)

## 1. Overview

A React web app, built in this repo (`react-practice`) as a new top-level project (`qulaq-as/`, matching the `exercise-formik`/`projects/166` scaffold convention), for practicing the A1 English content maintained in `ios-project-practices/english-language-a1-c2/01-a1-temelbaslar/` (42 markdown files: 33 vocabulary/register topics + 9 "Active Production" practice files, ~1433 words, ~327 situational Q&A prompts).

It replaces and extends the "Qulaq As" HTML artifact: same core idea (read the project's own markdown content, speak it aloud via the browser, no server, no external audio) but as a real app with persistent progress, spaced repetition, and now a structured **Course Mode** that walks a learner through Word → Collocation → Sentence → Question/Answer practice with instant self-checking, no audio submission required.

## 2. Scope

**In scope:**
- Read the 33 vocabulary/register `.md` files as the data source (word, gloss, example sentences)
- Read the 9 Active Production `.md` files (34-42) as the data source for Course Mode's Q&A stage
- Text-to-speech playback via the Web Speech API (`speechSynthesis`)
- Two data-loading modes (build-time bundled, runtime fetched), toggleable, optional
- Progress persistence via `localStorage`
- A built-in spaced-repetition system (own SM-2-lite scheduling — Anki becomes optional/legacy)
- Course Mode: Word → Collocation → Sentence → Question/Answer, all self-checking, no audio recording/submission
- Söz İstifadə Tövsiyələri: per-word cross-referenced usage (which topics/sentences a word appears in across the whole 42-file corpus), derived from existing data, no new content authoring
- Local development only (`npm run dev`); no deployment

**Out of scope (this iteration):**
- Speech recognition / pronunciation feedback (would need a live ASR service; the whole point of this app's exercises is that they're checkable without audio)
- A2-C2 content (doesn't exist yet)
- Deployment/hosting
- User accounts / multi-device sync (localStorage is single-browser)
- Any backend/server component

## 3. Architecture

**Stack:** Vite + React 19, react-router-dom for navigation, Context + hooks for state (no Redux — state is small: current topic/word, progress map, SRS map, settings).

**Folder structure:**
```
qulaq-as/
├── content/*.md              ← 42 files, copied from ios-project-practices (build-time source)
├── public/content/*.md       ← same 42 files (runtime-fetch source)
├── src/
│   ├── lib/
│   │   ├── parseVocab.js         ← parses the 33 vocab/register files (word/gloss/sentences)
│   │   ├── parseProduction.js    ← parses the 9 Active Production files (Situasiya/Cavab/Fokuslu Bank)
│   │   ├── srs.js                ← SM-2-lite scheduling
│   │   ├── falseAnswerGen.js     ← generates the "yanlış" (wrong) Q&A pairs for Course Mode by cross-pairing
│   │   └── wordIndex.js          ← cross-references every word against the whole 42-file corpus (usage recommendations)
│   ├── hooks/
│   │   ├── useContent.js         ← switches between build-time glob import and runtime fetch
│   │   ├── useProgress.js        ← reads/writes the localStorage progress+SRS blob
│   │   └── useSpeech.js          ← wraps speechSynthesis (voice selection, rate, queueing, repeat count)
│   ├── context/AppContext.jsx
│   ├── pages/
│   │   ├── Browse.jsx            ← topic browsing + TTS (the original Qulaq As experience)
│   │   ├── Review.jsx            ← "Bugünkü Təkrar" — due SRS cards across all topics
│   │   ├── Course.jsx            ← new: Word → Collocation → Sentence → Q&A flow, per topic
│   │   └── Settings.jsx          ← data-mode toggle, voice/rate defaults, reset progress
│   └── components/
│       (WordCard, TopicRail, PlayButton, ProgressBadge, CourseStep, TrueFalseCard, WordUsagePanel, ...)
```

## 4. Data Flow

Single parser per file family (`parseVocab.js` for files 01-33, `parseProduction.js` for files 34-42), both pure functions operating on raw markdown text — same regex approach already proven in the project's Python extraction scripts (`**word** — gloss` + `- EN — AZ` bullets; `**Situasiya:**` / `**Sənin cavabın:**` / `**Nümunə cavab:**` triples; `### 🎯 Fokuslu Cavab Bankı` blocks).

**Two loading modes, selectable in Settings (default: build-time):**
- **Build-time:** `import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default', eager: true })` — Vite bundles all 42 files at build time; works offline, zero network latency.
- **Runtime fetch:** the same 42 files also live in `public/content/`; fetched on demand with a loading state. Useful if content is updated without a rebuild.

Both modes feed the same parser, so downstream code (Browse, Review, Course) never needs to know which mode is active.

**Regenerating `content/`:** when `ios-project-practices/english-language-a1-c2/01-a1-temelbaslar/` gains new files, re-copy them into both `qulaq-as/content/` and `qulaq-as/public/content/` (a short shell one-liner, documented in the app's README) — this app's content is a snapshot, not a live symlink, matching how the Anki `.tsv` already needs manual regeneration.

## 5. Text-to-Speech (Browse Mode)

Identical behavior to the Qulaq As artifact: `speechSynthesis`, prefers an en-US voice, rate slider (0.6×-1.0×, default 0.85), repeat-count selector (1×/2×/3×), per-word and per-sentence play buttons, "Ardıcıl dinlə" auto-advance mode that walks the whole topic and rolls into the next one, graceful no-voice-available banner.

## 6. Progress & Spaced Repetition

**Storage:** one `localStorage` key, `qulaq-as-state`:
```json
{
  "heard": { "07-is-ve-peseler::lawyer": true },
  "srs": { "07-is-ve-peseler::lawyer": { "interval": 3, "ease": 2.3, "due": "2026-08-17", "reps": 2 } },
  "settings": { "dataMode": "build", "rate": 0.85, "voiceRepeat": 2 }
}
```
Keys are `topicId::word` (stable across content re-imports; word text doesn't shift the way an array index would if a file is edited).

**Algorithm:** simplified SM-2. First exposure to a word puts it in today's review queue. After review, one of four ratings updates its schedule:
- **Bilmirdim** (Again) → reset, due tomorrow
- **Çətin** (Hard) → interval × 1.2
- **Bilirdim** (Good) → interval × ease (2.3 default)
- **Asan** (Easy) → interval × 3.5

**Review.jsx** ("Bugünkü Təkrar") pulls every word across all 33 topics where `due <= today`, presents it with the same play/reveal UI as Browse, and the 4 rating buttons.

## 7. Course Mode (new)

For a chosen topic, a 4-stage flow, entirely self-checking, no audio submission:

| Stage | Shown | Exercise (auto-graded) |
|---|---|---|
| **1. Söz** | word + gloss | Match word → correct meaning (multiple choice, 4 options: 1 correct + 3 distractors from the same topic) |
| **2. Birləşmələr** | the word inside its real collocation, pulled from that word's own example sentences (e.g. not just "gonna" but "**gonna** call you") | Fill-in-the-blank: pick the missing word from 3-4 options |
| **3. Cümlə Praktikası** | a full example sentence with one word blanked | Fill-in-the-blank or multiple choice |
| **4. Sual → Cavab** | a Situasiya + a written answer (from files 34-42) | **Doğrudur/Yanlışdır?** — learner judges, then sees the real verdict instantly |

**Where stage-4 data comes from — no new content authoring needed:** `falseAnswerGen.js` takes the existing ~327 `(situation, correct answer)` pairs from files 34-42 and derives the True/False deck automatically:
- **Doğru card:** the pair as written (situation + its real model answer)
- **Yanlış card:** the situation paired with a *different, randomly chosen* situation's model answer (cross-pairing). To avoid accidentally-still-plausible false pairs (e.g. two greeting questions both accepting "Not much"), the generator excludes cross-pairs from the *same* subcategory/topic section when picking the mismatch, biasing toward pairs that are actually semantically distinct.

This mix (50% real pairs, 50% generated mismatches, shuffled) becomes the stage-4 deck for that topic. Purely deterministic client-side logic — no server, no audio, no manual grading.

**Distractor generation for stages 1-3** (multiple choice / fill-in-blank wrong options): pull 2-3 other words from the *same topic* as distractors — plausible enough to require real recognition, not so similar they're unfair (e.g. avoid picking near-synonyms as distractors unless the topic is small).

## 8. Söz İstifadə Tövsiyələri (Cross-Referenced Usage)

Hər sözün öz "ev faylında" cəmi 2 nümunə cümləsi var — bu, harada başqa işlədildiyini görmək üçün kifayət deyil. Bunun üçün **yeni məzmun yazmağa ehtiyac yoxdur**: 42 fayl artıq tam parse olunub (1433 söz, 2866 nümunə cümlə, 327 situasiya/cavab) — sadəcə bu korpusu bir dəfə indeksləyib **cross-reference** aparmaq kifayətdir.

**Necə işləyir:** Browse və Course rejimlərində hər söz kartının yanında genişlənən "🔍 Harada Keçir?" paneli olur:
- Bu sözün (və ya çox oxşar formasının) **başqa hansı mövzularda** keçdiyini göstərir — istər başqa faylda öz başlıq sözü kimi, istərsə başqa bir sözün nümunə cümləsi daxilində, istərsə də Active Production (34-42) situasiya/cavab mətnində
- Hər keçid üçün: konkret cümlə (EN+AZ) və həmin mövzuya keçid
- Nəticə: "bu sözü hansı cümlələrdə, hansı mövzularda işlədə bilərəm" sualına — ev faylındakı 2 cümlə əvəzinə — **bütün korpusdan yığılmış real nümunələr** cavab verir

**Texniki tərəfi:** `lib/wordIndex.js` — yükləmə zamanı bir dəfə qurulan `Map<lowercased word, [{topicId, topicName, sentence, mənbə: 'başlıq-söz'|'nümunə-cümlə'|'production'}]>` indeksi. Tam client-side, server/AI-çağırış yoxdur — mövcud parse olunmuş datanın üzərində sadə axtarışdır.

## 9. Error Handling

- No TTS voice available → banner (already proven in the artifact)
- Runtime-fetch mode: network/file-not-found → "Yenidən cəhd et" retry button
- `localStorage` unavailable or corrupted JSON → catch, log to console, fall back to fresh empty state (with a one-time notice, not a silent data-loss)
- Markdown parse failure on a given file (malformed content) → skip that file, log which one, don't crash the whole app

## 10. Testing

Matching this repo's existing convention (no formal tests in sibling exercises) — no test suite. Verification is manual: after building, spot-check parser output against known totals (1433 vocab words, 327 production prompts) the same way the Python extraction scripts were self-verified earlier in this project (entry counts, corruption grep equivalent isn't needed here since content is copied verbatim from already-verified source files).

## 11. Deployment

Local only (`npm run dev`) for this iteration. No hosting decision needed yet.
