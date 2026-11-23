

/*
cd "$HOME\Desktop\tajweed-audio"
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
fnm use 26
npm.cmd run dev

*/



import { createChatbot } from "./chatbot.js";
import "./website.css";
import { TajweedClient } from "@quran-lab/tajweedformer";

// Existing HTML elements
const status = document.querySelector("#status");
const heard = document.querySelector("#heard");
const listenButton = document.querySelector("#listen");
const details = document.querySelector("#details");
const feedback = document.querySelector("#feedback");
const ayahSelector = document.querySelector("#ayah");

// Upload controls from your existing index.html
const fileInput = document.querySelector("#recitation-file");
const analyzeButton = document.querySelector("#analyze-upload");
const uploadStatus = document.querySelector("#upload-status");
const uploadReport = document.querySelector("#upload-report");
const audioPlayer = document.querySelector("#audio-preview");
const rangeStart = document.querySelector("#range-start");
const rangeEnd = document.querySelector("#range-end");


const JUZ_AMMA_NAMES = [
  "النبأ", "النازعات", "عبس", "التكوير", "الانفطار",
  "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى",
  "الغاشية", "الفجر", "البلد", "الشمس", "الليل",
  "الضحى", "الشرح", "التين", "العلق", "القدر",
  "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر",
  "العصر", "الهمزة", "الفيل", "قريش", "الماعون",
  "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص",
  "الفلق", "الناس"
];
const EXTRA_SURAHS = {
  1: "الفاتحة"
};

const quranDisplay = document.querySelector("#quran-display");
const surahTitle = document.querySelector("#surah-title");
const quranVerses = new Map();

async function loadQuranText() {
  const response = await fetch("/tanzil-uthmani.txt");

  if (!response.ok) {
    throw new Error("تعذر تحميل نص القرآن");
  }

  const text = await response.text();

  for (const line of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const match = line.match(/^(\d+)\|(\d+)\|(.*)$/);
    if (!match) continue;

    const surah = Number(match[1]);
    const ayah = Number(match[2]);

    if (surah !== 1 && (surah < 78 || surah > 114)) continue;

    if (!quranVerses.has(surah)) {
      quranVerses.set(surah, []);
    }

    quranVerses.get(surah)[ayah - 1] = match[3];
  }
}

function displaySurah(surah) {
  const verses = quranVerses.get(surah) || [];
  const name = surah === 1 ? "الفاتحة" : JUZ_AMMA_NAMES[surah - 78];

  surahTitle.textContent = `سورة ${name}`;
  quranDisplay.replaceChildren();

  const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

  // Bismillah is displayed separately, except for At-Tawbah.
  if (surah !== 9) {
    const heading = document.createElement("div");
    heading.className = "quran-bismillah";
    heading.textContent = bismillah;
    quranDisplay.appendChild(heading);
  }

  for (let index = 0; index < verses.length; index++) {
    if (!verses[index]) continue;

    const verse = document.createElement("span");
    verse.className = "quran-verse";

    // Remove the introductory Bismillah from the display,
    // where it is included in the Tanzil verse text.
    const verseText = verses[index].replace(
      /^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/,
      ""
    );

    verse.textContent = `${verseText} ﴿${index + 1}﴾ `;
    quranDisplay.appendChild(verse);
  }
}




// Surah Al-Falaq: five Ayahs
let SURAH = null;
let AYAH_COUNT = 0;

const surahSelector = document.createElement("select");
surahSelector.id = "surah";
surahSelector.replaceChildren();

// Add Al-Fatiha first
const fatihaOption = document.createElement("option");
fatihaOption.value = "1";
fatihaOption.textContent = "سورة الفاتحة";
surahSelector.appendChild(fatihaOption);

// Add all 37 Surahs of Juz Amma
JUZ_AMMA_NAMES.forEach((name, index) => {
  const option = document.createElement("option");
  option.value = String(index + 78);
  option.textContent = `سورة ${name}`;
  surahSelector.appendChild(option);
});
const placeholderOption = document.createElement("option");
placeholderOption.value = "";
placeholderOption.textContent = "اختر السورة أولًا";
surahSelector.insertBefore(placeholderOption, surahSelector.firstChild);
surahSelector.value = "";

surahSelector.addEventListener("change", () => {
  SURAH = surahSelector.value ? Number(surahSelector.value) : null;
  if (!SURAH) return;
  AYAH_COUNT = SURAH === 1 ? 7 : (quranVerses.get(SURAH)?.length || 0);

  displaySurah(SURAH);
  const selectedName = surahSelector.selectedOptions[0]?.textContent || "السورة";
  document.querySelector("#upload-title").textContent = `رفع تسجيل صوتي — ${selectedName}`;
  if (feedback) feedback.replaceChildren();
  if (uploadReport) uploadReport.replaceChildren();
  if (heard) heard.textContent = "";
  if (details) details.textContent = "";
  // Update microphone starting Ayah
  ayahSelector.disabled = false;
  rangeStart.disabled = false;
  rangeEnd.disabled = false;
  ayahSelector.replaceChildren();

  for (let i = 1; i <= AYAH_COUNT; i++) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `الآية ${i}`;
    ayahSelector.appendChild(option);
  }

  // Update microphone ending Ayah
  ayahSelector.dispatchEvent(new Event("change"));

  // Update upload range selectors
  rangeStart.replaceChildren();
  rangeEnd.replaceChildren();

  for (let i = 1; i <= AYAH_COUNT; i++) {
    const startOption = document.createElement("option");
    startOption.value = String(i);
    startOption.textContent = `الآية ${i}`;
    rangeStart.appendChild(startOption);

    const endOption = document.createElement("option");
    endOption.value = String(i);
    endOption.textContent = `الآية ${i}`;
    rangeEnd.appendChild(endOption);
  }

  rangeEnd.value = String(AYAH_COUNT);
});

loadQuranText()
  .then(() => {
    surahTitle.textContent = "اختر سورة لعرض آياتها";
    quranDisplay.textContent = "ابدأ باختيار السورة ونطاق الآيات من الأعلى.";
  })
  .catch((error) => {
    console.error(error);
    quranDisplay.textContent = "تعذر تحميل نص القرآن";
  });

const surahLabel = document.createElement("label");
surahLabel.textContent = "السورة: ";
surahLabel.appendChild(surahSelector);

if (ayahSelector) {
  ayahSelector.parentNode.insertBefore(
    surahLabel,
    ayahSelector
  );

  ayahSelector.replaceChildren();

  for (let i = 1; i <= AYAH_COUNT; i++) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `الآية ${i}`;
    ayahSelector.appendChild(option);
  }
}


const microphoneEndLabel = document.createElement("label");
microphoneEndLabel.textContent = " إلى الآية: ";

const microphoneEnd = document.createElement("select");
microphoneEnd.id = "microphone-range-end";

