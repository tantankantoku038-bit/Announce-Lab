
(() => {
  "use strict";

  const ENTRIES_KEY = "announceLab.entries.v1";
  const REFLECTIONS_KEY = "announceLab.reflections.v1";

  // 強み・価値観を探すための手がかり。
  // 該当語があることだけで、本人の能力を断定しない。
  const patterns = [
    {
      name: "主体性",
      type: "strength",
      words: ["自分から", "主体的", "率先", "提案", "行動した", "働きかけ", "挑戦した"]
    },
    {
      name: "協調性",
      type: "strength",
      words: ["協力", "仲間", "チーム", "支えた", "サポート", "相談", "一緒に"]
    },
    {
      name: "継続力",
      type: "strength",
      words: ["継続", "続けた", "毎日", "努力", "練習", "積み重ね", "粘り強く"]
    },
    {
      name: "課題解決力",
      type: "strength",
      words: ["改善", "工夫", "解決", "課題", "原因", "試行錯誤", "乗り越え"]
    },
    {
      name: "責任感",
      type: "strength",
      words: ["責任", "任された", "最後まで", "やり遂げ", "役割", "準備した"]
    },
    {
      name: "向上心",
      type: "strength",
      words: ["成長", "学んだ", "勉強", "振り返り", "高め", "目標", "上達"]
    },
    {
      name: "人とのつながり",
      type: "value",
      words: ["仲間", "友人", "人のため", "相手", "信頼", "感謝", "支え合い"]
    },
    {
      name: "成長",
      type: "value",
      words: ["成長", "学び", "挑戦", "新しいこと", "上達", "できるよう"]
    },
    {
      name: "貢献",
      type: "value",
      words: ["貢献", "役に立つ", "助け", "支えた", "喜んで", "チームのため"]
    },
    {
      name: "誠実さ",
      type: "value",
      words: ["誠実", "正直", "約束", "責任", "丁寧", "向き合った"]
    },
    {
      name: "挑戦",
      type: "value",
      words: ["挑戦", "新しいこと", "初めて", "失敗", "壁", "困難"]
    }
  ];

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.warn("Announce Lab: 保存データを読み取れませんでした。", error);
      return [];
    }
  }

  // オブジェクトの構造が変わっても、
  // 保存されている文字列情報を幅広く分析する。
  function toSearchText(value) {
    if (typeof value === "string") return value;
    if (value == null) return "";
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.map(toSearchText).join(" ");
    }
    if (typeof value === "object") {
      return Object.values(value).map(toSearchText).join(" ");
    }
    return "";
  }

  function getTitle(entry, index) {
    if (typeof entry === "string") {
      return entry.slice(0, 45) || `経験 ${index + 1}`;
    }

    if (entry && typeof entry === "object") {
      const title = entry.title || entry.name || entry.activity ||
        entry.experience || entry.event;
      if (typeof title === "string" && title.trim()) {
        return title.trim();
      }
    }

    return `経験 ${index + 1}`;
  }

  function analyse(entries, reflections) {
    const reflectionText = toSearchText(reflections);
    const records = entries.map((entry, index) => ({
      title: getTitle(entry, index),
      text: toSearchText(entry)
    }));

    const combinedText = [
      ...records.map(record => record.text),
      reflectionText
    ].join(" ");

    const results = patterns.map(pattern => {
      // 何件の経験記録に手がかりが含まれるかを数える。
      const matchedRecords = records.filter(record =>
        pattern.words.some(word => record.text.includes(word))
      );

      const matchedWords = pattern.words.filter(word =>
        combinedText.includes(word)
      );

      return {
        ...pattern,
        count: matchedRecords.length,
        matchedWords,
        evidence: matchedRecords.slice(0, 3).map(record => record.title)
      };
    });

    return {
      strengths: results
        .filter(item => item.type === "strength" && item.count > 0)
        .sort((a, b) => b.count - a.count),
      values: results
        .filter(item => item.type === "value" && item.count > 0)
        .sort((a, b) => b.count - a.count),
      recordCount: entries.length
    };
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function addResult(container, item, label) {
    const card = makeElement("article", "al-analysis-card");
    card.appendChild(makeElement("h4", "", item.name));

    card.appendChild(makeElement(
      "p",
      "al-analysis-note",
      `${label}の手がかりがある記録：${item.count}件`
    ));

    if (item.evidence.length) {
      card.appendChild(makeElement("p", "", "関連する経験"));

      const list = makeElement("ul", "al-analysis-evidence");
      item.evidence.forEach(title => {
        list.appendChild(makeElement("li", "", title));
      });
      card.appendChild(list);
    }

    container.appendChild(card);
  }

  function render(panel) {
    const entries = readArray(ENTRIES_KEY);
    const reflections = readArray(REFLECTIONS_KEY);
    const result = analyse(entries, reflections);

    panel.replaceChildren();

    panel.appendChild(makeElement("h3", "", "あなたの強み・価値観を振り返る"));

    panel.appendChild(makeElement(
      "p",
      "al-analysis-note",
      `分析対象：経験記録 ${result.recordCount}件。記録内の言葉を手がかりに候補を表示します。`
    ));

    if (result.recordCount === 0 && reflections.length === 0) {
      panel.appendChild(makeElement(
        "p",
        "",
        "まだ分析できる記録がありません。まずは経験を1つ登録してみましょう。"
      ));
      return;
    }

    panel.appendChild(makeElement("h4", "", "強みの候補"));

    if (result.strengths.length) {
      result.strengths.slice(0, 5).forEach(item =>
        addResult(panel, item, "強み")
      );
    } else {
      panel.appendChild(makeElement(
        "p",
        "",
        "強みの手がかりはまだ見つかっていません。経験の中で、自分が取った行動や工夫を詳しく記録してみましょう。"
      ));
    }

    panel.appendChild(makeElement("h4", "", "価値観の候補"));

    if (result.values.length) {
      result.values.slice(0, 5).forEach(item =>
        addResult(panel, item, "価値観")
      );
    } else {
      panel.appendChild(makeElement(
        "p",
        "",
        "価値観の手がかりはまだ見つかっていません。何を大切にして行動したかを振り返ってみましょう。"
      ));
    }

    panel.appendChild(makeElement(
      "p",
      "al-analysis-disclaimer",
      "これは記録に含まれる言葉から作った仮説です。言葉が多いことが、そのまま強みの強さを意味するわけではありません。自分の実感と照らし合わせて解釈してください。"
    ));
  }

  function install() {
    const analysisView = document.getElementById("analysis");
    if (!analysisView) {
      console.warn(
        "Announce Lab: #analysis が見つかりません。HTML内の画面IDを確認してください。"
      );
      return;
    }

    // 既存画面の内容は消さず、追加パネルだけを設置する。
    const panel = makeElement("section", "al-analysis-panel");
    panel.id = "al-strength-analysis";

    const refreshButton = makeElement(
      "button",
      "al-analysis-refresh",
      "記録を再分析する"
    );
    refreshButton.type = "button";
    refreshButton.addEventListener("click", () => render(panel));

    analysisView.appendChild(panel);
    analysisView.appendChild(refreshButton);

    const style = makeElement("style");
    style.textContent = `
      .al-analysis-panel {
        margin: 24px 0;
        padding: 20px;
        border: 1px solid #d9e0ea;
        border-radius: 16px;
        background: var(--card, #fff);
        color: var(--text, #172033);
      }
      .al-analysis-panel h3 { margin-top: 0; }
      .al-analysis-card {
        margin: 12px 0;
        padding: 14px;
        border: 1px solid #e0e5ec;
        border-radius: 12px;
      }
      .al-analysis-card h4 { margin: 0 0 8px; }
      .al-analysis-note, .al-analysis-disclaimer {
        font-size: .92rem;
        line-height: 1.7;
        opacity: .8;
      }
      .al-analysis-evidence { padding-left: 20px; }
      .al-analysis-refresh {
        padding: 10px 16px;
        border: 0;
        border-radius: 10px;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);

    render(panel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
