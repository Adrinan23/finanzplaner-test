// Block "Immobilien" im Blatt "Ersparnisse - Rücklagen": je Kredit aus dem Blatt "Finanzierung" eine Zeile
// mit echter Ersparnis (Tilgungskonto beim endfälligen Darlehen) bzw. gedachter Ersparnis (getilgter Teil beim
// Annuitätendarlehen). Alles Formeln, rechnet also mit dem aktuellen Monat weiter. Spalten wie die Sparziele (B-I),
// dazu J (Zinsen pro Monat) und K (Restschuld).
(function (global) {
  const MARKE = 'Immobilien: Ersparnis und gedachte Ersparnis';
  const MAX = 6;
  const KOPF = ['Kredit', 'Art der Ersparnis', 'Monatliche Sparrate', 'Aktueller Stand', 'Zielbestand (Kreditsumme)', 'Fortschritt',
    'Verbleibende Monate', 'Kommentare', 'Zinsen pro Monat (Kosten)', 'Restschuld heute'];

  // z0: Zeile der Überschrift; gesamt: Zeile "Gesamtsumme" der Sparziele (oder 0)
  function zellen(z0, gesamt) {
    const z = [];
    const setz = (a1, inhalt, extra) => z.push(Object.assign(typeof inhalt === 'string' && inhalt.charAt(0) === '=' ? { a1, f: inhalt } : { a1, v: inhalt }, extra || {}));
    setz('B' + z0, MARKE, { fett: true });
    setz('B' + (z0 + 1), 'Wird automatisch aus dem Blatt „Finanzierung“ berechnet (Eingabe in der App unter „Immobilien“). Gedachte Ersparnis = der schon getilgte Teil des Kredits.', { grau: true });
    const kz = z0 + 2;
    KOPF.forEach((t, i) => setz(String.fromCharCode(66 + i) + kz, t, { kopf: true }));
    const JETZT = '(YEAR(TODAY())*12+MONTH(TODAY())-1)';
    const idx = c => 'IF(ISNUMBER(' + c + '),YEAR(' + c + ')*12+MONTH(' + c + ')-1,VALUE(LEFT(' + c + ',4))*12+VALUE(MID(' + c + ',6,2))-1)';
    for (let k = 0; k < MAX; k++) {
      const r = kz + 1 + k, fz = k + 2, F = c => "'Finanzierung'!" + c + fz;
      const leer = F('A') + '=""';
      const endf = F('D') + '="Endfälliges Darlehen"';
      const zr = '(' + F('G') + '/1200)', rate = 'IF(' + F('I') + '>0,' + F('I') + ',' + F('F') + '*(' + F('G') + '+' + F('H') + ')/1200)';
      const start = idx(F('J')), kk = 'MAX(0,' + JETZT + '-' + start + ')';
      const rest = 'MAX(0,-FV(' + zr + ',' + kk + ',-' + rate + ',' + F('F') + '))';
      const sz = '(' + F('R') + '/1200)', stand = 'IF(' + F('P') + '="",' + JETZT + ',' + idx(F('P')) + ')';
      const konto = n => 'FV(' + sz + ',MAX(0,' + n + '),-' + F('Q') + ',-' + F('O') + ')';
      const ende = '(' + start + '+' + F('K') + '*12-1)';
      const kontoEnde = konto(ende + '-' + stand);
      const vorbei = JETZT + '>' + ende;
      const w = (a, b) => '=IF(' + leer + ',"",IF(' + endf + ',' + a + ',' + b + '))';
      setz('B' + r, '=IF(' + leer + ',"",' + F('A') + '&" · "&' + F('D') + ')');
      setz('C' + r, w('"Tilgungskonto (echte Ersparnis)"', '"Getilgt (gedachte Ersparnis)"'));
      setz('D' + r, w('IF(' + vorbei + ',0,' + F('Q') + ')', 'IF(' + JETZT + '<' + start + ',0,MIN(' + rest + ',' + rate + '-' + rest + '*' + zr + '))'));
      setz('E' + r, w(konto(JETZT + '-' + stand), F('F') + '-' + rest));
      setz('F' + r, '=IF(' + leer + ',"",' + F('F') + ')');
      setz('G' + r, '=IF(OR(' + leer + ',N(F' + r + ')=0),"",E' + r + '/F' + r + ')');
      setz('H' + r, w('MAX(0,' + ende + '-' + JETZT + ')',
        'IF(' + rest + '=0,0,ROUNDUP(ROUND(IF(' + zr + '=0,' + rest + '/' + rate + ',NPER(' + zr + ',-' + rate + ',' + rest + ')),6),0))'));
      setz('I' + r, w('IF(N(' + F('K') + ')=0,"Laufzeit fehlt",IF(' + kontoEnde + '>=' + F('F') + '-1,"Tilgungskonto reicht voraussichtlich","Tilgungskonto reicht voraussichtlich nicht"))',
        'IF(' + rate + '<=' + F('F') + '*' + zr + ',"Rate deckt die Zinsen nicht","")'));
      setz('J' + r, w('IF(' + vorbei + ',0,' + F('F') + '*' + zr + ')', 'IF(' + JETZT + '<' + start + ',0,' + rest + '*' + zr + ')'));
      setz('K' + r, w('IF(' + vorbei + ',0,' + F('F') + ')', 'IF(' + JETZT + '<' + start + ',0,' + rest + ')'));
    }
    const s = kz + MAX + 1, von = kz + 1, bis = kz + MAX;
    setz('B' + s, 'Summe Immobilien', { fett: true });
    ['D', 'E', 'F', 'J', 'K'].forEach(c => setz(c + s, '=SUM(' + c + von + ':' + c + bis + ')', { fett: true }));
    setz('G' + s, '=IF(F' + s + '>0,E' + s + '/F' + s + ',"")', { fett: true });
    if (gesamt) {
      setz('B' + (s + 1), 'Alle Ersparnisse inkl. Immobilien', { fett: true });
      setz('D' + (s + 1), '=N(D' + gesamt + ')+D' + s, { fett: true });
      setz('E' + (s + 1), '=N(E' + gesamt + ')+E' + s, { fett: true });
    }
    return z;
  }

  // Block in der Monatsübersicht (unter "MONATLICHE GESAMT-KONSOLIDIERUNG"): je Monat die Ersparnis aus den Krediten
  // (Tilgung bzw. Sparrate aufs Tilgungskonto), fortlaufend im Jahr, und die Zinsen. Zählt nicht in den Saldo.
  // z0: erste Zeile, jan: Spalte Januar (1 = A), datum: Zeile mit den Monatsdaten, spar: Zwischensumme Sparbeiträge (oder 0)
  const MARKE_MONAT = 'IMMOBILIEN: ERSPARNIS UND GEDACHTE ERSPARNIS';
  const sp = n => String.fromCharCode(64 + n);
  function monatsZellen(z0, jan, datum, spar) {
    const z = [];
    const setz = (a1, inhalt, extra) => z.push(Object.assign(typeof inhalt === 'string' && inhalt.charAt(0) === '=' ? { a1, f: inhalt } : { a1, v: inhalt }, extra || {}));
    const idx = c => 'IF(ISNUMBER(' + c + '),YEAR(' + c + ')*12+MONTH(' + c + ')-1,VALUE(LEFT(' + c + ',4))*12+VALUE(MID(' + c + ',6,2))-1)';
    const monate = [];
    for (let i = 0; i < 12; i++) monate.push(sp(jan + i));
    const ges = sp(jan + 12);
    const R = { kopf: z0, k1: z0 + 1, summe: z0 + MAX + 1, lauf: z0 + MAX + 2, zins: z0 + MAX + 3, alle: z0 + MAX + 4, alleLauf: z0 + MAX + 5, hz1: z0 + MAX + 6 };
    setz('B' + R.kopf, MARKE_MONAT, { kapitel: true });
    setz('C' + R.kopf, 'Nur zur Info, zählt nicht im Saldo. Wird aus dem Blatt „Finanzierung“ berechnet.', { kapitel: true });
    for (let k = 0; k < MAX; k++) {
      const r = R.k1 + k, h = R.hz1 + k, fz = k + 2, F = c => "'Finanzierung'!" + c + fz;
      const leer = F('A') + '=""', endf = F('D') + '="Endfälliges Darlehen"';
      const zr = '(' + F('G') + '/1200)', rate = 'IF(' + F('I') + '>0,' + F('I') + ',' + F('F') + '*(' + F('G') + '+' + F('H') + ')/1200)';
      const start = idx(F('J')), ende = '(' + start + '+N(' + F('K') + ')*12-1)';
      setz('B' + r, '=IF(' + leer + ',"","Immobilie")');
      setz('C' + r, '=IF(' + leer + ',"",' + F('A') + '&" · "&' + F('D') + ')');
      setz('D' + r, '=IF(' + leer + ',"",IF(' + endf + ',"Sparrate Tilgungskonto","Tilgung (gedachte Ersparnis)"))');
      monate.forEach(X => {
        const M = '(YEAR(' + X + '$' + datum + ')*12+MONTH(' + X + '$' + datum + ')-1)', kk = '(' + M + '-' + start + ')';
        const rest = 'MAX(0,-FV(' + zr + ',' + kk + ',-' + rate + ',' + F('F') + '))';
        const laeuft = 'AND(' + M + '>=' + start + ',' + M + '<=' + ende + ')';
        setz(X + r, '=IF(' + leer + ',"",IF(' + endf + ',IF(' + laeuft + ',' + F('Q') + ',0),IF(' + kk + '<0,0,IF(' + rest + '=0,0,MIN(' + rest + ',' + rate + '-' + rest + '*' + zr + ')))))');
        setz(X + h, '=IF(' + leer + ',"",IF(' + endf + ',IF(' + laeuft + ',' + F('F') + '*' + zr + ',0),IF(' + kk + '<0,0,' + rest + '*' + zr + ')))');
      });
      setz(ges + r, '=IF(' + leer + ',"",SUM(' + monate[0] + r + ':' + monate[11] + r + '))');
      setz('B' + h, 'Hilfszeile Zinsen', { grau: true });
    }
    setz('B' + R.summe, 'Zwischensumme'); setz('C' + R.summe, 'ERSPARNIS IMMOBILIEN (MONAT)');
    setz('B' + R.lauf, 'Fortlaufend'); setz('C' + R.lauf, 'Ersparnis Immobilien seit Januar', { fett: true });
    setz('B' + R.zins, 'Kosten'); setz('C' + R.zins, 'Zinsen Immobilien');
    if (spar) { setz('B' + R.alle, 'Gesamt'); setz('C' + R.alle, 'Alle Sparbeiträge inkl. Immobilien'); setz('B' + R.alleLauf, 'Fortlaufend'); setz('C' + R.alleLauf, 'Alle Sparbeiträge seit Januar', { fett: true }); }
    monate.concat([ges]).forEach((X, i) => {
      const zeile = r => '=SUM(' + monate[0] + r + ':' + monate[11] + r + ')';
      setz(X + R.summe, i < 12 ? '=SUM(' + X + R.k1 + ':' + X + (R.k1 + MAX - 1) + ')' : zeile(R.summe));
      setz(X + R.zins, i < 12 ? '=SUM(' + X + R.hz1 + ':' + X + (R.hz1 + MAX - 1) + ')' : zeile(R.zins));
      if (spar) setz(X + R.alle, '=N(' + X + spar + ')+' + X + R.summe);
      if (i < 12) {
        setz(X + R.lauf, '=SUM($' + monate[0] + R.summe + ':' + X + R.summe + ')', { fett: true });
        if (spar) setz(X + R.alleLauf, '=SUM($' + monate[0] + R.alle + ':' + X + R.alle + ')', { fett: true });
      }
    });
    return { zellen: z, R, letzte: R.hz1 + MAX - 1 };
  }

  global.ErsparnisBlock = { MARKE, MAX, KOPF, zellen, ZEILEN: 2 + 1 + MAX + 2, MARKE_MONAT, monatsZellen };
})(typeof window !== 'undefined' ? window : globalThis);
