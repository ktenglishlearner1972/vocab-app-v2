import React, { useMemo, useRef, useState, useEffect } from "react";

const STORAGE_KEY = "vocab_app_state_v1";
const HISTORY_KEY = "vocab_app_history_v1";
const DAILY_GOAL = 200;

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function buildWeakPool(entries, mistakes) {
  const pool = [];

  for (const e of entries) {
    const m = mistakes[e.word] || 0;
    const weight = Math.min(5, m + 1);

    for (let i = 0; i < weight; i++) pool.push(e);
  }

  return shuffle(pool);
}

export default function VocabTestApp() {
  const [entries, setEntries] = useState([
    {
      word: "abandon",
      sentence: "He abandoned the old plan and started over.",
      japanese: "彼は古い計画を捨ててやり直した。",
      category: "基本単語"
    }
  ]);

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(1);
  const [learned, setLearned] = useState({});
  const [mistakes, setMistakes] = useState({});
  const [history, setHistory] = useState({});
  const [mode, setMode] = useState("all");

  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.entries) setEntries(parsed.entries);
        if (parsed.learned) setLearned(parsed.learned);
        if (parsed.mistakes) setMistakes(parsed.mistakes);
      }

      const h = localStorage.getItem(HISTORY_KEY);
      if (h) setHistory(JSON.parse(h));
    } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries, learned, mistakes }));
  }, [entries, learned, mistakes]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const today = todayStr();
  const reviewedToday = history[today] || 0;

  const currentPool = useMemo(() => {
    let pool = [...entries];

    if (mode === "unlearned") {
      pool = pool.filter((e) => !learned[e.word]);
    }

    if (mode === "weak") {
      pool = buildWeakPool(entries, mistakes);
    }

    if (mode !== "test" && mode !== "weak") {
      pool = shuffle(pool);
    }

    return pool;
  }, [entries, learned, mistakes, mode]);

  const current = currentPool[index] || null;

  const learnedCount = Object.values(learned).filter(Boolean).length;

  const weakRanking = useMemo(() => {
    return [...entries]
      .map((e) => ({ word: e.word, count: mistakes[e.word] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [entries, mistakes]);

  const handleNext = () => {
    setStep(1);
    setIndex((p) => (p + 1) % Math.max(currentPool.length, 1));

    setHistory((prev) => ({
      ...prev,
      [today]: (prev[today] || 0) + 1
    }));
  };

  const handleWrong = () => {
    if (!current) return;
    setMistakes((p) => ({
      ...p,
      [current.word]: (p[current.word] || 0) + 1
    }));
  };

  const handleSpeak = () => {
    if (!current?.word || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(current.word);
    u.lang = "en-US";
    speechSynthesis.speak(u);
  };

  const handleCardTap = () => {
    if (step < 3) setStep(step + 1);
  };

  const toggleLearned = () => {
    if (!current) return;
    setLearned((p) => ({ ...p, [current.word]: !p[current.word] }));
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".csv")) continue;

      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length <= 1) continue;

      const rows = lines.slice(1).map((line) => {
        const [word, sentence, japanese, category] = line.split(",");
        return {
          word: (word || "").trim(),
          sentence: (sentence || "").trim(),
          japanese: (japanese || "").trim(),
          category: (category || "未分類").replaceAll('"', '')
        };
      }).filter((r) => r.word);

      setEntries((prev) => {
        const set = new Set(prev.map((x) => x.word.toLowerCase()));
        const unique = rows.filter((r) => !set.has(r.word.toLowerCase()));
        return [...prev, ...unique];
      });
    }

    event.target.value = "";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-bold">英単語テストアプリ</h1>

        <div className="text-xs text-gray-600">
          今日: {reviewedToday} / {DAILY_GOAL}
        </div>

        <div className="flex gap-2 text-xs flex-wrap">
          <button onClick={() => setMode("all")}>全て</button>
          <button onClick={() => setMode("unlearned")}>未習得</button>
          <button onClick={() => setMode("weak")}>苦手優先</button>
          <button onClick={() => setMode("test")}>テスト</button>
        </div>

        <input type="file" ref={fileRef} onChange={handleFileUpload} accept=".csv,.xlsx" multiple />

        <div
          onClick={handleCardTap}
          className="border rounded-2xl p-6 text-center space-y-2"
        >
          {current && (
            <>
              <div className="text-2xl font-bold">{current.word}</div>
              {step >= 2 && <div>{current.sentence}</div>}
              {step >= 3 && (
                <>
                  <div className="text-sm text-gray-600">{current.japanese}</div>
                  <div className="text-xs">{current.category}</div>
                </>
              )}
            </>
          )}
        </div>

        <button onClick={handleNext} className="w-full border p-2 rounded">次へ</button>
        <button onClick={handleWrong} className="w-full border p-2 rounded">間違えた</button>
        <button onClick={handleSpeak} className="w-full border p-2 rounded">発音🔊</button>

        <div className="text-xs text-gray-500">
          進捗 {learnedCount} / {entries.length}
        </div>

        <div className="text-xs">
          <div className="font-bold mt-2">苦手ランキングTOP20</div>
          {weakRanking.map((w, i) => (
            <div key={w.word}>
              {i + 1}. {w.word}（{w.count}回）
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
