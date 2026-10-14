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
    k5: 92, hin5: 93, eKauf: 94, eEk: 95, eMiete: 96, eMietPlus: 97, eKosten: 98, eAusfall: 99, eAfa: 100, eSteuer: 101,
    eWert: 102, eGuthaben: 103, eAlt: 104, eAltSteuer: 105, eDispo: 106,
    vT: 107, vJahr: 108, vKauf: 109, vMiete: 110, vKosten: 111, vAusfall: 112, vObjekt: 113, vEk: 114, vDarl: 115, vZins: 116,
    vTilg: 117, vSteuer: 118, vZinsFA: 119, vSaldo: 120, vFA: 121, vRest: 122, vWert: 123, vVerm: 124,
    vStKopf: 126, vEink: 127, vSt: 128, vAlt: 130,
    sK: 132, sImmo: 133, sAlt: 134, sVorteil: 135, sRendite: 136
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
      setz(c + Z.tilg, wenn('IF(' + c + '$' + Z.typ + '="e","am Ende",IF(N(' + F('H') + ')>0,' + F('H') + ',(' + c + '$' + Z.rate + '*12/' + c + '$' + Z.summe + ')*100-' + F('G') + '))'), { fmt: PZ });
      setz(c + Z.rate, wenn('IF(N(' + F('I') + ')>0,' + F('I') + ',' + c + '$' + Z.summe + '*(' + F('G') + '+IF(' + c + '$' + Z.typ + '="e",0,N(' + F('H') + ')))/1200)'), { fmt: EUR });
      setz(c + Z.beginn, wenn('DATE(INT(' + c + '$' + Z.start + '/12),MOD(' + c + '$' + Z.start + ',12)+1,1)'), { fmt: MON });
      setz(c + Z.bind, wenn('IF(N(' + F('K') + ')>0,' + F('K') + ',"")'), { fmt: ZAHL });
      setz(c + Z.bindEnde, wenn('IF(N(' + F('K') + ')>0,EDATE(' + c + '$' + Z.beginn + ',' + F('K') + '*12-1),"")'), { fmt: MON });
      setz(c + Z.restHeute, wenn(rest(c, c + '$' + Z.k)), { fmt: EUR0 });
      setz(c + Z.restBind, wenn('IF(N(' + F('K') + ')>0,' + rest(c, 'MIN(' + c + '$' + Z.n + ',' + F('K') + '*12)') + ',"")'), { fmt: EUR0 });
      setz(c + Z.ende, wenn('EDATE(' + c + '$' + Z.beginn + ',' + c + '$' + Z.n + '-1)'), { fmt: MON });
      setz(c + Z.laufzeit, wenn(c + '$' + Z.n + '/12'), { fmt: JAHR1 });
      setz(c + Z.zinsenGes, wenn('IF(' + c + '$' + Z.typ + '="t",' + c + '$' + Z.r + '*(' + c + '$' + Z.n + '*' + c + '$' + Z.summe + '-' + c + '$' + Z.t + '*' + c + '$' + Z.n + '*(' + c + '$' + Z.n + '-1)/2),' +
        'IF(' + c + '$' + Z.typ + '="e",' + c + '$' + Z.summe + '*' + c + '$' + Z.r + '*' + c + '$' + Z.n + ',' + c + '$' + Z.rate + '*' + c + '$' + Z.n + '-' + c + '$' + Z.ueber + '-' + c + '$' + Z.summe + '))'), { fmt: EUR0 });
      setz(c + Z.sonder, wenn('IF(N(' + F('L') + ')>0,' + c + '$' + Z.summe + '*' + F('L') + '/100,"")'), { fmt: EUR0 });

      // Hilfswerte
      setz(c + Z.typ, wenn('IF(' + F('D') + '="Tilgungsdarlehen","t",IF(' + F('D') + '="Endfälliges Darlehen","e","a"))'));
      setz(c + Z.start, wenn('IF(ISNUMBER(' + F('J') + '),YEAR(' + F('J') + ')*12+MONTH(' + F('J') + ')-1,VALUE(LEFT(' + F('J') + ',4))*12+VALUE(MID(' + F('J') + ',6,2))-1)'), { fmt: ZAHL });
      setz(c + Z.r, wenn(F('G') + '/1200'), { fmt: '0.000000' });
      setz(c + Z.t, wenn('IF(N(' + F('H') + ')>0,' + c + '$' + Z.summe + '*' + F('H') + '/1200,MAX(0,' + c + '$' + Z.rate + '-' + c + '$' + Z.summe + '*' + c + '$' + Z.r + '))'), { fmt: EUR });
      setz(c + Z.n, wenn('IF(' + c + '$' + Z.typ + '="e",IF(N(' + F('K') + ')>0,' + F('K') + '*12,360),IF(' + c + '$' + Z.typ + '="t",ROUNDUP(ROUND(' + c + '$' + Z.summe + '/' + c + '$' + Z.t + ',6),0),' +
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

    // ---- 5. Vermietung: Vollstaendiger Finanzplan (VoFi) ----
    // t = 0..10 in den Spalten C..M; Zinsen, Tilgung und Restschuld kommen aus dem Tilgungsplan (Teil 4, Jahr 1 = erste Zeile).
    const T = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
    const B = r => '$B$' + r;
    setz('A' + Z.k5, '5. Vermietung: Vollständiger Finanzplan (VoFi) über 10 Jahre', { fett: true, kapitel: true });
    setz('A' + Z.hin5, 'Wie in deiner Uni-Datei: Lohnt sich die vermietete Immobilie gegenüber einer Geldanlage des Eigenkapitals? Zinsen und Tilgung kommen aus dem Tilgungsplan (Teil 4).', { grau: true });
    const ein = (r, t, wert, fmt, hinweis) => { setz('A' + r, t); setz('B' + r, wert, { fmt: fmt, eingabe: true }); if (hinweis) setz('C' + r, hinweis, { grau: true }); };
    ein(Z.eKauf, 'Kaufpreis inkl. Nebenkosten', '=N(' + D + '!B2)', EUR0, 'aus „Finanzierung“, kann überschrieben werden');
    ein(Z.eEk, 'Eigenkapital', '=N(' + D + '!C2)', EUR0);
    ein(Z.eMiete, 'Nettokaltmiete pro Jahr (Jahr 1)', 0, EUR0);
    ein(Z.eMietPlus, 'Mietsteigerung pro Jahr', 2, PZ);
    ein(Z.eKosten, 'Verwaltung, Instandhaltung, nicht umlagefähige Kosten pro Jahr', 0, EUR0);
    ein(Z.eAusfall, 'Mietausfallwagnis', 2, PZ, 'Anteil der Miete');
    ein(Z.eAfa, 'Abschreibung (AfA) pro Jahr', '=' + B(Z.eKauf) + '*80/100*2/100', EUR0, 'Faustregel: 2 % vom Gebäudeanteil (hier 80 % des Kaufpreises)');
    ein(Z.eSteuer, 'Persönlicher Steuersatz', 30, PZ);
    ein(Z.eWert, 'Wertsteigerung der Immobilie pro Jahr', 1.5, PZ);
    ein(Z.eGuthaben, 'Zins auf Überschüsse (Finanzanlage)', 2, PZ);
    ein(Z.eAlt, 'Zins der alternativen Geldanlage', 4, PZ);
    ein(Z.eAltSteuer, 'Steuer auf Kapitalerträge', 25, PZ, 'Abgeltungsteuer, vereinfacht');
    ein(Z.eDispo, 'Zins auf Unterdeckung', 8, PZ, 'wenn Miete die Raten nicht deckt (z. B. Dispo oder Zusatzdarlehen)');

    const zeilen5 = [[Z.vT, 'Zeitpunkt t'], [Z.vJahr, 'Jahr'], [Z.vKauf, 'Immobilienkauf'], [Z.vMiete, '+ Nettokaltmiete'], [Z.vKosten, '− Verwaltung, Instandhaltung'],
      [Z.vAusfall, '− Mietausfall'], [Z.vObjekt, 'Zahlungsreihe der Immobilie'], [Z.vEk, '+ Eigenkapital'], [Z.vDarl, '+ Aufnahme Darlehen'],
      [Z.vZins, '− Sollzinsen'], [Z.vTilg, '− Tilgung'], [Z.vSteuer, '− Steuern (negativ = Erstattung)'], [Z.vZinsFA, '± Zinsen Finanzanlage / Unterdeckung'],
      [Z.vSaldo, 'Überschuss im Jahr (negativ = Zuschuss nötig)'], [Z.vFA, 'Bestand Finanzanlage (negativ = Unterdeckung)'], [Z.vRest, 'Restschuld Darlehen'], [Z.vWert, 'Wert der Immobilie'],
      [Z.vVerm, 'Vermögen (Wert − Restschuld + Finanzanlage)'], [Z.vStKopf, 'Steuerberechnung'], [Z.vEink, 'Einkünfte aus Vermietung und Zinsen'], [Z.vSt, 'Steuern'],
      [Z.vAlt, 'Alternative: Eigenkapital als Geldanlage']];
    zeilen5.forEach(([r, t]) => setz('A' + r, t, { fett: [Z.vT, Z.vObjekt, Z.vSaldo, Z.vVerm, Z.vStKopf, Z.vAlt].indexOf(r) >= 0, kopf: r === Z.vT || r === Z.vStKopf }));
    T.forEach((c, t) => {
      const p = (spalte) => 'N(INDEX($' + spalte + '$' + Z.plan + ':$' + spalte + '$' + (Z.plan + JAHRE - 1) + ',' + t + '))';
      const vor = T[t - 1];
      setz(c + Z.vT, t, { fmt: '"t="0', fett: true, kopf: true });
      setz(c + Z.vJahr, t === 0 ? 'Kauf' : '=IF($A$' + Z.plan + '="","",$A$' + Z.plan + '+' + (t - 1) + ')', { fmt: ZAHL });
      setz(c + Z.vKauf, t === 0 ? '=-' + B(Z.eKauf) : 0, { fmt: EUR0 });
      setz(c + Z.vMiete, t === 0 ? 0 : (t === 1 ? '=' + B(Z.eMiete) : '=' + vor + Z.vMiete + '*(100+' + B(Z.eMietPlus) + ')/100'), { fmt: EUR0 });
      setz(c + Z.vKosten, t === 0 ? 0 : '=' + B(Z.eKosten), { fmt: EUR0 });
      setz(c + Z.vAusfall, t === 0 ? 0 : '=' + c + Z.vMiete + '*' + B(Z.eAusfall) + '/100', { fmt: EUR0 });
      setz(c + Z.vObjekt, '=' + c + Z.vKauf + '+' + c + Z.vMiete + '-' + c + Z.vKosten + '-' + c + Z.vAusfall, { fmt: EUR0, fett: true });
      setz(c + Z.vEk, t === 0 ? '=' + B(Z.eEk) : 0, { fmt: EUR0 });
      setz(c + Z.vDarl, t === 0 ? '=N($H$' + Z.summe + ')' : 0, { fmt: EUR0 });
      setz(c + Z.vZins, t === 0 ? 0 : '=' + p('N'), { fmt: EUR0 });
      setz(c + Z.vTilg, t === 0 ? 0 : '=' + p('O'), { fmt: EUR0 });
      setz(c + Z.vSteuer, t === 0 ? 0 : '=' + c + Z.vSt, { fmt: EUR0 });
      setz(c + Z.vZinsFA, t === 0 ? 0 : '=IF(' + vor + Z.vFA + '>=0,' + vor + Z.vFA + '*' + B(Z.eGuthaben) + ',' + vor + Z.vFA + '*' + B(Z.eDispo) + ')/100', { fmt: EUR0 });
      setz(c + Z.vSaldo, '=' + c + Z.vObjekt + '+' + c + Z.vEk + '+' + c + Z.vDarl + '-' + c + Z.vZins + '-' + c + Z.vTilg + '-' + c + Z.vSteuer + '+' + c + Z.vZinsFA, { fmt: EUR0, fett: true });
      setz(c + Z.vFA, t === 0 ? '=' + c + Z.vSaldo : '=' + vor + Z.vFA + '+' + c + Z.vSaldo, { fmt: EUR0 });
      setz(c + Z.vRest, t === 0 ? '=N($H$' + Z.summe + ')' : '=' + p('P'), { fmt: EUR0 });
      setz(c + Z.vWert, '=' + B(Z.eKauf) + '*((100+' + B(Z.eWert) + ')/100)^' + t, { fmt: EUR0 });
      setz(c + Z.vVerm, '=' + c + Z.vWert + '-' + c + Z.vRest + '+' + c + Z.vFA, { fmt: EUR0, fett: true });
      setz(c + Z.vStKopf, '', { kopf: true });
      setz(c + Z.vEink, t === 0 ? 0 : '=' + c + Z.vMiete + '-' + c + Z.vKosten + '-' + c + Z.vAusfall + '-' + B(Z.eAfa) + '-' + c + Z.vZins + '+' + c + Z.vZinsFA, { fmt: EUR0 });
      setz(c + Z.vSt, t === 0 ? 0 : '=' + c + Z.vEink + '*' + B(Z.eSteuer) + '/100', { fmt: EUR0 });
      setz(c + Z.vAlt, t === 0 ? '=' + B(Z.eEk) : '=' + vor + Z.vAlt + '*(1+' + B(Z.eAlt) + '/100*(100-' + B(Z.eAltSteuer) + ')/100)', { fmt: EUR0, fett: true });
    });
    setz('A' + Z.sK, 'Ergebnis nach 10 Jahren', { fett: true, kapitel: true });
    setz('A' + Z.sImmo, 'Vermögen mit Immobilie'); setz('B' + Z.sImmo, '=M' + Z.vVerm, { fmt: EUR0, fett: true });
    setz('C' + Z.sImmo, 'Verkauf nach 10 Jahren ist privat steuerfrei; Verkaufskosten sind nicht berücksichtigt.', { grau: true });
    setz('A' + Z.sAlt, 'Vermögen mit Geldanlage'); setz('B' + Z.sAlt, '=M' + Z.vAlt, { fmt: EUR0, fett: true });
    setz('A' + Z.sVorteil, 'Vorteil der Immobilie'); setz('B' + Z.sVorteil, '=B' + Z.sImmo + '-B' + Z.sAlt, { fmt: EUR0, fett: true });
    setz('A' + Z.sRendite, 'Rendite auf das Eigenkapital pro Jahr'); setz('B' + Z.sRendite, '=IFERROR(((B' + Z.sImmo + '/' + B(Z.eEk) + ')^(1/10)-1)*100,"")', { fmt: PZ, fett: true });
    return z;
  }

  global.FinanzierungsBlatt = { NAME: 'Immobilienfinanzierung', DATEN: D, Z, zellen, MAX };
})(typeof window !== 'undefined' ? window : globalThis);
