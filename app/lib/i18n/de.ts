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
  'nav.legal': 'Impressum',
  'nav.privacy': 'Datenschutz',
  'nav.terms': 'AGB',
  'nav.sitemap': 'Sitemap',

  'legal.title': 'Impressum',
  'legal.close': 'Impressum schließen',
  'legal.publisher.title': 'Herausgeber',
  'legal.publisher.status.ei':
    'Einzelunternehmer im französischen Micro-entreprise-Regime',
  'legal.publisher.intro': '{name}, {status}.',
  'legal.publisher.siret': 'SIRET: {siret}.',
  'legal.publicationDirector': 'Verantwortlich für den Inhalt: {name}.',
  'legal.contact': 'Kontakt: {email}.',
  'legal.host.title': 'Hosting',
  'legal.host.intro':
    'Die Website wird gehostet von {name}, {address} (SIREN {siren}).',
  'legal.host.location':
    'Daten und Dienste werden in Frankreich und den Niederlanden gespeichert.',
  'legal.ip.title': 'Geistiges Eigentum',
  'legal.ip.intro':
    'Der Name „{site}“, das Design und die Anwendungsinhalte (ohne Nutzerinhalte) sind geschützt.',
  'legal.ip.reproduction':
    'Unerlaubte Vervielfältigung ist untersagt.',
  'legal.privacyLink': 'Zur Verarbeitung personenbezogener Daten siehe die',
  'legal.termsLink': 'Die Nutzungsbedingungen stehen in den',

  'privacy.title': 'Datenschutzerklärung',
  'privacy.close': 'Datenschutzerklärung schließen',
  'privacy.controller.title': 'Verantwortlicher',
  'privacy.controller.body':
    '{name} ({site}), {address}, erreichbar unter {email}, ist Verantwortlicher für die über die Anwendung erhobenen personenbezogenen Daten.',
  'privacy.data.title': 'Erhobene Daten',
  'privacy.data.account':
    'Konto (bei Anmeldung): E-Mail-Adresse, Anzeigename, Authentifizierungssitzungen.',
  'privacy.data.cloud':
    'Cloud-Bibliothek (bei Nutzung eines Kontos): Gruppen, Repertoires, Lieder, Metadaten und Audiodateien hochgeladener Spuren.',
  'privacy.data.technical':
    'Minimale technische Daten für den Betrieb des Dienstes (z. B. serverseitige Fehlerprotokolle).',
  'privacy.purposes.title': 'Zwecke und Rechtsgrundlagen',
  'privacy.purposes.body':
    'Die Daten dienen der Anmeldung, dem Speichern und Abrufen von Spuren in der Cloud sowie der Sicherheit des Dienstes. Rechtsgrundlagen: Vertragserfüllung (Bereitstellung des Dienstes gemäß den AGB) und gegebenenfalls berechtigtes Interesse (Sicherheit, Missbrauchsprävention).',
  'privacy.processors.title': 'Auftragsverarbeiter',
  'privacy.processors.body':
    'Hosting und Speicherung werden von {host} bereitgestellt. Daten und Dienste werden in Frankreich und den Niederlanden gespeichert.',
  'privacy.retention.title': 'Speicherdauer',
  'privacy.retention.body':
    'Konto- und Bibliotheksdaten werden so lange gespeichert, wie das Konto besteht. Du kannst dein Konto in der App löschen; zugehörige Daten werden dann gelöscht. Technische Protokolle werden nur so lange wie für die Diagnose nötig aufbewahrt.',
  'privacy.rights.title': 'Deine Rechte',
  'privacy.rights.body':
    'Du hast Rechte auf Auskunft, Berichtigung, Löschung, Widerspruch, Einschränkung und Datenübertragbarkeit. Du kannst sie über {email} ausüben oder indem du dein Konto in den Einstellungen löschst. Du kannst auch eine Beschwerde bei einer Aufsichtsbehörde einreichen (in Frankreich: CNIL, cnil.fr).',
  'privacy.cookies.title': 'Cookies und lokaler Speicher',
  'privacy.cookies.guest':
    'Als Gast setzt PolyRecorder keine Cookies.',
  'privacy.cookies.signedIn':
    'Nach der Anmeldung wird ein einziges httpOnly-Sitzungscookie ({cookie}) verwendet, das für die Authentifizierung unbedingt erforderlich ist. Es dient nicht dem Werbe-Tracking.',
  'privacy.cookies.localStorage':
    'Oberflächeneinstellungen (Sprache, Theme, Aufnahmeoptionen, aktives Lied) werden im localStorage des Browsers gespeichert, nicht in Cookies.',
  'privacy.legalLink': 'Siehe auch das',
  'privacy.termsLink': 'und die',

  'terms.title': 'Nutzungsbedingungen',
  'terms.close': 'Nutzungsbedingungen schließen',
  'terms.effective': 'Gültig ab {date}.',
  'terms.object.title': 'Gegenstand',
  'terms.object.body':
    'Diese Nutzungsbedingungen regeln den Zugang zu und die Nutzung von {site}, einem von {name} herausgegebenen Dienst. Sie bilden den vertraglichen Rahmen zwischen dir und dem Herausgeber für die Nutzung des Dienstes.',
  'terms.acceptance.title': 'Annahme',
  'terms.acceptance.body':
    'Durch die Nutzung des Dienstes (als Gast oder mit Konto) akzeptierst du diese Bedingungen. Wenn du sie nicht akzeptierst, darfst du den Dienst nicht nutzen.',
  'terms.service.title': 'Leistungsbeschreibung',
  'terms.service.guest':
    'Ohne Konto kannst du den Rekorder im Browser nutzen. Aufnahmen bleiben dann lokal auf deinem Gerät (sofern du nicht ausdrücklich eine andere Aktion auslöst).',
  'terms.service.account':
    'Mit einem Konto kannst du Spuren in der Cloud speichern (Gruppen, Repertoires, Lieder) und später wieder öffnen sowie bestimmte Lieder öffentlich teilen, wenn du das freigibst.',
  'terms.service.free':
    'Der Dienst wird derzeit kostenlos angeboten, im Rahmen der technischen Möglichkeiten des Herausgebers.',
  'terms.service.futurePaid':
    'Kostenpflichtige Angebote (z. B. ein Abonnement) können später eingeführt werden. In diesem Fall werden diese Bedingungen, das Impressum und die Datenschutzerklärung vor jeder Abrechnung aktualisiert, und die Preise werden bei der Buchung klar dargestellt.',
  'terms.account.title': 'Konto',
  'terms.account.body':
    'Du bist für den Schutz des Zugangs zu deiner E-Mail und für die Nutzung deines Kontos verantwortlich. Angaben müssen korrekt sein. Du kannst dein Konto in den Einstellungen löschen; damit werden zugehörige Daten gemäß der Datenschutzerklärung gelöscht.',
  'terms.content.title': 'Nutzerinhalte',
  'terms.content.ownership':
    'Du bleibst Eigentümer der Aufnahmen und Inhalte, die du erstellst oder hochlädst.',
  'terms.content.license':
    'Du räumst dem Herausgeber eine nicht ausschließliche, weltweite, kostenlose Lizenz ein, beschränkt auf Hosting, Sicherung, Anzeige und technische Bereitstellung für den Betrieb des Dienstes (einschließlich von dir freigegebenem öffentlichen Teilen).',
  'terms.content.responsibility':
    'Du versicherst, über die erforderlichen Rechte an hochgeladenen Inhalten zu verfügen (Stimmen, Werke usw.), und verpflichtest dich, keine rechtswidrigen Inhalte hochzuladen.',
  'terms.use.title': 'Zulässige Nutzung',
  'terms.use.body':
    'Missbrauch des Dienstes ist untersagt (Eindringen, vorsätzliche Überlastung, Schädigung anderer Nutzer, illegale Inhalte, Umgehung von Sicherheitsmaßnahmen). Bei schwerwiegendem Verstoß kann der Herausgeber ein Konto sperren oder löschen.',
  'terms.availability.title': 'Verfügbarkeit',
  'terms.availability.body':
    'Der Herausgeber bemüht sich um einen kontinuierlichen Dienst, gewährleistet aber keine ununterbrochene Verfügbarkeit. Wartung, Ausfälle oder Änderungen können vorkommen. Der Dienst wird „wie besehen“ bereitgestellt.',
  'terms.liability.title': 'Haftung',
  'terms.liability.body':
    'Soweit gesetzlich zulässig haftet der Herausgeber nicht für indirekte Schäden, Verlust lokaler nicht synchronisierter Daten oder Folgen nicht konformer Nutzung. Nichts in diesen Bedingungen schließt die Haftung für Vorsatz oder grobe Fahrlässigkeit oder zwingende Verbraucherrechte aus.',
  'terms.privacy.title': 'Personenbezogene Daten',
  'terms.privacy.body':
    'Die Verarbeitung personenbezogener Daten ist beschrieben in der',
  'terms.changes.title': 'Änderungen der Bedingungen',
  'terms.changes.body':
    'Der Herausgeber kann diese Bedingungen ändern. Das Inkrafttreten steht oben auf der Seite. Weiterbenutzung nach einer Aktualisierung gilt als Annahme. Bei einer wesentlichen Änderung im Zusammenhang mit einem kostenpflichtigen Angebot erfolgt vor dem Kauf eine klare Information.',
  'terms.law.title': 'Anwendbares Recht',
  'terms.law.body':
    'Diese Bedingungen unterliegen französischem Recht. Bei Streitigkeiten kannst du {email} kontaktieren. Scheitert eine einvernehmliche Lösung, sind die zuständigen französischen Gerichte angerufen, vorbehaltlich zwingender Verbraucherschutzvorschriften.',
  'terms.legalLink': 'Siehe auch das',

  'sitemap.title': 'Sitemap',
  'sitemap.close': 'Sitemap schließen',
  'sitemap.app.title': 'Anwendung',
  'sitemap.app.home': 'Rekorder',
  'sitemap.account.title': 'Konto',
  'sitemap.legal.title': 'Rechtliches',

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
  'account.pseudo.lengthHint': '3–40 Zeichen, ohne @',
  'account.pseudo.customizeHint':
    'Dein Anzeigename wurde automatisch erzeugt. Passe ihn an, damit er unter deinen geteilten Songs erscheint.',
  'account.pseudo.available': 'verfügbar',
  'account.pseudo.unavailable': 'nicht verfügbar',
  'account.pseudo.current': 'mein aktueller Name',
  'account.save': 'Speichern',
  'account.saving': 'Wird gespeichert…',
  'account.saved': 'Gespeichert.',
  'account.error.pseudoTooShort': 'Anzeigename muss mindestens 3 Zeichen haben.',
  'account.error.pseudoTooLong': 'Anzeigename zu lang (max. 40 Zeichen).',
  'account.error.pseudoInvalidChars':
    'Der Anzeigename darf kein @ enthalten.',
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

  'auth.close': 'Anmeldung schließen',
  'auth.signIn.title': 'Anmelden oder Konto erstellen',
  'auth.signIn.lead':
    'Kein Passwort.\nGib deine E-Mail oder deinen Anzeigenamen ein.\nDein Konto wird erstellt, falls es noch nicht existiert.\nÖffne den Link in der E-Mail (30 Minuten gültig, einmalig).\nDu bleibst auf diesem Gerät angemeldet, bis du dich abmeldest.',
  'auth.signIn.email': 'E-Mail',
  'auth.signIn.emailPlaceholder': 'du@beispiel.com',
  'auth.signIn.identifier': 'E-Mail oder Anzeigename',
  'auth.signIn.identifierPlaceholder': 'du@beispiel.com oder max22',
  'auth.signIn.submit': 'Weiter',
  'auth.signIn.sending': 'Wird gesendet…',
  'auth.sent.title': 'Posteingang prüfen',
  'auth.sent.body':
    'Eine E-Mail mit einem Anmelde-Link wurde gerade gesendet. Öffne ihn, um fortzufahren — dein Konto wird beim ersten Klick erstellt, falls nötig.',
  'auth.sent.bodyWithEmail':
    'Eine E-Mail mit einem Anmelde-Link wurde gerade an {email} gesendet. Öffne ihn, um fortzufahren — dein Konto wird beim ersten Klick erstellt, falls nötig.',
  'auth.sent.hint':
    'Der Link läuft in 30 Minuten ab und kann nur einmal verwendet werden. Schau auch im Spam nach.',
  'auth.sent.retry': 'Andere Kennung verwenden',
  'auth.sent.devHint':
    'Lokal kommt die E-Mail möglicherweise nicht an — nutze den Button unten, um dich sofort anzumelden.',
  'auth.sent.openLink': 'Anmelde-Link öffnen',
  'auth.error.invalidEmail': 'Ungültige E-Mail-Adresse.',
  'auth.error.invalidIdentifier': 'Ungültige E-Mail oder Anzeigename.',
  'auth.error.rateLimited':
    'Zu viele Anfragen für diese E-Mail. Versuche es in einer Stunde erneut.',
  'auth.error.emailFailed': 'E-Mail konnte nicht gesendet werden. Später erneut versuchen.',
  'auth.error.linkInvalid': 'Ungültiger Anmelde-Link.',
  'auth.error.linkExpired': 'Dieser Link ist abgelaufen. Fordere einen neuen an.',
  'auth.error.linkUsed': 'Dieser Link wurde bereits verwendet. Fordere einen neuen an.',
  'auth.email.welcome.subject': 'Willkommen bei PolyRecorder',
  'auth.email.welcome.text':
    'Willkommen! Dein PolyRecorder-Konto ist bereit.\nDenk daran, deinen Anzeigenamen zu ändern (er wurde automatisch erzeugt).\n\nUm dein Konto zu aktivieren und dich anzumelden, öffne diesen Link (30 Minuten gültig, einmalig):\n\n{link}\n\nDanach kannst du Aufnahmen machen, überlagern und herunterladen.\n\nWenn du das nicht angefordert hast, ignoriere diese E-Mail.',
  'auth.email.welcome.html':
    '<p>Willkommen&nbsp;! Dein <strong>PolyRecorder</strong>-Konto ist bereit.</p><p>Denk daran, deinen Anzeigenamen zu ändern (er wurde automatisch erzeugt).</p><p>Um dein Konto zu aktivieren und dich anzumelden, öffne diesen Link (30&nbsp;Minuten gültig, einmalig):</p><p><a href="{link}">Konto aktivieren</a></p><p>Danach kannst du Aufnahmen machen, überlagern und herunterladen.</p><p>Wenn du das nicht angefordert hast, ignoriere diese E-Mail.</p>',
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
  'tracks.highlight': '{name} hervorheben',
  'tracks.delete': '{name} löschen',
  'tracks.delete.confirm': '„{name}“ löschen?',
  'tracks.cloudSave': '{name} in die Cloud speichern',
  'tracks.cloudSaving': 'Wird gespeichert…',
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
  'help.shortcuts.closePanels':
    'Hilfe / Einstellungen / Konto / Bibliothek schließen',

  'nav.library': 'Bibliothek',

  'cloud.error.tooLarge': 'Datei zu groß (max. 100 MB).',
  'cloud.error.s3NotConfigured': 'Cloud-Speicher ist nicht konfiguriert.',
  'cloud.error.unauthorized': 'Melde dich an, um in die Cloud zu speichern.',
  'cloud.error.uploadFailed': 'Cloud-Upload fehlgeschlagen. Bitte erneut versuchen.',
  'cloud.error.openFailed': 'Dieses Lied konnte nicht geöffnet werden.',

  'library.title': 'Bibliothek',
  'library.close': 'Bibliothek schließen',
  'library.empty': 'Noch keine Gruppen.',
  'library.group': 'Gruppe',
  'library.repertoire': 'Repertoire',
  'library.song': 'Lied',
  'library.group.meta': '{repertoires} · {songs}',
  'library.count.repertoire.one': '{count} Repertoire',
  'library.count.repertoire.other': '{count} Repertoires',
  'library.count.song.one': '{count} Lied',
  'library.count.song.other': '{count} Lieder',
  'library.count.track.one': '{count} Spur',
  'library.count.track.other': '{count} Spuren',
  'library.addGroup': 'Neue Gruppe',
  'library.addRepertoire': 'Neues Repertoire',
  'library.addSong': 'Neues Lied',
  'library.rename': 'Umbenennen',
  'library.delete': 'Löschen',
  'library.open': 'Öffnen',
  'library.namePrompt': 'Name',
  'library.deleteConfirm': '„{name}“ und Inhalt löschen?',
  'library.opening': 'Wird geöffnet…',
  'library.expand': '{name} ausklappen',
  'library.collapse': '{name} einklappen',
  'library.error': 'Aktion fehlgeschlagen. Bitte erneut versuchen.',
  'library.public': 'Öffentlich machen',
  'library.private': 'Privat machen',
  'library.public.on': 'Öffentlich',
  'library.public.off': 'Privat',
  'library.share': 'Teilen',
  'library.share.disabled': 'Mach das Lied öffentlich, um es zu teilen.',
  'library.share.copy': 'Link kopieren',
  'library.share.copied': 'Link kopiert',
  'library.share.whatsapp': 'WhatsApp',
  'library.share.native': 'Teilen…',
  'library.share.title': '„{name}“ teilen',

  'song.view.notFound': 'Dieses Lied fehlt oder ist privat.',
  'song.view.shared': 'geteilt',
  'song.og.description': '{tracks} · Anhören auf PolyRecorder',

  'settings.title': 'Einstellungen',
  'settings.close': 'Einstellungen schließen',
  'settings.appearance': 'Erscheinungsbild:',
  'settings.theme.aria': 'Design',
  'settings.theme.system': 'Auto (Browser)',
  'settings.theme.light': 'Hell',
  'settings.theme.dark': 'Dunkel',
  'settings.autoplay': 'Nach Aufnahmeende automatisch abspielen',
  'settings.autoCloudSave': 'Spuren automatisch in der Cloud speichern',
  'settings.autoCloudSave.hint':
    'Wenn deaktiviert, erscheint an jeder lokalen Spur ein Button zum manuellen Hochladen.',
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