microphoneEndLabel.appendChild(microphoneEnd);

if (ayahSelector) {
  ayahSelector.parentNode.insertBefore(
    microphoneEndLabel,
    ayahSelector.nextSibling
  );

  function updateMicrophoneRange() {
    const start = Number(ayahSelector.value);

    microphoneEnd.replaceChildren();

    for (let ayah = start; ayah <= AYAH_COUNT; ayah++) {
      const option = document.createElement("option");
      option.value = String(ayah);
      option.textContent = `الآية ${ayah}`;
      microphoneEnd.appendChild(option);
    }
  }

  ayahSelector.addEventListener("change", updateMicrophoneRange);
  updateMicrophoneRange();
}


// Load our existing quran-g2p references
async function getReference(ayah) {
  const filename = SURAH === 1
    ? `fatiha_${ayah}_reference.json`
    : `surah_${SURAH}_ayah_${ayah}_reference.json`;

  const response = await fetch(`/${filename}`);
  if (!response.ok) throw new Error(`تعذر تحميل مرجع الآية ${ayah}`);
  return response.json();
}
// Display phonemes as understandable Arabic sounds.
// This is an approximate phonetic representation,
// not a verified mapping to Quran text positions.
const soundNames = {
  a: "فتحة",
  i: "كسرة",
  u: "ضمة",
  aa: "صوت مد بالألف",
  ii: "صوت مد بالياء",
  uu: "صوت مد بالواو",
  b: "ب",
  t: "ت",
  th: "ث",
  j: "ج",
  "ḥ": "ح",
  "ħ": "ح",
  kh: "خ",
  d: "د",
  dh: "ذ",
  r: "ر",
  z: "ز",
  s: "س",
  sh: "ش",
  "ṣ": "ص",
  "ḍ": "ض",
  "ṭ": "ط",
  "ẓ": "ظ",
  "ʿ": "ع",
  "ɣ": "غ",
  gh: "غ",
  f: "ف",
  q: "ق",
  k: "ك",
  l: "ل",
  m: "م",
  n: "ن",
  h: "ه",
  w: "و",
  y: "ي"
};

function describeSound(token) {
  if (!token) return "لا يوجد صوت واضح";

  const key = String(token).trim();

  return soundNames[key] || `الصوت (${key})`;
}

// Edit-distance alignment between expected
// and detected phoneme sequences.
function alignSequences(expected, actual) {
  const m = expected.length;
  const n = actual.length;

  const dp = Array.from(
    { length: m + 1 },
    () => new Uint32Array(n + 1)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost =
        expected[i - 1].token === actual[j - 1].name
          ? 0
          : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  const result = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const same =
        expected[i - 1].token === actual[j - 1].name;

      const cost = same ? 0 : 1;

      if (dp[i][j] === dp[i - 1][j - 1] + cost) {
        result.push({
          expected: expected[i - 1],
          detected: actual[j - 1],
          type: same ? "match" : "substitution"
        });

        i--;
        j--;
        continue;
      }
    }

    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      result.push({
        expected: expected[i - 1],
        detected: null,
        type: "missing"
      });

      i--;
    } else {
      result.push({
        expected: null,
        detected: actual[j - 1],
        type: "extra"
      });

      j--;
    }
  }

  return result.reverse();
}

// Convert model differences into Arabic explanations.

function describeDifference(item) {
  const expected = item.expected?.token;
  const detected = item.detected?.name;

  if (item.type === "substitution") {
    return `الصوت المتوقع: ${describeSound(expected)}، ` +
      `والصوت المرصود: ${describeSound(detected)}. ` +
      "يُحتمل وجود اختلاف في النطق.";
  }

  if (item.type === "missing") {
    return `لم يرصد النظام الصوت المتوقع: ${describeSound(expected)}.`;
  }

  if (item.type === "extra") {
    return `رصد النظام صوتًا إضافيًا محتملًا: ${describeSound(detected)}.`;
  }

  return "";
}


function formatTajweedEvaluation(status, message) {
  const labels = {
  possible_correct: "ضمن النطاق المتوقع (تجريبي)",
  short: "أقصر من المتوقع (تجريبي)",
  long: "أطول من المتوقع (تجريبي)",
  unknown: "تعذر التقييم"
  };

  const label = labels[status] || "تقييم غير مؤكد";

  return status === "unknown"
    ? "تعذر التقييم — النموذج غير قادر حاليًا على تقييم هذا التسجيل. استشر شيخك."
    : `${label} — استشر شيخك.`;
}


function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}




function locateExpectedLetter(reference, item) {
  const token = item.expected;

  if (
    !token ||
    !Number.isInteger(token.word) ||
    !Number.isInteger(token.sourceTokenIndex)
  ) {
    return null;
  }

  const words = (reference.text || "").trim().split(/\s+/);
  const word = words[token.word];

  if (!word) return null;

  // Only highlight actual consonants.
  // Vowels and long sounds need separate handling.
  const isArabicConsonant = value =>
    typeof value === "string" &&
    /^[\u0621-\u064A\u0671]$/u.test(value);

  if (!isArabicConsonant(token.token)) {
    return null;
  }

  const normalizeLetter = letter => {
    if ("أإؤئٱ".includes(letter)) return "ء";
    return letter;
  };

  const writtenLetters = [];

  for (const char of word) {
    if (isArabicConsonant(char)) {
      writtenLetters.push(char);
    }
  }

  const referenceConsonants = reference.tokens
    .map((t, index) => ({ ...t, index }))
    .filter(t =>
      t.word === token.word &&
      isArabicConsonant(t.token)
    );

  // Match each reference consonant to a written letter
  // in the same order. Unpronounced written letters
  // may be skipped.
  let writtenIndex = 0;

  for (const consonant of referenceConsonants) {
    const expectedLetter = normalizeLetter(consonant.token);

    let found = -1;

    for (
      let i = writtenIndex;
      i < writtenLetters.length;
      i++
    ) {
      if (
        normalizeLetter(writtenLetters[i]) === expectedLetter
      ) {
        found = i;
        break;
      }
    }

    if (found === -1) {
      return null;
    }

    writtenIndex = found + 1;

    if (consonant.index === token.sourceTokenIndex) {
      return {
        word,
        letter: writtenLetters[found],
        position: found
      };
    }
  }

  return null;
}


