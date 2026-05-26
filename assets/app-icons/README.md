# App icon source assets

Put final replacement assets in this folder. `config/app-branding.js` prefers these files and falls back to the existing `assets/images/*` files while a replacement is missing.

Required release assets:

| File | Size | Transparency | Usage |
| --- | ---: | --- | --- |
| `app-icon.png` | 1024x1024 | No | Default app icon fallback. Use the full-color production icon. |
| `ios-light.png` | 1024x1024 | No | iOS light/default home-screen icon. |
| `ios-dark.png` | 1024x1024 | No | iOS dark appearance icon. Keep the same silhouette but tune background/contrast for dark mode. |
| `ios-tinted.png` | 1024x1024 | No | iOS tinted icon. Use a clean monochrome/single-material version that works with system tinting. |
| `android-legacy.png` | 1024x1024 | Yes | Android legacy/Play icon fallback. Keep important artwork inside the safe area. |
| `android-icon-foreground.png` | 432x432 or 512x512 | Yes | Android adaptive foreground layer. Artwork should sit inside the central safe area. |
| `android-icon-background.png` | Same as foreground | No | Android adaptive background layer. Use a flat or subtle brand background. |
| `android-icon-monochrome.png` | 432x432 or 512x512 | Yes | Android 13+ themed icon. Pure white shape on transparent background is safest. |
| `android-notification.png` | 96x96 | Yes | Android notification small icon. Must be all-white, flat, no color or gradients. |
| `splash-light.png` | 1200x1200 | Yes | Splash logo for light mode. Keep transparent padding around the mark. |
| `splash-dark.png` | 1200x1200 | Yes | Splash logo for dark mode. Use light artwork on transparent background. |
| `favicon.png` | 48x48 or 64x64 | Yes | Web favicon. |

Design notes:

- Use PNG files with the exact lowercase names above.
- Keep the app mark centered and readable at small sizes.
- Avoid text in app icons unless the mark is still clear at 48px.
- Android adaptive foreground can be masked by launchers, so keep key artwork away from edges.
- Notification icon is not a colored logo; Android renders it as a mask tinted by the configured purple accent.
