
"use strict";

const $ = (selector) => document.querySelector(selector);

const ENTRY_KEY = "announceLab.entries.v1";
const REFLECTION_KEY = "announceLab.reflections.v1";

let entries = loadEntries();
let toastTimer;

// 日付を YYYY-MM-DD 形式で取得
function today() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ブラウザから記録を読み込む
function loadEntries() {
  try {
    const data = JSON.parse(localStorage.getItem(ENTRY_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// HTMLとして解釈されないように文字を変換
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

// 記録を保存する
function saveEntries() {
  try {
    localStorage.setItem(ENTRY_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    showToast("保存できませんでした。空き容量を確認してください。");
    return false;
  }
}

// メッセージを表示
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// 画面を切り替える
function navigate(viewName) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewName);
  });

  document.querySelectorAll(".nav").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  const titles = {
    home: "おかえりなさい。",
    records: "あなたの経験を振り返ろう。",
    analysis: "自分らしさを見つけよう。"
  };

  $("#page-title").textContent = titles[viewName];
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (viewName === "records") renderAllEntries();
  if (viewName === "analysis") renderAnalysis();
}

// 記録フォームを開く
function openDialog(entry = null) {
  $("#record-form").reset();

  $("#record-id").value = entry?.id || "";
  $("#dialog-title").textContent =
    entry ? "記録を編集する" : "経験を記録する";

  $("#title").value = entry?.title || "";
  $("#date").value = entry?.date || today();
  $("#category").value = entry?.category || "日常の気づき";
  $("#event").value = entry?.event || "";
  $("#feeling").value = entry?.feeling || "";
  $("#action").value = entry?.action || "";
  $("#learning").value = entry?.learning || "";

  $("#record-dialog").showModal();
  setTimeout(() => $("#title").focus(), 50);
}

// 記録をカードとして表示
function createCard(entry) {
  const date = entry.date
    ? new Date(entry.date + "T00:00:00")
    : null;

  const month = date && !Number.isNaN(date.getTime())
    ? `${date.getMonth() + 1}月`
    : "--";

  const day = date && !Number.isNaN(date.getTime())
    ? date.getDate()
    : "--";

  return `
    <article class="record-card">
      <div class="record-date">
        ${escapeHTML(month)}
        <strong>${escapeHTML(day)}</strong>
      </div>

      <div class="record-body">
        <h3 class="record-title">${escapeHTML(entry.title)}</h3>
        <span class="chip">${escapeHTML(entry.category)}</span>
        <p class="record-text">${escapeHTML(entry.event)}</p>

        ${
          entry.feeling
            ? `<p class="record-text">感じたこと：${escapeHTML(entry.feeling)}</p>`
            : ""
        }

        ${
          entry.action
            ? `<p class="record-text">行動：${escapeHTML(entry.action)}</p>`
            : ""
        }

        ${
          entry.learning
            ? `<p class="record-text record-learning">✧ 気づき：${escapeHTML(entry.learning)}</p>`
            : ""
        }
      </div>

      <div class="record-actions">
        <button type="button" data-edit="${escapeHTML(entry.id)}">編集</button>
        <button type="button" data-delete="${escapeHTML(entry.id)}">削除</button>
      </div>
    </article>
  `;
}

// 日付の新しい順に並べる
function sortedEntries() {
  return [...entries].sort((a, b) =>
    (b.date || "").localeCompare(a.date || "")
  );
}

// ホーム画面を更新
function renderHome() {
  const sorted = sortedEntries();
  const now = new Date();

  const thisMonth = entries.filter((entry) => {
    if (!entry.date) return false;
    const d = new Date(entry.date + "T00:00:00");

    return !Number.isNaN(d.getTime()) &&
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth();
  }).length;

  $("#total-count").textContent = entries.length;

  $("#insight-count").textContent = entries.filter(
    (entry) => entry.learning.trim() !== ""
  ).length;

  $("#month-count").textContent = thisMonth;

  $("#recent-list").innerHTML = sorted
    .slice(0, 3)
    .map(createCard)
    .join("");

  $("#home-empty").classList.toggle("hidden", entries.length > 0);
  $("#recent-list").style.display = entries.length ? "grid" : "none";
}

// 記録一覧と検索
function renderAllEntries() {
  const query = $("#search").value.trim().toLowerCase();
  const category = $("#filter").value;

  const filtered = sortedEntries().filter((entry) => {
    const text = [
      entry.title,
      entry.event,
      entry.feeling,
      entry.action,
      entry.learning,
      entry.category
    ].join(" ").toLowerCase();

    return (!query || text.includes(query)) &&
      (!category || entry.category === category);
  });

  $("#all-list").innerHTML = filtered.map(createCard).join("");
  $("#records-empty").classList.toggle("hidden", filtered.length > 0);
  $("#all-list").style.display = filtered.length ? "grid" : "none";
}

// 自己分析画面を更新
function renderAnalysis() {
  loadReflections();

  const usefulEntries = sortedEntries().filter((entry) =>
    entry.learning || entry.feeling || entry.action
  );

  $("#analysis-list").innerHTML = usefulEntries
    .slice(0, 5)
    .map(createCard)
    .join("");
}

// 全画面を更新
function renderAll() {
  renderHome();

  if ($("#records").classList.contains("active")) {
    renderAllEntries();
  }

  if ($("#analysis").classList.contains("active")) {
    renderAnalysis();
  }
}

// 記録を追加・編集する
$("#record-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const title = $("#title").value.trim();
  const description = $("#event").value.trim();

  if (!title || !description) {
    showToast("タイトルと出来事を入力してください。");
    return;
  }

  const id = $("#record-id").value ||
    (crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random());

  const previous = entries.find((entry) => entry.id === id);

  const entry = {
    id,
    title,
    date: $("#date").value,
    category: $("#category").value,
    event: description,
    feeling: $("#feeling").value.trim(),
    action: $("#action").value.trim(),
    learning: $("#learning").value.trim(),
    createdAt: previous?.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  if (previous) {
    entries = entries.map((item) => item.id === id ? entry : item);
  } else {
    entries.push(entry);
  }

  if (saveEntries()) {
    $("#record-dialog").close();
    renderAll();
    showToast(previous ? "記録を更新しました。" : "経験を記録しました。");
  }
});

// 編集・削除ボタンの処理
document.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const entry = entries.find(
      (item) => item.id === editButton.dataset.edit
    );

    if (entry) openDialog(entry);
  }

  if (deleteButton) {
    const entry = entries.find(
      (item) => item.id === deleteButton.dataset.delete
    );

    if (!entry) return;

    if (confirm(`「${entry.title}」を削除しますか？`)) {
      const oldEntries = entries;
      entries = entries.filter((item) => item.id !== entry.id);

      if (saveEntries()) {
        renderAll();
        showToast("記録を削除しました。");
      } else {
        entries = oldEntries;
      }
    }
  }
});

