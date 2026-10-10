
(() => {
  "use strict";

  const STORAGE_KEY = "announceLab.strengthLab.prototype.v1";

  // AIではなく、経験文中の表現から強みの仮説を作る試作品。
  const profiles = [
    {
      id: "support",
      name: "人の可能性を引き出す人",
      summary: "周囲の様子を見ながら、人が力を発揮できるように働きかける傾向",
      keywords: [
        "仲間", "支え", "サポート", "後輩", "相談", "チーム",
        "相手", "協力", "助け", "一緒に", "寄り添", "成長を支"
      ],
      question: "誰かを支えようと思ったとき、あなたが一番大切にしていたことは何ですか？"
    },
    {
      id: "challenge",
      name: "悔しさを成長の力に変える人",
      summary: "うまくいかない状況を、次の工夫や挑戦につなげる傾向",
      keywords: [
        "悔し", "失敗", "挫折", "壁", "困難", "挑戦",
        "乗り越", "改善", "努力", "練習", "成長", "克服"
      ],
      question: "困難なとき、あなたをもう一度行動に向かわせたものは何でしたか？"
    },
    {
      id: "initiative",
      name: "必要なことを見つけ、自ら動く人",
      summary: "指示を待つだけでなく、自分で課題を見つけて行動する傾向",
      keywords: [
        "自分から", "主体的", "率先", "提案", "企画",
        "働きかけ", "自ら", "始めた", "行動した", "声をかけ"
      ],
      question: "その場面で、なぜ自分が動く必要があると感じたのでしょうか？"
    },
    {
      id: "persist",
      name: "小さな積み重ねを力に変える人",
      summary: "すぐに結果が出なくても、工夫しながら取り組みを続ける傾向",
      keywords: [
        "継続", "続け", "毎日", "積み重ね", "習慣",
        "地道", "コツコツ", "諦めず", "粘り強", "反復"
      ],
      question: "続けることが難しかったとき、何があなたの支えになりましたか？"
    },
    {
      id: "connect",
      name: "人と人の間に橋をかける人",
      summary: "異なる考えを持つ人の間に立ち、対話や協力を生み出す傾向",
      keywords: [
        "意見", "話し合", "対話", "調整", "つな", "協力",
        "理解", "相互", "関係", "コミュニケーション", "橋渡し"
      ],
      question: "意見や立場が異なる人と関わるとき、どんなことを意識していましたか？"
    },
    {
      id: "improve",
      name: "違和感を見逃さず、より良くする人",
      summary: "現状をそのまま受け入れず、原因を考えて改善する傾向",
      keywords: [
        "改善", "工夫", "原因", "課題", "分析", "見直し",
        "効率", "方法を変", "試行錯誤", "仕組み", "問題を解決"
      ],
      question: "現状を変えたいと思ったきっかけは何で、何を基準に改善しましたか？"
    },
    {
      id: "responsibility",
      name: "任された役割に、自分なりの意味を見いだす人",
      summary: "役割を引き受け、期待に応えようと工夫する傾向",
      keywords: [
        "責任", "任された", "役割", "最後まで", "やり遂げ",
        "準備", "期待", "任せ", "本番", "やり切"
      ],
      question: "その役割を果たすうえで、あなたが絶対に譲りたくなかったことは何ですか？"
    },
    {
      id: "curiosity",
      name: "知らないことを、自分の学びに変える人",
      summary: "疑問や関心を出発点に、自分から学び、視野を広げる傾向",
      keywords: [
        "興味", "好奇心", "調べ", "学ん", "研究", "知りたい",
        "新しい", "吸収", "質問", "探究", "視野"
      ],
      question: "そのことに興味を持ったのはなぜで、知ったことをどう生かしましたか？"
    }
  ];

  const escapeText = value => String(value ?? "");

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      alert("保存できませんでした。ブラウザの保存設定を確認してください。");
    }
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = escapeText(text);
    return node;
  }

  function analyse(text) {
    const episodes = text
      .split(/\n\s*\n/)
      .map(item => item.trim())
      .filter(Boolean);

    const results = profiles.map(profile => {
      const evidence = [];

      episodes.forEach((episode, index) => {
        const matched = profile.keywords.filter(word =>
          episode.includes(word)
        );

        if (matched.length) {
          evidence.push({
            episode: index + 1,
            text: episode,
            words: matched
          });
        }
      });

      return {
        ...profile,
        score: evidence.reduce(
          (sum, item) => sum + Math.min(item.words.length, 3),
          0
        ),
        evidence
      };
    });

    results.sort((a, b) => b.score - a.score);

    return { episodes, results };
  }

  function renderResults(output, text, feedback, note) {
    output.replaceChildren();

    const cleanText = text.trim();
    if (!cleanText) {
      output.appendChild(el(
        "p",
        "",
        "まずは、これまでの経験を入力してください。経験は空行で区切ると、別々のエピソードとして分析できます。"
      ));
      return;
    }

    const { episodes, results } = analyse(cleanText);
    const ranked = results.filter(item => item.score > 0);
    const lead = ranked[0];

    if (!lead) {
      output.appendChild(el(
        "p",
        "",
        "今の文章からは強みの候補を絞れませんでした。自分が何を考え、どう行動し、何を工夫したかを追加してみてください。"
      ));
      return;
    }

    const card = el("section", "sl-featured");
    card.appendChild(el("p", "sl-eyebrow", "あなたの強みの仮説"));
    card.appendChild(el("h3", "sl-headline", lead.name));
    card.appendChild(el("p", "sl-summary", lead.summary));
    card.appendChild(el(
      "p",
      "sl-caveat",
      "これはキーワードに基づく仮説であり、あなたの本質や能力を確定する診断ではありません。"
    ));
    output.appendChild(card);

    output.appendChild(el("h3", "sl-section-title", "そう考えた根拠"));

    lead.evidence.slice(0, 3).forEach(item => {
      const evidenceCard = el("article", "sl-evidence");
      evidenceCard.appendChild(el(
        "strong",
        "",
        `エピソード ${item.episode}`
      ));
      evidenceCard.appendChild(el("p", "", item.text));
      evidenceCard.appendChild(el(
        "p",
        "sl-keywords",
        `着目した言葉：${item.words.join("・")}`
      ));
      output.appendChild(evidenceCard);
    });

    output.appendChild(el("h3", "sl-section-title", "もう一歩、自分を深掘りする"));

    const question = el("div", "sl-question");
    question.appendChild(el("p", "", lead.question));

    const answer = el("textarea", "sl-answer");
    answer.rows = 4;
    answer.placeholder = "自分の言葉で考えを書いてみよう";
    answer.value = note || "";
    answer.setAttribute("aria-label", "深掘り質問への回答");
    question.appendChild(answer);

    const feedbackLabel = el("label", "sl-label", "この強みは自分に合っている？");
    const select = el("select", "sl-feedback");
    [
      ["", "選択してください"],
      ["yes", "しっくりくる"],
      ["maybe", "一部は合っている"],
      ["no", "少し違う"],
      ["unknown", "まだわからない"]
    ].forEach(([value, label]) => {
      const option = el("option", "", label);
      option.value = value;
      select.appendChild(option);
    });
    select.value = feedback || "";
    feedbackLabel.appendChild(select);
    question.appendChild(feedbackLabel);

    const saveButton = el("button", "sl-save", "振り返りを保存");
    saveButton.type = "button";
    saveButton.addEventListener("click", () => {
      const state = loadState();
      state.text = cleanText;
      state.feedback = select.value;
      state.note = answer.value;
      state.updatedAt = new Date().toISOString();
      saveState(state);
      alert("この試作品のブラウザ内に保存しました。");
    });
    question.appendChild(saveButton);
    output.appendChild(question);

    output.appendChild(el("h3", "sl-section-title", "ほかの強みの候補"));

    ranked.slice(1, 4).forEach(item => {
      const alternative = el("article", "sl-alternative");
      alternative.appendChild(el("h4", "", item.name));
      alternative.appendChild(el("p", "", item.summary));
      alternative.appendChild(el(
        "p",
        "sl-keywords",
        `関連する経験：${item.evidence.map(e => `エピソード ${e.episode}`).join("、")}`
      ));
      output.appendChild(alternative);
    });

    output.appendChild(el(
      "p",
      "sl-caveat",
      `分析対象は${episodes.length}件のエピソードです。文章の長さやキーワードの選び方で結果が変わります。`
    ));
  }

  function install() {
    const view = document.getElementById("analysis");
    if (!view || document.getElementById("sl-prototype")) return;

    const state = loadState();
    const section = el("section", "sl-shell");
    section.id = "sl-prototype";

    section.appendChild(el("p", "sl-eyebrow", "ANNOUNCE LAB / PROTOTYPE"));
    section.appendChild(el("h2", "", "強み発見ラボ"));
    section.appendChild(el(
      "p",
      "sl-intro",
      "経験を複数書き出すと、共通する行動から「自分を一言で表す強み」の候補を探します。"
    ));

    section.appendChild(el("label", "sl-label", "あなたの経験"));

    const input = el("textarea", "sl-input");
    input.rows = 9;
    input.placeholder =
      "例：試合に出られず悔しかったが、毎日練習を続けた。\n\n例：後輩が悩んでいたので、自分から声をかけて一緒に考えた。";
    input.value = state.text || "";
    input.setAttribute("aria-label", "分析したい経験を入力");

    section.appendChild(input);
    section.appendChild(el(
      "p",
      "sl-help",
      "経験と経験の間に空行を入れてください。名前や連絡先など、個人を特定できる情報は入力しないでください。"
    ));

    const runButton = el("button", "sl-run", "強みを分析する");
    runButton.type = "button";

    const output = el("div", "sl-results");
    runButton.addEventListener("click", () => {
      const oldState = loadState();
      oldState.text = input.value;
      saveState(oldState);
      renderResults(output, input.value, oldState.feedback, oldState.note);
    });

    section.appendChild(runButton);
    section.appendChild(output);

    const style = el("style");
    style.textContent = `
      #sl-prototype {
        --sl-ink: #17253e;
        --sl-muted: #66738a;
        margin: 28px 0;
        padding: 24px;
        border: 1px solid #dce3ed;
        border-radius: 18px;
        color: var(--sl-ink);
        background: #fff;
      }
      #sl-prototype * { box-sizing: border-box; }
      #sl-prototype h2 { margin: 6px 0 10px; font-size: 1.65rem; }
      #sl-prototype .sl-eyebrow {
        color: #526d9b; font-size: .75rem; font-weight: 700;
        letter-spacing: .12em; margin: 0;
      }
      #sl-prototype .sl-intro, #sl-prototype .sl-help,
      #sl-prototype .sl-caveat, #sl-prototype .sl-keywords {
        color: var(--sl-muted); line-height: 1.7; font-size: .9rem;
      }
      #sl-prototype .sl-label { display: block; font-weight: 700; margin: 18px 0 8px; }
      #sl-prototype textarea, #sl-prototype select {
        width: 100%; max-width: 100%; font: inherit;
        border: 1px solid #ccd5e2; border-radius: 10px;
        padding: 12px; background: #fff; color: #17253e;
      }
      #sl-prototype textarea { resize: vertical; line-height: 1.7; }
      #sl-prototype button {
        font: inherit; font-weight: 700; padding: 12px 18px;
        border-radius: 10px; cursor: pointer;
      }
      #sl-prototype .sl-run {
        width: 100%; border: 0; color: #fff; background: #233c65;
        margin: 12px 0 22px;
      }
      #sl-prototype .sl-featured {
        padding: 22px; border-radius: 14px; background: #eef3fb;
        border: 1px solid #d7e1f1;
      }
      #sl-prototype .sl-headline { font-size: 1.5rem; line-height: 1.5; margin: 10px 0; }
      #sl-prototype .sl-summary { line-height: 1.8; }
      #sl-prototype .sl-section-title { margin: 26px 0 12px; font-size: 1.1rem; }
      #sl-prototype .sl-evidence, #sl-prototype .sl-alternative {
        padding: 14px; margin: 10px 0; border: 1px solid #dce3ed; border-radius: 12px;
        overflow-wrap: anywhere;
      }
      #sl-prototype .sl-evidence p { line-height: 1.8; white-space: pre-wrap; }
      #sl-prototype .sl-question { padding: 18px; border-radius: 12px; background: #f6f8fb; }
      #sl-prototype .sl-save { margin-top: 12px; border: 1px solid #cbd5e1; background: #fff; }
      #sl-prototype .sl-caveat { margin-top: 18px; }
      @media (max-width: 600px) {
        #sl-prototype { padding: 16px; }
        #sl-prototype .sl-headline { font-size: 1.25rem; }
      }
    `;
    document.head.appendChild(style);
    view.appendChild(section);

    if (state.text) {
      renderResults(output, state.text, state.feedback, state.note);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
