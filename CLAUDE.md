# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Server

```bash
cd worktime-pwa
python3 -m http.server 8080
# → http://localhost:8080
```

Kein Build-Schritt, kein Package Manager, keine Transpilierung. Dateien editieren und Browser neu laden.

## Projektbeschreibung

Einfache jährliche Arbeitszeiterfassung als PWA:
- Nur Stunden pro Tag erfassen (kein Soll/Diff)
- Übersicht: aufsummierte Stunden pro Monat + Jahresgesamtstunden
- Offline-fähig via Service Worker
- Zielplattform: iPhone (Safari „Zum Home-Bildschirm") und Android Chrome

## Zielplattform

Primär: iPhone (Safari PWA). Testgerät: Android Pixel (Chrome).
Keine Apple-spezifischen Meta-Tags notwendig — Standard-PWA-Manifest genügt.
Service Worker: Cache-First-Strategie. Cache-Name versionieren (`worktime-v1` → `worktime-v2`) wenn neue Assets hinzukommen.

## Architektur

Single-Page-App, Views per `.hidden`-CSS-Klasse umgeschaltet. Plain JS als globale Namespaces, geladen in Abhängigkeitsreihenfolge am Ende von `index.html`:

```
storage.js → ui.js → app.js
```

| Datei | Namespace | Verantwortung |
|---|---|---|
| `js/storage.js` | `Storage` | Gesamter `localStorage`-Zugriff |
| `js/ui.js` | `UI` | Reines Rendering (baut HTML-Strings, kein State) |
| `js/app.js` | IIFE | App-State, Event-Bindings, View-Transitions |

`showView(name)` in `app.js` ist der einzige Einstiegspunkt für View-Wechsel.

## Datenmodell

```js
// localStorage-Schlüssel: "entry_YYYY-MM-DD"
{ date, hours, note }

// localStorage-Schlüssel: "settings"
{ defaultHours }
```

Einträge werden per Index über `localStorage` iteriert (keine separate Indexstruktur).

## CSS

`css/app.css`: CSS Custom Properties für Theming, Dark Mode via `prefers-color-scheme`.
`css/print.css`: Versteckt alles außer der aktiven Tabellenansicht — für PDF-Export via `window.print()`.

## Code-Konventionen

**Sortierung im Quellcode:**
- `public` Variablen/Konstanten: alphabetisch
- `private` Variablen/Konstanten: alphabetisch
- `public` Funktionen: alphabetisch (Parameter NICHT alphabetisch sortieren)
- `private` Funktionen: alphabetisch (Parameter NICHT alphabetisch sortieren)

**Dokumentation:** Alle Klassen und Funktionen mit JSDoc kommentieren (Parameter beschreiben).

**Sprache:** Kommunikation und Kommentare auf Deutsch.

## Sonderbefehle

- `#cmd` → Anweisungen in `prompt.txt` ausführen
