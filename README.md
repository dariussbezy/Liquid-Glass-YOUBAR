# Liquid Glass YOUBAR

> **Development moved:** all plugins and themes are now maintained in [Valenced Plugins & Themes](https://github.com/dariussbezy/dariussbezy-Valenced-Plugins-Themes). Use the [single repository URL](https://raw.githubusercontent.com/dariussbezy/dariussbezy-Valenced-Plugins-Themes/main/index.json) for installation and updates. This repository remains available for historical links.

A glass-inspired finish for Discord's bottom dock, built for Valenced on Android.

**Version: 1.0.0-beta** · **Recovery build 3** · Targets Discord 352.6 and Valenced Plugin API 1.

## Installation

In Valenced, open **Plugins → Advanced → Repository URL**, add this repository, then install **Liquid Glass YOUBAR** from the **beta** channel:

```text
https://raw.githubusercontent.com/dariussbezy/dariussbezy-Valenced-Plugins-Themes/main/index.json
```

Restart Discord after installing or enabling the plugin. Open its settings to adjust the finish.

If an earlier build crashes at startup, remove Liquid Glass YOUBAR in Recovery, fully close Discord, then install [Recovery build 3](./LGD/Liquid-Glass-YOUBAR-Valenced-1.0.0-beta-recovery3.zip). Its description says **Recovery build 3** so you can verify which package is installed.

## Features

- Translucent rounded glass surface with subtle edge reflections.
- Native Android backdrop blur when Discord exposes a supported renderer and a separate backdrop.
- **Subtle**, **Balanced** and **Frosted** finish presets.
- Independent switches for the glass appearance, backdrop blur and highlights.
- Light and dark theme support, with an appearance preview in settings.
- Matching animated on/off switches, with the same shape and dimensions as the other plugins.
- A status label showing whether backdrop blur or the translucent finish is active.
- Keeps Discord's original buttons, badges, gestures, positioning and navigation.
- Respects **Reduce Transparency** where the system exposes it.
- Restores Discord's original background when the glass appearance is disabled.
- Restores the original dock automatically if a glass component cannot be rendered.

## About the effect

The finish combines native blur, translucent tint and static light reflections. Its native rendering and appearance still need confirmation on a real Android device; local checks cover the integration and lifecycle.

On Android 12 and later, blur uses Discord's built-in native blur-target component to sample a separate view. The plugin checks that this view does not contain the dock itself. If that check fails, native blur is unavailable, or older hardware cannot use the supported blur path, the dock keeps its translucent glass finish. Software blur is disabled to avoid the heavier fallback path.

The plugin styles the current **YouBar** dock. Other navigation layouts remain unchanged. The sources use React Native and contain no custom Android binaries; iOS behavior is untested.

## Privacy and performance

No network requests, analytics, screenshots or polling. Settings stay in Valenced's local plugin storage. The effect adds a small number of views to the dock; native blur can still add rendering work. Choose **Subtle** or turn off **Backdrop blur** for a lighter finish.

Sources are in [`plugins/LGD`](./plugins/LGD). The installable package remains in [`LGD`](./LGD). The installed ZIP contains only the script and manifest.

## Repository structure

Sources use the [official Valenced plugin template](https://github.com/Valenced/valenced-plugin-template/tree/9a4f9187137a75d86fe552d0e594889a6e6fd7e5). The implementation is in [`plugins/LGD/js`](plugins/LGD/js), with shared configuration and the official plugin CLI at the repository root. `./gradlew packageAllPlugins` packages the plugin; `npm run publish:local` prepares the pool and both repository indexes. The `LGD/index.json` installation URL remains supported. Artifacts stay on `main` and the beta channel.

Install development dependencies with `bun install --frozen-lockfile` before running the root scripts. The compiler and SDK revisions are pinned in `package.json`.