// Madd-only experimental classification using the active SDK context cuts.
// Our Viterbi CTC spans are NOT proven equivalent to the SDK's H-time spans.
// Keep this as preliminary feedback, never a verified Tajweed judgment.
function evaluateMadd(maddToken, detectedTokens = [], rule = null, timingHead = null, reference = null, ctcAlignment = null, maddCalibration = null) {
  const unknown = (message = "تعذر الحصول على قياس موثوق لمقدار المد.", reason = "unclassified") => {
    console.warn("MADD REJECTION REASON:", {
      reason, word: rule?.word, title: rule?.title,
      recognized: rule?.recognized, matched: Boolean(rule?.matchedToken),
      allowed: rule?.allowedLengths, expected: rule?.expected
    });
    return { status: "unknown", message };
  };

  if (!rule?.recognized || !rule.matchedToken) {
    return unknown("لم يتم التعرف على صوت المد بدقة.", "phoneme_not_matched");
  }
  if (!timingHead || !reference) return unknown(undefined, "missing_timing_or_reference");

  const allowed = (Array.isArray(rule.allowedLengths) ? rule.allowedLengths : [])
    .map(Number).filter(Number.isFinite);
  if (!allowed.length && rule.expected != null && Number.isFinite(Number(rule.expected))) {
    allowed.push(Number(rule.expected));
  }
  if (!allowed.length) return unknown(undefined, "no_allowed_lengths");

  // Match the SDK's rule families; avoid applying 2-count cuts to longer Madd.
  const title = rule.title || "";
  const family = title.includes("اللازم") ? "lazim"
    : title.includes("المتصل") || title.includes("المنفصل") ? "muttasil"
    : allowed.includes(6) && allowed.includes(2) ? "free"
    : allowed.every(n => n === 2) ? "fixed2"
    : null;
  if (!family) return unknown("لا تتوفر معايرة مناسبة لهذا النوع من المد.", "unmapped_madd_family");

  const config = maddCalibration?.madd;
  if (!config || config.status === "off" || config.cuts?.[family]?.status === "off") {
    return unknown("معايرة هذا النوع من المد غير مفعّلة أو غير متاحة.", "sdk_family_disabled");
  }
  const cuts = config.preset_cuts?.balanced?.[family] || config.cuts?.[family];
  const cut24 = Number(cuts?.["2|4"]);
  const cut46 = Number(cuts?.["4|6"]);
  if (!Number.isFinite(cut24) || !Number.isFinite(cut46) || cut24 >= cut46) {
    return unknown("عتبات المد غير متاحة في معايرة النموذج.", "invalid_sdk_cuts");
  }

  try {
    const expected = reference.tokens.filter(t => t.token !== "|");
    const index = reference.tokens.slice(0, rule.tokenIndex)
      .filter(t => t.token !== "|").length;
    if (!["aa", "ii", "uu"].includes(expected[index]?.token)) return unknown();
    const spans = getReferenceSpans(reference, timingHead, ctcAlignment);
    if (!spans) return unknown(undefined, "alignment_missing");
    const duration = span => {
      if (span?.startFrame == null || span?.endFrame == null) return null;
      const frames = span.endFrame - span.startFrame;
      return frames > 0 ? frames : null;
    };
    const maddFrames = duration(spans[index]);
    // Extremely short spans are likely unstable alignment measurements.
    if (maddFrames == null || maddFrames < 5) return unknown(undefined, "madd_span_too_short");
    const shortVowels = expected.flatMap((token, i) => {
      const frames = duration(spans[i]);
      return ["a", "i", "u"].includes(token.token) && frames ? [frames] : [];
    }).sort((a, b) => a - b);
    if (shortVowels.length < (config.min_short_vowels || 3)) return unknown(undefined, "too_few_short_vowels");
    const middle = Math.floor(shortVowels.length / 2);
    const median = shortVowels.length % 2
      ? shortVowels[middle]
      : (shortVowels[middle - 1] + shortVowels[middle]) / 2;
    const ratio = maddFrames / median;
    console.log("MADD SDK CUTS TEST (experimental CTC ratio):", {
      word: rule.word, phoneme: expected[index].token, family,
      maddFrames, shortVowelMedianFrames: median,
      shortVowelCount: shortVowels.length, ratio, cut24, cut46
    });
    if (!Number.isFinite(ratio)) return unknown();

    // The SDK cuts distinguish 2/4/6 buckets, not an exact 5-count Madd.
    const bucket = ratio < cut24 ? 2 : ratio < cut46 ? 4 : 6;
    const acceptable = allowed.some(n => n === bucket || (n === 5 && bucket === 4));
    // These SDK cuts separate 2/4/6 categories; they are NOT validated
    // minimum/maximum acceptable durations for our custom CTC alignment.
    if (ratio < 1) return unknown(undefined, "ratio_below_reliable_guard");
    // For free Madd, 6 counts are allowed, but the highest bucket has no
    // upper bound. We cannot distinguish 6 from excessive elongation.
    if (family === "free" && bucket === 6) {
      return unknown("المد طويل، لكن لا يمكن التأكد من عدم تجاوزه ست حركات.", "free_upper_limit_unvalidated");
    }

    // Lower buckets remain experimental, not verified Tajweed judgments.
    if (acceptable) {
      return { status: "possible_correct", message: "مدة المد ضمن النطاق المتوقع مبدئيًا، وفق قياس تجريبي." };
    }
    const lowest = Math.min(...allowed);
    const highest = Math.max(...allowed);
    if (bucket < lowest) {
      return { status: "short", message: "قد يكون المد أقصر من المقدار المتوقع؛ القياس تجريبي." };
    }
    if (bucket > highest) {
      return { status: "long", message: "قد يكون المد أطول من المقدار المتوقع؛ القياس تجريبي." };
    }
    return unknown("لا يمكن تحديد مدى توافق مقدار المد مع الحكم بدقة.", "ambiguous_bucket");
  } catch (error) {
    console.warn("MADD CTC ERROR:", error);
    return unknown();
  }
}


// Experimental Viterbi CTC alignment.
// The output is not a verified reproduction of Quran Lab's scorer.
function alignTimingCTC(head, referenceTokens) {
  const ids = referenceTokens
    .filter(t => t.token !== "|")
    .map(t => t.id);

  const { values, frames: T, classes: C } = head;
  const blank = 0;

  if (
    !T ||
    !C ||
    values.length !== T * C ||
    !ids.length ||
    ids.some(id => !Number.isInteger(id) || id <= 0 || id >= C)
  ) {
    throw new Error("Invalid timing head or reference IDs");
  }

  const states = [blank];

  for (const id of ids) {
    states.push(id, blank);
  }

  const S = states.length;

  const back = Array.from(
    { length: T },
    () => new Uint8Array(S)
  );

  let previous = new Float64Array(S).fill(-Infinity);

  previous[0] = values[blank];

  if (S > 1) {
    previous[1] = values[states[1]];
  }

  for (let t = 1; t < T; t++) {
    const current = new Float64Array(S).fill(-Infinity);

    for (let j = 0; j < S; j++) {
      let best = previous[j];
      let move = 0;

      if (j >= 1 && previous[j - 1] > best) {
        best = previous[j - 1];
        move = 1;
      }

      if (
        j >= 2 &&
        states[j] !== blank &&
        states[j] !== states[j - 2] &&
        previous[j - 2] > best
      ) {
        best = previous[j - 2];
        move = 2;
      }

      current[j] = best + values[t * C + states[j]];
      back[t][j] = move;
    }

    previous = current;
  }

  let state =
    previous[S - 1] >= previous[S - 2]
      ? S - 1
      : S - 2;

  if (!Number.isFinite(previous[state])) {
    throw new Error("CTC alignment failed");
  }

  const spans = ids.map(() => ({
    startFrame: null,
    endFrame: null
  }));

  for (let t = T - 1; t >= 0; t--) {
    if (state % 2 === 1) {
      const span = spans[(state - 1) / 2];

      if (span.endFrame === null) {
        span.endFrame = t + 1;
      }

      span.startFrame = t;
    }

    if (t > 0) {
      state -= back[t][state];
    }
  }

  return spans;
}


