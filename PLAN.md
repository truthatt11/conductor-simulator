# Conductor Simulator — Project Plan

> **使用說明**：這份文件是這個專案的單一事實來源 (single source of truth)。
> 未來任何 AI 協作 session 都應該先讀這份文件，再開始工作。
> 包含完整的需求、決策、架構、與實作階段。

---

## 1. Product Vision

一個取代節拍器的**視覺化指揮模擬器**，給音樂學生在練琴時使用。

**目標使用者**：學習器樂/聲樂的學生，看不懂真人指揮手勢，但想在練習時就熟悉指揮的視覺資訊（不只是節拍）。

**核心價值**：不是另一個節拍器，而是把樂譜上的指揮資訊（拍號、強弱、速度變化、起收拍）**視覺化**，讓學生在家練琴時就能適應指揮邏輯。

**非目標**：
- 不是樂譜編輯器（不負責顯示樂譜本身）
- 不是錄音/伴奏工具
- 不取代真人指揮的細膩表情，只做結構性的指揮資訊

---

## 2. 已確認的需求決策

| 決策項 | 選擇 | 備註 |
|---|---|---|
| 平台 | **Web** | 跨平台、開發快、易分享 |
| 支援拍號 | 2/4, 3/4, 4/4, 6/8 | **架構需預留擴充**，未來可加 5/8、7/8、9/8 等 |
| 強弱動態 | 是 | pp / p / mp / mf / f / ff，影響手勢振幅 |
| 起拍 / 收拍 | 是 | preparation beat、cutoff gesture |
| 漸快 / 漸慢 | 是 | accel. / rit.，需 tempo ramp 插值 |
| 視覺風格 | **3D 虛擬指揮家** | rigged 人物模型 |
| 動畫方案 | **骨架 + 路徑混合** | 手臂用 IK 跟隨指揮路徑（程式控制），身體用輕微預烘焙 idle 動畫 |
| 樂譜輸入 | **匯入 MusicXML / MIDI** | 不做手動 timeline 編輯器 |

---

## 3. 使用者流程 (User Journey)

1. 開啟網頁
2. 上傳 MusicXML 或 MIDI 檔
3. 系統解析樂譜，顯示概覽（總小節數、拍號、tempo 標記）
4. 使用者可調整：
   - 整體速度倍率（例：50% 慢練）
   - 選擇 loop 段落（例：第 17–24 小節反覆）
   - 起拍前的 count-in 數量
5. 按「開始」→ 3D 指揮家依樂譜打拍、做強弱、處理速度變化、收拍

---

## 4. 技術選型

| 層級 | 選擇 | 理由 |
|---|---|---|
| Build tool | Vite | 快、TS 開箱即用 |
| 框架 | React + TypeScript | 元件化、型別安全 |
| 3D 渲染 | three.js + @react-three/fiber + @react-three/drei | Web 3D 標準，與 React 整合好 |
| IK | three-ik 套件，或自寫 CCD / FABRIK | 控制手臂跟隨路徑 |
| 3D 角色 | Mixamo 免費 rigged GLB | 骨架現成，省 rigging 成本 |
| 音訊時鐘 | **Web Audio API** (`AudioContext.currentTime` + lookahead scheduler) | 唯一能達到毫秒級精度。**絕對不能用 `setTimeout` / `setInterval` 排程拍點** |
| MusicXML 解析 | opensheetmusicdisplay（或 musicxml-interfaces） | 業界常用 |
| MIDI 解析 | @tonejs/midi | 維護活躍、API 乾淨 |
| 狀態管理 | Zustand | 比 Redux 輕、夠用 |
| 測試 | Vitest（單元） + Playwright（E2E） | |
| 樣式 | CSS Modules 或 Tailwind | 待定，phase 0 決定 |

---

## 5. 架構 (Modular, Domain-Driven)

遵循使用者全域偏好：**many small files, organize by domain, immutable data, high cohesion / low coupling**。

