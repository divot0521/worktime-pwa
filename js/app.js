/**
 * App-IIFE: besitzt den gesamten App-State, alle Event-Bindings
 * und steuert View-Transitionen.
 * Einstiegspunkt für View-Wechsel: showView(name).
 */
(function () {
  'use strict';

  // ── private Konstanten (alphabetisch) ────────────────────────────────────
  const MONTH_NAMES = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const VIEWS = ['day', 'month', 'year', 'settings'];

  const WEEKDAY_NAMES = [
    'Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
    'Donnerstag', 'Freitag', 'Samstag'
  ];

  // ── private Variablen (alphabetisch) ─────────────────────────────────────
  let _activeView    = 'day';
  let _pickerMonth   = new Date().getMonth() + 1;
  let _pickerYear    = new Date().getFullYear();
  let _selectedDate  = _todayStr();
  let _selectedMonth = new Date().getMonth() + 1;
  let _selectedYear  = new Date().getFullYear();

  // ── private Hilfsfunktionen (alphabetisch) ───────────────────────────────

  /**
   * Gibt ein Date-Objekt als YYYY-MM-DD-String zurück (lokale Zeit).
   * @param {Date} d
   * @returns {string}
   */
  function _dateToStr(d) {
    return d.getFullYear() + '-'
      + String(d.getMonth() + 1).padStart(2, '0') + '-'
      + String(d.getDate()).padStart(2, '0');
  }

  /**
   * Formatiert ein Datum als lesbaren deutschen Langen-String.
   * Beispiel: "Montag, 1. März 2026"
   * @param {string} dateStr - Datum im Format YYYY-MM-DD
   * @returns {string}
   */
  function _formatDateLong(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return WEEKDAY_NAMES[date.getDay()] + ', ' + d + '. ' + MONTH_NAMES[m - 1] + ' ' + y;
  }

  /**
   * Gibt das heutige Datum als YYYY-MM-DD-String zurück.
   * @returns {string}
   */
  function _todayStr() {
    return _dateToStr(new Date());
  }

  /**
   * Zeigt kurzes visuelles Feedback auf einem Button.
   * @param {HTMLButtonElement} btn     - Schaltfläche
   * @param {string}            label   - Ursprünglicher Label-Text
   */
  function _flashSaved(btn, label) {
    btn.textContent = '✓ Gespeichert';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = label;
      btn.disabled = false;
    }, 1500);
  }

  // ── private Render-Funktionen (alphabetisch) ─────────────────────────────

  /**
   * Callback für Tag-Auswahl im Monatskalender.
   * Aktualisiert _selectedDate und rendert das Formular neu.
   * @param {string} dateStr - Gewähltes Datum im Format YYYY-MM-DD
   */
  function _onDayTap(dateStr) {
    _selectedDate = dateStr;
    // Kalender neu rendern um Auswahl-Markierung zu aktualisieren
    UI.renderDayPicker(
      document.getElementById('day-picker-container'),
      _pickerYear, _pickerMonth, _selectedDate, _onDayTap
    );
    _renderDayForm();
  }

  /** Aktualisiert die Tag-Eingabeansicht: Kalender + Formular. */
  function _renderDay() {
    document.getElementById('picker-month-title').textContent =
      MONTH_NAMES[_pickerMonth - 1] + ' ' + _pickerYear;
    UI.renderDayPicker(
      document.getElementById('day-picker-container'),
      _pickerYear, _pickerMonth, _selectedDate, _onDayTap
    );
    _renderDayForm();
  }

  /** Aktualisiert nur das Eingabeformular für den gewählten Tag. */
  function _renderDayForm() {
    document.getElementById('selected-day-label').textContent = _formatDateLong(_selectedDate);
    const entry = Storage.getEntry(_selectedDate);
    document.getElementById('input-hours').value = entry ? entry.hours : 0;
    document.getElementById('input-note').value  = entry ? (entry.note || '') : '';
  }

  /** Aktualisiert die Monatsübersichtsansicht. */
  function _renderMonth() {
    document.getElementById('month-title').textContent =
      MONTH_NAMES[_selectedMonth - 1] + ' ' + _selectedYear;
    UI.renderMonth(
      document.getElementById('month-container'),
      _selectedYear,
      _selectedMonth
    );
  }

  /** Aktualisiert die Einstellungsansicht. */
  function _renderSettings() {
    const s = Storage.getSettings();
    document.getElementById('input-default-hours').value = s.defaultHours;
  }

  /** Aktualisiert die Jahresübersichtsansicht. */
  function _renderYear() {
    document.getElementById('year-title').textContent = String(_selectedYear);
    UI.renderYear(
      document.getElementById('year-container'),
      _selectedYear
    );
  }

  // ── private Event-Bindings ────────────────────────────────────────────────

  /** Bindet alle DOM-Event-Listener. Einmalig beim Start aufrufen. */
  function _bindEvents() {
    // Tab-Navigation
    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => showView(btn.dataset.view));
    });

    // Picker-Monat-Navigation in der Tag-Ansicht
    document.getElementById('btn-prev-picker-month').addEventListener('click', () => {
      if (_pickerMonth === 1) { _pickerMonth = 12; _pickerYear--; }
      else                    { _pickerMonth--; }
      _renderDay();
    });

    document.getElementById('btn-next-picker-month').addEventListener('click', () => {
      if (_pickerMonth === 12) { _pickerMonth = 1; _pickerYear++; }
      else                     { _pickerMonth++; }
      _renderDay();
    });

    // Monat-Navigation: vorheriger / nächster Monat
    document.getElementById('btn-prev-month').addEventListener('click', () => {
      if (_selectedMonth === 1) { _selectedMonth = 12; _selectedYear--; }
      else                      { _selectedMonth--; }
      _renderMonth();
    });

    document.getElementById('btn-next-month').addEventListener('click', () => {
      if (_selectedMonth === 12) { _selectedMonth = 1; _selectedYear++; }
      else                       { _selectedMonth++; }
      _renderMonth();
    });

    // Jahr-Navigation: vorheriges / nächstes Jahr
    document.getElementById('btn-prev-year').addEventListener('click', () => {
      _selectedYear--;
      _renderYear();
    });

    document.getElementById('btn-next-year').addEventListener('click', () => {
      _selectedYear++;
      _renderYear();
    });

    // Tageseintrag speichern
    document.getElementById('btn-save').addEventListener('click', () => {
      const hours = parseFloat(document.getElementById('input-hours').value) || 0;
      const note  = document.getElementById('input-note').value.trim();
      Storage.saveEntry(_selectedDate, hours, note);
      _flashSaved(document.getElementById('btn-save'), 'Speichern');
    });

    // Einstellungen speichern
    document.getElementById('btn-save-settings').addEventListener('click', () => {
      const defaultHours = parseFloat(document.getElementById('input-default-hours').value) || 8;
      Storage.saveSettings({ defaultHours });
      _flashSaved(document.getElementById('btn-save-settings'), 'Speichern');
    });
  }

  // ── public Funktionen (alphabetisch) ─────────────────────────────────────

  /**
   * Wechselt zur angegebenen View und rendert deren Inhalt.
   * Ist der einzige Einstiegspunkt für View-Transitionen.
   * @param {string} name - 'day' | 'month' | 'year' | 'settings'
   */
  function showView(name) {
    VIEWS.forEach(v => {
      document.getElementById('view-' + v).classList.toggle('hidden', v !== name);
    });
    document.querySelectorAll('.tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === name);
    });
    _activeView = name;

    if (name === 'day') {
      // Picker-Monat auf den Monat des gewählten Datums synchronisieren
      const parts = _selectedDate.split('-').map(Number);
      _pickerYear  = parts[0];
      _pickerMonth = parts[1];
      _renderDay();
    }
    if (name === 'month')    _renderMonth();
    if (name === 'year')     _renderYear();
    if (name === 'settings') _renderSettings();
  }

  // ── Initialisierung ───────────────────────────────────────────────────────

  // Service Worker registrieren
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .catch(err => console.warn('Service Worker Registrierung fehlgeschlagen:', err));
  }

  _bindEvents();
  showView('day');
})();
