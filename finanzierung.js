// Finanzierung: Immobilienkredite erfassen und Restschuld, Zins-/Tilgungsanteil und Laufzeit berechnen.
// Gespeichert wird im Blatt "Finanzierung" der Tabelle (eine Zeile pro Darlehen).
(function () {
  const ARTEN = [
    { name: 'Annuitätendarlehen', typ: 'annuitaet', info: 'Gleichbleibende Rate, der Zinsanteil sinkt, der Tilgungsanteil steigt.' },
    { name: 'KfW-Förderdarlehen', typ: 'annuitaet', info: 'Wie ein Annuitätendarlehen, oft mit tilgungsfreien Anlaufjahren.' },
    { name: 'Tilgungsdarlehen', typ: 'tilgung', info: 'Gleichbleibende Tilgung, die Rate sinkt mit der Zeit.' },
    { name: 'Endfälliges Darlehen', typ: 'endfaellig', info: 'Nur Zinsen, die ganze Summe wird am Ende (z. B. über einen Sparvertrag) zurückgezahlt.' },
    { name: 'Bauspardarlehen', typ: 'annuitaet', info: 'Darlehen aus einem Bausparvertrag, gleichbleibende Rate.' },
    { name: 'Forward-Darlehen', typ: 'annuitaet', info: 'Anschlussfinanzierung, die erst zu einem späteren Datum beginnt.' },
    { name: 'Privatdarlehen / Sonstiges', typ: 'annuitaet', info: '' }
  ];
  const typ = d => (ARTEN.find(a => a.name === d.art) || ARTEN[0]).typ;

  const euro = (n, nk) => Number(n).toLocaleString('de-DE', { minimumFractionDigits: nk === false ? 0 : 2, maximumFractionDigits: nk === false ? 0 : 2 }) + ' €';
  const pz = n => Number(n).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' %';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const zahl = v => { const n = Number(String(v || '').replace(/\s|€|%/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
  const MONATE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const monatText = idx => MONATE[((idx % 12) + 12) % 12] + ' ' + Math.floor(idx / 12);
  // "JJJJ-MM" (so speichert die App) oder eine Datumszahl der Tabelle (Tage seit 30.12.1899), falls direkt dort eingetippt
  const monatIndex = s => {
    const t = String(s === undefined || s === null ? '' : s).trim();
    const m = /^(\d{4})-(\d{1,2})/.exec(t);
    if (m) return Number(m[1]) * 12 + Number(m[2]) - 1;
    if (/^\d{4,6}(\.\d+)?$/.test(t)) { const d = new Date(Date.UTC(1899, 11, 30) + Number(t) * 86400000); return d.getUTCFullYear() * 12 + d.getUTCMonth(); }
    return null;
  };

  // Monatsrate: eingetragen, sonst aus Zins + anfänglicher Tilgung berechnet.
  function rateVon(d) {
    if (d.rate > 0) return d.rate;
    if (typ(d) === 'endfaellig') return d.summe * d.zins / 100 / 12;
    if (typ(d) === 'tilgung') return d.summe * (d.zins + d.tilgung) / 100 / 12;
    return d.summe * (d.zins + d.tilgung) / 100 / 12;
  }

  // Monatlicher Tilgungsplan bis zur Rückzahlung (max. 60 Jahre).
  function plan(d) {
    const r = d.zins / 100 / 12, rate = rateVon(d), t = typ(d);
    const tilgFix = t === 'tilgung' ? (d.tilgung > 0 ? d.summe * d.tilgung / 100 / 12 : Math.max(0, rate - d.summe * r)) : 0;
    const zeilen = [];
    let rest = d.summe;
    for (let i = 0; i < 720 && rest > 0.005; i++) {
      const zins = rest * r;
      let tilg;
      if (t === 'endfaellig') tilg = (d.bindung > 0 && i === d.bindung * 12 - 1) ? rest : 0;
      else if (t === 'tilgung') tilg = Math.min(rest, tilgFix);
      else tilg = Math.min(rest, rate - zins);
      if (tilg <= 0 && t !== 'endfaellig') return { zeilen, rate, deckt: false };
      rest -= tilg;
      zeilen.push({ zins, tilg, rest });
      if (t === 'endfaellig' && !(d.bindung > 0) && i >= 359) break;
    }
    return { zeilen, rate, deckt: true };
  }

  function auswertung(d) {
    const p = plan(d), start = monatIndex(d.beginn), heute = new Date();
    const jetzt = heute.getFullYear() * 12 + heute.getMonth();
    // bezahlte Raten: Monate seit Beginn (die Rate des laufenden Monats zählt erst ab dem nächsten)
    const bezahlt = start === null ? 0 : Math.max(0, Math.min(p.zeilen.length, jetzt - start));
    const bisher = p.zeilen.slice(0, bezahlt);
    const startetNoch = start !== null && start > jetzt;
    // Noch nicht begonnene Darlehen (z. B. Forward) zählen heute nicht als Schuld
    const restHeute = startetNoch ? 0 : (bezahlt ? bisher[bezahlt - 1].rest : d.summe);
    const naechste = p.zeilen[bezahlt] || null;
    const bindEnde = d.bindung > 0 ? Math.min(p.zeilen.length, d.bindung * 12) : 0;
    const restBindung = bindEnde ? p.zeilen[bindEnde - 1].rest : null;
    const fertig = p.deckt && p.zeilen.length && p.zeilen[p.zeilen.length - 1].rest <= 0.005;
    return {
      rate: p.rate, deckt: p.deckt,
      rateAktuell: naechste && typ(d) === 'tilgung' ? naechste.zins + naechste.tilg : p.rate, restHeute, getilgt: startetNoch ? 0 : d.summe - restHeute,
      zinsenBisher: bisher.reduce((s, z) => s + z.zins, 0),
      zinsenGesamt: p.zeilen.reduce((s, z) => s + z.zins, 0),
      naechste, restBindung,
      bindungEnde: start !== null && d.bindung > 0 ? start + d.bindung * 12 - 1 : null,
      ende: start !== null && fertig ? start + p.zeilen.length - 1 : null,
      laufzeit: fertig ? p.zeilen.length : null,
      startetNoch
    };
  }

  function immobilien(liste) {
    const g = [];
    liste.forEach(d => {
      let i = g.find(x => x.name === d.immobilie);
      if (!i) { i = { name: d.immobilie, kaufpreis: d.kaufpreis, eigenkapital: d.eigenkapital, darlehen: [] }; g.push(i); }
      i.darlehen.push(d);
    });
    return g;
  }

  const zeile = (k, v, extra) => '<div class="fzeile' + (extra ? ' ' + extra : '') + '"><span class="sub">' + k + '</span><span>' + v + '</span></div>';
  const jahreText = m => { const j = Math.floor(m / 12), r = m % 12; return j + ' Jahre' + (r ? ' ' + r + ' Mon.' : ''); };

  function darlehenHtml(d) {
    const a = auswertung(d);
    const anteil = d.summe > 0 ? Math.min(100, a.getilgt / d.summe * 100) : 0;
    let h = '<div class="darlehen"><div class="vkopf"><span class="vname"><b>' + esc(d.art || 'Darlehen') + '</b>' + (d.bank ? ' <span class="sub">' + esc(d.bank) + '</span>' : '') + '</span>' +
      '<span class="betrag">' + euro(a.rateAktuell) + ' / Monat</span></div>';
    if (!a.deckt) h += '<div class="sub warnung">⚠ Die Rate deckt die Zinsen nicht. Bitte Rate oder Tilgung prüfen.</div>';
    h += '<div class="fortschritt"><div class="balken" style="width:' + Math.max(anteil > 0 ? 1.5 : 0, anteil) + '%;background:var(--viz-spar)"></div></div>' +
      '<div class="sub vwerte">' + pz(anteil) + ' getilgt' + (a.startetNoch ? ' · beginnt ' + monatText(monatIndex(d.beginn)) : '') + '</div>';
    h += '<div class="fraster">' +
      zeile('Darlehenssumme', euro(d.summe, false)) +
      zeile('Restschuld heute', '<b>' + euro(a.restHeute, false) + '</b>') +
      zeile('Sollzins', pz(d.zins)) +
      zeile(typ(d) === 'endfaellig' ? 'Tilgung' : 'Anfängliche Tilgung', typ(d) === 'endfaellig' ? 'am Ende' : (d.rate > 0 && d.summe ? pz(Math.max(0, a.rate * 12 / d.summe * 100 - d.zins)) : (d.tilgung ? pz(d.tilgung) : '–'))) +
      (a.naechste ? zeile('Nächste Rate', euro(a.naechste.zins) + ' Zins + ' + euro(a.naechste.tilg) + ' Tilgung', 'breit') : '') +
      (a.bindungEnde !== null ? zeile('Zinsbindung bis', monatText(a.bindungEnde)) + zeile('Restschuld dann', a.deckt && a.restBindung !== null ? euro(a.restBindung, false) : '–') : '') +
      zeile('Bisher gezahlte Zinsen', euro(a.zinsenBisher, false)) +
      zeile('Zinsen gesamt', a.laufzeit ? euro(a.zinsenGesamt, false) : '–') +
      zeile('Abbezahlt', a.ende !== null ? monatText(a.ende) + ' <span class="sub">(' + jahreText(a.laufzeit) + ')</span>' : (typ(d) === 'endfaellig' ? 'am Laufzeitende' : '–'), 'breit') +
      (d.sonder ? zeile('Sondertilgung erlaubt', pz(d.sonder) + ' pro Jahr = ' + euro(d.summe * d.sonder / 100, false)) : '') +
      '</div>';
    if (a.startetNoch) h += '<div class="sub">Zählt erst ab ' + monatText(monatIndex(d.beginn)) + ' zur Restschuld. Hinweis: Das Darlehen, das es ablöst, wird bis zur vollständigen Rückzahlung weitergerechnet. Im Tilgungsplan der Tabelle stehen ab dann beide.</div>';
    if (d.notiz) h += '<div class="sub">' + esc(d.notiz) + '</div>';
    h += '<div class="faktionen"><button class="undo" data-bearbeiten="' + esc(d.id) + '">Bearbeiten</button>' +
      '<button class="undo" data-loeschen="' + esc(d.id) + '">Löschen</button></div></div>';
    return h;
  }

  function ansicht(liste) {
    if (!liste.length) {
      return '<div class="card"><h2>Noch keine Finanzierung eingetragen</h2>' +
        '<div class="sub">Trage hier bestehende Immobilienkredite ein. Die App berechnet Restschuld, Zins- und Tilgungsanteil und wann der Kredit abbezahlt ist.</div>' +
        '<button class="haupt" id="finNeu">Darlehen eintragen</button></div>';
    }
    const ims = immobilien(liste);
    const ausw = liste.map(auswertung);
    const sum = f => ims.reduce((s, i) => s + f(i), 0);
    const fk = liste.reduce((s, d, i) => s + (ausw[i].startetNoch ? 0 : d.summe), 0), spaeter = liste.reduce((s, d, i) => s + (ausw[i].startetNoch ? d.summe : 0), 0), rest = ausw.reduce((s, a) => s + a.restHeute, 0), raten = ausw.reduce((s, a) => s + (a.startetNoch || !a.naechste ? 0 : a.rateAktuell), 0);
    let h = '<div class="kacheln">' +
      '<div class="kachel"><div class="sub">Restschuld heute</div><div class="wert">' + euro(rest, false) + '</div><div class="sub">von ' + euro(fk, false) + ' Fremdkapital' + (spaeter ? ', dazu ' + euro(spaeter, false) + ' später' : '') + '</div></div>' +
      '<div class="kachel"><div class="sub">Raten pro Monat</div><div class="wert">' + euro(raten) + '</div><div class="sub">' + liste.length + (liste.length === 1 ? ' Darlehen' : ' Darlehen') + '</div></div>' +
      '<div class="kachel"><div class="sub">Eigenkapital</div><div class="wert">' + euro(sum(i => i.eigenkapital), false) + '</div><div class="sub">eingesetzt</div></div>' +
      '<div class="kachel"><div class="sub">Bereits getilgt</div><div class="wert">' + euro(fk - rest, false) + '</div><div class="sub">' + (fk ? pz((fk - rest) / fk * 100) : '–') + '</div></div>' +
      '</div>';
    ims.forEach(i => {
      const fkI = i.darlehen.reduce((s, d) => s + d.summe, 0), gesamt = i.kaufpreis || (i.eigenkapital + fkI);
      const ekQuote = gesamt > 0 ? i.eigenkapital / gesamt * 100 : 0;
      h += '<div class="card"><h2>' + esc(i.name) + '</h2>' +
        '<div class="aufteilung"><div class="balken" style="width:' + ekQuote + '%;background:var(--viz-spar)"></div><div class="balken" style="width:' + (100 - ekQuote) + '%;background:var(--viz-fix)"></div></div>' +
        '<div class="vergleich-legende sub"><span><span class="punkt" style="background:var(--viz-spar)"></span>Eigenkapital ' + euro(i.eigenkapital, false) + ' (' + pz(ekQuote) + ')</span>' +
        '<span><span class="punkt" style="background:var(--viz-fix)"></span>Fremdkapital ' + euro(fkI, false) + '</span></div>' +
        (i.kaufpreis ? '<div class="sub">Kaufpreis inkl. Nebenkosten: ' + euro(i.kaufpreis, false) + (Math.abs(i.kaufpreis - i.eigenkapital - fkI) > 1 ? ' · Differenz zu EK + Darlehen: ' + euro(i.kaufpreis - i.eigenkapital - fkI, false) : '') + '</div>' : '') +
        i.darlehen.map(darlehenHtml).join('') + '</div>';
    });
    if (liste.length > 6) h += '<div class="sub">Im Arbeitsblatt „Immobilienfinanzierung“ der Tabelle werden die ersten 6 Darlehen berechnet.</div>';
    h += '<button class="haupt" id="finNeu">Weiteres Darlehen eintragen</button>' +
      '<button class="zweit" id="finBlatt">Arbeitsblatt in der Tabelle neu aufbauen</button>';
    return h;
  }

  function formular(d, liste) {
    const namen = immobilien(liste).map(i => i.name);
    const feld = (id, label, wert, extra) => '<label for="' + id + '">' + label + '</label><input id="' + id + '" value="' + esc(wert === 0 || wert === undefined ? '' : String(wert).replace('.', ',')) + '" ' + (extra || 'inputmode="decimal" autocomplete="off"') + '>';
    return '<div class="card"><h2>' + (d.id ? 'Darlehen bearbeiten' : 'Darlehen eintragen') + '</h2>' +
      '<label for="fImmo">Immobilie</label><input id="fImmo" list="fImmoListe" placeholder="z. B. Wohnung Hauptstraße" value="' + esc(d.immobilie || '') + '" autocomplete="off">' +
      '<datalist id="fImmoListe">' + namen.map(n => '<option value="' + esc(n) + '">').join('') + '</datalist>' +
      '<div class="zweispaltig"><div>' + feld('fKauf', 'Kaufpreis inkl. Nebenkosten (€)', d.kaufpreis) + '</div><div>' + feld('fEk', 'Eigenkapital (€)', d.eigenkapital) + '</div></div>' +
      '<div class="sub">Kaufpreis und Eigenkapital gelten für die ganze Immobilie, auch wenn sie mehrere Darlehen hat.</div>' +
      '<label for="fArt">Kreditart</label><select id="fArt">' + ARTEN.map(a => '<option' + (a.name === d.art ? ' selected' : '') + '>' + a.name + '</option>').join('') + '</select>' +
      '<div class="sub" id="fArtInfo"></div>' +
      '<label for="fBank">Bank / Kreditgeber</label><input id="fBank" value="' + esc(d.bank || '') + '" autocomplete="off">' +
      '<div class="zweispaltig"><div>' + feld('fSumme', 'Darlehenssumme (€)', d.summe) + '</div><div>' + feld('fZins', 'Sollzins (% p.a.)', d.zins) + '</div></div>' +
      '<div class="zweispaltig"><div>' + feld('fTilg', 'Anfängl. Tilgung (% p.a.)', d.tilgung) + '</div><div>' + feld('fRate', 'oder Monatsrate (€)', d.rate) + '</div></div>' +
      '<div class="sub" id="fRateInfo"></div>' +
      '<div class="zweispaltig"><div><label for="fBeginn">Erste Rate (Monat)</label><input id="fBeginn" type="month" value="' + esc(d.beginn || '') + '"></div>' +
      '<div>' + feld('fBind', 'Zinsbindung (Jahre)', d.bindung, 'inputmode="numeric" autocomplete="off"') + '</div></div>' +
      feld('fSonder', 'Sondertilgung erlaubt (% p.a., optional)', d.sonder) +
      '<label for="fNotiz">Notiz (optional)</label><input id="fNotiz" value="' + esc(d.notiz || '') + '" autocomplete="off">' +
      '<button class="haupt" id="fSpeichern">Speichern</button><button class="zweit" id="fAbbrechen">Abbrechen</button>' +
      '<div class="meldung" id="fMeldung"></div></div>';
  }

  let liste = [], dateiId = null, ziel = null, laedt = false;
  const $ = id => document.getElementById(id);
  function meldung(t, k) { const m = $('fMeldung') || $('finMeldung'); if (m) { m.textContent = t || ''; m.className = 'meldung ' + (k || ''); } }

  function zeichne() {
    ziel.innerHTML = ansicht(liste) + '<div class="meldung" id="finMeldung"></div>';
    const neu = $('finNeu'); if (neu) neu.onclick = () => bearbeite({});
    const bl = $('finBlatt');
    if (bl) bl.onclick = async () => {
      if (!confirm('Arbeitsblatt „Immobilienfinanzierung“ in deiner Tabelle neu aufbauen?\n\nDeine Darlehen bleiben erhalten. Nur was du im Arbeitsblatt selbst in gelbe Felder eingetragen hast, wird zurückgesetzt.')) return;
      bl.disabled = true; meldung('Baue das Arbeitsblatt auf …');
      try { await window.Google.finanzierungsBlatt(dateiId, true); meldung('Das Arbeitsblatt „Immobilienfinanzierung“ ist neu aufgebaut.', 'ok'); }
      catch (err) { meldung(err.message || String(err), 'fehler'); if (err instanceof window.Google.NichtAngemeldet) window.Google.anmelden(true); }
      bl.disabled = false;
    };
    ziel.querySelectorAll('[data-bearbeiten]').forEach(b => { b.onclick = () => bearbeite(Object.assign({}, liste.find(d => d.id === b.dataset.bearbeiten))); });
    ziel.querySelectorAll('[data-loeschen]').forEach(b => {
      b.onclick = async () => {
        const d = liste.find(x => x.id === b.dataset.loeschen);
        if (!confirm('Darlehen „' + (d.art || '') + (d.bank ? ' ' + d.bank : '') + '“ von „' + d.immobilie + '“ löschen?')) return;
        await speichere(liste.filter(x => x.id !== d.id), 'Gelöscht.');
      };
    });
  }

  function bearbeite(d) {
    ziel.innerHTML = formular(d, liste);
    window.scrollTo(0, 0);
    const info = () => {
      const a = ARTEN.find(x => x.name === $('fArt').value);
      $('fArtInfo').textContent = a ? a.info : '';
      const v = werte();
      const r = v.summe && (v.zins || v.tilgung || v.rate) ? rateVon(Object.assign({}, v)) : 0;
      $('fRateInfo').textContent = r ? (v.rate ? 'Rate wie eingetragen: ' : 'Berechnete Monatsrate: ') + euro(r) + ' (davon anfangs ' + euro(v.summe * v.zins / 100 / 12) + ' Zinsen)' : '';
    };
    const fImmo = $('fImmo');
    fImmo.onchange = () => {
      const i = immobilien(liste).find(x => x.name === fImmo.value.trim());
      if (i) { $('fKauf').value = i.kaufpreis ? String(i.kaufpreis).replace('.', ',') : ''; $('fEk').value = i.eigenkapital ? String(i.eigenkapital).replace('.', ',') : ''; }
    };
    ziel.querySelectorAll('input, select').forEach(e => e.addEventListener('input', info));
    info();
    $('fAbbrechen').onclick = zeichne;
    $('fSpeichern').onclick = async () => {
      const v = werte();
      if (!v.immobilie) return meldung('Bitte einen Namen für die Immobilie eintragen.', 'fehler');
      if (!(v.summe > 0)) return meldung('Bitte die Darlehenssumme eintragen.', 'fehler');
      if (!(v.zins > 0) && !(v.rate > 0) && !(v.tilgung > 0)) return meldung('Bitte den Sollzins, die Tilgung oder die Monatsrate eintragen.', 'fehler');
      if (!v.beginn) return meldung('Bitte den Monat der ersten Rate wählen.', 'fehler');
      if (typ(v) !== 'endfaellig' && !(v.tilgung > 0) && !(v.rate > 0)) return meldung('Bitte die anfängliche Tilgung oder die Monatsrate eintragen.', 'fehler');
      v.id = d.id || Date.now().toString(36);
      let neu = d.id ? liste.map(x => x.id === d.id ? v : x) : liste.concat([v]);
      // Kaufpreis und Eigenkapital gelten für alle Darlehen derselben Immobilie
      neu = neu.map(x => x.immobilie === v.immobilie ? Object.assign({}, x, { kaufpreis: v.kaufpreis, eigenkapital: v.eigenkapital }) : x);
      $('fSpeichern').disabled = true;
      await speichere(neu, 'Gespeichert.');
    };
  }

  function werte() {
    return {
      immobilie: $('fImmo').value.trim(), kaufpreis: zahl($('fKauf').value), eigenkapital: zahl($('fEk').value),
      art: $('fArt').value, bank: $('fBank').value.trim(), summe: zahl($('fSumme').value), zins: zahl($('fZins').value),
      tilgung: zahl($('fTilg').value), rate: zahl($('fRate').value), beginn: $('fBeginn').value,
      bindung: zahl($('fBind').value), sonder: zahl($('fSonder').value), notiz: $('fNotiz').value.trim()
    };
  }

  async function speichere(neu, text) {
    meldung('Speichere …');
    try {
      await window.Google.finanzierungSpeichern(dateiId, neu);
      liste = neu;
      // Arbeitsblatt "Immobilienfinanzierung" beim ersten Speichern anlegen (rechnet danach selbst mit)
      try { if (await window.Google.finanzierungsBlatt(dateiId, false)) text += ' Das Arbeitsblatt „Immobilienfinanzierung“ wurde in deiner Tabelle angelegt.'; }
      catch (err) { console.warn('Arbeitsblatt nicht angelegt', err); }
      zeichne();
      meldung(text, 'ok');
    } catch (err) {
      const b = $('fSpeichern'); if (b) b.disabled = false;
      meldung(err.message || String(err), 'fehler');
      if (err instanceof window.Google.NichtAngemeldet) window.Google.anmelden(true);
    }
  }

  window.Finanzierung = {
    async zeige(container, id) {
      ziel = container;
      if (id !== dateiId) { liste = []; dateiId = id; }
      if (!navigator.onLine) { ziel.innerHTML = '<div class="card"><div class="sub">Die Finanzierung braucht eine Internetverbindung.</div></div>'; return; }
      if (laedt) return;
      laedt = true;
      ziel.innerHTML = '<div class="card"><div class="sub">Lade Finanzierung …</div></div>';
      try { liste = await window.Google.finanzierungLaden(id); zeichne(); }
      catch (err) {
        ziel.innerHTML = '<div class="card"><div class="meldung fehler">' + esc(err.message || String(err)) + '</div></div>';
        if (err instanceof window.Google.NichtAngemeldet) window.Google.anmelden(true);
      } finally { laedt = false; }
    },
    _test: { auswertung, plan, rateVon, ansicht, formular }
  };
})();
