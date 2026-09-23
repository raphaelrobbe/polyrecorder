import type { MessageKey } from './fr'

/** German UI copy — please review. */
export const de: Record<MessageKey, string> = {
  'brand.tagline': 'Aufnehmen, überlagern, anhören, herunterladen.',

  'deck.ariaLabel': 'Rekorder',

  'common.close': 'Schließen',
  'common.delete': 'Löschen',

  'error.title': 'Ups',
  'error.lead':
    'Etwas ist schiefgelaufen. Du kannst zum Rekorder zurückkehren und es erneut versuchen.',
  'error.home': 'Zurück zum Rekorder',

  'nav.help': 'Hilfe',
  'nav.settings': 'Einstellungen',
  'nav.signIn': 'Anmelden',
  'nav.signOut': 'Abmelden',
  'nav.accountMenu': 'Kontomenü',
  'nav.accountSettings': 'Kontoeinstellungen',

  'account.title': 'Konto',
  'account.close': 'Kontoeinstellungen schließen',
  'account.email': 'E-Mail',
  'account.email.hint':
    'Ein Bestätigungslink wird an die neue Adresse gesendet.',
  'account.email.pending':
    'Fast geschafft: öffne den an {email} gesendeten Link, um die Änderung zu bestätigen.',
  'account.email.openConfirmLink': 'Bestätigungslink öffnen',
  'account.pseudo': 'Anzeigename',
  'account.pseudoPlaceholder': 'Dein Anzeigename',
  'account.pseudo.lengthHint': '3–40 Zeichen',
  'account.pseudo.available': 'verfügbar',
  'account.pseudo.unavailable': 'nicht verfügbar',
  'account.pseudo.current': 'mein aktueller Name',
  'account.save': 'Speichern',
  'account.saving': 'Wird gespeichert…',
  'account.saved': 'Gespeichert.',
  'account.error.pseudoTooShort': 'Anzeigename muss mindestens 3 Zeichen haben.',
  'account.error.pseudoTooLong': 'Anzeigename zu lang (max. 40 Zeichen).',
  'account.error.pseudoTaken': 'Dieser Anzeigename ist bereits vergeben.',
  'account.error.invalidEmail': 'Ungültige E-Mail-Adresse.',
  'account.error.emailTaken': 'Diese E-Mail-Adresse wird bereits verwendet.',
  'account.error.emailRateLimited':
    'Zu viele Anfragen für diese E-Mail. Versuche es in einer Stunde erneut.',
  'account.error.emailFailed': 'E-Mail konnte nicht gesendet werden. Später erneut versuchen.',
  'account.error.saveFailed': 'Speichern fehlgeschlagen. Erneut versuchen.',
  'account.delete.button': 'Konto löschen',
  'account.delete.confirmBody':
    'Diese Aktion ist unwiderruflich. Alle mit deinem Konto verknüpften Daten werden dauerhaft gelöscht, und geteilte Links funktionieren nicht mehr.',
  'account.delete.confirm': 'Ja, endgültig löschen',
  'account.delete.cancel': 'Abbrechen',
  'account.delete.deleting': 'Wird gelöscht…',
  'account.delete.error': 'Konto konnte nicht gelöscht werden. Erneut versuchen.',

  'auth.signIn.title': 'Anmelden oder Konto erstellen',
  'auth.signIn.lead':
    'Gib deine E-Mail ein: wir erstellen bei Bedarf ein Konto und senden dir einen einmaligen Magie-Link (30 Minuten gültig). Kein Passwort.',
  'auth.signIn.email': 'E-Mail',
  'auth.signIn.emailPlaceholder': 'du@beispiel.com',
  'auth.signIn.submit': 'Weiter',
  'auth.signIn.sending': 'Wird gesendet…',
  'auth.sent.title': 'Posteingang prüfen',
  'auth.sent.body':
    'Eine E-Mail mit einem Anmelde-Link wurde gerade gesendet. Öffne ihn, um fortzufahren — dein Konto wird beim ersten Klick erstellt, falls nötig.',
  'auth.sent.bodyWithEmail':
    'Eine E-Mail mit einem Anmelde-Link wurde gerade an {email} gesendet. Öffne ihn, um fortzufahren — dein Konto wird beim ersten Klick erstellt, falls nötig.',
  'auth.sent.hint':
    'Der Link läuft in 30 Minuten ab und kann nur einmal verwendet werden. Schau auch im Spam nach.',
  'auth.sent.retry': 'Andere E-Mail verwenden',
  'auth.sent.devHint':
    'Lokal kommt die E-Mail möglicherweise nicht an — nutze den Button unten, um dich sofort anzumelden.',
  'auth.sent.openLink': 'Anmelde-Link öffnen',
  'auth.error.invalidEmail': 'Ungültige E-Mail-Adresse.',
  'auth.error.rateLimited':
    'Zu viele Anfragen für diese E-Mail. Versuche es in einer Stunde erneut.',
  'auth.error.emailFailed': 'E-Mail konnte nicht gesendet werden. Später erneut versuchen.',
  'auth.error.linkInvalid': 'Ungültiger Anmelde-Link.',
  'auth.error.linkExpired': 'Dieser Link ist abgelaufen. Fordere einen neuen an.',
  'auth.error.linkUsed': 'Dieser Link wurde bereits verwendet. Fordere einen neuen an.',
  'auth.email.welcome.subject': 'Willkommen bei PolyRecorder',
  'auth.email.welcome.text':
    'Willkommen! Dein PolyRecorder-Konto ist bereit.\n\nZum Aktivieren und Anmelden öffne diesen Link (30 Minuten gültig, einmalig):\n\n{link}\n\nDanach kannst du Aufnahmen machen, überlagern und herunterladen.\n\nWenn du das nicht angefordert hast, ignoriere diese E-Mail.',
  'auth.email.welcome.html':
    '<p>Willkommen&nbsp;! Dein <strong>PolyRecorder</strong>-Konto ist bereit.</p><p>Zum Aktivieren und Anmelden öffne diesen Link (30&nbsp;Minuten gültig, einmalig):</p><p><a href="{link}">Konto aktivieren</a></p><p>Danach kannst du Aufnahmen machen, überlagern und herunterladen.</p><p>Wenn du das nicht angefordert hast, ignoriere diese E-Mail.</p>',
  'auth.email.signIn.subject': 'Dein PolyRecorder-Anmelde-Link',
  'auth.email.signIn.text':
    'Hier ist dein Anmelde-Link für PolyRecorder (30 Minuten gültig, einmalig):\n\n{link}\n\nWenn du das nicht angefordert hast, ignoriere diese E-Mail.',
  'auth.email.signIn.html':
    '<p>Hier ist dein Anmelde-Link für <strong>PolyRecorder</strong> (30&nbsp;Minuten gültig, einmalig):</p><p><a href="{link}">Anmelden</a></p><p>Wenn du das nicht angefordert hast, ignoriere diese E-Mail.</p>',
  'auth.emailChange.subject': 'Anfrage zur E-Mail-Änderung bei PolyRecorder',
  'auth.emailChange.text':
    'Es wurde beantragt, die E-Mail-Adresse eines PolyRecorder-Kontos auf dieses Postfach zu ändern.\n\nWenn du das nicht angefordert hast, ignoriere diese E-Mail — deine Adresse ändert sich nicht.\n\nAndernfalls bestätige die Änderung mit diesem Link (30 Minuten gültig, einmalig):\n\n{link}',
  'auth.emailChange.html':
    '<p>Es wurde beantragt, die E-Mail-Adresse eines <strong>PolyRecorder</strong>-Kontos auf dieses Postfach zu ändern.</p><p>Wenn du das nicht angefordert hast, ignoriere diese E-Mail — deine Adresse ändert sich nicht.</p><p>Andernfalls bestätige die Änderung mit diesem Link (30&nbsp;Minuten gültig, einmalig):</p><p><a href="{link}">Neue E-Mail bestätigen</a></p>',

  'locale.select.aria': 'Sprache wählen',
  'settings.language': 'Sprache:',
  'settings.language.aria': 'Oberflächensprache',

  'theme.switchToDark': 'Zum dunklen Design wechseln',
  'theme.switchToLight': 'Zum hellen Design wechseln',
  'theme.darkSystem': 'Dunkles Design (aktuell automatisch)',
  'theme.lightSystem': 'Helles Design (aktuell automatisch)',
  'theme.dark': 'Dunkles Design',
  'theme.light': 'Helles Design',

  'session.title.aria': 'Titel der Aufnahme',
  'session.defaultTitle': 'Meine Polyphonie',

  'capture.nextTrack': 'Nächste Spur',
  'capture.nextTrack.hint':
    'Nächste Spur: spielt diesen Take ab und nimmt gleichzeitig den nächsten auf.',
  'capture.discard': 'Take verwerfen und neu starten',
  'capture.record': 'Aufnehmen',
  'capture.stop': 'Stopp',

  'mix.restart': 'Zum Anfang',
  'mix.play': 'Wiedergabe',
  'mix.pause': 'Pause',
  'mix.download': 'Mix herunterladen (MP3)',
  'mix.download.hint': 'Mix der ausgewählten Spuren herunterladen (MP3)',
  'mix.seekAria': 'Wiedergabeposition',
  'mix.masterVolume': 'Master-Lautstärke',

  'mode.groupAria': 'Arbeitsmodi',
  'mode.label': 'Modus',
  'mode.mix': 'Mix',
  'mode.mix.hint': 'Mix-Modus: Lautstärke pro Spur und Master',
  'mode.align': 'Ausrichten',
  'mode.align.hint': 'Ausricht-Modus: Spurensynchronisation',

  'align.latency.label': 'Wiedergabe-Vorlauf',
  'align.latency.about': 'Über den Wiedergabe-Vorlauf',
  'align.latency.adjust': 'Monitoring-Vorlauf anpassen',
  'align.latency.minus': 'Monitoring etwas früher starten (−5 ms)',
  'align.latency.plus': 'Monitoring etwas später starten (+5 ms)',
  'align.latency.input': 'Wiedergabe-Vorlauf in Millisekunden',
  'align.latency.tip':
    'Bei „Nächste Spur“ werden vorhandene Takes mit etwas Hardware-Latenz im Kopfhörer abgespielt. PolyRecorder startet dieses Monitoring etwas früher, damit deine neue Stimme an der richtigen Stelle der Timeline landet. Passe den Wert an (±5 ms oder direkt eingeben), wenn das Monitoring noch zu spät oder zu früh wirkt (auf diesem Gerät gespeichert). Das ist nicht die Auto-Ausrichtung über die 3–4-Markierungen: sie gilt nur während der Aufnahme.',

  'volume.percentAria': '{label} in Prozent',

  'tracks.muteAll.hint': 'Alle Spuren stummschalten / aktivieren',
  'tracks.muteAll.aria': 'Alle Spuren aktivieren',
  'tracks.deleteAll': 'Alle Spuren löschen',
  'tracks.deleteOne.confirm': 'Spur „{name}“ löschen?',
  'tracks.deleteAll.confirm':
    '{count} Spuren löschen? Sie gehen unwiderruflich verloren.',
  'tracks.alignAll.hint':
    'Auto-Ausrichtung ein-/ausschalten (außer Spur 1)',
  'tracks.alignAll.aria': 'Alle Spuren automatisch ausrichten',
  'tracks.reorder': '{name} neu anordnen',
  'tracks.audible': 'Hörbar',
  'tracks.muted': 'Stumm',
  'tracks.listen': '{name} anhören',
  'tracks.name.aria': 'Spurname',
  'tracks.defaultName': 'Spur {index}',
  'tracks.filenameFallback': 'spur',
  'tracks.volume': 'Lautstärke {name}',
  'tracks.delete': '{name} löschen',
  'tracks.delete.confirm': '„{name}“ löschen?',
  'tracks.ref.hint': 'Referenzspur (Markierungen 1–2–3–4)',
  'tracks.ref.aria': 'Referenz',
  'tracks.ref.badge': 'Ref.',
  'tracks.autoAlign': 'Auto-Ausrichtung',
  'tracks.autoAlign.named': 'Auto-Ausrichtung {name}',
  'tracks.offset.hint': 'Diese Spur bei der Wiedergabe verschieben',
  'tracks.offset.minus': '{name} um 5 ms früher',
  'tracks.offset.plus': '{name} um 5 ms später',
  'tracks.offset.input': 'Ausrichtung von {name} in Millisekunden',
  'tracks.drag': 'Ziehen zum Umsortieren',

  'warn.attention': 'Achtung',
  'warn.openAlignMode': 'Ausricht-Modus öffnen',
  'warn.skew.tooltip':
    'Eine Auto-Ausrichtung über 300 ms deutet oft auf Sync-Probleme hin (unklare Markierungen, Latenz usw.). Öffne den Ausricht-Modus zum Prüfen und Anpassen.',
  'warn.skew.short': 'Hohe Auto-Ausrichtung bei {names}.',
  'warn.skew.long':
    'Hohe Auto-Ausrichtung bei {names}. Sync im Ausricht-Modus prüfen.',
  'warn.beat.irregular':
    'Unregelmäßiger oder nicht erkannter 1-2-3-4-Auftakt auf der Referenzspur ({name}).',
  'warn.beat.missing':
    '1-2-3-4-Auftakt auf „{name}“ nicht erkannt ({count}/4 Treffer).',
  'warn.beat.error': 'Auftakt von „{name}“ konnte nicht analysiert werden.',

  'howto.title': 'Anleitung',
  'howto.step1': 'auf den roten Knopf „Aufnehmen“ tippen',
  'howto.step2':
    'laut und gleichmäßig 1-2-3-4 sagen (oder ein anderes klares 4er-Signal), dann die erste Stimme singen',
  'howto.step3':
    'auf „Nächste Spur“ tippen (Chevron nach rechts), um direkt die zweite Stimme aufzunehmen',
  'howto.step4':
    'nur die 3. und 4. Zählzeit laut mitsprechen, genau wenn du sie hörst, dann die zweite Stimme singen',
  'howto.step5': 'für weitere Stimmen wiederholen',
  'howto.step6':
    'am Ende der letzten Stimme auf den roten Knopf „Stopp“ tippen',
  'howto.tips':
    'Tipps: nimm in ruhiger Umgebung auf, möglichst mit Kopfhörer oder Ohrhörer—besonders am Handy!',
  'howto.latency':
    'Browser und Audiogeräte erzeugen Latenz (Kopfhörer, Mikrofon, Buffer). Ohne gemeinsame Markierungen verrutschen die Takes. Die vier Markierungen der Referenzspur und die „3-4“ der folgenden Spuren lassen PolyRecorder diese Verschiebung messen und automatisch korrigieren. Klare, gleichmäßige, gut getrennte Laute richten besser aus; ein unregelmäßiger oder leiser Auftakt kann die Sync stören.',

  'help.title': 'Hilfe',
  'help.close': 'Hilfe schließen',
  'help.customize.title': 'Anpassung',
  'help.customize.body1':
    'Den Projektnamen änderst du oben per Klick auf den Titel{f2}. Auch jeder Spurname lässt sich in der Liste anklicken und ändern.',
  'help.customize.f2': ' (oder mit F2)',
  'help.customize.body2':
    'Diese Namen fließen in die MP3-Datei: der Projekttitel und — wenn nicht alle Spuren ausgewählt sind — die exportierten Spurnamen, z. B. „Meine Polyphonie_Bässe 1 - Bässe 2.mp3“.',
  'help.sync.title': 'Synchronisation',
  'help.sync.body1':
    'Zum Ausrichten der Spuren sollte die erste (Referenz) mit vier klaren, gleichmäßigen Markierungen beginnen (1-2-3-4 oder ein anderes hörbares 4er-Signal). Folgende Spuren wiederholen nur die 3. und 4. Zählzeit, dann die Stimme. PolyRecorder misst damit den Latenzversatz und korrigiert ihn automatisch.',
  'help.sync.body2':
    'Störgeräusche können die Erkennung von 1-2-3-4 verhindern. Dann besser von vorn aufnehmen, um eine solide Referenzspur zu haben—sonst muss alles manuell ausgerichtet werden. Dasselbe gilt für die 3-4 späterer Spuren: eine schwache oder verrauschte Markierung bricht die Auto-Ausrichtung dieses Takes.',
  'help.shortcuts.title': 'Tastenkürzel',
  'help.shortcuts.recording': 'Aufnahme',
  'help.shortcuts.record': 'Aufnehmen',
  'help.shortcuts.next': 'Nächste Spur',
  'help.shortcuts.discard': 'Take verwerfen',
  'help.shortcuts.stop': 'Stopp',
  'help.shortcuts.playback': 'Wiedergabe',
  'help.shortcuts.playPause': 'Play / Pause',
  'help.shortcuts.downloadCat': 'Download',
  'help.shortcuts.download': 'MP3 herunterladen',
  'help.shortcuts.general': 'Allgemein',
  'help.shortcuts.editTitle': 'Titel bearbeiten',
  'help.shortcuts.closePanels': 'Hilfe / Einstellungen / Konto schließen',

  'settings.title': 'Einstellungen',
  'settings.close': 'Einstellungen schließen',
  'settings.appearance': 'Erscheinungsbild:',
  'settings.theme.aria': 'Design',
  'settings.theme.system': 'Auto (Browser)',
  'settings.theme.light': 'Hell',
  'settings.theme.dark': 'Dunkel',
  'settings.autoplay': 'Nach Aufnahmeende automatisch abspielen',
  'settings.skipCountIn': '1-2-3-4 entfernen',
  'settings.skipCountIn.play.hint':
    'Wiedergabe beginnt direkt nach der „4“',
  'settings.skipCountIn.play': 'bei der Wiedergabe',
  'settings.skipCountIn.download.hint':
    'Die MP3 beginnt direkt nach der „4“',
  'settings.skipCountIn.download': 'beim MP3-Download',
  'settings.devices': 'Audiogeräte',
  'settings.devices.mobileNote':
    'Auf Telefon oder Tablet führt die Gerätewahl im Browser oft zu mehr Problemen als Nutzen (Bluetooth-Kopfhörer falsch erkannt, kein Ton, System-Mikrofon…). Besser Kopfhörer anschließen und dem Telefon die Audiowege überlassen.',
  'settings.devices.playback': 'Wiedergabe',
  'settings.devices.playback.hint':
    'Damit das Mikrofon nicht mitschneidet, was du hörst: Kopfhörer verwenden.',
  'settings.devices.duringRecord': 'während der Aufnahme',
  'settings.devices.sinkMonitor': 'Ausgang während der Aufnahme',
  'settings.devices.duringPlayback': 'bei der Wiedergabe',
  'settings.devices.sinkPlayback': 'Ausgang bei der Wiedergabe',
  'settings.devices.sinkUnsupported':
    'Dieser Browser kann den Audioausgang nicht von der Seite aus wählen. Fürs Monitoring Kopfhörer anschließen oder den Ausgang in den Systemeinstellungen ändern.',
  'settings.devices.record': 'Aufnahme',
  'settings.devices.record.hint':
    'Mikrofon für die Takes. Bezeichnungen erscheinen nach der Zugriffserlaubnis.',
  'settings.devices.inputMonitor': 'Mikrofon während der Aufnahme',
  'settings.devices.inputOverride':
    'Das System hat „{label}“ statt des gewählten Mikrofons geöffnet. Nochmal versuchen oder Mikrofonrechte prüfen.',
  'settings.devices.inputOverrideGeneric':
    'Das System hat ein anderes Mikrofon geöffnet als gewählt. Nochmal versuchen oder Mikrofonrechte prüfen.',

  'devices.outputFallback': 'Ausgang',
  'devices.inputFallback': 'Mikrofon',

  'hint.recording.headphonesBleed':
    'Kopfhörer empfohlen: ohne sie kann das Mikrofon Lautsprecher aufnehmen und die Ausrichtung stören.',
  'hint.recording.headphonesLatency':
    'Kopfhörer empfohlen. Monitoring für Audiolatenz kompensiert.',
  'hint.listening': 'Wiedergabe…',

  'error.needTwoTracks': 'Zum Ausrichten braucht es mindestens zwei Spuren.',
  'error.missingReference': 'Referenzspur fehlt.',
  'error.refPeaks':
    '{name}: {count}/4 Treffer gefunden. Mach 4 gut getrennte Laute (Stimme oder Klatschen).',
  'error.trackPeaks':
    '{name}: {count}/2 Treffer gefunden. Mach 2 klare Laute für „3 4“ (Stimme oder Klatschen).',
  'error.autoAlignDeferred': 'Auto-Ausrichtung verschoben: {message}',
  'error.autoAlignDeferredGeneric': 'Auto-Ausrichtung verschoben.',
  'error.refPeaksSkipCountIn':
    '{name}: {count}/4 Treffer gefunden. Mach 4 gut getrennte Laute, um das 1-2-3-4 zu entfernen.',
  'error.exportNoTracks': 'Wähle mindestens eine Spur zum Export.',
  'error.exportNoneSelected': 'Keine Spur für den Export ausgewählt.',
  'error.countInTooLate':
    'Die „4“ liegt zu nah am Ende: nach dem Auftakt bleibt nichts zum Export.',
  'error.exportFailed': 'MP3-Export fehlgeschlagen.',
  'error.emptyTrack': 'Leere Spur, nichts abzuspielen.',
  'error.recordFailed': 'Aufnahme fehlgeschlagen.',
  'error.recordStart': 'Aufnahme konnte nicht gestartet werden.',
  'error.noActiveRecording': 'Keine laufende Aufnahme.',
  'error.noAudioData': 'Keine Audiodaten erfasst. Aufnahme erneut versuchen.',
  'error.discardFailed': 'Take konnte nicht neu gestartet werden.',
  'error.micAccess': 'Kein Zugriff auf das Mikrofon.',
  'error.nextTrackFailed': 'Wechsel zur nächsten Spur fehlgeschlagen.',
  'error.stopFailed': 'Konnte nicht sauber stoppen.',
  'error.playbackFailed': 'Wiedergabe fehlgeschlagen.',
  'error.pauseFailed': 'Pause fehlgeschlagen.',
  'error.autoAlignFailed': 'Auto-Ausrichtung fehlgeschlagen.',

  'align.refPeaks.ok':
    '1-2-3-4 ({name}): {times}\nAbstände {gaps} ms',
  'align.refPeaks.partial':
    '1-2-3-4-Auftakt ({name}): {times} ({count}/4)',
}
