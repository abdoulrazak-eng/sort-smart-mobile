# SmartEco on the desktop (Windows / macOS / Linux)

SmartEco now ships an Electron shell (`electron/main.cjs`). It opens a native
window that loads the live site, so the camera scanner and the server-side AI
classification work exactly as on the web, and web updates arrive without
re-installing the desktop app.

## 1. Install the build tooling (once, on your own machine)

```bash
npm install --save-dev electron @electron/packager
```

## 2. Run it locally

```bash
npx electron .
```

Point it at another URL (e.g. your custom domain or a local dev server):

```bash
SMARTECO_URL=https://smartsortapp.com npx electron .      # macOS / Linux
set SMARTECO_URL=https://smartsortapp.com && npx electron .  # Windows cmd
```

## 3. Package installers / portable builds

Windows (`.exe` in a folder — zip it to distribute):

```bash
npx @electron/packager . "SmartEco" --platform=win32 --arch=x64 \
  --out=electron-release --overwrite --icon=electron/icon.ico
```

macOS (`.app`):

```bash
npx @electron/packager . "SmartEco" --platform=darwin --arch=arm64 \
  --out=electron-release --overwrite --icon=electron/icon.icns
```

Linux:

```bash
npx @electron/packager . "SmartEco" --platform=linux --arch=x64 \
  --out=electron-release --overwrite
```

Output lands in `electron-release/SmartEco-<platform>-<arch>/`.

## 4. Icons

`electron/icon.png` (512×512) is used for the window. For packaged apps convert it:

- Windows: `icon.ico` (256×256 multi-size)
- macOS: `icon.icns`

```bash
npm i -D png-to-ico
npx png-to-ico electron/icon.png > electron/icon.ico
```

## 5. Signing & distribution

- **Windows**: unsigned builds show a SmartScreen warning. An OV/EV code-signing
  certificate removes it (`signtool sign /fd sha256 ...`).
- **macOS**: needs an Apple Developer ID to sign + notarize:
  ```bash
  codesign --deep --force --options runtime --sign "Developer ID Application: NAME (TEAMID)" \
    electron-release/SmartEco-darwin-arm64/SmartEco.app
  xcrun notarytool submit SmartEco.zip --apple-id ... --team-id ... --password ...
  ```
- Camera use on macOS requires `NSCameraUsageDescription` in the packaged
  `Info.plist` — add it after packaging, or pass
  `--extend-info` with a plist containing:
  ```xml
  <key>NSCameraUsageDescription</key>
  <string>SmartEco uses the camera to identify waste items and tell you which bin to use.</string>
  ```

## 6. Updating later

Press **Publish** in Lovable — the desktop app loads the live site, so UI and AI
changes appear on next launch. Repackage only when you change Electron config,
icons, or the app version.