function prepareCTCAlignment(timingHead, references) {
  if (!timingHead || !references?.length) return null;

  const combinedTokens = references.flatMap(reference =>
    reference.tokens.filter(token => token.token !== "|")
  );

  if (!combinedTokens.length) return null;

  try {
    const spans = alignTimingCTC(timingHead, combinedTokens);

    const byReference = new Map();
    let offset = 0;

    for (const reference of references) {
      const count = reference.tokens.filter(
        token => token.token !== "|"
      ).length;

      byReference.set(reference, spans.slice(offset, offset + count));
      offset += count;
    }

    return byReference;
  } catch (error) {
    console.warn("MULTI-AYAH CTC ERROR:", error);
    return null;
  }
}

function getReferenceSpans(reference, timingHead, ctcAlignment = null) {
  if (ctcAlignment) {
    return ctcAlignment.get(reference) || null;
  }

  if (!timingHead) return null;

  try {
    return alignTimingCTC(timingHead, reference.tokens);
  } catch (error) {
    console.warn("CTC ALIGNMENT ERROR:", error);
    return null;
  }
}



function evaluateQalqalah(rule, qalqalahHead, calibration, context, items = [], timingHead = null, reference = null, ctcAlignment = null) {
  const unknown = "لا يمكن التقييم: البيانات الصوتية غير كافية.";

  const expectedLetter = rule.letter;
  const detectedLetter = rule.matchedToken?.name;
  

  if (
    !rule.recognized ||
    !rule.matchedToken ||
    detectedLetter !== expectedLetter
  ) {
    return "لا يمكن تقييم القلقلة: لم يتم التأكد من نطق الحرف الصحيح.";
  }

  if (!["q", "ق", "ṭ", "ط", "b", "ب", "j", "ج", "d", "د"].includes(expectedLetter)) {
    return "لا يمكن التقييم: هذا الحرف ليس من حروف القلقلة.";
  }

    if (!timingHead || !reference || !qalqalahHead) {
      return unknown;
    }

  const config = calibration?.json?.contexts?.[context]?.qalqalah;
  const threshold = 0.9; // Your custom experimental threshold

  if (
    !config ||
    config.status === "off" ||
    qalqalahHead.classes !== 3 ||
    timingHead.frames !== qalqalahHead.frames
  ) {
    return unknown;
  }

  const expected = reference.tokens.filter(t => t.token !== "|");
  const spans = getReferenceSpans(reference, timingHead, ctcAlignment);
  if (!spans) return unknown;

  const index = reference.tokens
  .slice(0, rule.tokenIndex)
  .filter(token => token.token !== "|").length;

  if (index < 0 || spans[index]?.endFrame == null) {
    return unknown;
  }

  const itemIndex = items.findIndex(
    item => item.expected?.sourceTokenIndex === rule.tokenIndex
  );

  const nextDetected = itemIndex >= 0
  ? items
      .slice(itemIndex + 1)
      .find(item => item.detected)?.detected
  : null;

  if (
    nextDetected &&
    ["a", "i", "u", "aa", "ii", "uu"].includes(nextDetected.name)
  ) {
    return "لا يمكن التقييم: رُصد صوت حركة بعد حرف القلقلة.";
  }

  const start = spans[index].endFrame + 2;
  const stop = spans[index].endFrame + 14;

  if (
    start < 0 ||
    stop > qalqalahHead.frames ||
    qalqalahHead.values.length < stop * 3
  ) {
    return unknown;
  }

  let sum = 0;

  for (let frame = start; frame < stop; frame++) {
    const offset = frame * 3;
    sum += qalqalahHead.values[offset + 1]
         + qalqalahHead.values[offset + 2];
  }

  const score = sum / (stop - start);

  console.log("QALQALAH CTC TEST:", {
    score,
    customThreshold: threshold,
    sdkThreshold: config.tau
  });

  if (!Number.isFinite(score)) return unknown;

  if (score >= threshold) {
  return "أداء صحيح مبدئيًا — رُصدت إشارة قلقلة واضحة.";
}

if (score >= threshold * 0.7) {
  return "خطأ محتمل في القلقلة — الإشارة الصوتية أضعف من العتبة التجريبية.";
}

return "التلاوة غير واضحة للتقييم — لم تتوفر أدلة صوتية كافية.";
  }


const MADD_NAMES = {
  TABEEI: "المد الطبيعي",
  BADAL: "مد البدل",
  MUTTASIL: "المد الواجب المتصل",
  MUNFASIL: "المد الجائز المنفصل",
  LAZIM: "المد اللازم",
  ARID: "المد العارض للسكون",
  AARID: "المد العارض للسكون",
  AARED: "المد العارض للسكون",
  LIN: "مد اللين",
  LEEN: "مد اللين",
  SILAH: "مد الصلة",
  SILA: "مد الصلة",
  IWAD: "مد العوض",
  EWAD: "مد العوض",
  TAMKIN: "مد التمكين",
  FARQ: "مد الفرق"
};

function getMaddTitle(ruleNames) {
  for (const [key, title] of Object.entries(MADD_NAMES)) {
    if (ruleNames.some(rule =>
      String(rule).toUpperCase().includes(key)
    )) {
      return title;
    }
  }

  return "حكم مد";
}




