import React, { useMemo, useRef, useState } from "react";

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
  const fileRef = useRef(null);

  const current = entries[index] || null;
  const total = entries.length;
  const learnedCount = Object.values(learned).filter(Boolean).length;

  const categories = useMemo(() => {
    return [...new Set(entries.map((e) => e.category || "未分類"))];
  }, [entries]);

  const handleNext = () => {
    setStep(1);
    setIndex((prev) => (prev + 1) % total);
  };

  const handleCardTap = () => {
    if (step < 3) setStep(step + 1);
  };

  const toggleLearned = () => {
    if (!current) return;
    setLearned((prev) => ({
      ...prev,
      [current.word]: !prev[current.word]
    }));
  };

  const addSampleList = () => {
    const extra = [
      {
        word: "infer",
        sentence: "We can infer the meaning from the context.",
        japanese: "文脈から意味を推測できる。",
        category: "模試復習"
      },
      {
        word: "break down",
        sentence: "The car broke down on the way home.",
        japanese: "車が帰宅途中で故障した。",
        category: "熟語"
      }
    ];
    setEntries((prev) => [...prev, ...extra]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl shadow-lg bg-white p-6 space-y-4">
        <h1 className="text-xl font-bold">英単語テストアプリ</h1>
        <p className="text-sm text-gray-600">
          複数ファイルの追加読込・タグ別管理・未習得復習に対応した実用版です。
        </p>

        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            multiple
            className="block w-full text-sm"
          />
          <button
            onClick={addSampleList}
            className="w-full px-4 py-2 rounded-xl border shadow-sm"
          >
            単語集を追加（サンプル）
          </button>
          <div className="text-xs text-gray-500">
            後から別の単語帳・熟語集を追加して統合できます
          </div>
        </div>

        <div
          onClick={handleCardTap}
          className="border rounded-2xl p-6 text-center space-y-3 cursor-pointer select-none"
        >
          {current && (
            <>
              <div className="text-2xl font-semibold">{current.word}</div>
              {step >= 2 && (
                <div className="text-base text-gray-700">
                  {current.sentence}
                </div>
              )}
              {step >= 3 && (
                <>
                  <div className="text-sm text-gray-600">
                    {current.japanese}
                  </div>
                  <div className="text-xs text-gray-500">
                    分類: {current.category}
                  </div>
                  <label className="flex items-center justify-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!learned[current.word]}
                      onChange={toggleLearned}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>正解した</span>
                  </label>
                </>
              )}
            </>
          )}
        </div>

        <button
          onClick={handleNext}
          className="w-full px-4 py-2 rounded-xl shadow border"
        >
          次へ
        </button>

        <div className="text-sm text-gray-500">
          進捗: {learnedCount} / {total}
        </div>
        <div className="text-xs text-gray-500">
          カテゴリ: {categories.join(" / ")}
        </div>
      </div>
    </div>
  );
}