// 自己分析メモを読み込む
function loadReflections() {
  try {
    const data = JSON.parse(
      localStorage.getItem(REFLECTION_KEY) || "{}"
    );

    $("#reflect-feeling").value = data.feeling || "";
    $("#reflect-action").value = data.action || "";
    $("#reflect-values").value = data.values || "";
  } catch (error) {
    console.warn("振り返りメモを読み込めませんでした。", error);
  }
}

// 自己分析メモを保存
$("#save-reflections").addEventListener("click", () => {
  const data = {
    feeling: $("#reflect-feeling").value,
    action: $("#reflect-action").value,
    values: $("#reflect-values").value
  };

  try {
    localStorage.setItem(REFLECTION_KEY, JSON.stringify(data));

    $("#save-status").textContent = "保存しました。このブラウザ内に保存されています。";
    showToast("振り返りを保存しました。");
  } catch (error) {
    showToast("保存できませんでした。");
  }
});

// メニュー切り替え
document.querySelectorAll(".nav").forEach((button) => {
  button.addEventListener("click", () => navigate(button.dataset.view));
});

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => navigate(button.dataset.open));
});

// 記録作成ボタン
["add-button", "hero-add", "first-add", "add-from-records"].forEach((id) => {
  $("#" + id).addEventListener("click", () => openDialog());
});

// ダイアログを閉じる
$("#close-dialog").addEventListener("click", () => {
  $("#record-dialog").close();
});

$("#cancel-dialog").addEventListener("click", () => {
  $("#record-dialog").close();
});

// 検索とカテゴリー絞り込み
$("#search").addEventListener("input", renderAllEntries);
$("#filter").addEventListener("change", renderAllEntries);

// 初期表示
renderAll();