```
src/
  domain/                # 純資料 + 純函數，無 IO、無 framework 依賴
    score/
      types.ts           # Score, Measure, Beat, Dynamic, TempoMark 型別
      score.ts           # 不可變更新函數
      score.test.ts
    conducting/          # 指揮路徑（純幾何，與拍號 decoupled）
      types.ts           # ConductingPath { id, label, beatCount, anchors, sample() }
      curve.ts           # 共用 bezier / 路徑工具
      paths/
        twoBeat.ts       # 通用 2-beat (down-up)
        threeBeat.ts     # 通用 3-beat (triangle)
        fourBeat.ts      # 通用 4-beat (cross)
        sixBeat.ts       # 通用 6-beat (subdivided)
      registry.ts        # 列出所有 paths（擴充點）
      compatibility.ts   # meter ↔ path 多對多相容矩陣 + 預設選擇
      *.test.ts
    tempo/
      ramp.ts            # accel/rit 插值
      ramp.test.ts
    dynamics/
      amplitude.ts       # Dynamic → 振幅倍率
  parsers/               # 外部格式 → Score
    musicxml/
      parse.ts
      parse.test.ts
      fixtures/          # 測試用樣本
    midi/
      parse.ts
      parse.test.ts
  engine/                # 執行期：時鐘 + 排程
    clock/
      audioClock.ts      # Web Audio 高精度時鐘
      lookahead.ts       # lookahead scheduler pattern
      clock.test.ts
    playback/
      controller.ts      # play / pause / seek / loop
      scheduler.ts       # Score + clock → 拍點事件
      events.ts          # BeatEvent, DownbeatEvent, CutoffEvent...
  scene/                 # 3D 場景
    conductor/
      model.tsx          # 載入 GLB
      ikRig.ts           # 骨架 IK 設定
      boneMapping.ts     # 不同模型骨架命名映射
    baton/
      pathFollower.ts    # 棒尖端沿 BeatPath 移動
    camera/
      setup.ts
    lighting/
      setup.ts
  ui/
    upload/              # 樂譜上傳、解析錯誤顯示
    controls/            # play/pause、速度、loop 範圍
    timeline/            # 小節進度、目前位置
    settings/            # 動態開關、起拍 count-in
  app/
    store.ts             # Zustand store
    routes.tsx
    main.tsx
  __fixtures__/          # 跨模組測試用樣本樂譜
```

### 5.1 核心抽象

**Score 是中心資料模型**。所有 parser 都產出同一個 Score 形狀，所有下游消費者都讀同一個 Score。

```typescript
// 草稿 — phase 0 會 finalize
type Score = {
  meta: { title?: string; composer?: string };
  measures: ReadonlyArray<Measure>;
};

type Measure = {
  index: number;                      // 0-based
  timeSignature: TimeSignature;       // { numerator, denominator }
  tempo: TempoMark;                   // bpm + optional ramp
  dynamic?: Dynamic;                  // pp..ff，沿用到下個 dynamic
  gestures: ReadonlyArray<Gesture>;   // cue, cutoff, fermata...
};

type TempoMark =
  | { kind: 'steady'; bpm: number }
  | { kind: 'ramp'; fromBpm: number; toBpm: number };  // accel/rit

type Dynamic = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff';
```

**所有 Score 操作必須回傳新物件**（immutability — 使用者全域規則）。

### 5.2 指揮路徑 (ConductingPath) — 與拍號解耦

**關鍵設計**：路徑是純幾何，跟拍號是兩個獨立概念。

```typescript
interface ConductingPath {
  id: string;
  label: string;
  beatCount: number;                    // 路徑有幾個 ictus（不知道拍號）
  beatAnchors: ReadonlyArray<Vec2>;
  sample(t: number, opts: { amplitude: number }): Vec2;
}
```

**為什麼解耦**：
- 同一拍號可用多種路徑（例 6/8 可「在 2」或「在 6」）
- 同一路徑可用於多種拍號（例 two-beat 用於 2/4、4/4 cut-time、6/8 compound）

**相容性矩陣** (`compatibility.ts`)：以 meter 為 key 列出支援的 path ids，**有序**（第一個 = 預設）。

```typescript
// 例：
{ meter: 4/4, supportedPathIds: ['four-beat', 'two-beat'] }
{ meter: 6/8, supportedPathIds: ['two-beat', 'six-beat'] }
```

API：
- `supportedPathsForMeter(ts)` — 該 meter 支援的 paths
- `defaultPathForMeter(ts)` — 第一個（慣例）
- `metersForPath(pathId)` — 反向查詢
- `isCompatible(ts, pathId)` — boolean

**擴充方式**：
- 加新 path：在 `paths/` 加檔案 + 在 `registry.ts` 登錄
- 加新 meter 或新組合：在 `compatibility.ts` 的矩陣加一筆
- **不修改既有程式碼**（Open/Closed）

### 5.3 模組依賴方向（嚴格單向）

```
ui  →  app/store  →  engine  →  domain
                       ↓
                    scene  →  domain
parsers  →  domain
```

- `domain` 不依賴任何上層 — 純函數、可獨立測試
- `engine` 與 `scene` 都消費 `domain`，彼此**不互相依賴**
- 視覺呈現（scene）與排程（engine）解耦，未來換 2D 視覺只需替換 scene

---

## 6. 階段性交付計畫

每個 phase 結束都是「可運行的成品」，不是半成品。

