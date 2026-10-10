
(() => {
  "use strict";

  const SOURCE_KEY = "announceLab.strengthLab.prototype.v1";
  const INTERVIEW_KEY = "announceLab.interview.v1";

  const questionSets = {
    challenge: [
      "そのとき、何が一番悔しかった？",
      "その悔しさを乗り越えるために、具体的に何を変えた？",
      "その経験を通して、以前の自分と変わったことは何？"
    ],
    support: [
      "相手を支えようと思ったのは、なぜ？",
      "相手のために、具体的にどんな工夫をした？",
      "相手の変化や反応から、何を感じた？"
    ],
    initiative: [
      "自分から動こうと思ったきっかけは何？",
      "行動するとき、どんなことを考えて判断した？",
      "もし自分が動かなかったら、どうなっていたと思う？"
    ],
    persist: [
      "途中でやめたくなったとき、何が支えになった？",
      "続けるために、自分なりに工夫したことは？",
      "続けたからこそ得られたものは何？"
    ],
    connect: [
      "相手と自分の考えが違ったとき、何を大切にした？",
      "お互いを理解するために、具体的に何をした？",
      "その経験から、人との関わり方について何を学んだ？"
    ],
    improve: [
      "現状を変えたいと思ったのは、なぜ？",
      "原因をどう考え、どんな工夫を試した？",
      "工夫の結果、何が変わった？"
    ],
    responsibility: [
      "その役割を大切にしようと思ったのは、なぜ？",
      "期待に応えるために、どんな工夫をした？",
      "その経験で、自分の責任について考え方は変わった？"
    ],
    curiosity: [
      "そのことに興味を持ったきっかけは何？",
      "知るために、自分からどんな行動をした？",
      "得た知識や発見を、その後どう生かした？"
    ],
    general: [
      "その経験で、あなたが一番大切にしていたことは何？",
      "そのために、自分なりにどんな行動や工夫をした？",
      "その経験から、これからも大切にしたいことは何？"
    ]
  };

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      alert("保存できませんでした。ブラウザの保存設定を確認してください。");
      return false;
    }
  }

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  // 最初の経験文から、質問テーマの候補を選ぶ。
  function chooseTheme(text) {
    const themes = [
      ["challenge", ["悔し", "失敗", "挫折", "困難", "壁", "乗り越", "克服"]],
      ["support", ["支え", "後輩", "サポート", "助け", "寄り添", "相談"]],
      ["initiative", ["自分から", "自ら", "率先", "提案", "働きかけ"]],
      ["persist", ["継続", "続け", "毎日", "積み重ね", "諦めず", "粘り強"]],
      ["connect", ["話し合", "意見", "調整", "対話", "橋渡し"]],
      ["improve", ["改善", "工夫", "原因", "課題", "試行錯誤"]],
      ["responsibility", ["責任", "任された", "役割", "やり遂げ"]],
      ["curiosity", ["興味", "好奇心", "調べ", "探究", "学ん"]]
    ];

    let best = "general";
    let bestScore = 0;

    themes.forEach(([theme, words]) => {
      const score = words.filter(word => text.includes(word)).length;
      if (score > bestScore) {
        best = theme;
        bestScore = score;
      }
    });

    return best;
  }

  // 回答内容から、次の質問の方向を選ぶ。
  function chooseFollowup(answer, theme, step) {
    const text = answer.toLowerCase();

    if (step >= 2) {
      return questionSets[theme][2];
    }

    if (/(成長|上達|学び|できるよう|変わり|自分を高め)/.test(text)) {
      return "あなたにとって「成長した」と実感できるのは、どんな瞬間？";
    }

    if (/(仲間|友達|チーム|人のため|相手|支え|喜ん|信頼)/.test(text)) {
      return "周囲の人との関わりは、あなたの行動や考え方にどう影響した？";
    }

    if (/(悔し|負け|失敗|不安|怖|苦し|壁|困難)/.test(text)) {
      return "その気持ちがあった中で、次の一歩を踏み出せた理由は何？";
    }

    if (/(目標|夢|結果|達成|勝ち|成功)/.test(text)) {
      return "その目標を、あなたにとって達成する価値があると思ったのはなぜ？";
    }

    if (/(自分から|主体|自ら|決め|選ん|考え)/.test(text)) {
      return "その判断をするとき、何を基準に「これが大切だ」と考えた？";
    }

    return questionSets[theme][Math.min(step, 2)];
  }

  function install() {
    const view = document.getElementById("analysis");
    if (!view || document.getElementById("il-interview")) return;

    const root = make("section", "il-shell");
    root.id = "il-interview";

    root.appendChild(make("p", "il-eyebrow", "ANNOUNCE LAB / SELF DISCOVERY"));
    root.appendChild(make("h2", "", "深掘りインタビュー"));
    root.appendChild(make(
      "p",
      "il-intro",
      "回答に応じて次の質問を変えながら、経験の背景にある価値観を探ります。"
    ));

    const status = make("p", "il-status", "");
    const question = make("h3", "il-question", "");
    const history = make("div", "il-history", "");
    const answer = make("textarea", "il-answer", "");
    answer.rows = 5;
    answer.placeholder = "正解はありません。思い出したことを自分の言葉で書いてみよう。";
    answer.setAttribute("aria-label", "深掘り質問への回答");

    const buttons = make("div", "il-buttons");
    const nextButton = make("button", "il-next", "回答して次の質問へ");
    nextButton.type = "button";
    const restartButton = make("button", "il-restart", "最初からやり直す");
    restartButton.type = "button";

    buttons.append(nextButton, restartButton);
    root.append(status, question, history, answer, buttons);

    const result = make("div", "il-summary", "");
    root.appendChild(result);

    const style = make("style");
    style.textContent = `
      #il-interview {
        margin: 28px 0; padding: 24px; border-radius: 18px;
        border: 1px solid #dce3ed; background: #fff; color: #17253e;
      }
      #il-interview * { box-sizing: border-box; }
      #il-interview h2 { margin: 8px 0; }
      #il-interview .il-eyebrow {
        margin: 0; color: #526d9b; font-size: .75rem;
        letter-spacing: .1em; font-weight: 700;
      }
      #il-interview .il-intro, #il-interview .il-status {
        color: #66738a; line-height: 1.7; font-size: .92rem;
      }
      #il-interview .il-question { margin: 22px 0; line-height: 1.65; }
      #il-interview .il-answer {
        width: 100%; padding: 12px; font: inherit; line-height: 1.7;
        border: 1px solid #ccd5e2; border-radius: 10px; resize: vertical;
      }
      #il-interview .il-buttons { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
      #il-interview button {
        padding: 11px 15px; font: inherit; font-weight: 700;
        border-radius: 10px; cursor: pointer;
      }
      #il-interview .il-next { color: white; background: #233c65; border: 0; }
      #il-interview .il-restart { background: white; border: 1px solid #ccd5e2; }
      #il-interview .il-history { display: grid; gap: 12px; }
      #il-interview .il-turn {
        border: 1px solid #dce3ed; border-radius: 12px; padding: 14px;
        overflow-wrap: anywhere;
      }
      #il-interview .il-turn p { white-space: pre-wrap; line-height: 1.7; }
      #il-interview .il-turn-label { color: #66738a; font-size: .8rem; }
      #il-interview .il-summary {
        margin-top: 18px; padding: 16px; border-radius: 12px;
        background: #eef3fb; line-height: 1.8;
      }
      @media (max-width: 600px) {
        #il-interview { padding: 16px; }
        #il-interview .il-buttons button { width: 100%; }
      }
    `;

    document.head.appendChild(style);
    view.appendChild(root);

    let state = read(INTERVIEW_KEY, null);

    function getSourceText() {
      const source = read(SOURCE_KEY, {});
      return typeof source.text === "string" ? source.text.trim() : "";
    }

    function render() {
      history.replaceChildren();
      result.replaceChildren();

      if (!state || !state.theme) {
        status.textContent = "経験を登録し、強み発見ラボで一度分析してから始めてください。";
        question.textContent = "準備ができたら、インタビューを開始しよう。";
        answer.value = "";
        answer.disabled = true;
        nextButton.disabled = true;
        return;
      }

      answer.disabled = false;
      nextButton.disabled = false;

      status.textContent = `質問 ${Math.min(state.answers.length + 1, 3)} / 3`;
      question.textContent = state.currentQuestion;
      answer.value = "";

      state.answers.forEach((item, index) => {
        const turn = make("article", "il-turn");
        turn.appendChild(make("p", "il-turn-label", `質問 ${index + 1}`));
        turn.appendChild(make("strong", "", item.question));
        turn.appendChild(make("p", "", item.answer));
        history.appendChild(turn);
      });

      if (state.answers.length >= 3) {
        status.textContent = "インタビュー完了";
        question.textContent = "あなたが大切にしていることを振り返ろう。";
        answer.disabled = true;
        nextButton.disabled = true;

        const allAnswers = state.answers.map(item => item.answer).join(" ");
        const themes = [];

        if (/(成長|上達|学び|挑戦)/.test(allAnswers)) themes.push("成長や挑戦");
        if (/(仲間|人|相手|支え|信頼)/.test(allAnswers)) themes.push("人とのつながり");
        if (/(悔し|失敗|困難|乗り越)/.test(allAnswers)) themes.push("困難から学ぶこと");
        if (/(目標|達成|結果|努力)/.test(allAnswers)) themes.push("目標に向かうこと");

        result.appendChild(make("h3", "", "振り返りのヒント"));
        result.appendChild(make(
          "p",
          "",
          themes.length
            ? `回答には「${[...new Set(themes)].join("」「")}」に関する言葉が含まれていました。これらが自分にとってなぜ大切なのか、考えてみましょう。`
            : "回答を読み返して、何度も出てきた言葉や、特に気持ちが動いた場面を探してみましょう。"
        ));
        result.appendChild(make(
          "p",
          "",
          "これは回答のキーワードから作った振り返りのヒントです。あなたの価値観を確定する診断ではありません。"
        ));
        return;
      }

      if (state.answers.length) {
        result.appendChild(make(
          "p",
          "il-intro",
          "回答をもとに次の質問を選びました。しっくりこない場合は、自由に自分の考えを書いて大丈夫です。"
        ));
      }
    }

    nextButton.addEventListener("click", () => {
      const response = answer.value.trim();

      if (!response) {
        alert("まずは、自分の考えを少し書いてみよう。");
        return;
      }

      state.answers.push({
        question: state.currentQuestion,
        answer: response
      });

      if (state.answers.length < 3) {
        state.currentQuestion = chooseFollowup(
          response,
          state.theme,
          state.answers.length
        );
      }

      if (write(INTERVIEW_KEY, state)) render();
    });

    restartButton.addEventListener("click", () => {
      const sourceText = getSourceText();

      if (!sourceText) {
        alert("先に強み発見ラボで経験を入力して分析してください。");
        return;
      }

      state = {
        theme: chooseTheme(sourceText),
        answers: [],
        currentQuestion: questionSets[chooseTheme(sourceText)][0]
      };

      if (write(INTERVIEW_KEY, state)) render();
    });

    if (!state || !Array.isArray(state.answers)) {
      state = null;
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
