# ノルウェー式 HIIT Timer

4x4 ノルウェー式 HIIT インターバルタイマー。

**4分 運動 → 3分 軽い運動** を4セット繰り返します。

## Features

- フェーズごとに背景色が変化（運動=赤、休憩=緑）
- バックグラウンドでも動作継続（Web Worker + Wake Lock）
- フェーズ切り替え時にサウンド・通知・バイブレーション
- PWA対応 — ホーム画面に追加してアプリとして使用可能

## Development

```bash
npm install
npm run dev
```

## Deploy

GitHub Pages へ自動デプロイ（`main` ブランチへの push で発火）。

リポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定してください。