function getTajweedRules(reference, items) {
  const words = (reference.text || "").trim().split(/\s+/);

  const rules = [];

  for (let index = 0; index < reference.tokens.length; index++) {
    const token = reference.tokens[index];

    if (!Number.isInteger(token.word)) continue;

    const ruleNames = token.rules || [];
    const lengths = token.length || [];
    const qalqalah = token.qalqalah || [];

    const word = words[token.word] || "كلمة غير محددة";

    const matchingItem = items.find(item =>
      item.expected?.sourceTokenIndex === index
    );

    const matchedToken =
    matchingItem?.type === "match" &&
    matchingItem.detected?.name === token.token
    ? matchingItem.detected
    : null;

    const recognized =
      matchingItem?.type === "match";

    const possibleDifference =
      matchingItem &&
      matchingItem.type !== "match";

    // Madd
    if (
      ["aa", "ii", "uu"].includes(token.token) &&
      (
       lengths.length > 0 ||
      ruleNames.some(rule => rule.includes("TABEEI"))
      )
    ) {
      const length = lengths[0];

      rules.push({
        type: "madd",
        matchedToken,
        durationMs:
          matchedToken &&
          Number.isFinite(matchedToken.firstMs) &&
          Number.isFinite(matchedToken.lastMs) &&
          matchedToken.lastMs > matchedToken.firstMs
            ? matchedToken.lastMs - matchedToken.firstMs
            : null,
        word,
        title: getMaddTitle(ruleNames),
        expected: length?.canonical ?? null,
        allowedLengths: Array.isArray(length?.allowed)
          ? length.allowed
          : [],
        recognized,
        possibleDifference,
        matchedToken,
        tokenIndex: index
      });
    }

    // Qalqalah
    if (
      qalqalah.length > 0 ||
      ruleNames.some(rule => rule.includes("QALQALAH"))
    ) {
      const qalqalahTypes = [
      ...qalqalah,
      ...ruleNames
    ].map(value => String(value).toUpperCase());

    const hasType = name =>
      qalqalahTypes.some(value => value.includes(name));

    const kind = hasType("AKBAR")
      ? "الأكبر"
      : hasType("KUBRA")
        ? "الكبرى"
        : hasType("SUGHRA") || hasType("SUGRA")
          ? "الصغرى"
          : "غير محددة";

      rules.push({
        type: "qalqalah",
        word,
        title: `القلقلة ${kind}`,
        letter: token.token,
        recognized,
        possibleDifference,
        matchedToken,
        tokenIndex: index
      });
    }
  }

  console.table(
  rules.map(rule => ({
    word: rule.word,
    type: rule.type,
    title: rule.title,
    expected: rule.type === "madd"
      ? rule.expected
      : "—",
    allowed: rule.type === "madd"
      ? rule.allowedLengths?.join(", ") || "—"
      : "—",
    recognized: rule.recognized
  }))
  );
  return rules;
}

function addTajweedRules(card, reference, items, detectedTokens = [], qalqalahData = null, timingHead = null, ctcAlignment = null) {
  const rules = getTajweedRules(reference, items);

  if (!rules.length) return;

  const container = createElement(
    "section",
    "tajweed-rules-section"
  );

  container.dir = "rtl";

  container.appendChild(
    createElement("h3", "", "أحكام التجويد")
  );

  for (const rule of rules) {
    const box = createElement(
      "div",
      "tajweed-rule-card"
    );

    box.appendChild(
      createElement("h4", "", rule.title)
    );

    box.appendChild(
      createElement(
        "p",
        "",
        `الكلمة: ${rule.word}`
      )
    );

    if (rule.type === "madd") {

      const maddToken = rule.matchedToken;


      const evaluation = evaluateMadd(
        maddToken,
        detectedTokens,
        rule,
        timingHead,
        reference,
        ctcAlignment,
        qalqalahData?.calibration?.json?.contexts?.[qalqalahData.context]

      );

      box.appendChild(
        createElement(
          "p",
          "tajweed-rule-note",
          formatTajweedEvaluation(
          evaluation.status,
          evaluation.message
        )
        )
      );

      const allowed = rule.allowedLengths.length
      ? rule.allowedLengths
      : rule.expected != null
        ? [rule.expected]
        : [];

      const durationText = allowed.length
      ? `المقدار المتوقع: ${allowed.join(" أو ")} حركة`
      : "المقدار المتوقع: غير محدد في المرجع";

    }

        
      if (rule.type === "qalqalah") {
        box.appendChild(
          createElement(
            "p",
            "",
            `الحرف: ${rule.letter}`
          )
        );

        const message = qalqalahData
        ? evaluateQalqalah(
            rule,
            qalqalahData.head,
            qalqalahData.calibration,
            qalqalahData.context,
            items,
            timingHead,
            reference,
            ctcAlignment

          )
        : "لا يمكن التقييم: البيانات الصوتية غير كافية.";

        box.appendChild(
          createElement("p", "tajweed-rule-note", message)
        );
      }


    let message;

    if (rule.possibleDifference) {
      message =
        "رصد النظام اختلافًا محتملًا في الصوت المرتبط بهذا الحكم. " +
        "لا يمكن تحديد صحة أداء الحكم من هذا الاختلاف وحده.";
    } else if (rule.recognized) {
      message =
        "تعرّف النظام على الصوت المرتبط بهذا الحكم، " +
        "لكن جودة أداء الحكم لم تُقيّم بعد.";
    } else {
      message =
        "هذا الحكم موجود في الآية المرجعية. " +
        "لم تتوفر نتيجة صوتية كافية لتقييم أدائه.";
    }

    
    if (rule.type !== "madd" && rule.type !== "qalqalah") {
      box.appendChild(
        createElement("p", "tajweed-rule-note", message)
      );
    }


    container.appendChild(box);
  }

  card.appendChild(container);
}

// Display one report card per Ayah.

