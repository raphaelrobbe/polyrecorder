import type { MessageKey } from './fr'

/** German UI copy — please review. */
export const de: Record<MessageKey, string> = {
  'brand.tagline': 'Aufnehmen, überlagern, teilen, kollaborieren.',
  'brand.homeAria': 'Zurück zur polyrecorder-Startseite',
  'seo.home.title': 'polyrecorder — Aufnehmen, überlagern, teilen, kollaborieren',
  'seo.home.description':
    'Mehrspur-Rekorder im Browser: Takes überlagern, Sessions teilen und online zusammenarbeiten. Kostenlos, ohne Installation.',
  'seo.help.description':
    'polyrecorder-Hilfe: Gastmodus, Simple/Mix/Ausrichtung/Schneiden, Cloud-Bibliothek, Teilen, FAQ und Tastenkürzel.',
  'seo.legal.description':
    'Impressum von polyrecorder: Herausgeber, Hosting und geistiges Eigentum.',
  'seo.privacy.description':
    'Datenschutzerklärung von polyrecorder: erhobene Daten, Zwecke und deine Rechte.',
  'seo.register.description':
    'Verzeichnis von Verarbeitungstätigkeiten von polyrecorder (DSGVO Art. 30): Konto, Cloud-Bibliothek, Kontakt und Protokolle.',
  'seo.terms.description':
    'Nutzungsbedingungen von polyrecorder: Konto, Inhalte und Verantwortlichkeiten.',
  'seo.contact.description':
    'polyrecorder kontaktieren: Formular für Fragen, Meldungen und kontobezogene Anliegen.',
  'seo.sitemap.description':
    'Sitemap von polyrecorder: App-Seiten, Konto und rechtliche Informationen.',
  'seo.library.user.description':
    'Öffentliche Bibliothek von @{pseudo} auf polyrecorder — geteilte Gruppen, Repertoires und Sessions.',
  'seo.library.group.description':
    'Gruppe „{name}“ auf polyrecorder — geteilte Repertoires und Songs.',
  'seo.library.repertoire.description':
    'Repertoire „{name}“ auf polyrecorder — geteilte Songs und Sessions.',
  'seo.library.song.description':
    '„{name}“ auf polyrecorder — geteilte Aufnahmesessions.',

  'deck.ariaLabel': 'Rekorder',
  'deck.toolsAria': 'Bibliothek und Modi',
  'deck.newSession': 'Neue Sitzung',
  'deck.newSession.back': 'Zurück',

  'common.close': 'Schließen',
  'common.delete': 'Löschen',
  'common.validate': 'Bestätigen',

  'error.title': 'Ups',
  'error.lead':
    'Etwas ist schiefgelaufen. Du kannst zum Rekorder zurückkehren und es erneut versuchen.',
  'error.home': 'Zurück zum Rekorder',

  'nav.help': 'Hilfe',
  'nav.settings': 'Präferenzen',
  'nav.signIn': 'Anmelden',
  'nav.signOut': 'Abmelden',
  'nav.accountMenu': 'Kontomenü',
  'nav.accountSettings': 'Kontoeinstellungen',
  'nav.legal': 'Impressum',
  'nav.privacy': 'Datenschutz',
  'nav.processingRegister': 'Verarbeitungsverzeichnis',
  'nav.terms': 'AGB',
  'nav.contact': 'Kontakt',
  'nav.sitemap': 'Sitemap',

  'contact.title': 'Kontakt',
  'contact.close': 'Kontaktformular schließen',
  'contact.formLink': 'Kontaktformular',
  'contact.lead':
    'Eine Frage, ein Problem, eine Idee? Schreib uns — wir antworten per E-Mail.',
  'contact.email': 'E-Mail',
  'contact.message': 'Nachricht',
  'contact.captcha': 'Anti-Robot-Prüfung',
  'contact.submit': 'Senden',
  'contact.sending': 'Senden…',
  'contact.success':
    'Nachricht gesendet. Du erhältst eine Antwort an die angegebene Adresse.',
  'contact.error.email': 'Gib eine gültige E-Mail-Adresse ein.',
  'contact.error.message': 'Schreib eine Nachricht vor dem Senden.',
  'contact.error.captcha': 'Schließe die Anti-Robot-Prüfung ab.',
  'contact.error.rateLimited':
    'Zu viele Nachrichten. Versuche es in ein paar Minuten erneut.',
  'contact.error.send': 'Senden gerade nicht möglich. Versuche es später erneut.',

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
    '{name} ({site}), {address}, erreichbar über das {email}, ist Verantwortlicher für die über die Anwendung erhobenen personenbezogenen Daten.',
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
    'Du hast Rechte auf Auskunft, Berichtigung, Löschung, Widerspruch, Einschränkung und Datenübertragbarkeit. Du kannst sie über das {email} ausüben oder indem du dein Konto in den Einstellungen löschst. Du kannst auch eine Beschwerde bei einer Aufsichtsbehörde einreichen (in Frankreich: CNIL, cnil.fr).',
  'privacy.cookies.title': 'Cookies und lokaler Speicher',
  'privacy.cookies.guest':
    'Als Gast setzt polyrecorder keine Cookies.',
  'privacy.cookies.signedIn':
    'Nach der Anmeldung wird ein einziges httpOnly-Sitzungscookie ({cookie}) verwendet, das für die Authentifizierung unbedingt erforderlich ist. Es dient nicht dem Werbe-Tracking.',
  'privacy.cookies.localStorage':
    'Oberflächeneinstellungen (Sprache, Theme, Aufnahmeoptionen, aktives Lied) werden im localStorage des Browsers gespeichert, nicht in Cookies.',
  'privacy.legalLink': 'Siehe auch das',
  'privacy.termsLink': 'und die',
  'privacy.gdpr.title': 'DSGVO-Konformität',
  'privacy.gdpr.body':
    'Gemäß DSGVO beschreibt ein Verzeichnis von Verarbeitungstätigkeiten Zwecke, Datenkategorien, Empfänger, Speicherdauern und Sicherheitsmaßnahmen. Siehe das',

  'register.title': 'Verzeichnis von Verarbeitungstätigkeiten',
  'register.close': 'Verarbeitungsverzeichnis schließen',
  'register.intro':
    'Dieses Dokument ist das Verzeichnis von Verarbeitungstätigkeiten des Verantwortlichen für polyrecorder (Art. 30 DSGVO). Es gibt einen Überblick über die mit dem Dienst verbundenen Verarbeitungen personenbezogener Daten.',
  'register.dates':
    'Verzeichnis erstellt am {created}. Zuletzt aktualisiert am {updated}.',
  'register.controller.title': 'Verantwortlicher',
  'register.controller.body':
    '{name} ({site}), {address}.',
  'register.controller.contact':
    'Kontakt für Betroffenenrechte und Datenschutzfragen: {email}.',
  'register.controller.dpo':
    'Es wurde kein Datenschutzbeauftragter (DSB) bestellt.',
  'register.summary.title': 'Übersicht der Verarbeitungen',
  'register.summary.col.ref': 'Nr. / Ref.',
  'register.summary.col.name': 'Name der Verarbeitung',
  'register.summary.col.purpose': 'Zweck',
  'register.summary.col.sensitive': 'Sensible Daten',
  'register.sensitive.no': 'Nein',
  'register.fiche.created': 'Erstellt',
  'register.fiche.updated': 'Zuletzt aktualisiert',
  'register.fiche.purpose': 'Hauptzweck',
  'register.fiche.data': 'Betroffene Daten',
  'register.fiche.retention': 'Speicherdauer',
  'register.fiche.subjects': 'Betroffene Personen',
  'register.fiche.recipients': 'Empfänger',
  'register.fiche.security': 'Sicherheitsmaßnahmen',
  'register.fiche.transfers': 'Übermittlungen außerhalb der EU',
  'register.fiche.sensitive': 'Sensible Daten',
  'register.privacyLink': 'Mehr zu deinen Rechten in der',
  'register.legalLink': 'und im',

  'register.account.ref': '1',
  'register.account.name': 'Konto und Authentifizierung',
  'register.account.purpose':
    'Benutzerkonten anlegen und authentifizieren',
  'register.account.subPurposes':
    'Unterzwecke: Magic Links zur Anmeldung / E-Mail-Bestätigung senden; Anzeigenamen (Pseudo) anpassen; Zugang zur Cloud-Bibliothek absichern.',
  'register.account.data':
    'E-Mail-Adresse, Pseudo, Authentifizierungs-Token / Sitzungen (httpOnly-Sitzungscookie), kontobezogene Daten.',
  'register.account.retention':
    'Solange das Konto besteht; Löschung des Kontos löscht zugehörige Daten. Magic Links verfallen schnell (einmalig, kurzlebig).',
  'register.account.subjects':
    'Nutzer mit polyrecorder-Konto.',
  'register.account.recipients':
    'Verantwortlicher; Hosting- und Transaktionsmail-Auftragsverarbeiter (Scaleway, Frankreich / Niederlande). Das Pseudo kann öffentlich sichtbar sein, wenn Teilen aktiviert ist.',
  'register.account.security':
    'Magic-Link-Authentifizierung, httpOnly-Sitzungscookie, anwendungsseitige Zugriffskontrolle, HTTPS, Backups beim Hoster.',
  'register.account.transfers':
    'Keine Übermittlung außerhalb der EU für diese Verarbeitung (Scaleway-Hosting und -Mail im EWR).',

  'register.cloud.ref': '2',
  'register.cloud.name': 'Cloud-Bibliothek',
  'register.cloud.purpose':
    'Aufnahmen des Nutzers hosten und organisieren',
  'register.cloud.subPurposes':
    'Unterzwecke: Gruppen, Repertoires, Songs, Metadaten und Audiodateien speichern; Sessions wieder öffnen; öffentliches Teilen ermöglichen, wenn der Nutzer es aktiviert.',
  'register.cloud.data':
    'Bibliotheksmetadaten (Namen, Struktur, Lautstärken, Offsets usw.), hochgeladene Audiodateien, technische Objekt-IDs, Bezug zum Eigentümerkonto, Einstellungen fürs öffentliche Teilen.',
  'register.cloud.retention':
    'Solange Konto oder Inhalte bestehen; Löschung mit Konto- oder Inhaltslöschung durch den Nutzer.',
  'register.cloud.subjects':
    'Angemeldete Nutzer der Cloud-Bibliothek; Besucher ausdrücklich öffentlich geteilter Inhalte.',
  'register.cloud.recipients':
    'Kontoinhaber; über öffentliches Teilen berechtigte Personen (falls aktiviert); Object-Storage-/Datenbank-Auftragsverarbeiter (Scaleway, Frankreich / Niederlande).',
  'register.cloud.security':
    'Kontobezogene Zugriffskontrolle, vorab signierte Upload-URLs, HTTPS, Anwendungsisolation, Backups beim Hoster.',
  'register.cloud.transfers':
    'Keine Übermittlung außerhalb der EU für die Speicherung (Frankreich / Niederlande).',

  'register.contact.ref': '3',
  'register.contact.name': 'Kontaktformular',
  'register.contact.purpose':
    'Anfragen über das Kontaktformular bearbeiten',
  'register.contact.subPurposes':
    'Unterzwecke: Spam begrenzen (Anti-Bot-Prüfung); Nachricht an den Herausgeber zustellen und per E-Mail antworten.',
  'register.contact.data':
    'Angegebene E-Mail, Nachrichteninhalt, Anti-Bot-Token (Cloudflare Turnstile), minimale technische Metadaten der Übermittlung.',
  'register.contact.retention':
    'So lange wie zur Bearbeitung der Anfrage und des Schriftverkehrs nötig; kein Marketing-Archiv.',
  'register.contact.subjects':
    'Jede Person, die das Kontaktformular nutzt (mit oder ohne Konto).',
  'register.contact.recipients':
    'Verantwortlicher; Scaleway (E-Mail-Versand); Cloudflare (Turnstile-Prüfung).',
  'register.contact.security':
    'HTTPS, Ratenbegrenzung, Turnstile-Captcha, eingeschränkter Zugang zum Kontaktpostfach.',
  'register.contact.transfers':
    'Cloudflare (Turnstile) kann eine Verarbeitung außerhalb der EU unter vertraglichen Garantien des Auftragsverarbeiters (SCC / DPA) beinhalten. Der E-Mail-Versand bleibt bei Scaleway (EWR).',

  'register.logs.ref': '4',
  'register.logs.name': 'Technische und Sicherheitsprotokolle',
  'register.logs.purpose':
    'Betrieb, Diagnose und Sicherheit des Dienstes gewährleisten',
  'register.logs.subPurposes':
    'Unterzwecke: Serverfehler analysieren; Missbrauch verhindern (z. B. Ratenlimits am Kontaktformular); Verfügbarkeit sichern.',
  'register.logs.data':
    'Fehlerprotokolle und minimale technische Spuren (Zeitstempel, Fehlertyp, ggf. IP oder technische IDs je nach Komponente).',
  'register.logs.retention':
    'Begrenzt auf Diagnose- und Sicherheitsbedarf (kurz, dann Löschung oder Rotation).',
  'register.logs.subjects':
    'Nutzer und Besucher, deren technische Aktivität Protokolle erzeugt.',
  'register.logs.recipients':
    'Verantwortlicher; Hoster (Scaleway) im Rahmen des Infrastrukturbetriebs.',
  'register.logs.security':
    'Eingeschränkter Infrastrukturzugang, HTTPS, betriebliche Best Practices.',
  'register.logs.transfers':
    'Keine Übermittlung außerhalb der EU für bei Scaleway gehostete Protokolle (EWR) vorgesehen.',

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
    'Diese Bedingungen unterliegen französischem Recht. Bei Streitigkeiten kannst du das {email} nutzen. Scheitert eine einvernehmliche Lösung, sind die zuständigen französischen Gerichte angerufen, vorbehaltlich zwingender Verbraucherschutzvorschriften.',
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
  'account.pseudo.lengthHint':
    '3–20 Zeichen, nur Buchstaben, Ziffern und _',
  'account.pseudo.customizeHint':
    'Dein Anzeigename wurde automatisch erzeugt. Passe ihn an, damit er unter deinen geteilten Songs erscheint.',
  'account.pseudo.available': 'verfügbar',
  'account.pseudo.unavailable': 'nicht verfügbar',
  'account.pseudo.current': 'mein aktueller Name',
  'account.save': 'Speichern',
  'account.saving': 'Wird gespeichert…',
  'account.saved': 'Gespeichert.',
  'account.error.pseudoTooShort': 'Anzeigename muss mindestens 3 Zeichen haben.',
  'account.error.pseudoTooLong': 'Anzeigename zu lang (max. 20 Zeichen).',
  'account.error.pseudoInvalidChars':
    '3–20 Zeichen, nur Buchstaben, Ziffern und _',
  'account.error.pseudoDoubleUnderscore': 'Keine zwei _ hintereinander',
  'account.error.pseudoEdgeUnderscore': 'Kein _ am Anfang oder Ende',
  'account.error.pseudoReserved': 'Dieser Anzeigename ist reserviert.',
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
  'account.stats.recording': 'Aufnahmezeit',
  'account.stats.library': 'Bibliothek',
  'account.stats.hour.one': '{count} Stunde',
  'account.stats.hour.other': '{count} Stunden',
  'account.stats.minute.one': '{count} Minute',
  'account.stats.minute.other': '{count} Minuten',
  'account.stats.second.one': '{count} Sekunde',
  'account.stats.second.other': '{count} Sekunden',

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
  'auth.sent.draftHint':
    'Deine Aufnahmen bleiben auf diesem Gerät, bis du den Link öffnest. Nutze denselben Browser — nichts geht an den Server, solange du nicht angemeldet bist.',
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
  'auth.email.welcome.subject': 'Willkommen bei polyrecorder',
  'auth.email.welcome.text':
    'Willkommen! Dein polyrecorder-Konto ist bereit.\nDenk daran, deinen Anzeigenamen zu ändern (er wurde automatisch erzeugt).\n\nUm dein Konto zu aktivieren und dich anzumelden, öffne diesen Link (30 Minuten gültig, einmalig):\n\n{link}\n\nDanach kannst du Aufnahmen machen, überlagern und herunterladen.\n\nWenn du das nicht angefordert hast, ignoriere diese E-Mail.',
  'auth.email.welcome.html':
    '<p>Willkommen&nbsp;! Dein <strong style="font-weight:800">polyrecorder</strong>-Konto ist bereit.</p><p>Denk daran, deinen Anzeigenamen zu ändern (er wurde automatisch erzeugt).</p><p>Um dein Konto zu aktivieren und dich anzumelden, öffne diesen Link (30&nbsp;Minuten gültig, einmalig):</p><p><a href="{link}">Konto aktivieren</a></p><p>Danach kannst du Aufnahmen machen, überlagern und herunterladen.</p><p>Wenn du das nicht angefordert hast, ignoriere diese E-Mail.</p>',
  'auth.email.signIn.subject': 'Dein polyrecorder-Anmelde-Link',
  'auth.email.signIn.text':
    'Hier ist dein Anmelde-Link für polyrecorder (30 Minuten gültig, einmalig):\n\n{link}\n\nWenn du das nicht angefordert hast, ignoriere diese E-Mail.',
  'auth.email.signIn.html':
    '<p>Hier ist dein Anmelde-Link für <strong style="font-weight:800">polyrecorder</strong> (30&nbsp;Minuten gültig, einmalig):</p><p><a href="{link}">Anmelden</a></p><p>Wenn du das nicht angefordert hast, ignoriere diese E-Mail.</p>',
  'auth.emailChange.subject': 'Anfrage zur E-Mail-Änderung bei polyrecorder',
  'auth.emailChange.text':
    'Es wurde beantragt, die E-Mail-Adresse eines polyrecorder-Kontos auf dieses Postfach zu ändern.\n\nWenn du das nicht angefordert hast, ignoriere diese E-Mail — deine Adresse ändert sich nicht.\n\nAndernfalls bestätige die Änderung mit diesem Link (30 Minuten gültig, einmalig):\n\n{link}',
  'auth.emailChange.html':
    '<p>Es wurde beantragt, die E-Mail-Adresse eines <strong style="font-weight:800">polyrecorder</strong>-Kontos auf dieses Postfach zu ändern.</p><p>Wenn du das nicht angefordert hast, ignoriere diese E-Mail — deine Adresse ändert sich nicht.</p><p>Andernfalls bestätige die Änderung mit diesem Link (30&nbsp;Minuten gültig, einmalig):</p><p><a href="{link}">Neue E-Mail bestätigen</a></p>',

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
  'song.title.aria': 'Liedtitel',
  'song.title.openLibrary': 'Lied in der Bibliothek öffnen',
  'session.defaultTitle': 'Meine Polyphonie',
  'session.prev': 'Vorherige Session',
  'session.next': 'Nächste Session',

  'capture.nextTrack': 'Nächste Spur',
  'capture.nextTrack.hint':
    'Nächste Spur: spielt diesen Take ab und nimmt gleichzeitig den nächsten auf.',
  'capture.discard': 'Take verwerfen und neu starten',
  'capture.record': 'Aufnehmen',
  'capture.import': 'Audiodatei importieren',
  'capture.import.hint':
    'Audiodatei von diesem Gerät importieren (wird zu einer Spur)',
  'capture.metronome': 'Metronom',
  'capture.metronome.hint':
    'Metronomspur hinzufügen (Tempo auf der Spur einstellbar, Standard 60 BPM)',
  'capture.metronome.bpm': 'Tempo in Schlägen pro Minute',
  'capture.metronome.unit': 'BPM',
  'capture.metronome.apply': 'OK',
  'capture.dropHint': 'Zum Importieren ablegen',
  'capture.stop': 'Stopp',
  'capture.forgottenStop': 'Hast du vergessen, die Aufnahme zu stoppen?',
  'capture.forgottenStop.discard':
    'Falls ja, kannst du die laufende Aufnahme mit dem Knopf {discard} abbrechen',

  'track.metronome': 'Metronom {bpm} BPM',
  'track.metronome.label': 'Metronom',

  'mix.restart': 'Zum Anfang',
  'mix.stop': 'Stop',
  'mix.play': 'Wiedergabe',
  'mix.pause': 'Pause',
  'mix.download': 'Mix herunterladen (MP3)',
  'mix.download.hint': 'Mix der ausgewählten Spuren herunterladen (MP3)',
  'mix.seekAria': 'Wiedergabeposition',
  'mix.seek.back': '- {seconds} s',
  'mix.seek.back.aria': '{seconds} Sekunden zurück',
  'mix.seek.back.hint': 'Abspielposition {seconds} Sekunden zurücksetzen',
  'mix.seek.forward': '+ {seconds} s',
  'mix.seek.forward.aria': '{seconds} Sekunden vor',
  'mix.seek.forward.hint': 'Abspielposition {seconds} Sekunden vorspulen',
  'mix.masterVolume': 'Master-Lautstärke',
  'mix.clip.record.hint':
    'Übersteuerung bei der Aufnahme. Nimm die Spur neu auf und prüfe den Mikrofon-Eingangspegel.',
  'mix.clip.record.aria': 'Übersteuerung bei der Aufnahme',
  'mix.clip.bus':
    'Mix übersteuert: Master-Lautstärke (oder Spurpegel) senken.',
  'settings.autoMasterPreventClip':
    'Master-Lautstärke automatisch senken, um Übersteuerung zu vermeiden',
  'settings.autoMasterPreventClip.hint':
    'Wenn der Mix 0 dBFS überschreitet, senkt der Master auf ~0,85. Du kannst ihn manuell anheben; bei erneuter Übersteuerung erscheint eine Warnung.',
  'settings.autoMasterBoost':
    'Master-Lautstärke automatisch auf ~0,85 anheben',
  'settings.autoMasterBoost.hint':
    'Wenn der Mix zu leise ist, hebt der Master auf einen Peak von ~0,85. Ausschalten, wenn du lieber leiser bleibst.',
  'mix.autoMaster.hint.prevent':
    'Die Master-Lautstärke wurde automatisch gesenkt, um Übersteuerung zu vermeiden.',
  'mix.autoMaster.hint.boost':
    'Die Master-Lautstärke wurde automatisch auf ~0,85 angehoben.',

  'mode.groupAria': 'Arbeitsmodi',
  'mode.label': 'Modus',
  'mode.simple': 'Einfach',
  'mode.simple.hint': 'Einfacher Modus: Aufnehmen und Abspielen',
  'mode.mix': 'Mix',
  'mode.mix.hint': 'Mix-Modus: Lautstärke pro Spur und Master',
  'mode.align': 'Ausrichten',
  'mode.align.hint': 'Ausricht-Modus: Spurensynchronisation',
  'mode.cut': 'Schneiden',
  'mode.cut.hint': 'Schnittmodus: teilen, stummschalten, zusammenführen',

  'cut.idle.hint':
    'Setze den Abspielcursor, dann teilen, um die Spuren zu schneiden',
  'cut.select.hint': 'Wähle eine oder mehrere Spuren',
  'cut.select.confirm': 'Bestätigen',
  'cut.cancel': 'Abbrechen',
  'cut.reset': 'Zurücksetzen',
  'cut.rate.aria': 'Wiedergabegeschwindigkeit',
  'cut.rate.half': 'Wiedergabe mit halber Geschwindigkeit',
  'cut.rate.quarter': 'Wiedergabe mit Viertelgeschwindigkeit',
  'cut.edit.hint':
    'Am Abspielcursor teilen, Segmente wählen, dann Stummschalten oder Zusammenführen',
  'cut.scissors': 'Am Abspielcursor teilen',
  'cut.scissors.hint': 'Alle Segmente am Abspielcursor teilen',
  'cut.scissors.aria': 'Am Abspielcursor teilen',
  'cut.mute': 'Stummschalten',
  'cut.mute.hint': 'Gewählte Segmente stummschalten (nicht destruktiv)',
  'cut.mute.barAria': 'Stummgeschaltete Bereiche von {name}',
  'cut.mute.barTitle': 'Stummgeschalteter Abschnitt',
  'cut.mute.remove': 'Diesen Mute entfernen',
  'cut.mute.removeAria': 'Stummgeschalteten Bereich entfernen',
  'cut.merge': 'Zusammenführen',
  'cut.merge.hint': 'Gewählte Segmente zu einer neuen Spur zusammenführen',
  'cut.merge.busy': 'Zusammenführung…',
  'cut.merge.progress': 'Zusammenführung läuft…',
  'cut.merge.disabledEmpty': 'Mindestens ein Segment wählen',
  'cut.merge.disabledOverlap':
    'Nicht möglich: gewählte Segmente überlappen auf der Timeline',
  'cut.merge.trackName': 'Fusion · {names}',
  'cut.merge.trackNameFallback': 'Fusion',
  'cut.track.select': 'Diese Spur in den Schnittmodus einbeziehen',
  'cut.track.selectAria': '{name} fürs Schneiden auswählen',
  'cut.segments.aria': 'Segmente von {name}',
  'cut.segment.toggle': 'Dieses Segment aus- oder abwählen',

  'piano.toggle': 'Piano',
  'piano.toggle.show': 'Klavier anzeigen',
  'piano.toggle.hide': 'Klavier ausblenden',
  'piano.keyboardAria': 'Klaviatur (zwei Oktaven)',
  'piano.keyAria': 'Taste {note}',

  'deck.autoAlign.label': 'Auto-Ausrichtung per Auftakt',
  'deck.autoAlign.on': 'An',
  'deck.autoAlign.off': 'Aus',
  'deck.metronome': 'Metronom',
  'deck.metronome.add': 'Metronom hinzufügen',
  'deck.howtoLink': 'Anleitung',

  'align.latency.label': 'Wiedergabe-Vorlauf',
  'align.latency.about': 'Über den Wiedergabe-Vorlauf',
  'align.latency.adjust': 'Monitoring-Vorlauf anpassen',
  'align.latency.minus': 'Monitoring etwas früher starten (−5 ms)',
  'align.latency.plus': 'Monitoring etwas später starten (+5 ms)',
  'align.latency.input': 'Wiedergabe-Vorlauf in Millisekunden',
  'align.latency.tip':
    'Bei „Nächste Spur“ werden vorhandene Takes mit etwas Hardware-Latenz im Kopfhörer abgespielt. polyrecorder startet dieses Monitoring etwas früher, damit deine neue Stimme an der richtigen Stelle der Timeline landet. Passe den Wert an (±5 ms oder direkt eingeben), wenn das Monitoring noch zu spät oder zu früh wirkt (auf diesem Gerät gespeichert). Das ist nicht die Auto-Ausrichtung über die 3–4-Markierungen: sie gilt nur während der Aufnahme.',

  'volume.percentAria': '{label} in Prozent',

  'tracks.muteAll.hint': 'Alle Spuren stummschalten / aktivieren',
  'tracks.muteAll.aria': 'Alle Spuren aktivieren',
  'tracks.deleteAll': 'Alle Spuren löschen',
  'tracks.deleteOne.confirm': 'Spur „{name}“ löschen?',
  'tracks.deleteAll.confirm':
    '{count} Spuren löschen? Sie gehen unwiderruflich verloren.',
  'tracks.alignAll.hint':
    'Auto-Ausrichtung für alle Spuren neu berechnen (außer Spur 1)',
  'tracks.alignAll.aria':
    'Auto-Ausrichtung für alle Spuren neu berechnen',
  'tracks.alignCol': 'Auto',
  'tracks.offsetCol': 'Manuell',
  'tracks.align.legend':
    'Auto: Ausrichtung neu aus den 3–4-Markierungen berechnen. Manuell: Spur von Hand verschieben (± ms).',
  'tracks.reorder': '{name} neu anordnen',
  'tracks.audible': 'Hörbar',
  'tracks.muted': 'Stumm',
  'tracks.listen': '{name} anhören',
  'tracks.name.aria': 'Spurname',
  'tracks.uploadedBy': 'Aufgenommen von {pseudo}',
  'tracks.uploadedBy.me': 'Ich',
  'tracks.defaultName': 'Spur {index}',
  'tracks.filenameFallback': 'spur',
  'tracks.volume': 'Lautstärke {name}',
  'tracks.highlight': '{name} hervorheben',
  'tracks.download.progress': 'Spur wird geladen…',
  'tracks.delete': '{name} löschen',
  'tracks.delete.confirm': '„{name}“ löschen?',
  'tracks.delete.referenceLocked':
    'Die Referenzspur kann nicht gelöscht werden, solange die Auto-Ausrichtung über den Auftakt aktiv ist.',
  'tracks.cloudSave': '{name} in die Cloud speichern',
  'tracks.cloudSaving': 'Wird gespeichert…',
  'tracks.ref.hint': 'Referenzspur (Markierungen 1–2–3–4) — tippen, um eine andere zu wählen',
  'tracks.ref.aria': 'Referenz',
  'tracks.ref.badge': 'Ref.',
  'tracks.ref.pickHint': 'Wähle die neue Referenzspur',
  'tracks.ref.pickTarget.aria': '{name} als Referenzspur setzen',
  'tracks.ref.pickCancel': 'Abbrechen',
  'tracks.contentSync': 'sync',
  'tracks.contentSync.aria': '{name} an eine andere Spur synchronisieren',
  'tracks.contentSync.hint':
    'Ausrichtung per Inhaltskorrelation verfeinern: Sync tippen, dann die Zielspur',
  'tracks.contentSync.pickHint': 'Wähle die Spur zum Ausrichten',
  'tracks.contentSync.pickAbout': 'Über Sync',
  'tracks.contentSync.pickTip':
    'Nach einem Punch-in (Aufnahme während der Wiedergabe) startet die neue Spur an der Playhead-Position mit einem vorläufigen Offset. Sync verfeinert die Ausrichtung per Inhaltskorrelation: tippe die Spur mit derselben Passage (oft die, die du im Monitoring gehört hast). polyrecorder sucht die beste Übereinstimmung um den aktuellen Offset. Abbrechen beendet die Auswahl ohne Änderung.',
  'tracks.contentSync.pickTarget.aria': '{from} an {name} ausrichten',
  'tracks.contentSync.pickCancel': 'Abbrechen',
  'tracks.contentSync.weak':
    'Sync: zu wenig gemeinsamer Inhalt — vorläufiger Offset behalten',
  'tracks.contentSync.failed': 'Spur konnte nicht synchronisiert werden',
  'tracks.span.aria': 'Position von {name} auf der Mix-Timeline',
  'tracks.span.seekAria':
    'Wiedergabemarkierung auf der Timeline setzen (Spur {name})',
  'tracks.span.seekHint':
    'Klicken oder ziehen, um die Wiedergabemarkierung zu setzen',
  'tracks.autoAlign': 'Ausrichtung neu berechnen',
  'tracks.autoAlign.named': 'Ausrichtung für {name} neu berechnen',
  'tracks.offset.hint': 'Diese Spur bei der Wiedergabe verschieben',
  'tracks.offset.minus': '{name} um 5 ms früher',
  'tracks.offset.plus': '{name} um 5 ms später',
  'tracks.offset.input': 'Ausrichtung von {name} in Millisekunden',
  'tracks.drag': 'Ziehen zum Umsortieren',

  'warn.attention': 'Achtung',
  'warn.openAlignMode': 'Ausricht-Modus öffnen',
  'warn.disableAutoAlign': 'Auto-Ausrichtung deaktivieren',
  'warn.duplicateName.hint':
    'Zwei Spuren haben denselben Namen. Benenne eine um, um sie zu unterscheiden.',
  'warn.duplicateName.aria': 'Doppelter Name: {name}',
  'warn.beat.chip.aria':
    'Achtung: Problem mit dem Auftakt der Referenzspur. Ausricht-Modus öffnen.',
  'warn.skew.tooltip':
    'Eine Auto-Ausrichtung über 300 ms deutet oft auf Sync-Probleme hin (unklare Markierungen, Latenz usw.). Öffne den Ausricht-Modus zum Prüfen und Anpassen.',
  'warn.skew.short': 'Hohe Auto-Ausrichtung bei {names}.',
  'warn.skew.long':
    'Hohe Auto-Ausrichtung bei {names}. Sync im Ausricht-Modus prüfen.',
  'warn.skew.chip.aria':
    'Hohe Auto-Ausrichtung bei {name}. Ausricht-Modus öffnen.',
  'warn.beat.irregular':
    'Unregelmäßiger oder nicht erkannter 1-2-3-4-Auftakt auf der Referenzspur ({name}).',
  'warn.beat.missing':
    '1-2-3-4-Auftakt auf „{name}“ nicht erkannt ({count}/4 Treffer).',
  'warn.beat.error': 'Auftakt von „{name}“ konnte nicht analysiert werden.',

  'howto.title': 'Anleitung',
  'howto.metro.off': 'Ohne Metronom',
  'howto.metro.on': 'Mit Metronom',
  'howto.metro.add':
    'Füge zuerst das Metronom über den Knopf „Metronom“ unter dem Rekorder hinzu (neben Piano). Es wird die Referenzspur (synthetisches 1-2-3-4): bei jeder Stimme markierst du nur die 3. und 4. Zählzeit laut.',
  'howto.step1': 'auf das Regenbogen-Mikrofon tippen, um aufzunehmen',
  'howto.step2':
    'laut und gleichmäßig 1-2-3-4 sagen (oder ein anderes klares 4er-Signal), dann die erste Stimme singen',
  'howto.step2.metro':
    'das Metronom 1-2-3-4 spielen lassen, aber die 3. und 4. Zählzeit laut markieren (oder ein klarer Laut), dann die erste Stimme singen',
  'howto.step3':
    'auf „Nächste Spur“ tippen (Chevron nach rechts), um direkt die zweite Stimme aufzunehmen',
  'howto.step4':
    'nur die 3. und 4. Zählzeit laut mitsprechen, genau wenn du sie hörst, dann die zweite Stimme singen',
  'howto.step4.metro':
    'wie bei der ersten Stimme: beim 3. und 4. Metronom-Klick laut markieren, dann die zweite Stimme singen',
  'howto.step5': 'für weitere Stimmen wiederholen',
  'howto.step6':
    'am Ende der letzten Stimme auf den Regenbogen-Knopf „Stopp“ tippen',
  'howto.tips':
    'Tipp: nimm in ruhiger Umgebung auf, möglichst mit Kopfhörer oder Ohrhörer—besonders am Handy!',
  'howto.whyNeeded': 'Warum ist das nötig',
  'howto.whyNeeded.about': 'Warum die Auto-Ausrichtung per Auftakt nötig ist',
  'howto.latency':
    'Browser und Audiogeräte erzeugen Latenz (Kopfhörer, Mikrofon, Buffer). Ohne gemeinsame Markierungen verrutschen die Takes. Die vier Markierungen der Referenzspur und die „3-4“ der folgenden Spuren lassen polyrecorder diese Verschiebung messen und automatisch korrigieren.',

  'help.title': 'Hilfe',
  'help.close': 'Hilfe schließen',
  'help.search.placeholder': 'Suchen…',
  'help.search.aria': 'Hilfe durchsuchen',
  'help.search.empty': 'Keine Rubrik entspricht dieser Suche.',
  'help.toc.aria': 'Inhaltsverzeichnis der Hilfe',
  'help.toc.start': 'Einstieg',
  'help.toc.guest': 'Gast & Konto',
  'help.toc.metronome': 'Metronom',
  'help.toc.piano': 'Klavier',
  'help.toc.record': 'Allgemeine Befehle',
  'help.toc.sync': 'Modus Ausrichtung',
  'help.toc.cut': 'Modus Schneiden',
  'help.toc.mix': 'Modus Mix',
  'help.toc.library': 'Bibliothek',
  'help.toc.share': 'Teilen',
  'help.toc.account': 'Konto',
  'help.toc.devices': 'Einstellungen',
  'help.toc.shortcuts': 'Tastenkürzel',
  'help.toc.faq': 'FAQ',

  'help.start.title': 'Schnellstart',
  'help.start.body1':
    'Du kannst sofort loslegen, ohne ein Konto anzulegen. Setz Kopfhörer auf: sonst nimmt das Mikrofon leicht die Lautsprecher wieder auf.',
  'help.start.body2':
    'Mehrere Stimmen im Takt übereinanderlegen: auf der 1. Spur klar „1-2-3-4“ sagen, bevor du singst; auf den folgenden nur „3-4“. Siehe Synchronisation weiter unten.',
  'help.start.howtoLink': 'Zur Ausrichtungs-Anleitung',

  'help.guest.title': 'Gastmodus & Anmeldung',
  'help.guest.body1':
    'Ohne Konto werden deine Aufnahmen nicht gespeichert. Nach einem Take bieten wir die Anmeldung an, damit du sie behalten und teilen kannst.',
  'help.guest.body2':
    'Du meldest dich mit einem Link per E-Mail an (kein Passwort). Öffne ihn im selben Browser: deine lokalen Takes werden übernommen und dann auf dein Konto gespeichert.',
  'help.guest.body3':
    'Wechselst du Gerät oder Browser vor der Anmeldung, findest du diese Takes nicht wieder.',

  'help.metronome.title': 'Metronom',
  'help.metronome.body1':
    'Unter dem Rekorder kannst du ein Metronom hinzufügen. Es dient als Rhythmus-Referenz: auf jeder Stimme sagst du „3-4“ zusammen mit dem 3. und 4. Schlag, um dich darauf auszurichten. Am besten mit Kopfhörern aufnehmen (auch ohne Metronom empfohlen!).',

  'help.piano.title': 'Klavier',
  'help.piano.body1':
    'Die Taste Klavier unter dem Rekorder öffnet eine kleine Klaviatur zum Anstimmen. Mit Kopfhörern kannst du leise eine Note spielen, auch während der Aufnahme!',

  'help.record.title': 'Allgemeine Befehle',
  'help.record.action.import':
    'importiert eine Audiodatei (Drag-and-drop auf den Rekorder geht auch). Übliche Formate: MP3, WAV, OGG, M4A usw.',
  'help.record.action.record':
    'startet einen Take (an der Cursorposition).',
  'help.record.action.next':
    'speichert die aktuelle Spur und startet eine neue, während du die vorherigen hörst.',
  'help.record.action.stopCapture':
    'beendet die Aufnahme und speichert die Spur (außer sie dauert weniger als eine Sekunde).',
  'help.record.action.discard':
    'verwirft den laufenden Take und startet sofort neu.',
  'help.record.action.stopPlay':
    'stoppt die Wiedergabe und springt zum Anfang.',
  'help.record.action.export':
    'exportiert eine MP3, die dem entspricht, was du hörst, wenn du die aktive Session abspielst. Songname, Sessionname (angemeldet) und Spurnamen (wenn nicht alle ausgewählt sind) stehen im Dateinamen.',
  'help.record.mode.simple': 'aufnehmen und hören',
  'help.record.mode.mix': 'Lautstärken regeln',
  'help.record.mode.align': 'Spuren synchronisieren',
  'help.record.mode.cut':
    'einen Abschnitt stummschalten oder Segmente zusammenfügen',
  'help.record.tool.piano': 'zeigt eine kleine Klaviatur zum Anstimmen',
  'help.record.tool.metronome': 'fügt eine Metronomspur hinzu',
  'help.record.body2':
    'Den Projekttitel änderst du oben{f2}. Einen Spurnamen per Klick. Diese Namen erscheinen auch in der heruntergeladenen MP3.',
  'help.record.f2': ' — Tastenkürzel F2',

  'help.sync.title': 'Synchronisation',
  'help.sync.autoAlign.title': 'Auto-Ausrichtung per Auftakt',
  'help.sync.autoAlign.body1':
    'Dieser Modus korrigiert Sync-Probleme zwischen Spuren bei der Aufnahme.',
  'help.sync.autoAlign.body2':
    'Wenn du diesen Modus nutzt (standardmäßig an), muss die erste Spur (Referenz) mit vier klaren, gleichmäßigen Markierungen beginnen (sag „1-2-3-4“, oder einen anderen klaren 4er-Schlag).',
  'help.sync.autoAlign.body3':
    'Auf den folgenden sag nur „3-4“ (oder klare Laute), dann sing.',
  'help.sync.autoAlign.body4':
    'polyrecorder misst damit den Versatz durch Audiolatenz und korrigiert ihn automatisch. Mit einem Metronom als Referenz markierst du auf den Takes nur „3-4“.',
  'help.sync.autoAlign.rerun.before': 'Die',
  'help.sync.autoAlign.rerun.after':
    '-Knöpfe, die nur erscheinen, wenn die Auto-Ausrichtung aktiv ist, lassen dich nachträglich automatisch ausrichten, falls die Option nicht von Anfang an an war.',
  'help.sync.noise.body':
    'Wenn das „1-2-3-4“ der Referenzspur im Rauschen untergeht, erkennt die App es schlecht und weist dich darauf hin: nimm die Spur besser neu auf. Dasselbe gilt für das „3-4“ späterer Spuren: ist es unklar, kann die Auto-Ausrichtung dieser Spuren scheitern.',
  'help.sync.ref.body':
    '„Ref.“ kennzeichnet die Referenzspur. Tippe darauf, um eine andere zu wählen.',
  'help.sync.punch.title': 'Aufnahme aus dem Stand',
  'help.sync.punch.body1.before':
    'Während der Wiedergabe (oder Pause mittendrin),',
  'help.sync.punch.body1.after':
    'startet eine neue Spur an dieser Position. Ein „Sync“-Button erscheint kurz im Simple-Modus (bleibt im Ausrichtungsmodus). Damit synchronisierst du die Spur mit einer anderen (nach Klick auf „Sync“ auswählen).',
  'help.sync.punch.body2':
    'Gedacht für unterbrochene Takes: nimm etwas vor dem Ende der unterbrochenen Aufnahme erneut auf, wiederhole einen gelungenen Anfang, dann weiter. Der ähnliche Abschnitt ermöglicht die Sync. Danach kannst du die beiden Spuren im Modus „Schneiden“ zusammenführen: Anfang der ersten und Ende der nächsten aneinander setzen.',
  'help.sync.punch.seeCut': 'Zur Rubrik Schneiden',

  'help.cut.title': 'Schneiden',
  'help.cut.body1':
    'In diesem Modus teilst du Spuren, schaltest Abschnitte stumm oder fügst Segmente zu einer neuen Spur zusammen.',
  'help.cut.split.title': 'Teilen',
  'help.cut.split.body1.before':
    'Setze den Abspielcursor an die gewünschte Stelle und nutze',
  'help.cut.split.body1.after':
    '. Die Spuren werden in Segmente geteilt: tippe ein Segment an, um es auszuwählen (mehrere möglich).',
  'help.cut.split.body2':
    'Zurücksetzen verwirft die aktuellen Schnitte und stellt ganze Spuren wieder her.',
  'help.cut.mute.title': 'Stummschalten',
  'help.cut.mute.body1':
    'Stummschalten schaltet die gewählten Segmente stumm, ohne die Audiodatei umzuschreiben. Ein Balken markiert den Bereich; du kannst ihn später entfernen.',
  'help.cut.merge.title': 'Zusammenführen',
  'help.cut.merge.body1':
    'Zusammenführen baut die gewählten Segmente zu einer neuen Spur. Lücken werden zu Stille. Nicht möglich, wenn Segmente auf der Timeline überlappen.',
  'help.cut.tips.body1':
    'Du kannst die Wiedergabe verlangsamen (×0.25 oder ×0.5), um den Cursor genauer zu setzen.',
  'help.cut.tips.body2':
    'Stummschalten eines Abschnitts wird nur online gespeichert, wenn du die Spur besitzt. Zusammenführen erzeugt eine neue Spur unter deinem Namen.',

  'help.mix.title': 'Mix & Export',
  'help.mix.body1.before':
    'Im Mix-Modus regelst du Spur- und Gesamtlautstärke und hebst Spuren mit den',
  'help.mix.body1.mid':
    '-Tasten hervor, und lädst ein MP3 herunter (nur ausgewählte Spuren). Wie in den anderen Modi lassen',
  'help.mix.body1.after': '-Tasten Spuren stumm schalten.',
  'help.mix.body2.before':
    'Auch wenn die Lautstärke jeder Spur stimmt, kann ihre Überlagerung zu laut werden. Eine Option, standardmäßig an und in den',
  'help.mix.body2.after':
    ' abschaltbar, senkt automatisch die Gesamtlautstärke bei Übersteuerung.',
  'help.mix.body3':
    'Eine andere Option kann die Gesamtlautstärke automatisch anheben, wenn sie zu niedrig ist.',
  'help.mix.body4':
    'Ein „!“ auf einer Spur bedeutet Übersteuerung bei der Aufnahme: nimm neu auf mit niedrigerem Mikrofonpegel oder größerem Abstand.',

  'help.library.title': 'Cloud-Bibliothek',
  'help.library.body1':
    'Einmal angemeldet liegen deine Projekte in Meine Bibliothek, so geordnet: Gruppen → Repertoires → Lieder → Sessions. Die Brotkrumenleiste, auch im Rekorder sichtbar, zeigt, wo du bist.',
  'help.library.body2':
    'Die erste Speicherung legt ein Lied unter Personal / Allgemein an.',
  'help.library.body3.before': 'Elemente löschen',
  'help.library.body3.mid': ', hinzufügen',
  'help.library.body3.after':
    ', umbenennen (Klick auf den Namen) oder teilen geht über die Bibliothek. Achtung: das Löschen eines Elements löscht auch alles darin (die Anzahl wird angezeigt).',

  'help.share.title': 'Teilen & Kollaboration',
  'help.share.body1':
    'Über die Bibliothek oder den Rekorder kannst du ein Lied öffentlich machen. Kollaboration aktivierst du nur in der Bibliothek, damit andere angemeldete Personen Spuren hinzufügen können.',
  'help.share.body2':
    'Über den Teilen-Knopf kopierst du den Link oder teilst auf dem Handy direkt über deine üblichen Apps.',
  'help.share.body3':
    'In der Ansicht (öffentliches Lied ohne Kollaboration) kannst du weitere Spuren aufnehmen, aber nur für dich—sie werden nicht im öffentlichen Projekt gespeichert.',

  'help.account.title': 'Konto',
  'help.account.body1':
    'Du meldest dich mit E-Mail oder Pseudo an (Link per E-Mail). In den Kontoeinstellungen kannst du E-Mail und Pseudo ändern und deine gesamte Aufnahmezeit sowie die Anzahl von Gruppen, Repertoires, Liedern und Sessions sehen.',
  'help.account.body2':
    'Die Kontolöschung entfernt zugehörige Daten endgültig. Details in Datenschutz und AGB.',

  'help.devices.title': 'Einstellungen',
  'help.devices.body1':
    'Unter Präferenzen findest du alle oben beschriebenen Optionen.',
  'help.devices.body2':
    'Je nach Gerät (Computer, Browser) kannst du Audio-Eingang und -Ausgang (Mikrofon und Lautsprecher) einstellen.',

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
    'Hilfe / Präferenzen / Konto / Bibliothek schließen',

  'help.faq.title': 'FAQ',
  'help.faq.accountNeeded.q': 'Brauche ich ein Konto?',
  'help.faq.accountNeeded.a':
    'Nicht zum Starten. Ein Konto (mit E-Mail) dient zum Online-Speichern, Teilen und Kollaborieren.',
  'help.faq.guestKeepTakes.q':
    'Was passiert mit Takes, wenn ich als Gast aufnehme und mich dann anmelde?',
  'help.faq.guestKeepTakes.a':
    'Sie werden aus dem lokalen Entwurf dieses Browsers wiederhergestellt und dann wie nach einer normalen Aufnahme auf dein Konto geladen, als neues Lied. Der Link aus der E-Mail muss im selben Browser geöffnet werden.',
  'help.faq.guestLost.q':
    'Gehen Gast-Takes verloren, wenn ich das Gerät wechsle?',
  'help.faq.guestLost.a':
    'Ja, wenn du Gerät oder Browser wechselst. Melde dich dort wieder an, wo du aufgenommen hast, um sie zu retten.',
  'help.faq.headphones.q': 'Warum Kopfhörer?',
  'help.faq.headphones.a':
    'Ohne sie nimmt das Mikrofon oft die Lautsprecher wieder auf: Klang und Timing leiden. Kopfhörer verhindern das.',
  'help.faq.modes.q':
    'Wozu dienen die Modi Simple, Mix, Ausrichtung und Schneiden?',
  'help.faq.modes.a':
    'Simple: aufnehmen und hören. Mix: Lautstärken. Ausrichtung: Rhythmen synchronisieren. Schneiden: einen Abschnitt stummschalten, Teile zusammenfügen.',
  'help.faq.clipping.q': 'Warum eine Übersteuerungswarnung im Mix?',
  'help.faq.clipping.a':
    'Ein „!“ auf einer Spur: sie war bei der Aufnahme zu laut — neu aufnehmen und Mikrofonpegel senken. Ein Hinweis am Gesamtvolumen: der Mix ist zu laut — senken oder Auto-Senken in den Einstellungen aktivieren.',
  'help.faq.metronome.q': 'Wozu das Metronom?',
  'help.faq.metronome.a':
    'Das Metronom hilft beim Tempo und auch bei der Auto-Ausrichtung. Aktiviere dafür „Auto-Ausrichtung nach Schlag“ und sage beim Aufnehmen auf dem 3. und 4. Schlag „3-4“ (oder mach zwei klare Geräusche). Sonst können durch Hardware- oder Software-Latenz Versätze entstehen.',
  'help.faq.piano.q': 'Wird das Klavier mit meiner Stimme aufgenommen?',
  'help.faq.piano.a':
    'Nein. Das Klavier gibt nur den Ton. Mit Kopfhörern hörst du es, ohne dass es in die Aufnahme gelangt.',
  'help.faq.skew.q': 'Spuren sind verschoben — was tun?',
  'help.faq.skew.a1':
    'Wenn du die Auto-Ausrichtung nach Schlag nutzen willst und kein Metronom verwendest, müssen die vier Anfangsschläge klar und ohne Störgeräusche hörbar sein. Folgende Spuren dürfen nur Schläge auf dem 3. und 4. Zählzeit haben. Ohne Auto-Ausrichtung kannst du manuell im Modus',
  'help.faq.skew.a2':
    'kalibrieren, indem du die Millisekunden rechts an den Spuren anpasst.',
  'help.faq.storage.q': 'Wo werden meine Takes gespeichert?',
  'help.faq.storage.a':
    'Ohne Konto werden Spuren nicht online gespeichert. Mit Konto auf deinen Liedern schon, und du findest sie in der Bibliothek (Personal / Allgemein am Anfang). Spuren, die du auf dem Lied eines anderen hinzugefügt hast, liegen auf dessen Konto.',
  'help.faq.libraryWhere.q':
    'Wo finde ich eine frisch gespeicherte Session?',
  'help.faq.libraryWhere.a':
    'Du findest sie über die Brotkrumenleiste oben am Rekorder. Wenn du unsicher bist, schau in die Bibliothek — Sessions liegen standardmäßig in Personal / Allgemein.',
  'help.faq.share.q': 'Wie teile ich ein Lied und kollaboriere?',
  'help.faq.share.a1': 'Mach das Lied öffentlich mit Klick auf',
  'help.faq.share.a2': '(aus Bibliothek oder Rekorder), dann auf',
  'help.faq.share.a3':
    '. Wenn andere Spuren hinzufügen sollen, die alle sehen, aktiviere die Kollaboration mit Klick auf',
  'help.faq.share.a4': '(nur aus der Bibliothek).',
  'help.faq.browsers.q': 'Welche Browser und Berechtigungen?',
  'help.faq.browsers.a':
    'Ein aktueller Browser (Chrome, Firefox, Safari, Edge…) und erlaubter Mikrofonzugriff (Browser-Berechtigungen).',
  'help.faq.sizeLimit.q': 'Gibt es eine Größenbegrenzung?',
  'help.faq.sizeLimit.a':
    'Ja: etwa 100 MB pro online gesendete Datei.',
  'help.faq.deleteAccount.q': 'Wie lösche ich mein Konto?',
  'help.faq.deleteAccount.a':
    'Kontoeinstellungen → Konto löschen. Das ist endgültig. Siehe auch Datenschutz und AGB.',
  'help.faq.deleteAccount.privacy': 'Datenschutz',
  'help.faq.deleteAccount.terms': 'AGB',
  'help.faq.pwa.q': 'Funktioniert die App offline?',
  'help.faq.pwa.a':
    'Aufnehmen auf dem Gerät kann ohne Internet gehen; Speichern, Anmelden und Teilen brauchen eine Verbindung.',
  'help.faq.installable.q': 'Ist die App installierbar?',
  'help.faq.installable.a':
    'Ja — öffne das Browser-Menü und wähle „App installieren“. polyrecorder steht nicht in den App Stores, aber so bleibt die App immer aktuell.',
  'help.faq.accountStats.q':
    'Was bedeuten die Zahlen unter Mein Konto?',
  'help.faq.accountStats.a':
    'Die Aufnahmezeit summiert deine online gespeicherten Spuren. Die anderen Zahlen zählen Gruppen, Repertoires, Lieder und Sessions.',

  'nav.library': 'Bibliothek',
  'nav.myLibrary': 'Meine Bibliothek',

  'cloud.error.tooLarge': 'Datei zu groß (max. 100 MB).',
  'cloud.error.s3NotConfigured': 'Cloud-Speicher ist nicht konfiguriert.',
  'cloud.error.unauthorized': 'Melde dich an, um in die Cloud zu speichern.',
  'guestDraft.quota':
    'Nicht genug lokaler Speicher für den Entwurf. Gib Speicher frei oder melde dich bald an.',
  'guest.prompt.body':
    'Du bist im Gastmodus. Ohne Anmeldung bleibt deine Arbeit nur auf diesem Gerät: Sie geht verloren, wenn du die Seite verlässt, und du kannst sie nicht teilen.',
  'guest.prompt.bodyAccount':
    'Ein Konto wird mit einem Klick nur per E-Mail erstellt.',
  'guest.prompt.cta': 'Anmelden / Konto erstellen',
  'guest.prompt.dismiss': 'Schließen',
  'pwa.install.body':
    'Installiere polyrecorder auf diesem Gerät für schnelleren Zugriff.',
  'pwa.install.cta': 'Installieren',
  'pwa.install.later': 'Später',
  'pwa.install.dismiss': 'Schließen',
  'pwa.install.ios.howto':
    'Tippe auf Teilen und dann auf „Zum Home-Bildschirm“.',
  'pwa.install.ios.gotIt': 'Verstanden',
  'cloud.error.uploadFailed': 'Cloud-Upload fehlgeschlagen. Bitte erneut versuchen.',
  'cloud.error.openFailed': 'Dieses Lied konnte nicht geöffnet werden.',
  'cloud.error.openOffline':
    'Offline: dieses Lied lässt sich nicht öffnen. Prüfe die Verbindung oder starte eine neue Session.',

  'library.title': 'Bibliothek',
  'library.close': 'Bibliothek schließen',
  'library.empty': 'Noch keine Gruppen.',
  'library.empty.repertoires': 'Noch keine Repertoires.',
  'library.empty.songs': 'Noch keine Lieder.',
  'library.empty.songParts': 'Noch keine Sessions.',
  'library.group': 'Gruppe',
  'library.repertoire': 'Repertoire',
  'library.song': 'Lied',
  'library.songPart': 'Session',
  'library.level.groups': 'Gruppen',
  'library.level.repertoires': 'Repertoires',
  'library.level.songs': 'Lieder',
  'library.level.songParts': 'Sessions',
  'library.group.meta': '{repertoires} · {songs}',
  'library.count.group.one': '{count} Gruppe',
  'library.count.group.other': '{count} Gruppen',
  'library.count.repertoire.one': '{count} Repertoire',
  'library.count.repertoire.other': '{count} Repertoires',
  'library.count.song.one': '{count} Lied',
  'library.count.song.other': '{count} Lieder',
  'library.count.songPart.one': '{count} Session',
  'library.count.songPart.other': '{count} Sessions',
  'library.count.track.one': '{count} Spur',
  'library.count.track.other': '{count} Spuren',
  'library.addGroup': 'Neue Gruppe',
  'library.addRepertoire': 'Neues Repertoire',
  'library.addSong': 'Neues Lied',
  'library.addSongPart': 'Neue Session',
  'library.songPart.default': 'Session',
  'library.songPart.unnamed': 'Ohne Namen',
  'library.rename': 'Umbenennen',
  'library.reorder': '{name} verschieben',
  'library.delete': 'Löschen',
  'library.deleteSongPart': 'Session löschen',
  'library.deleteSongPartConfirm':
    'Session „{name}“ und ihre Spuren löschen?',
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
  'library.collaborate.enable': 'Zusammenarbeit erlauben',
  'library.collaborate.disable': 'Zusammenarbeit deaktivieren',
  'library.collaborate.on':
    'Zusammenarbeit an: angemeldete Nutzer können Spuren hinzufügen',
  'library.collaborate.off':
    'Zusammenarbeit aus — Besucher können nur hören',
  'library.share': 'Teilen',
  'library.share.disabled': 'Mach das Lied öffentlich, um es zu teilen.',
  'library.share.copy': 'Link kopieren',
  'library.share.copied': 'Link kopiert',
  'library.share.whatsapp': 'WhatsApp',
  'library.share.native': 'Teilen…',
  'library.share.title': '„{name}“ teilen',

  'song.view.notFound': 'Dieses Lied fehlt oder ist privat.',
  'song.view.newSession': 'Neue Session',
  'song.view.shared': 'geteilt',
  'song.view.collaborate': 'offen für Zusammenarbeit',
  'song.og.description': '{tracks} · Anhören auf polyrecorder',

  'settings.title': 'Präferenzen',
  'settings.close': 'Präferenzen schließen',
  'settings.appearance': 'Erscheinungsbild:',
  'settings.theme.aria': 'Design',
  'settings.theme.system': 'Auto (Browser)',
  'settings.theme.light': 'Hell',
  'settings.theme.dark': 'Dunkel',
  'settings.autoplay': 'Nach Aufnahmeende automatisch abspielen',
  'settings.showCalageWarnings': 'Ausrichtungsbezogene Warnungen anzeigen',
  'settings.showCalageWarnings.about': 'Über Ausrichtungswarnungen',
  'settings.showCalageWarnings.tip':
    '„!“-Hinweise, wenn der 1-2-3-4-Auftakt der Referenz unregelmäßig wirkt oder die Auto-Ausrichtung über 300 ms liegt. Wird automatisch deaktiviert, wenn die erste Spur eines Songs ein Audio-Import ist (meist ohne Auftakt).',
  'settings.autoAlign': 'Auto-Ausrichtung per Auftakt',
  'settings.autoAlign.about': 'Über die Auto-Ausrichtung',
  'settings.autoAlign.tip':
    'Misst und korrigiert den Versatz zwischen Spuren anhand der Markierungen 1-2-3-4 (Referenz) und 3-4 (folgende Spuren). Geeignet für Polyphonie-Aufnahmen. Deaktiviere sie bei Audio-Importen ohne Auftakt, um Versätze und Warnungen zu vermeiden.',
  'settings.countInAlign': 'Auftakt und Auto-Ausrichtung',
  'settings.defaultsForNewProjects': 'Standardeinstellungen für neue Projekte',
  'settings.autoCloudSave': 'Spuren automatisch in der Cloud speichern',
  'settings.autoCloudSave.hint':
    'Wenn deaktiviert, erscheint an jeder lokalen Spur ein Button zum manuellen Hochladen.',
  'settings.skipCountIn': '1-2-3-4 entfernen, falls erkannt',
  'settings.skipCountIn.play.hint':
    'Wiedergabe beginnt direkt nach der „4“ (wenn ein Auftakt erkannt wurde)',
  'settings.skipCountIn.play': 'bei der Wiedergabe',
  'settings.skipCountIn.download.hint':
    'Die MP3 beginnt direkt nach der „4“ (wenn ein Auftakt erkannt wurde)',
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
  'error.importFailed': 'Audiodatei konnte nicht importiert werden.',
  'error.importNoAudio': 'Keine erkannte Audiodatei.',
  'error.importDecodeFailed':
    'Diese Audiodatei kann vom Browser nicht gelesen werden.',
  'error.importTooLong':
    'Datei zu lang (max. 5 Minuten, wie eine Aufnahme).',
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
