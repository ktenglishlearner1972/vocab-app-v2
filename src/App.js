import React, { useMemo, useState } from "react";

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState("all");

  const [entries] = useState([
    {
      word: "abandon",
      meaning: "捨てる、放棄する",
      sentence: "He abandoned the old plan and started over.",
      sentence_jp: "彼は古い計画を捨ててやり直した。",
      category: "基本単語"
    }
  ]);

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState({});

  // ⭐カスタムファイル名表示用
  const [fileName, setFileName] = useState("");

  const currentPool = useMemo(() => {
    let pool = [...entries];

    if (mode === "weak") pool = buildWeakPool(entries, mistakes);
    else pool = shuffle(pool);

    return pool;
  }, [entries, mistakes, mode]);

  const current = currentPool[index] || null;

  /* ================= ACTIONS ================= */

  const startTest = () => {
    setIndex(0);
    setStep(0);
    setScreen("test");
  };

  const handleNext = () => {
    setStep(0);
    setIndex((p) => (p + 1) % Math.max(currentPool.length, 1));
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
    setStep((p) => Math.min(p + 1, 2));
  };

  /* ⭐ファイル選択（完全カスタム） */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // CSV読み込みはここに後で追加
    }
  };

  /* ================= HOME ================= */

  if (screen === "home") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 text-center space-y-10">

          <h1 className="text-xl font-bold">英単語テストアプリ</h1>

          {/* 単語テスト */}
          <div className="space-y-4">
            <div className="font-semibold">－ 単語テスト －</div>

            <div className="flex flex-col gap-3 items-center">
              <button onClick={() => { setMode("all"); startTest(); }}
                className="w-56 h-12 border rounded-lg">
                すべて
              </button>

              <button onClick={() => { setMode("weak"); startTest(); }}
                className="w-56 h-12 border rounded-lg">
                苦手優先
              </button>

              <button onClick={() => { setMode("all"); startTest(); }}
                className="w-56 h-12 border rounded-lg">
                テスト
              </button>
            </div>
          </div>

          {/* 苦手ランキング */}
          <div className="space-y-4">
            <div className="font-semibold">－ 苦手ランキング －</div>

            <button
              onClick={() => setScreen("ranking")}
              className="w-56 h-12 border rounded-lg"
            >
              苦手単語
            </button>
          </div>

          {/* ⭐単語インポート（完全カスタム・標準UI排除済み） */}
          <div className="space-y-4">
            <div className="font-semibold">－ 単語インポート －</div>

            <div className="flex flex-col items-center gap-2">

              <label className="w-56 h-12 border rounded-lg flex items-center justify-center cursor-pointer">
                ファイルを選択
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {fileName && (
                <div className="text-xs text-gray-500">
                  {fileName}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    );
  }

  /* ================= TEST ================= */

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-10">

        <button onClick={() => setScreen("home")} className="text-xs underline">
          ← ホーム
        </button>

        <div onClick={handleCardTap}
          className="border rounded-2xl p-6 text-center space-y-5 cursor-pointer">

          {current && (
            <>
              <div className="text-2xl font-bold">{current.word}</div>

              <div className={step >= 1 ? "text-black" : "text-gray-300"}>
                {current.sentence}
              </div>

              <div className={step >= 2 ? "text-black" : "text-gray-300"}>
                {current.meaning}
              </div>

              <div className={step >= 2 ? "text-black" : "text-gray-300"}>
                {current.sentence_jp}
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          <button onClick={handleNext} className="w-full border p-2 rounded">
            次へ
          </button>

          <button onClick={handleWrong} className="w-full border p-2 rounded">
            間違えた
          </button>

          <button onClick={handleSpeak} className="w-full border p-2 rounded">
            発音🔊
          </button>
        </div>

      </div>
    </div>
  );
}