function addReportRow(parent, ayah, reference, items, detectedTokens = [], qalqalahData = null, timingHead = null, ctcAlignment = null) {
  const card = createElement("article", "ayah-result");
  card.dir = "rtl";

  const disclaimer = createElement(
  "p",
  "ai-evaluation-disclaimer",
  "تنبيه: هذا تقييم مبدئي باستخدام الذكاء الاصطناعي، " +
  "وقد يخطئ في تحديد صحة التلاوة. " +
  "يُنصح بمراجعة شيخ أو معلّم تجويد مؤهل للتأكد من الأداء."
  );

card.appendChild(disclaimer);

  const title = createElement(
    "h3",
    "",
    `الآية ${ayah} — ${reference.text || ""}`
  );

  card.appendChild(title);

  const differences = items.filter(
    item => item.type !== "match"
  );

  if (!differences.length) {
    addTajweedRules(card, reference, items, detectedTokens, qalqalahData, timingHead, ctcAlignment);
    parent.appendChild(card);
    return;
  }

  const groups = new Map();

  for (const item of differences) {
    const wordIndex = item.expected?.word;

    const key = Number.isInteger(wordIndex)
      ? `word-${wordIndex}`
      : "unknown";

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(item);
  }

  const words = (reference.text || "")
    .trim()
    .split(/\s+/);

  card.appendChild(
    createElement(
      "p",
      "",
      `رصد النظام اختلافات صوتية محتملة في ${groups.size} موضع/كلمة.`
    )
  );

  for (const [key, group] of groups) {
    const first = group[0];
    const wordIndex = first.expected?.word;

    const word = Number.isInteger(wordIndex)
      ? words[wordIndex]
      : null;

    const section = createElement(
      "div",
      "tajweed-word-result"
    );

    const heading = createElement("h4", "");

    if (word) {
      const locations = group
        .map(item => locateExpectedLetter(reference, item))
        .filter(Boolean);

      const positions = new Set(
        locations.map(location => location.position)
      );

      let letterPosition = 0;

      for (const char of word) {
        const span = document.createElement("span");
        span.textContent = char;

        if (/^[\u0621-\u064A\u0671]$/u.test(char)) {
          if (positions.has(letterPosition)) {
            span.style.color = "#B45309";
            span.style.fontWeight = "bold";
            span.style.textDecoration = "underline";
          }

          letterPosition++;
        }

        heading.appendChild(span);
      }
    } else {
      heading.textContent = "موضع غير محدد بدقة";
    }

    section.appendChild(heading);

    const list = createElement(
      "ul",
      "tajweed-differences"
    );

    for (const item of group.slice(0, 8)) {
      const line = createElement(
        "li",
        "",
        describeDifference(item)
      );

      list.appendChild(line);
    }

    section.appendChild(list);
    card.appendChild(section);
  }

  
    card.appendChild(
      createElement(
        "p",
        "",
        "تنبيه: هذه اختلافات محتملة في تسلسل الأصوات، " +
        "وليست أخطاء تجويد مؤكدة."
      )
    );

    // Show Madd and Qalqalah rules
    addTajweedRules(card, reference, items, detectedTokens, qalqalahData, timingHead, ctcAlignment);



  parent.appendChild(card);
}


// Decode audio into mono Float32Array.
async function decodeUploadedAudio(file) {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  const context = new AudioContextClass({
    sampleRate: 16000
  });

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = await context.decodeAudioData(arrayBuffer);

    const mono = new Float32Array(buffer.length);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);

      for (let i = 0; i < buffer.length; i++) {
        mono[i] += data[i] / buffer.numberOfChannels;
      }
    }

    return {
      samples: mono,
      sampleRate: buffer.sampleRate,
      duration: buffer.duration
    };
  } finally {
    await context.close();
  }
}

// Analyze audio through TajweedFormer.
async function analyzeAudio(model, audio) {
  const session = await model.listen({
    from: audio.samples,
    sampleRate: audio.sampleRate,
    pace: "fast"
  });

  let streamedTokens = [];

  for await (const chunk of session.chunks) {
    if (chunk.decoded?.tokens?.length) {
      streamedTokens = chunk.decoded.tokens;
    }
  }

  const heads = await session.finish();
  const qalqalahHead = heads.get("attr_qalqalah");

  console.log("QALQALAH HEAD:", {
    frameMs: qalqalahHead?.frameMs,
    frames: qalqalahHead?.frames,
    classes: qalqalahHead?.classes,
    kind: qalqalahHead?.kind,
    firstValues: Array.from(
      qalqalahHead?.values?.slice(0, 9) || []
    )
  });
  const qalqalahOutput = heads._a?.attr_qalqalah;

  console.log("QALQALAH METADATA:", {
    shape: qalqalahOutput?.shape,
    dims: qalqalahOutput?.dims,
    keys: qalqalahOutput ? Object.keys(qalqalahOutput) : [],
    length: qalqalahOutput?.length,
    firstValues: qalqalahOutput?.slice?.(0, 16)
  });
  console.log(
  "QALQALAH RAW OUTPUT:",
  heads._a?.attr_qalqalah
  );

  console.log("===== TAJWEED MODEL HEADS =====", heads);

  console.log(
    "Available model outputs:",
    Object.keys(heads)
  );

  try {
    console.log(
      "Decoded phonemes:",
      heads.decoded()
    );


    const decoded = heads.decoded();

    console.log("===== DECODED STRUCTURE =====");

    console.log("First 5 frames:", decoded.frames?.slice(0, 5));

    console.log("First 5 tokens:", decoded.tokens?.slice(0, 5));


    console.log("===== TOKEN DETAILS =====");

    decoded.tokens?.slice(0, 8).forEach((token, index) => {
      console.log(`Token ${index + 1}:`, {
        name: token.name,
        keys: Object.keys(token),
        fullToken: token
      });
    });

    console.log("===== FRAME DETAILS =====");

    decoded.frames?.slice(0, 3).forEach((frame, index) => {
      console.log(`Frame ${index + 1}:`, {
        keys: Object.keys(frame),
        fullFrame: frame
      });
    });


    console.log("First word:", decoded.words?.[0]);

    console.log("Available head methods:", 
      Object.getOwnPropertyNames(
        Object.getPrototypeOf(heads)
      )
    );

    console.log("===== RAW OUTPUT DIMENSIONS =====");

    for (const [name, value] of Object.entries(heads._a || {})) {
      console.log(name, {
        length: value?.length,
        firstValues: value?.slice?.(0, 8)
      });
    }

  } catch (error) {
    console.warn("Cannot inspect decoded output:", error);
  }

  console.log("===== END MODEL OUTPUT =====");



  const decodedResult = heads.decoded();
  const finalTokens = decodedResult?.tokens || [];

  return {
    tokens: finalTokens.length
      ? finalTokens
      : streamedTokens,
    frames: decodedResult?.frames || [],
    heads
  };
}

// Validate reference phoneme vocabulary.
function validateReferences(model, references) {
  for (const reference of references) {
    for (const token of reference.tokens) {
      if (token.token === "|") continue;

      if (model.tokens.name(token.id) !== token.token) {
        throw new Error(
          "البيانات المرجعية لا تتوافق مع إصدار النموذج."
        );
      }
    }
  }
}

// Produce a grouped report from selected consecutive Ayahs.
function buildVerseReport(references, detectedTokens) {
  const expected = [];

  references.forEach((reference, index) => {
    const ayah = reference.ayah ?? index + 1;

    for (const token of reference.tokens) {
      if (token.token !== "|") {
        expected.push({ ...token, ayah });
      }
    }
  });

  const actual = detectedTokens.filter(
    token => token.name !== "|"
  );

  const aligned = alignSequences(expected, actual);

  const grouped = new Map(
    references.map((reference, index) => [
      reference.ayah ?? index + 1,
      []
    ])
  );

  let currentAyah = references[0].ayah ?? 1;

  for (const item of aligned) {
    if (item.expected?.ayah) {
      currentAyah = item.expected.ayah;
    }

    grouped.get(currentAyah)?.push(item);
  }

  return grouped;
}

