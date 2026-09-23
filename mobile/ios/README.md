# iOS – GANZA (bare React Native)

This folder is prepared for a real iPhone build via React Native CLI.

## Setup
```bash
cd mobile
bundle install
pod install --project-directory=ios
npm run ios
```

## Camera permissions – Info.plist
Add to `ios/Ganza/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>GANZA needs camera access to scan wooden boards (Shyira imbaho zigaragara neza muri camera).</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>GANZA needs photo library access to pick board images.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Not used but required by some camera libs.</string>
```

## Notes
- No Expo dependencies – uses `react-native-vision-camera` or native `AVFoundation` when installed.
- Firebase via `firebase` JS SDK (no admin secrets in app).
- Bundle identifier: `com.ganza.app`
- Supports New Architecture (Fabric) = false by default, enable via `newArchEnabled=true` in `gradle.properties` / Podfile.
- For release: `npx react-native run-ios --configuration Release` or via Xcode Archive.
