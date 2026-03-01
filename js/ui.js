/**
 * UI-Namespace: reines Rendering.
 * Baut HTML-Strings und injiziert sie in Container-Elemente.
 * Modifiziert keinen App-State, ruft direkt Storage auf.
 */
const UI = (() => {
  'use strict';

  // ── private Konstanten (alphabetisch) ────────────────────────────────────
  const MONTH_NAMES = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  // ── private Funktionen (alphabetisch) ────────────────────────────────────

  /**
   * Formatiert eine Stundenzahl für die Anzeige (deutsches Dezimalformat).
   * Gibt '–' zurück wenn der Wert null/0/undefined ist.
   * @param {number|null|undefined} hours
   * @returns {string}
   */
  function _formatHours(hours) {
    if (!hours && hours !== 0) return '–';
    if (hours === 0)           return '–';
    return hours.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  /**
   * Erzeugt aus einem YYYY-MM-DD-String ein lokales Date-Objekt
   * ohne Timezone-Verschiebung.
   * @param {string} dateStr - Datum im Format YYYY-MM-DD
   * @returns {Date}
   */
  function _parseLocalDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /**
   * Gibt das heutige Datum als YYYY-MM-DD-String zurück (lokale Zeit).
   * @returns {string}
   */
  function _todayStr() {
    const d = new Date();
    return d.getFullYear() + '-'
      + String(d.getMonth() + 1).padStart(2, '0') + '-'
      + String(d.getDate()).padStart(2, '0');
  }

  // ── public Funktionen (alphabetisch) ─────────────────────────────────────

  /**
   * Rendert die Monatsübersicht in den angegebenen Container.
   * Zeigt alle Tage des Monats mit Stunden und Notiz; Wochenenden hervorgehoben.
   * @param {HTMLElement} container - Ziel-Element
   * @param {number}      year      - Jahr (z.B. 2026)
   * @param {number}      month     - Monat (1–12)
   */
  function renderMonth(container, year, month) {
    const entries    = Storage.getEntriesForMonth(year, month);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Einträge als Lookup-Map aufbauen
    const entryMap = {};
    entries.forEach(e => { entryMap[e.date] = e; });

    const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);

    let rows = '';
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr  = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const date     = _parseLocalDate(dateStr);
      const entry    = entryMap[dateStr];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      rows += `<tr class="${isWeekend ? 'weekend' : ''}">
        <td class="col-wd">${WEEKDAY_SHORT[date.getDay()]}</td>
        <td class="col-day">${d}.</td>
        <td class="col-hours">${_formatHours(entry ? entry.hours : null)}</td>
        <td class="col-note">${entry && entry.note ? entry.note : ''}</td>
      </tr>`;
    }

    container.innerHTML = `
      <table class="time-table">
        <thead>
          <tr>
            <th colspan="2">Tag</th>
            <th class="col-hours">Std.</th>
            <th>Notiz</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2"><strong>Gesamt</strong></td>
            <td class="col-hours"><strong>${_formatHours(totalHours)}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>`;
  }

  /**
   * Rendert die Jahresübersicht in den angegebenen Container.
   * Zeigt die Stundensumme pro Monat und die Jahresgesamtsumme.
   * @param {HTMLElement} container - Ziel-Element
   * @param {number}      year      - Jahr (z.B. 2026)
   */
  function renderYear(container, year) {
    const entries = Storage.getEntriesForYear(year);

    // Monatssummen berechnen (Index 0 = Januar)
    const monthTotals = new Array(12).fill(0);
    entries.forEach(e => {
      const monthIndex = parseInt(e.date.split('-')[1], 10) - 1;
      monthTotals[monthIndex] += e.hours || 0;
    });

    const yearTotal = monthTotals.reduce((sum, h) => sum + h, 0);

    let rows = '';
    MONTH_NAMES.forEach((name, i) => {
      rows += `<tr>
        <td>${name}</td>
        <td class="col-hours">${_formatHours(monthTotals[i])}</td>
      </tr>`;
    });

    container.innerHTML = `
      <table class="time-table">
        <thead>
          <tr>
            <th>Monat</th>
            <th class="col-hours">Std.</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td><strong>Gesamt ${year}</strong></td>
            <td class="col-hours"><strong>${_formatHours(yearTotal)}</strong></td>
          </tr>
        </tfoot>
      </table>`;
  }

  /**
   * Rendert den Monatskalender zur Tag-Auswahl in den Container.
   * Wochenenden und Tage mit vorhandenen Einträgen werden visuell markiert.
   * @param {HTMLElement} container    - Ziel-Element
   * @param {number}      year         - Anzuzeigendes Jahr
   * @param {number}      month        - Anzuzeigender Monat (1–12)
   * @param {string}      selectedDate - Aktuell gewähltes Datum (YYYY-MM-DD)
   * @param {Function}    onDayTap     - Callback(dateStr: string) bei Tag-Auswahl
   */
  function renderDayPicker(container, year, month, selectedDate, onDayTap) {
    const firstDay    = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today       = _todayStr();

    // Europäischer Wochenstart: Montag = 0, Sonntag = 6
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    // Tage mit Einträgen ermitteln
    const entries    = Storage.getEntriesForMonth(year, month);
    const entryDates = new Set(entries.filter(e => e.hours > 0).map(e => e.date));

    let cells = '';
    for (let i = 0; i < startOffset; i++) {
      cells += '<div class="dc dc--empty"></div>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr   = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const date      = new Date(year, month - 1, d);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      let cls = 'dc';
      if (dateStr === selectedDate) cls += ' dc--selected';
      if (dateStr === today)        cls += ' dc--today';
      if (isWeekend)                cls += ' dc--weekend';
      if (entryDates.has(dateStr))  cls += ' dc--has-entry';

      cells += `<div class="${cls}" data-date="${dateStr}">${d}</div>`;
    }

    container.innerHTML = `
      <div class="day-picker">
        <div class="day-picker-wd">
          <span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span>
        </div>
        <div class="day-picker-grid">${cells}</div>
      </div>`;

    container.querySelectorAll('.dc[data-date]').forEach(cell => {
      cell.addEventListener('click', () => onDayTap(cell.dataset.date));
    });
  }

  // ── public API ────────────────────────────────────────────────────────────
  return { renderDayPicker, renderMonth, renderYear };
})();