let modelLoadingPromise = null;
async function initialize() {
  if (status) status.textContent = "جارٍ تحميل نموذج التحليل...";

  try {
    const key = import.meta.env.VITE_QURANLAB_KEY;

    if (!key) {
      throw new Error("مفتاح Quran Lab غير موجود.");
    }

    const client = await TajweedClient.create({ key });
    const model = await client.model();
    console.log("DEFAULT CONTEXT:", model.defaultContext);
    console.log("MODEL API:", {
    modelKeys: Object.keys(model),
    modelMethods: Object.getOwnPropertyNames(
      Object.getPrototypeOf(model)
    ),
    modelId: model.id,
    contexts: model.contexts
    });

    console.log("TajweedFormer version:", model.version);
    console.log("CALIBRATION:", model.calibration);

    console.log(
    "QALQALAH CONFIG:",
    JSON.stringify(
      {
        modelContexts: model.contexts,
        settings: Object.fromEntries(
          Object.entries(model.calibration.json.contexts).map(
            ([name, context]) => [name, context.qalqalah]
          )
        )
      },
      null,
      2
      )
     );

    console.log("QALQALAH SETTINGS:",
      model.calibration?.json?.contexts
    );

    if (status) status.textContent = "النموذج جاهز للتحليل";
    if (listenButton) listenButton.disabled = !SURAH;
    document.querySelector("#model-setup")?.classList.add("ready");

    // Uploaded audio
    if (
      fileInput &&
      analyzeButton &&
      uploadStatus &&
      uploadReport &&
      audioPlayer &&
      rangeStart &&
      rangeEnd
    ) {
      let previewUrl = null;

      fileInput.addEventListener("change", () => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          previewUrl = null;
        }

        const file = fileInput.files?.[0];

        audioPlayer.pause();
        audioPlayer.removeAttribute("src");

        if (file) {
          previewUrl = URL.createObjectURL(file);
          audioPlayer.src = previewUrl;
        }

        audioPlayer.hidden = !file;
        analyzeButton.disabled = !file || !SURAH;
        uploadReport.replaceChildren();

        uploadStatus.textContent = file
          ? `الملف المختار: ${file.name}`
          : "اختر ملفًا صوتيًا لبدء التحليل.";
      });

      analyzeButton.addEventListener("click", async () => {
        const file = fileInput.files?.[0];

        if (!SURAH) { uploadStatus.textContent = "اختر السورة أولًا."; return; }
        if (!file) {
          uploadStatus.textContent = "يرجى اختيار ملف صوتي.";
          return;
        }

        const from = Number(rangeStart.value);
        const to = Number(rangeEnd.value);

        if (
          !Number.isInteger(from) ||
          !Number.isInteger(to) ||
          from < 1 ||
          to > AYAH_COUNT ||
          from > to
        ) {
          uploadStatus.textContent =
            "يرجى اختيار نطاق صحيح من الآيات.";
          return;
        }

        analyzeButton.disabled = true;
        uploadReport.replaceChildren();

        try {
          uploadStatus.textContent =
            "جارٍ قراءة الملف الصوتي...";

          const audio = await decodeUploadedAudio(file);

          if (audio.duration < 0.2) {
            throw new Error("التسجيل قصير جدًا.");
          }

          if (audio.duration > 10 * 60) {
            throw new Error(
              "يجب ألا تتجاوز مدة التسجيل 10 دقائق."
            );
          }

          const ayahNumbers = Array.from(
            { length: to - from + 1 },
            (_, index) => from + index
          );

          const references = await Promise.all(
            ayahNumbers.map(getReference)
          );

          validateReferences(model, references);

          uploadStatus.textContent =
            "جارٍ تحليل التلاوة، يرجى الانتظار...";

          
          const analysisResult = await analyzeAudio(model, audio);

          const detectedTokens = analysisResult.tokens;
          const decodedFrames = analysisResult.frames;
          const modelHeads = analysisResult.heads;
          const timingHead = modelHeads.get("timing_log_probs");

          const qalqalahData = {
          head: modelHeads.get("attr_qalqalah"),
          calibration: model.calibration,
          context: model.defaultContext
           };


          console.log(
            "MADD TIMING TEST:",
            detectedTokens
              .filter(token =>
                ["aa", "ii", "uu"].includes(token.name)
              )
              .map(token => ({
                name: token.name,
                keys: Object.keys(token),
                token
              }))
          );



          if (!detectedTokens.length) {
            throw new Error(
              "لم يتمكن النموذج من التعرف على أصوات واضحة."
            );
          }


          const expected = references.flatMap(
            (reference, index) =>
              reference.tokens
                .map((token, tokenIndex) => ({
                  ...token,
                  ayah: ayahNumbers[index],
                  sourceTokenIndex: tokenIndex
                }))
                .filter(token => token.token !== "|")
          );

          const actual = detectedTokens.filter(
            token => token.name !== "|"
          );

          const aligned = alignSequences(expected, actual);

          const grouped = new Map(
            ayahNumbers.map(ayah => [ayah, []])
          );

          let currentAyah = from;

          for (const item of aligned) {
            if (item.expected?.ayah) {
              currentAyah = item.expected.ayah;
            }

            grouped.get(currentAyah)?.push(item);
          }

          const ctcAlignment =
          prepareCTCAlignment(timingHead, references) || new Map();

          references.forEach((reference, index) => {
          const ayah = ayahNumbers[index];

          addReportRow(
            uploadReport,
            ayah,
            reference,
            grouped.get(ayah) || [],
            detectedTokens,
            qalqalahData,
            timingHead,
            ctcAlignment
          );
        });

          uploadStatus.textContent =
            "اكتمل التحليل المبدئي. " +
            "حدود الآيات والاختلافات الصوتية تقديرية.";

        } catch (error) {
            console.error("UPLOAD FAILED:", error);
            console.error("UPLOAD ERROR STACK:", error?.stack);

            uploadStatus.textContent =
              `تعذر تحليل التسجيل: ${error?.message || String(error)}`;
        } finally {
          analyzeButton.disabled = !fileInput.files?.length || !SURAH;
        }
      });
    } else {
      console.warn(
        "Upload controls are missing from index.html"
      );
    }

    // Keep the existing single-Ayah microphone test.
    if (listenButton) {
      listenButton.addEventListener("click", async () => {
        listenButton.disabled = true;

        if (status) status.textContent = "جارٍ الاستماع...";
        if (heard) heard.textContent = "";
        if (details) details.textContent = "";
        if (feedback) feedback.textContent = "";

        try {
          const from = Number(ayahSelector?.value || 1);
          const to = Number(microphoneEnd.value || from);

          const ayahNumbers = Array.from(
            { length: to - from + 1 },
            (_, index) => from + index
          );

          const references = await Promise.all(
            ayahNumbers.map(getReference)
          );

          validateReferences(model, references);

          const session = await model.listen({
          endOnSilenceMs: from === to ? 1500 : 3500
          });
          console.log("SESSION API:", {
          sessionKeys: Object.keys(session),
          sessionMethods: Object.getOwnPropertyNames(
            Object.getPrototypeOf(session)
          )
          });

          let streamedTokens = [];

          for await (const chunk of session.chunks) {
            if (chunk.decoded?.tokens?.length) {
              streamedTokens = chunk.decoded.tokens;
            }
          }

          const heads = await session.finish();
          const timingHead = heads.get("timing_log_probs");
          console.log("RECOGNIZED SOUNDS:",
          heads.decoded()?.tokens?.map(t => ({
            name: t.name,
            firstMs: t.firstMs,
            lastMs: t.lastMs
          }))
          );
          console.log("SESSION CONTEXT:", {
          sessionContext: session.context,
          headContext: heads.context,
          modelContexts: model.contexts
           });


           const qalqalahData = {
            head: heads.get("attr_qalqalah"),
            calibration: model.calibration,
            context: model.defaultContext
           };

          const detected =
            heads.decoded()?.tokens?.length
              ? heads.decoded().tokens
              : streamedTokens;

          if (!detected.length) {
            throw new Error("لم يتم التعرف على أصوات واضحة.");
          }


          const expected = references.flatMap((reference, index) =>
            reference.tokens
              .map((token, tokenIndex) => ({
                ...token,
                ayah: ayahNumbers[index],
                sourceTokenIndex: tokenIndex
              }))
              .filter(token => token.token !== "|")
          );

          const actual = detected.filter(
            token => token.name !== "|"
          );

          const aligned = alignSequences(expected, actual);

          const grouped = new Map(
            ayahNumbers.map(ayah => [ayah, []])
          );

          let currentAyah = from;

          for (const item of aligned) {
            if (item.expected?.ayah) {
              currentAyah = item.expected.ayah;
            }

            grouped.get(currentAyah)?.push(item);
          }

          const ctcAlignment =
            prepareCTCAlignment(timingHead, references) || new Map();

          if (heard) {
            heard.textContent = "اكتمل التعرف على الأصوات.";
          }

          if (details) {
            details.textContent = "";
          }

          if (feedback) {
            feedback.replaceChildren();

            references.forEach((reference, index) => {
              const ayah = ayahNumbers[index];

              addReportRow(
                feedback,
                ayah,
                reference,
                grouped.get(ayah) || [],
                detected,
                qalqalahData,
                timingHead,
                ctcAlignment
              );
            });
          }

          if (status) {
            status.textContent = "اكتمل تحليل التلاوة.";
          }
        } catch (error) {
          console.error("Microphone analysis error:", error);

          if (status) {
            status.textContent =
              `تعذر تحليل التلاوة: ${error.message}`;
          }
        } finally {
          listenButton.disabled = !SURAH;
        }
      });
    }

  } catch (error) {
    console.error("Initialization error:", error);

    if (status) {
      status.textContent =
        `تعذر تحميل النموذج: ${error.message}`;
    }
  }
}