### Phase 0 — 地基 ✅ 完成 (2026-05-12)
- [x] Vite + React + TS + Vitest scaffold
- [x] ESLint / Prettier
- [ ] CI（GitHub Actions：lint + test + build） — 待加
- [x] Web Audio lookahead scheduler（dependency-injected timer / AudioContext，可測）
- [x] 單元測試驗證**零漂移**（純函式時鐘以 fake audio context 驗證拍點時間戳）
- [ ] 10 分鐘真實播放漂移驗證 — 需在瀏覽器手動跑
- [x] Score 資料模型 + 完整型別 + 單元測試（11 tests）

**Exit criteria**：終端有 BPM 控制的純音訊節拍器，誤差通過驗證。

### Phase 1 — 2D 指揮棒 MVP ✅ 完成 (2026-05-12)
- [x] 實作 4 個通用 `ConductingPath`：twoBeat, threeBeat, fourBeat, sixBeat
- [x] **Meter ↔ Path decoupled**：路徑是純幾何，跟拍號透過 compatibility 矩陣關聯
- [x] SVG 光點 + path 曲線，RAF 同步音訊時鐘
- [x] UI：BPM 輸入、Meter 下拉、Path 下拉（依當前 meter 動態過濾）、Dynamic、play/pause
- [x] Debug overlay：anchor 編號、紅點 = downbeat
- [x] 53 tests pass（含 store 行為測試）

**Exit criteria**：可以拿來當「視覺化節拍器」實際練琴。

**⏸️ 暫停點 — 在進入 Phase 2 之前**：
- 視覺化節拍對練琴真的有幫助嗎？
- 4 種路徑曲線形狀正確嗎？（**找指揮老師看過**）
- 是否真的需要做到 3D？（2D 也許就夠，省下 phase 4 的 2–3 週）

### Phase 2 — 樂譜匯入（1–2 週）
- [ ] MusicXML parser → Score
- [ ] MIDI parser → Score
- [ ] 解析錯誤的友善訊息
- [ ] 上傳 UI + 解析後概覽（總小節、拍號變化、tempo 變化清單）
- [ ] 提取 dynamic 記號（pp..ff）
- [ ] 提取 tempo 變化（含 accel/rit 範圍）

**Exit criteria**：能匯入老師指定的曲目，正確識別所有拍號與動態。

### Phase 3 — 進階指揮資訊（1 週）
- [ ] Dynamic → 手勢振幅縮放（pp 小、ff 大）
- [ ] 起拍 preparation beat（樂曲開始前 1 拍預備動作）
- [ ] 收拍 cutoff gesture（樂曲/段落結尾的圈狀手勢）
- [ ] Tempo ramp 線性/曲線插值（accel/rit）
- [ ] Fermata（延音）— 暫停在拍點，等使用者按鍵繼續

**Exit criteria**：完整呈現一首中等難度曲目的指揮資訊。

### Phase 4 — 3D 指揮家（2–3 週，最高風險）
- [ ] 載入 Mixamo rigged GLB
- [ ] 骨架命名映射（抽成 config，相容多種模型）
- [ ] IK：右手腕跟隨 baton path（CCD 或 FABRIK）
- [ ] **Anticipation curve**：手腕提早 ~80ms 到拍點再回彈（避免機器人感）
- [ ] Idle 動畫：呼吸、身體微擺
- [ ] 攝影機、燈光、簡單背景
- [ ] 左手簡化版（暫不做表情）

**Exit criteria**：3D 角色動作流暢，跟音訊同步準確。

### Phase 5 — 練習功能（1 週）
- [ ] 段落 loop（選 measure 範圍反覆）
- [ ] 速度倍率（50%–150%）
- [ ] Count-in（樂曲開始前先打 N 個空拍）
- [ ] 預設 preset 存檔（localStorage）
- [ ] 快捷鍵（空白鍵 play/pause、← → seek 小節）

**Exit criteria**：能拿給其他學生試用。

**總計：8–12 週**（視投入時間）。

---

## 7. 主要風險與緩解

| 風險 | 影響 | 緩解 |
|---|---|---|
| 瀏覽器 `setTimeout` 抖動 (~10–50ms) | 拍點不準，無法練琴 | **必用** Web Audio API + lookahead scheduler pattern。Phase 0 就驗證 |
| IK 動作僵硬 | 像機器人，影響沉浸感 | Anticipation + smoothing + 適度誇張的曲線。預留 phase 4 一週調整 |
| MusicXML 檔案品質參差 | 解析失敗或結果錯誤 | 寬鬆解析 + 清楚錯誤訊息 + 大量 fixture 測試（不同編譜軟體輸出） |
| 3D 角色骨架命名差異 | 換模型就壞 | `boneMapping.ts` 抽出設定檔，支援多種命名慣例 |
| 範圍蔓延 | 永遠做不完 | 嚴格 phase gate，phase 1 後強制停下來評估 |

---

## 8. 編碼準則（專案特定）

