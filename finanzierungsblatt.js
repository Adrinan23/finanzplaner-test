// Aufbau des Arbeitsblatts "Immobilienfinanzierung" in der Google-Tabelle.
// Alle Werte sind Formeln auf das Blatt "Finanzierung" (das die App unter "Kredite" fuellt),
// rechnen also in der Tabelle mit, auch wenn dort direkt etwas geaendert wird.
// Formeln ohne Dezimalzahlen, damit sie in jeder Tabellensprache gleich gelesen werden.
(function (global) {
  const D = 'Finanzierung';          // Datenblatt der App
  const MAX = 6;                     // Darlehen nebeneinander (Spalten B-G)
  const SP = ['B', 'C', 'D', 'E', 'F', 'G'];
  const JAHRE = 40;

  // Zeilen
  const Z = {
    titel: 1, hinweis: 2,
    k1: 4, kopf1: 5, immo: 6, art: 7, bank: 8, summe: 9, zins: 10, tilg: 11, rate: 12, beginn: 13, bind: 14, bindEnde: 15,
    restHeute: 16, restBind: 17, ende: 18, laufzeit: 19, zinsenGes: 20, sonder: 21,
    kHilf: 23, typ: 24, start: 25, r: 26, t: 27, n: 28, k: 29, ueber: 30, startJahr: 31,
    k2: 33, neuZins: 34, neuRate: 35, neuLz: 36, neuZinsen: 37,
    k3: 39, kauf: 40, grest: 41, notar: 42, makler: 43, nk: 44, gesamt: 45, ekEmpf: 46,
    k4: 48, kopf4: 49, plan: 50,
    k5: 92, hin5: 93, nutzung: 94, wert: 95, wertOhne: 96, ek: 97, kredit: 98, ekQuote: 99, sZins: 100, sTilg: 101, sLz: 102, sRate: 103,
    zeitraum: 104, kosten: 105, wertPlus: 106, kOpt: 107, miete: 108, mietPlus: 109, alt: 110, altSteuer: 111, ausfall: 112,
    afa: 113, steuer: 114, hilf5: 115, kopf5: 116, s5: 117,
    eK: 158, eJahre: 159, eRest: 160, eZinsen: 161, eWert: 162, eKauf: 163, eAlt: 164, eVorteil: 165, eHinweis: 166
  };

  // Restschuld nach k Raten fuer das Darlehen in Spalte c (k ist ein Formelausdruck)
  function rest(c, k) {
    const a = 'MAX(0,-FV(' + c + '$' + Z.r + ',' + k + ',-' + c + '$' + Z.rate + ',' + c + '$' + Z.summe + '))';
    const t = 'MAX(0,' + c + '$' + Z.summe + '-' + c + '$' + Z.t + '*(' + k + '))';
    const e = 'IF((' + k + ')>=' + c + '$' + Z.n + ',0,' + c + '$' + Z.summe + ')';
    return 'IF(' + c + '$' + Z.typ + '="t",' + t + ',IF(' + c + '$' + Z.typ + '="e",' + e + ',' + a + '))';
  }

  function zellen() {
    const z = [];   // { a1, v (Zahl/Text) | f (Formel), fmt, fett, farbe }
    const setz = (a1, inhalt, opt) => z.push(Object.assign({ a1: a1 }, typeof inhalt === 'string' && inhalt.charAt(0) === '=' ? { f: inhalt } : { v: inhalt }, opt || {}));
    const EUR = '#,##0.00 "€"', EUR0 = '#,##0 "€"', PZ = '0.00" %"', MON = 'mmm yyyy', ZAHL = '0', JAHR1 = '0.0" J."';

    setz('A' + Z.titel, 'Immobilienfinanzierung', { fett: true, gross: true });
    setz('A' + Z.hinweis, 'Die Darlehen kommen aus dem Blatt „Finanzierung“ (in der App unter „Kredite“ eintragen). Gelbe Felder kannst du hier selbst ändern, alles andere rechnet automatisch.', { grau: true });

    // ---- 1. Darlehen im Ueberblick ----
    setz('A' + Z.k1, '1. Darlehen im Überblick', { fett: true, kapitel: true });
    setz('A' + Z.kopf1, '', { fett: true });
    SP.forEach((c, i) => setz(c + Z.kopf1, 'Darlehen ' + (i + 1), { fett: true, kopf: true }));
    setz('H' + Z.kopf1, 'Gesamt', { fett: true, kopf: true });
    const beschr = [
      [Z.immo, 'Immobilie'], [Z.art, 'Kreditart'], [Z.bank, 'Bank'], [Z.summe, 'Darlehenssumme'], [Z.zins, 'Sollzins p.a.'],
      [Z.tilg, 'Anfängliche Tilgung p.a.'], [Z.rate, 'Monatsrate (anfangs)'], [Z.beginn, 'Erste Rate'], [Z.bind, 'Zinsbindung (Jahre)'],
      [Z.bindEnde, 'Zinsbindung endet'], [Z.restHeute, 'Restschuld heute'], [Z.restBind, 'Restschuld Ende Zinsbindung'],
      [Z.ende, 'Abbezahlt (letzte Rate)'], [Z.laufzeit, 'Gesamtlaufzeit'], [Z.zinsenGes, 'Zinsen über die ganze Laufzeit'], [Z.sonder, 'Sondertilgung erlaubt pro Jahr']
    ];
    beschr.forEach(([r, t]) => setz('A' + r, t));

    SP.forEach((c, i) => {
      const d = i + 2, F = col => D + '!' + col + d, leer = c + '$' + Z.summe + '=""';
      const wenn = (f) => '=IF(' + leer + ',"",IFERROR(' + f + ',""))';
      setz(c + Z.immo, '=IF(' + F('A') + '="","",' + F('A') + ')');
      setz(c + Z.art, '=IF(' + F('A') + '="","",' + F('D') + ')');
      setz(c + Z.bank, '=IF(' + F('A') + '="","",' + F('E') + ')');
      setz(c + Z.summe, '=IF(OR(' + F('A') + '="",N(' + F('F') + ')=0),"",' + F('F') + ')', { fmt: EUR0 });
      setz(c + Z.zins, wenn(F('G')), { fmt: PZ });
      setz(c + Z.tilg, wenn('IF(' + c + '$' + Z.typ + '="e","am Ende",IF(AND(N(' + F('H') + ')>0,N(' + F('I') + ')=0),' + F('H') + ',(' + c + '$' + Z.rate + '*12/' + c + '$' + Z.summe + ')*100-' + F('G') + '))'), { fmt: PZ });
      setz(c + Z.rate, wenn('IF(N(' + F('I') + ')>0,' + F('I') + ',' + c + '$' + Z.summe + '*(' + F('G') + '+IF(' + c + '$' + Z.typ + '="e",0,N(' + F('H') + ')))/1200)'), { fmt: EUR });
      setz(c + Z.beginn, wenn('DATE(INT(' + c + '$' + Z.start + '/12),MOD(' + c + '$' + Z.start + ',12)+1,1)'), { fmt: MON });
      setz(c + Z.bind, wenn('IF(N(' + F('K') + ')>0,' + F('K') + ',"")'), { fmt: ZAHL });
      setz(c + Z.bindEnde, wenn('IF(N(' + F('K') + ')>0,EDATE(' + c + '$' + Z.beginn + ',' + F('K') + '*12-1),"")'), { fmt: MON });
      setz(c + Z.restHeute, wenn('IF(' + c + '$' + Z.start + '>(YEAR(TODAY())*12+MONTH(TODAY())-1),0,' + rest(c, c + '$' + Z.k) + ')'), { fmt: EUR0 });
      setz(c + Z.restBind, wenn('IF(N(' + F('K') + ')>0,' + rest(c, 'MIN(' + c + '$' + Z.n + ',' + F('K') + '*12)') + ',"")'), { fmt: EUR0 });
      const offen = 'AND(' + c + '$' + Z.typ + '="e",N(' + F('K') + ')=0)';  // endfaellig ohne Zinsbindung: Ende unbekannt
      setz(c + Z.ende, wenn('IF(' + offen + ',"",EDATE(' + c + '$' + Z.beginn + ',' + c + '$' + Z.n + '-1))'), { fmt: MON });
      setz(c + Z.laufzeit, wenn('IF(' + offen + ',"",' + c + '$' + Z.n + '/12)'), { fmt: JAHR1 });
      setz(c + Z.zinsenGes, wenn('IF(' + offen + ',"",IF(' + c + '$' + Z.typ + '="t",' + c + '$' + Z.r + '*(' + c + '$' + Z.n + '*' + c + '$' + Z.summe + '-' + c + '$' + Z.t + '*' + c + '$' + Z.n + '*(' + c + '$' + Z.n + '-1)/2),' +
        'IF(' + c + '$' + Z.typ + '="e",' + c + '$' + Z.summe + '*' + c + '$' + Z.r + '*' + c + '$' + Z.n + ',' + c + '$' + Z.rate + '*' + c + '$' + Z.n + '-' + c + '$' + Z.ueber + '-' + c + '$' + Z.summe + ')))'), { fmt: EUR0 });
      setz(c + Z.sonder, wenn('IF(N(' + F('L') + ')>0,' + c + '$' + Z.summe + '*' + F('L') + '/100,"")'), { fmt: EUR0 });

      // Hilfswerte
      setz(c + Z.typ, wenn('IF(' + F('D') + '="Tilgungsdarlehen","t",IF(' + F('D') + '="Endfälliges Darlehen","e","a"))'));
      setz(c + Z.start, wenn('IF(ISNUMBER(' + F('J') + '),YEAR(' + F('J') + ')*12+MONTH(' + F('J') + ')-1,VALUE(LEFT(' + F('J') + ',4))*12+VALUE(MID(' + F('J') + ',6,2))-1)'), { fmt: ZAHL });
      setz(c + Z.r, wenn(F('G') + '/1200'), { fmt: '0.000000' });
      setz(c + Z.t, wenn('IF(N(' + F('H') + ')>0,' + c + '$' + Z.summe + '*' + F('H') + '/1200,MAX(0,' + c + '$' + Z.rate + '-' + c + '$' + Z.summe + '*' + c + '$' + Z.r + '))'), { fmt: EUR });
      setz(c + Z.n, wenn('IF(' + c + '$' + Z.typ + '="e",IF(N(' + F('K') + ')>0,' + F('K') + '*12,1200),IF(' + c + '$' + Z.typ + '="t",ROUNDUP(ROUND(' + c + '$' + Z.summe + '/' + c + '$' + Z.t + ',6),0),' +
        'IF(' + c + '$' + Z.r + '=0,ROUNDUP(ROUND(' + c + '$' + Z.summe + '/' + c + '$' + Z.rate + ',6),0),IF(' + c + '$' + Z.rate + '<=' + c + '$' + Z.summe + '*' + c + '$' + Z.r + ',"",ROUNDUP(ROUND(NPER(' + c + '$' + Z.r + ',-' + c + '$' + Z.rate + ',' + c + '$' + Z.summe + '),6),0)))))'), { fmt: ZAHL });
      setz(c + Z.k, wenn('MAX(0,MIN(' + c + '$' + Z.n + ',YEAR(TODAY())*12+MONTH(TODAY())-1-' + c + '$' + Z.start + '))'), { fmt: ZAHL });
      setz(c + Z.ueber, wenn('IF(' + c + '$' + Z.typ + '="a",' + c + '$' + Z.rate + '-' + rest(c, c + '$' + Z.n + '-1') + '*(1+' + c + '$' + Z.r + '),0)'), { fmt: EUR });
      setz(c + Z.startJahr, wenn('INT(' + c + '$' + Z.start + '/12)'), { fmt: ZAHL });

      // ---- 2. Anschlussfinanzierung ----
      setz(c + Z.neuZins, '=IF(OR(' + leer + ',N(' + F('K') + ')=0),"",4)', { fmt: PZ, eingabe: true });
      const restLz = '(' + c + '$' + Z.n + '-' + F('K') + '*12)', nr = c + '$' + Z.neuZins + '/1200', rb = c + '$' + Z.restBind;
      setz(c + Z.neuRate, '=IF(OR(' + leer + ',N(' + c + '$' + Z.neuZins + ')=0,N(' + rb + ')=0),"",IFERROR(IF(' + c + '$' + Z.typ + '="a",-PMT(' + nr + ',' + restLz + ',' + rb + '),IF(' + c + '$' + Z.typ + '="t",' + c + '$' + Z.t + '+0,0)+' + rb + '*' + nr + '),""))', { fmt: EUR });
      setz(c + Z.neuLz, '=IF(OR(' + leer + ',N(' + c + '$' + Z.neuZins + ')=0,N(' + rb + ')=0,' + c + '$' + Z.typ + '<>"a"),"",IFERROR(NPER(' + nr + ',-' + c + '$' + Z.rate + ',' + rb + ')/12,"Rate reicht nicht"))', { fmt: JAHR1 });
      setz(c + Z.neuZinsen, '=IF(N(' + c + '$' + Z.neuRate + ')=0,"",IF(' + c + '$' + Z.typ + '="a",' + c + '$' + Z.neuRate + '*' + restLz + '-' + rb + ',IF(' + c + '$' + Z.typ + '="t",' + nr + '*(' + restLz + '*' + rb + '-' + c + '$' + Z.t + '*' + restLz + '*(' + restLz + '-1)/2),' + c + '$' + Z.neuRate + '*' + restLz + ')))', { fmt: EUR0 });
    });
    // Gesamt-Spalte
    [Z.summe, Z.rate, Z.restHeute, Z.restBind, Z.zinsenGes, Z.sonder].forEach(r => setz('H' + r, '=SUM(B' + r + ':G' + r + ')', { fmt: r === Z.rate ? EUR : EUR0, fett: true }));
    setz('A' + Z.kHilf, 'Hilfswerte für die Berechnung', { grau: true, fett: true });
    [[Z.typ, 'Typ (a = Annuität, t = Tilgung, e = endfällig)'], [Z.start, 'Erste Rate als Monatszahl'], [Z.r, 'Zins pro Monat'], [Z.t, 'Tilgung pro Monat (Tilgungsdarlehen)'],
      [Z.n, 'Anzahl Raten bis abbezahlt'], [Z.k, 'Bisher gezahlte Raten'], [Z.ueber, 'Letzte Rate kleiner um'], [Z.startJahr, 'Jahr der ersten Rate']]
      .forEach(([r, t]) => setz('A' + r, t, { grau: true }));

    setz('A' + Z.k2, '2. Anschlussfinanzierung: Was passiert nach der Zinsbindung?', { fett: true, kapitel: true });
    setz('A' + Z.neuZins, 'Angenommener Zins danach (p.a.)');
    setz('A' + Z.neuRate, 'Neue Monatsrate (gleiches Laufzeitende)');
    setz('A' + Z.neuLz, 'Oder: Restlaufzeit mit bisheriger Rate');
    setz('A' + Z.neuZinsen, 'Zinsen nach der Zinsbindung (gleiches Ende)');

    // ---- 3. Kaufnebenkosten ----
    setz('A' + Z.k3, '3. Kaufnebenkosten-Rechner', { fett: true, kapitel: true });
    setz('C' + Z.k3, 'Satz', { fett: true, kopf: true }); setz('D' + Z.k3, 'Betrag', { fett: true, kopf: true });
    setz('A' + Z.kauf, 'Kaufpreis (ohne Nebenkosten)'); setz('D' + Z.kauf, '', { fmt: EUR0, eingabe: true });
    const nk = (r, t, satz, hinweis) => {
      setz('A' + r, t); setz('C' + r, satz, { fmt: PZ, eingabe: true }); setz('D' + r, '=IF(N($D$' + Z.kauf + ')=0,"",$D$' + Z.kauf + '*C' + r + '/100)', { fmt: EUR0 });
      if (hinweis) setz('E' + r, hinweis, { grau: true });
    };
    nk(Z.grest, 'Grunderwerbsteuer', 5, 'je Bundesland 3,5 % bis 6,5 %');
    nk(Z.notar, 'Notar und Grundbuch', 2, 'ca. 1,5 % bis 2 %');
    nk(Z.makler, 'Makler', 3.57, 'bei Kauf über Makler, oft 3,57 %');
    setz('A' + Z.nk, 'Kaufnebenkosten', { fett: true }); setz('C' + Z.nk, '=SUM(C' + Z.grest + ':C' + Z.makler + ')', { fmt: PZ, fett: true });
    setz('D' + Z.nk, '=IF(N($D$' + Z.kauf + ')=0,"",SUM(D' + Z.grest + ':D' + Z.makler + '))', { fmt: EUR0, fett: true });
    setz('A' + Z.gesamt, 'Gesamtkosten', { fett: true }); setz('D' + Z.gesamt, '=IF(N($D$' + Z.kauf + ')=0,"",D' + Z.kauf + '+D' + Z.nk + ')', { fmt: EUR0, fett: true });
    setz('A' + Z.ekEmpf, 'Empfohlenes Eigenkapital'); setz('D' + Z.ekEmpf, '=IF(N($D$' + Z.kauf + ')=0,"",D' + Z.nk + '+D' + Z.kauf + '*20/100)', { fmt: EUR0 });
    setz('E' + Z.ekEmpf, 'Faustregel: Nebenkosten + 20 % des Kaufpreises', { grau: true });

    // ---- 4. Tilgungsplan pro Jahr ----
    setz('A' + Z.k4, '4. Tilgungsplan pro Jahr', { fett: true, kapitel: true });
    const kopf = ['Jahr'].concat(SP.map((c, i) => 'Restschuld D' + (i + 1))).concat(SP.map((c, i) => 'Zinsen D' + (i + 1))).concat(['Zinsen gesamt', 'Tilgung gesamt', 'Restschuld gesamt', 'Raten gesamt']);
    const KS = ['A'].concat(SP).concat(['H', 'I', 'J', 'K', 'L', 'M']).concat(['N', 'O', 'P', 'Q']);
    kopf.forEach((t, i) => setz(KS[i] + Z.kopf4, t, { fett: true, kopf: true }));
    for (let j = 0; j < JAHRE; j++) {
      const r = Z.plan + j, Y = '$A' + r;
      setz('A' + r, j === 0 ? '=IF(COUNT($B$' + Z.start + ':$G$' + Z.start + ')=0,"",INT(MIN($B$' + Z.start + ':$G$' + Z.start + ')/12))' : '=IF(A' + (r - 1) + '="","",A' + (r - 1) + '+1)', { fmt: ZAHL, fett: true });
      SP.forEach((c, i) => {
        const ks = 'MAX(0,MIN(' + c + '$' + Z.n + ',' + Y + '*12-' + c + '$' + Z.start + '))';
        const ke = 'MAX(0,MIN(' + c + '$' + Z.n + ',' + Y + '*12+12-' + c + '$' + Z.start + '))';
        const aktiv = 'OR(' + Y + '="",' + c + '$' + Z.summe + '="",' + c + '$' + Z.n + '="",' + Y + '*12+11<' + c + '$' + Z.start + ')';
        setz(c + r, '=IF(' + aktiv + ',"",' + rest(c, ke) + ')', { fmt: EUR0 });
        const zA = '(' + ke + '-' + ks + ')*' + c + '$' + Z.rate + '-IF(AND(' + ke + '=' + c + '$' + Z.n + ',' + ke + '>' + ks + '),' + c + '$' + Z.ueber + ',0)-(' + rest(c, ks) + '-' + rest(c, ke) + ')';
        const zT = c + '$' + Z.r + '*((' + ke + '-' + ks + ')*' + c + '$' + Z.summe + '-' + c + '$' + Z.t + '*(' + ks + '+' + ke + '-1)*(' + ke + '-' + ks + ')/2)';
        const zE = c + '$' + Z.summe + '*' + c + '$' + Z.r + '*(' + ke + '-' + ks + ')';
        setz(String.fromCharCode(72 + i) + r, '=IF(' + aktiv + ',"",IF(' + c + '$' + Z.typ + '="t",' + zT + ',IF(' + c + '$' + Z.typ + '="e",' + zE + ',' + zA + ')))', { fmt: EUR0 });
      });
      setz('N' + r, '=IF(' + Y + '="","",SUM(H' + r + ':M' + r + '))', { fmt: EUR0, fett: true });
      setz('P' + r, '=IF(' + Y + '="","",SUM(B' + r + ':G' + r + '))', { fmt: EUR0, fett: true });
      setz('O' + r, '=IF(' + Y + '="","",SUMIF($B$' + Z.startJahr + ':$G$' + Z.startJahr + ',' + Y + ',$B$' + Z.summe + ':$G$' + Z.summe + ')' + (j ? '+N(P' + (r - 1) + ')' : '') + '-P' + r + ')', { fmt: EUR0, fett: true });
      setz('Q' + r, '=IF(' + Y + '="","",N' + r + '+O' + r + ')', { fmt: EUR0, fett: true });
    }

    // ---- 5. Szenario-Rechner: Kaufen und selbst wohnen (optional vermieten) ----
    // Ein Annuitaetendarlehen, alle Werte frei einstellbar (Vorgaben aus den eingetragenen Krediten), Zeitraum bis 40 Jahre.
    const B = r => '$B$' + r, S5 = Z.s5, E5 = Z.s5 + JAHRE - 1;
    setz('A' + Z.k5, '5. Szenario-Rechner: Kaufen und selbst wohnen', { fett: true, kapitel: true });
    setz('A' + Z.hin5, 'Spiel hier frei mit Werten: Laufzeit, Zins, Tilgung, Immobilienwert, Kredit und Eigenkapital. Vergleich mit Mieten und Vermietung sind optional (unterer Teil der Eingaben).', { grau: true });
    const ein = (r, t, wert, fmt, hinweis, opt) => { setz('A' + r, t); setz('B' + r, wert, Object.assign({ fmt: fmt, eingabe: true }, opt || {})); if (hinweis) setz('C' + r, hinweis, { grau: true }); };
    const aus = (r, t, f, fmt, hinweis) => { setz('A' + r, t); setz('B' + r, f, { fmt: fmt, fett: true }); if (hinweis) setz('C' + r, hinweis, { grau: true }); };
    ein(Z.nutzung, 'Nutzung', 'Eigennutzung', null, 'Eigennutzung oder Vermietung', { liste: ['Eigennutzung', 'Vermietung'] });
    ein(Z.wert, 'Immobilienwert (Kaufpreis inkl. Nebenkosten)', '=N(' + D + '!B2)', EUR0, 'Vorgabe aus deinen Krediten, frei änderbar');
    ein(Z.wertOhne, 'Kaufpreis ohne Nebenkosten', '=IF(N($D$' + Z.kauf + ')>0,$D$' + Z.kauf + ',ROUND(' + B(Z.wert) + '*100/110,-2))', EUR0, 'Basis für den Wert der Immobilie (Nebenkosten steigern den Wert nicht). Vorgabe: Teil 3, sonst Wert minus ca. 10 %');
    ein(Z.ek, 'Eigenkapital', '=N(' + D + '!C2)', EUR0);
    ein(Z.kredit, 'Kreditsumme', '=MAX(0,' + B(Z.wert) + '-' + B(Z.ek) + ')', EUR0, 'Vorgabe: Immobilienwert minus Eigenkapital');
    aus(Z.ekQuote, 'Eigenkapitalanteil', '=IFERROR(' + B(Z.ek) + '/' + B(Z.wert) + '*100,"")', PZ);
    ein(Z.sZins, 'Sollzins p.a.', '=IF(ISNUMBER($B$' + Z.zins + '),$B$' + Z.zins + ',4)', PZ);
    ein(Z.sTilg, 'Anfängliche Tilgung p.a.', '=IF(ISNUMBER($B$' + Z.tilg + '),$B$' + Z.tilg + ',2)', PZ);
    ein(Z.sLz, 'Oder: Kreditlaufzeit in Jahren', '', ZAHL, 'z. B. 10 oder 30; wenn ausgefüllt, wird die Tilgung so gewählt, dass der Kredit dann abbezahlt ist');
    aus(Z.sRate, 'Monatsrate', '=IFERROR(IF(N(' + B(Z.sLz) + ')>0,-PMT(' + B(Z.sZins) + '/1200,' + B(Z.sLz) + '*12,' + B(Z.kredit) + '),' + B(Z.kredit) + '*(' + B(Z.sZins) + '+' + B(Z.sTilg) + ')/1200),0)', EUR);
    ein(Z.zeitraum, 'Betrachtungszeitraum in Jahren', '=IF(N(' + B(Z.sLz) + ')>0,MIN(40,' + B(Z.sLz) + '),IFERROR(MIN(40,ROUNDUP($D$' + Z.hilf5 + '/12,0)),30))', ZAHL, 'Vorgabe: bis der Kredit abbezahlt ist (höchstens 40)');
    ein(Z.kosten, 'Instandhaltung und Eigentümerkosten pro Jahr', '=ROUND(' + B(Z.wertOhne) + '/100,-2)', EUR0, 'Faustregel: ca. 1 % des Kaufpreises als Rücklage, steigt jährlich wie die Mietsteigerung');
    ein(Z.wertPlus, 'Wertsteigerung der Immobilie pro Jahr', 1.5, PZ);
    setz('A' + Z.kOpt, 'Optional: Vergleich mit Mieten oder Vermietung', { fett: true, kopf: true });
    ein(Z.miete, 'Miete pro Monat (kalt)', '', EUR0, 'Eigennutzung: Miete, die du sonst zahlen würdest (für den Vergleich). Vermietung: Mieteinnahme.');
    ein(Z.mietPlus, 'Mietsteigerung pro Jahr', 2, PZ);
    ein(Z.alt, 'Zins einer alternativen Geldanlage', 4, PZ);
    ein(Z.altSteuer, 'Steuer auf Kapitalerträge', 25, PZ, 'Abgeltungsteuer, vereinfacht');
    ein(Z.ausfall, 'Nur Vermietung: Mietausfallwagnis', 2, PZ);
    ein(Z.afa, 'Nur Vermietung: Abschreibung (AfA) pro Jahr', '=' + B(Z.wert) + '*80/100*2/100', EUR0, 'Faustregel: 2 % vom Gebäudeanteil (80 %); Neubau ab 2023: 3 %, Baujahr vor 1925: 2,5 %');
    ein(Z.steuer, 'Nur Vermietung: persönlicher Steuersatz', 30, PZ);

    // Hilfswerte (ausgeblendete Zeile): Monatszins, Rate, Anzahl Raten, letzte Rate kleiner um, Vermietung ja/nein, Anlagezins netto
    const H = { r: '$B$' + Z.hilf5, R: '$C$' + Z.hilf5, n: '$D$' + Z.hilf5, ue: '$E$' + Z.hilf5, verm: '$F$' + Z.hilf5, ra: '$G$' + Z.hilf5 };
    const restS = k => 'MAX(0,-FV(' + H.r + ',' + k + ',-' + H.R + ',' + B(Z.kredit) + '))';
    setz('A' + Z.hilf5, 'Hilfswerte Szenario', { grau: true });
    setz('B' + Z.hilf5, '=' + B(Z.sZins) + '/1200');
    setz('C' + Z.hilf5, '=' + B(Z.sRate));
    setz('D' + Z.hilf5, '=IFERROR(IF(' + B(Z.kredit) + '=0,0,IF(' + H.r + '=0,ROUNDUP(ROUND(' + B(Z.kredit) + '/' + H.R + ',6),0),ROUNDUP(ROUND(NPER(' + H.r + ',-' + H.R + ',' + B(Z.kredit) + '),6),0))),"")');
    setz('E' + Z.hilf5, '=IFERROR(' + H.R + '-' + restS(H.n + '-1') + '*(1+' + H.r + '),0)');
    setz('F' + Z.hilf5, '=IF(' + B(Z.nutzung) + '="Vermietung",1,0)');
    setz('G' + Z.hilf5, '=' + B(Z.alt) + '/100*(100-' + B(Z.altSteuer) + ')/100');

    const kopf5 = ['Jahr', 'Zinsen', 'Tilgung', 'Restschuld', 'Eigentümerkosten', 'Miete (gespart / eingenommen)', 'Steuern (nur Vermietung)',
      'Belastung im Jahr', 'Wert der Immobilie', 'Vermögen mit Kauf', 'Angespartes (nur Vermietung)', 'Vermögen Alternative', 'Vorteil Kauf'];
    kopf5.forEach((t, i) => setz(String.fromCharCode(65 + i) + Z.kopf5, t, { fett: true, kopf: true }));
    for (let j = 0; j < JAHRE; j++) {
      const r = S5 + j, A = '$A' + r, w = f => '=IF(' + A + '="","",' + f + ')';
      const ks = 'MIN(' + H.n + ',(' + A + '-1)*12)', ke = 'MIN(' + H.n + ',' + A + '*12)';
      setz('A' + r, '=IF(' + (j + 1) + '>' + B(Z.zeitraum) + ',"",' + (j + 1) + ')', { fmt: ZAHL, fett: true });
      setz('B' + r, w('IFERROR((' + ke + '-' + ks + ')*' + H.R + '-IF(AND(' + ke + '=' + H.n + ',' + ke + '>' + ks + '),' + H.ue + ',0)-(' + restS(ks) + '-' + restS(ke) + '),0)'), { fmt: EUR0 });
      setz('C' + r, w('IFERROR(' + restS(ks) + '-' + restS(ke) + ',0)'), { fmt: EUR0 });
      setz('D' + r, w('IFERROR(' + restS(ke) + ',0)'), { fmt: EUR0 });
      setz('E' + r, w(B(Z.kosten) + '*((100+' + B(Z.mietPlus) + ')/100)^(' + A + '-1)'), { fmt: EUR0 });
      setz('F' + r, w('N(' + B(Z.miete) + ')*12*((100+' + B(Z.mietPlus) + ')/100)^(' + A + '-1)*IF(' + H.verm + '=1,(100-' + B(Z.ausfall) + ')/100,1)'), { fmt: EUR0 });
      setz('G' + r, w('IF(' + H.verm + '=1,(F' + r + '-E' + r + '-B' + r + '-' + B(Z.afa) + ')*' + B(Z.steuer) + '/100,0)'), { fmt: EUR0 });
      setz('H' + r, w('B' + r + '+C' + r + '+E' + r + '+G' + r), { fmt: EUR0, fett: true });
      setz('I' + r, w(B(Z.wertOhne) + '*((100+' + B(Z.wertPlus) + ')/100)^' + A), { fmt: EUR0 });
      const vorK = j ? 'N(K' + (r - 1) + ')' : '0', vorL = j ? 'L' + (r - 1) : B(Z.ek);
      setz('K' + r, w('IF(' + H.verm + '=1,' + vorK + '*(1+' + H.ra + ')+F' + r + '-H' + r + ',"")'), { fmt: EUR0 });
      setz('J' + r, w('I' + r + '-D' + r + '+N(K' + r + ')'), { fmt: EUR0, fett: true });
      setz('L' + r, w('IF(AND(' + H.verm + '=0,N(' + B(Z.miete) + ')=0),"",' + vorL + '*(1+' + H.ra + ')+IF(' + H.verm + '=0,H' + r + '-F' + r + ',0))'), { fmt: EUR0 });
      setz('M' + r, w('IF(L' + r + '="","",J' + r + '-L' + r + ')'), { fmt: EUR0, fett: true });
    }
    const amEnde = sp => 'IFERROR(INDEX($' + sp + '$' + S5 + ':$' + sp + '$' + E5 + ',' + B(Z.zeitraum) + '),"")';
    setz('A' + Z.eK, 'Ergebnis am Ende des Betrachtungszeitraums', { fett: true, kapitel: true });
    aus(Z.eJahre, 'Jahre', '=' + B(Z.zeitraum), ZAHL);
    aus(Z.eRest, 'Restschuld', '=' + amEnde('D'), EUR0);
    aus(Z.eZinsen, 'Gezahlte Zinsen insgesamt', '=SUM(B' + S5 + ':B' + E5 + ')', EUR0);
    aus(Z.eWert, 'Wert der Immobilie', '=' + amEnde('I'), EUR0);
    aus(Z.eKauf, 'Vermögen mit Kauf', '=' + amEnde('J'), EUR0, 'Wert minus Restschuld (bei Vermietung plus Angespartes)');
    aus(Z.eAlt, 'Vermögen Alternative', '=' + amEnde('L'), EUR0, 'Eigennutzung: Mieten und Eigenkapital plus gesparte Differenz anlegen. Vermietung: Eigenkapital anlegen.');
    aus(Z.eVorteil, 'Vorteil Kauf', '=' + amEnde('M'), EUR0);
    setz('A' + Z.eHinweis, 'Für den Vergleich mit Mieten oben bei „Miete pro Monat“ eine Miete eintragen. Verkaufskosten und Steuern beim Verkauf sind nicht berücksichtigt.', { grau: true });
    return z;
  }

  global.FinanzierungsBlatt = { NAME: 'Immobilienfinanzierung', DATEN: D, Z, zellen, MAX };
})(typeof window !== 'undefined' ? window : globalThis);