// Website UI: loading state, navigation and chatbot mount (not Tajweed logic).
const modelSetupButton = document.querySelector("#load-model");
const modelSetupPanel = document.querySelector("#model-setup");
const statusNodes = [status, uploadStatus].filter(Boolean);
const syncBusy = () => {
  for (const node of statusNodes) {
    const text = node.textContent || "";
    node.classList.toggle("is-busy", /جارٍ|يرجى الانتظار/.test(text));
  }
};
const statusObserver = new MutationObserver(syncBusy);
for (const node of statusNodes) statusObserver.observe(node, {childList:true,subtree:true,characterData:true});
syncBusy();
modelSetupButton?.addEventListener("click", async () => {
  if (!SURAH) { if (status) status.textContent = "اختر السورة أولًا."; return; }
  if (modelLoadingPromise) return;
  modelSetupButton.disabled = true;
  modelSetupButton.textContent = "جارٍ تجهيز النموذج...";
  modelSetupPanel?.classList.add("loading");
  modelLoadingPromise = initialize();
  try { await modelLoadingPromise; }
  finally {
    modelSetupPanel?.classList.remove("loading");
    modelSetupButton.textContent = "إعادة محاولة تجهيز النموذج";
    modelSetupButton.disabled = false;
    modelLoadingPromise = null;
  }
});

surahSelector.addEventListener("change", () => {
  if (listenButton) listenButton.disabled = !SURAH || !modelSetupPanel?.classList.contains("ready");
  if (analyzeButton) analyzeButton.disabled = !SURAH || !fileInput?.files?.length || !modelSetupPanel?.classList.contains("ready");
  if (modelSetupButton) modelSetupButton.disabled = !SURAH || modelSetupPanel?.classList.contains("ready");
});

const navigationLinks = [...document.querySelectorAll("[data-page-link]")];
const pages = [...document.querySelectorAll("[data-page]")];
function showPage(name) {
  const selected = pages.some(p => p.dataset.page === name) ? name : "home";
  for (const page of pages) page.hidden = page.dataset.page !== selected;
  for (const link of navigationLinks) {
    const active = link.dataset.pageLink === selected;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  document.title = `تجويد | ${({home:"الرئيسية",analysis:"تحليل التلاوة",chat:"المساعد الذكي",about:"من نحن"})[selected]}`;
  window.scrollTo({top:0,behavior:"instant"});
}
window.addEventListener("hashchange", () => showPage(location.hash.slice(1)));
showPage(location.hash.slice(1));

function attachChatLoading(chatbot) {
  const form = chatbot.querySelector(".chat-form");
  const messages = chatbot.querySelector(".chat-messages");
  if (!form || !messages) return;
  const thinking = document.createElement("div");
  thinking.className = "chat-thinking";
  thinking.setAttribute("role", "status");
  thinking.innerHTML = '<span class="book-pulse" aria-hidden="true">۞</span><span>المساعد يفكر...</span>';
  form.addEventListener("submit", () => {
    thinking.hidden = false;
    messages.after(thinking);
  });
  const observer = new MutationObserver((mutations) => {
    const hasNewAssistant = mutations.some(mutation =>
      [...mutation.addedNodes].some(node =>
        node.nodeType === 1 &&
        (node.matches?.(".chat-message.assistant") || node.querySelector?.(".chat-message.assistant"))
      )
    );
    if (hasNewAssistant) thinking.hidden = true;
  });
  observer.observe(messages, {childList:true,subtree:true});
}

// Chatbot remains provided by the existing chatbot.js module.
const chatMount = document.querySelector("#chatbot-mount");
try {
  const chatbot = createChatbot();
  chatMount?.appendChild(chatbot);
  attachChatLoading(chatbot);
} catch (error) {
  console.error("Chatbot setup error:", error);
  if (chatMount) chatMount.textContent = "تعذر تهيئة المساعد الذكي. تحقق من ملف chatbot.js وإعدادات API.";
}