繼承使用者全域規則 (`~/.claude/rules/common/`)，並加上專案特定要求：

1. **不可變性**：所有 Score 操作回傳新物件。`domain/` 內**禁止 mutation**。
2. **檔案大小**：典型 200–400 行，最多 800。指揮圖形如果超過 400 行，拆 helper。
3. **測試覆蓋**：
   - `domain/`：100% — 純函數沒有理由不測完
   - `parsers/`：每個支援的 MusicXML/MIDI 檔案結構都要有 fixture
   - `engine/clock`：必須有時鐘漂移測試
4. **錯誤處理**：parser 失敗 → 結構化錯誤 + 友善 UI 訊息。**絕對不能 silent swallow**。
5. **無註解原則**：除非說明非顯然的 why（為什麼這個 anticipation 是 80ms 而不是 50ms）。不寫 what 註解。
6. **TDD**：新功能先寫測試。phase 0 設好 Vitest watch mode。

---

## 9. 開放問題（待決定）

需要使用者進一步輸入：

1. **指揮圖形數學定義**：4 種拍號的標準曲線（最好找指揮老師確認或參考標準教材）
   - 4/4：下-左-右-上的「十字」變體有好幾種，哪一種最常見？
   - 6/8 快板用 2 大拍打？還是 6 小拍都打？預設策略待定
2. **3D 角色性別/造型**：男/女/中性？正裝/休閒？
3. **左手要不要做**：phase 4 暫不做表情，但左手「強弱提示」要不要做？
4. **目標瀏覽器**：只支援 Chrome/Safari 最新版？還是要兼容 Firefox / 舊版？
5. **離線使用**：要不要做 PWA？（學生家裡可能沒 wifi）
6. **MusicXML 子集**：要支援壓縮版 `.mxl` 嗎？multi-staff？反覆記號？

---

## 10. 給未來協作 Session 的 Onboarding

如果你（AI 或新加入的人）剛接手這個專案：

1. **先讀這份 PLAN.md 全文**
2. 看 `package.json` 知道目前在哪個 phase
3. 看 `src/domain/score/types.ts` 理解核心資料模型
4. 跑 `npm test` 確認測試全綠
5. 跑 `npm run dev` 看目前產品狀態
6. 任何決策變更 → **更新這份 PLAN.md**，不要讓計畫和現實脫節

### 常見任務的入口點

| 想做什麼 | 從哪裡開始 |
|---|---|
| 加新指揮路徑（如 one-beat、five-beat） | `src/domain/conducting/paths/` 加檔案 → `registry.ts` 登錄 |
| 加新拍號（如 5/8、9/8） | 在 `src/domain/conducting/compatibility.ts` 的矩陣加一筆 |
| 改現有路徑曲線形狀 | 對應的 `paths/twoBeat.ts` 等，先改測試 |
| 改某拍號用哪個路徑當預設 | `compatibility.ts` 把該 meter 的 supportedPathIds 第一項換掉 |
| 讓某 path 不再支援某 meter | `compatibility.ts` 從該 meter 的清單移除 |
| 加新樂譜格式 | `src/parsers/` 加新 adapter，產出同樣的 `Score` |
| 換 3D 角色 | 替換 `.glb` 檔，調 `boneMapping.ts` |
| 調手勢「感覺」 | `scene/baton/pathFollower.ts` 的 anticipation / smoothing 參數 |

---

## 11. 變更紀錄

| 日期 | 變更 | 決策者 |
|---|---|---|
| 2026-05-12 | 初稿，確認平台、拍號、視覺風格、輸入方式 | 使用者 |
| 2026-05-12 | Phase 0 完成：Vite/React/TS/Vitest scaffold、Score 資料模型、Web Audio lookahead scheduler（DI-friendly、可測、零漂移） | — |
| 2026-05-12 | Phase 1 完成：4 個指揮路徑、SVG 視覺化、UI 控制、AudioContext 音訊 click（downbeat 1500Hz / 其他 1000Hz） | — |
| 2026-05-12 | **架構重構**：`patterns/` → `conducting/`，將「拍號 (Meter)」與「指揮路徑 (ConductingPath)」decouple。路徑改為純幾何（只有 `beatCount`），不再綁定拍號 | 使用者要求 |
| 2026-05-12 | 引入 **meter ↔ path 多對多 compatibility 矩陣** (`compatibility.ts`)：每個 meter 有一個有序的支援 paths 清單（首項 = 預設）。UI 的 Path 下拉依當前 meter 動態過濾；切 meter 時若路徑仍相容則保留，否則 snap 到預設 | 使用者要求 |
| 2026-05-12 | 初版相容矩陣：2/4→[two,four]、3/4→[three,six]、4/4→[four,two]、6/8→[two,six] | — |
