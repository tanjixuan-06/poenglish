/**
 * 数据备份：导出 / 导入
 *
 * 学习数据全部存在 localStorage，清一次缓存就全没了。
 * 这里把生词、练习记录、复习进度、打卡记录打成一份 JSON，
 * 可下载到本地，也能从文件恢复（默认合并，不覆盖已有数据）。
 */

import { loadVocab, saveVocab, type VocabItem } from "./vocab";
import { loadPractice, savePractice, type PracticeRecord } from "./progress";
import { loadSrs, saveSrs, type SrsState } from "./srs";

export type Backup = {
  /** 格式版本，便于日后兼容升级 */
  v: 1;
  at: number;
  vocab: VocabItem[];
  practice: PracticeRecord[];
  srs: Record<string, SrsState>;
  checkin: string[];
};

export function buildBackup(): Backup {
  let checkin: string[] = [];
  try {
    const raw = window.localStorage.getItem("poenglish-checkin");
    const list = raw ? JSON.parse(raw) : [];
    if (Array.isArray(list)) checkin = list.filter((x) => typeof x === "string");
  } catch {
    checkin = [];
  }
  return {
    v: 1,
    at: Date.now(),
    vocab: loadVocab(),
    practice: loadPractice(),
    srs: loadSrs(),
    checkin,
  };
}

export function downloadBackup(name = "poenglish-backup") {
  const data = buildBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${name}-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 交给浏览器完成下载后再回收
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type ImportResult = {
  ok: boolean;
  addedPractice: number;
  addedVocab: number;
  mergedSrs: number;
};

/** 解析并合并备份；返回 false 表示文件不是本站备份 */
export function applyBackup(text: string, replace = false): ImportResult {
  let data: Backup;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, addedPractice: 0, addedVocab: 0, mergedSrs: 0 };
  }
  if (
    !data ||
    typeof data !== "object" ||
    (!Array.isArray(data.vocab) && !Array.isArray(data.practice))
  ) {
    return { ok: false, addedPractice: 0, addedVocab: 0, mergedSrs: 0 };
  }

  /* 生词：按小写词去重合并 */
  const oldVocab = replace ? [] : loadVocab();
  const seen = new Set(oldVocab.map((v) => v.w.trim().toLowerCase()));
  let addedVocab = 0;
  for (const v of data.vocab || []) {
    if (!v || typeof v.w !== "string" || typeof v.zh !== "string") continue;
    const key = v.w.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    oldVocab.push({ w: v.w, zh: v.zh, from: v.from, at: Number(v.at) || Date.now() });
    addedVocab += 1;
  }
  saveVocab(oldVocab);

  /* 练习记录：按 时间戳+slug+我的答案 去重 */
  const oldPractice = replace ? [] : loadPractice();
  const seenP = new Set(
    oldPractice.map((p) => `${p.at}|${p.slug}|${p.mine.slice(0, 40)}`)
  );
  let addedPractice = 0;
  for (const p of data.practice || []) {
    if (!p || typeof p.slug !== "string" || typeof p.mine !== "string") continue;
    const key = `${Number(p.at) || 0}|${p.slug}|${p.mine.slice(0, 40)}`;
    if (seenP.has(key)) continue;
    seenP.add(key);
    oldPractice.push({
      kind: p.kind || "write",
      slug: p.slug,
      title: String(p.title || ""),
      src: String(p.src || ""),
      mine: p.mine,
      ref: String(p.ref || ""),
      score: Number(p.score) || 0,
      at: Number(p.at) || Date.now(),
    });
    addedPractice += 1;
  }
  savePractice(oldPractice);

  /* 复习进度：取间隔更长的那条，避免导入倒退 */
  const oldSrs = replace ? {} : loadSrs();
  let mergedSrs = 0;
  for (const [k, v] of Object.entries<any>(data.srs || {})) {
    if (!v || typeof v.due !== "string") continue;
    const cur = oldSrs[k];
    if (!cur || (Number(v.interval) || 0) > cur.interval) {
      oldSrs[k] = {
        due: v.due,
        interval: Number(v.interval) || 0,
        ease: Number(v.ease) || 2.5,
        reps: Number(v.reps) || 0,
        lapses: Number(v.lapses) || 0,
      };
      mergedSrs += 1;
    }
  }
  saveSrs(oldSrs);

  /* 打卡日期取并集 */
  try {
    const raw = window.localStorage.getItem("poenglish-checkin");
    const list = raw ? JSON.parse(raw) : [];
    const set = new Set<string>(
      replace ? [] : Array.isArray(list) ? list.filter((x) => typeof x === "string") : []
    );
    for (const d of data.checkin || []) if (typeof d === "string") set.add(d);
    window.localStorage.setItem("poenglish-checkin", JSON.stringify([...set].slice(-400)));
  } catch {
    /* 静默失败 */
  }

  return { ok: true, addedPractice, addedVocab, mergedSrs };
}
