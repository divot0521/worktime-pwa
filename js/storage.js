/**
 * Storage-Namespace: gesamter localStorage-Zugriff für die Arbeitszeiterfassung.
 * Eintrags-Schlüssel folgen dem Muster "entry_YYYY-MM-DD".
 * Einstellungen werden unter dem Schlüssel "settings" gespeichert.
 */
const Storage = (() => {
  'use strict';

  // ── private Konstanten (alphabetisch) ────────────────────────────────────
  const KEY_PREFIX   = 'entry_';
  const KEY_SETTINGS = 'settings';

  // ── private Funktionen (alphabetisch) ────────────────────────────────────

  /**
   * Erzeugt den localStorage-Schlüssel für ein Datum.
   * @param {string} date - Datum im Format YYYY-MM-DD
   * @returns {string} Schlüssel, z.B. "entry_2026-03-01"
   */
  function _entryKey(date) {
    return KEY_PREFIX + date;
  }

  // ── public Funktionen (alphabetisch) ─────────────────────────────────────

  /**
   * Löscht den Eintrag für ein Datum.
   * @param {string} date - Datum im Format YYYY-MM-DD
   */
  function deleteEntry(date) {
    localStorage.removeItem(_entryKey(date));
  }

  /**
   * Gibt den Eintrag für ein bestimmtes Datum zurück.
   * @param {string} date - Datum im Format YYYY-MM-DD
   * @returns {{ date: string, hours: number, note: string }|null}
   */
  function getEntry(date) {
    const raw = localStorage.getItem(_entryKey(date));
    return raw ? JSON.parse(raw) : null;
  }

  /**
   * Gibt alle Einträge eines Monats aufsteigend sortiert zurück.
   * @param {number} year  - Jahr, z.B. 2026
   * @param {number} month - Monat (1–12)
   * @returns {{ date: string, hours: number, note: string }[]}
   */
  function getEntriesForMonth(year, month) {
    const prefix  = KEY_PREFIX + year + '-' + String(month).padStart(2, '0');
    const entries = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        entries.push(JSON.parse(localStorage.getItem(key)));
      }
    }

    entries.sort((a, b) => a.date.localeCompare(b.date));
    return entries;
  }

  /**
   * Gibt alle Einträge eines Jahres aufsteigend sortiert zurück.
   * @param {number} year - Jahr, z.B. 2026
   * @returns {{ date: string, hours: number, note: string }[]}
   */
  function getEntriesForYear(year) {
    const prefix  = KEY_PREFIX + String(year);
    const entries = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        entries.push(JSON.parse(localStorage.getItem(key)));
      }
    }

    entries.sort((a, b) => a.date.localeCompare(b.date));
    return entries;
  }

  /**
   * Gibt die gespeicherten Einstellungen zurück.
   * Fehlen Einstellungen, werden Standardwerte geliefert.
   * @returns {{ defaultHours: number }}
   */
  function getSettings() {
    const raw = localStorage.getItem(KEY_SETTINGS);
    return raw ? JSON.parse(raw) : { defaultHours: 8 };
  }

  /**
   * Speichert einen Tageseintrag.
   * Bestehende Einträge für das gleiche Datum werden überschrieben.
   * @param {string} date  - Datum im Format YYYY-MM-DD
   * @param {number} hours - Gearbeitete Stunden
   * @param {string} note  - Optionale Notiz
   */
  function saveEntry(date, hours, note) {
    const entry = { date, hours, note };
    localStorage.setItem(_entryKey(date), JSON.stringify(entry));
  }

  /**
   * Speichert die Einstellungen.
   * @param {{ defaultHours: number }} settings
   */
  function saveSettings(settings) {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
  }

  // ── public API ────────────────────────────────────────────────────────────
  return {
    deleteEntry,
    getEntriesForMonth,
    getEntriesForYear,
    getEntry,
    getSettings,
    saveEntry,
    saveSettings
  };
})();
