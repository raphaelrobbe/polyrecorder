import type { MessageKey } from './fr'

/** Norwegian (Bokmål) UI copy — please review. */
export const no: Record<MessageKey, string> = {
  'brand.tagline': 'Ta opp, lag på lag, lytt, last ned.',

  'deck.ariaLabel': 'Opptaker',

  'common.close': 'Lukk',
  'common.delete': 'Slett',

  'error.title': 'Oi',
  'error.lead':
    'Noe gikk galt. Du kan gå tilbake til opptakeren og prøve igjen.',
  'error.home': 'Tilbake til opptakeren',

  'nav.help': 'Hjelp',
  'nav.settings': 'Innstillinger',
  'nav.signIn': 'Logg inn',
  'nav.signOut': 'Logg ut',
  'nav.accountMenu': 'Kontomeny',
  'nav.accountSettings': 'Kontoinnstillinger',
  'nav.legal': 'Juridisk',
  'nav.privacy': 'Personvern',
  'nav.terms': 'Vilkår',
  'nav.sitemap': 'Nettstedskart',

  'legal.title': 'Juridisk informasjon',
  'legal.close': 'Lukk juridisk informasjon',
  'legal.publisher.title': 'Utgiver',
  'legal.publisher.status.ei':
    'enkeltpersonforetak under fransk micro-entreprise-ordning',
  'legal.publisher.intro': '{name}, {status}.',
  'legal.publisher.siret': 'SIRET: {siret}.',
  'legal.publicationDirector': 'Redaktøransvarlig: {name}.',
  'legal.contact': 'Kontakt: {email}.',
  'legal.host.title': 'Hosting',
  'legal.host.intro':
    'Nettstedet hostes av {name}, {address} (SIREN {siren}).',
  'legal.host.location':
    'Data og tjenester lagres i Frankrike og Nederland.',
  'legal.ip.title': 'Immaterielle rettigheter',
  'legal.ip.intro':
    'Navnet «{site}», designet og applikasjonsinnholdet (unntatt brukerinnhold) er beskyttet.',
  'legal.ip.reproduction':
    'Uautorisert gjengivelse er forbudt.',
  'legal.privacyLink': 'For behandling av personopplysninger, se',
  'legal.termsLink': 'Bruksvilkårene er beskrevet i',

  'privacy.title': 'Personvernerklæring',
  'privacy.close': 'Lukk personvernerklæringen',
  'privacy.controller.title': 'Behandlingsansvarlig',
  'privacy.controller.body':
    '{name} ({site}), {address}, kontaktbar på {email}, er behandlingsansvarlig for personopplysninger samlet inn via applikasjonen.',
  'privacy.data.title': 'Opplysninger som samles inn',
  'privacy.data.account':
    'Konto (hvis du logger inn): e-postadresse, visningsnavn, autentiseringsøkter.',
  'privacy.data.cloud':
    'Skybibliotek (hvis du bruker konto): grupper, repertoarer, sanger, metadata og lydfiler for opplastede spor.',
  'privacy.data.technical':
    'Minimale tekniske data for drift av tjenesten (f.eks. feillogger på serveren).',
  'privacy.purposes.title': 'Formål og rettslig grunnlag',
  'privacy.purposes.body':
    'Opplysningene brukes for at du skal kunne logge inn, lagre og hente spor i skyen, og for å sikre tjenesten. Rettslig grunnlag: oppfyllelse av avtale (levering av tjenesten etter vilkårene) og, der det er aktuelt, berettiget interesse (sikkerhet, forebygging av misbruk).',
  'privacy.processors.title': 'Databehandlere',
  'privacy.processors.body':
    'Hosting og lagring leveres av {host}. Data og tjenester lagres i Frankrike og Nederland.',
  'privacy.retention.title': 'Lagringstid',
  'privacy.retention.body':
    'Konto- og bibliotekdata lagres så lenge kontoen eksisterer. Du kan slette kontoen i appen; tilhørende data slettes da. Tekniske logger lagres bare så lenge det er nødvendig for diagnostikk.',
  'privacy.rights.title': 'Dine rettigheter',
  'privacy.rights.body':
    'Du har rett til innsyn, retting, sletting, protest, begrensning og dataportabilitet. Du kan utøve dem via {email}, eller ved å slette kontoen i innstillingene. Du kan også klage til en tilsynsmyndighet (i Frankrike: CNIL, cnil.fr).',
  'privacy.cookies.title': 'Informasjonskapsler og lokal lagring',
  'privacy.cookies.guest':
    'Som gjest setter PolyRecorder ingen informasjonskapsler.',
  'privacy.cookies.signedIn':
    'Etter innlogging brukes én httpOnly-sesjonskapsel ({cookie}), strengt nødvendig for autentisering. Den brukes ikke til reklamesporing.',
  'privacy.cookies.localStorage':
    'Grensesnittpreferanser (språk, tema, opptaksvalg, aktiv sang) lagres i nettleserens localStorage, ikke i informasjonskapsler.',
  'privacy.legalLink': 'Se også',
  'privacy.termsLink': 'og',

  'terms.title': 'Bruksvilkår',
  'terms.close': 'Lukk bruksvilkårene',
  'terms.effective': 'Gjeldende fra {date}.',
  'terms.object.title': 'Formål',
  'terms.object.body':
    'Disse bruksvilkårene regulerer tilgang til og bruk av {site}, en tjeneste utgitt av {name}. De utgjør den avtalemessige rammen mellom deg og utgiveren for bruk av tjenesten.',
  'terms.acceptance.title': 'Aksept',
  'terms.acceptance.body':
    'Ved å bruke tjenesten (som gjest eller med konto) godtar du disse vilkårene. Hvis du ikke godtar dem, må du ikke bruke tjenesten.',
  'terms.service.title': 'Tjenestebeskrivelse',
  'terms.service.guest':
    'Uten konto kan du bruke opptakeren i nettleseren. Opptak forblir da lokale på enheten din (med mindre du eksplisitt utløser en annen handling).',
  'terms.service.account':
    'Med konto kan du lagre spor i skyen (grupper, repertoarer, sanger) og åpne dem senere, samt dele enkelte sanger offentlig hvis du aktiverer deling.',
  'terms.service.free':
    'Tjenesten tilbys for tiden gratis, innenfor utgiverens tekniske muligheter.',
  'terms.service.futurePaid':
    'Betalte tilbud (for eksempel et abonnement) kan innføres senere. I så fall oppdateres disse vilkårene, den juridiske informasjonen og personvernerklæringen før fakturering, og prisene presenteres tydelig ved kjøp.',
  'terms.account.title': 'Konto',
  'terms.account.body':
    'Du er ansvarlig for å beskytte tilgangen til e-posten din og for bruken av kontoen. Opplysninger må være korrekte. Du kan slette kontoen i innstillingene; da slettes tilhørende data som beskrevet i personvernerklæringen.',
  'terms.content.title': 'Brukerinnhold',
  'terms.content.ownership':
    'Du beholder eierskapet til opptak og innhold du lager eller laster opp.',
  'terms.content.license':
    'Du gir utgiveren en ikke-eksklusiv, verdensomspennende, vederlagsfri lisens begrenset til hosting, sikkerhetskopiering, visning og teknisk levering som trengs for å drive tjenesten (inkl. offentlig deling du aktiverer).',
  'terms.content.responsibility':
    'Du garanterer å ha nødvendige rettigheter til opplastet innhold (stemmer, verk osv.) og forplikter deg til ikke å laste opp ulovlig innhold.',
  'terms.use.title': 'Akseptabel bruk',
  'terms.use.body':
    'Det er forbudt å misbruke tjenesten (inntrenging, bevisst overbelastning, skade på andre brukere, ulovlig innhold, omgåelse av sikkerhet). Ved alvorlig brudd kan utgiveren suspendere eller slette en konto.',
  'terms.availability.title': 'Tilgjengelighet',
  'terms.availability.body':
    'Utgiveren tilstreber kontinuerlig tjeneste, men garanterer ikke uavbrutt tilgjengelighet. Vedlikehold, feil eller endringer kan forekomme. Tjenesten leveres «som den er».',
  'terms.liability.title': 'Ansvar',
  'terms.liability.body':
    'Så langt loven tillater, er utgiveren ikke ansvarlig for indirekte skader, tap av lokale data som ikke var synkronisert, eller følger av ikke-konform bruk. Ingenting i disse vilkårene utelukker ansvar for forsett eller grov uaktsomhet, eller ufravikelige forbrukerrettigheter.',
  'terms.privacy.title': 'Personopplysninger',
  'terms.privacy.body':
    'Behandling av personopplysninger er beskrevet i',
  'terms.changes.title': 'Endring av vilkårene',
  'terms.changes.body':
    'Utgiveren kan endre disse vilkårene. Ikrafttredelsesdato står øverst på siden. Fortsatt bruk etter en oppdatering betyr at du godtar de nye vilkårene. Ved vesentlig endring knyttet til et betalt tilbud gis klar informasjon før kjøp.',
  'terms.law.title': 'Lovvalg',
  'terms.law.body':
    'Disse vilkårene er underlagt fransk rett. Ved tvist kan du kontakte {email}. Dersom minnelig løsning ikke oppnås, er franske domstoler kompetente, med forbehold om ufravikelige forbrukervernregler.',
  'terms.legalLink': 'Se også',

  'sitemap.title': 'Nettstedskart',
  'sitemap.close': 'Lukk nettstedskartet',
  'sitemap.app.title': 'Applikasjon',
  'sitemap.app.home': 'Opptaker',
  'sitemap.account.title': 'Konto',
  'sitemap.legal.title': 'Juridisk',

  'account.title': 'Konto',
  'account.close': 'Lukk kontoinnstillinger',
  'account.email': 'E-post',
  'account.email.hint':
    'En bekreftelseslenke sendes til den nye adressen.',
  'account.email.pending':
    'Nesten ferdig: åpne lenken sendt til {email} for å bekrefte endringen.',
  'account.email.openConfirmLink': 'Åpne bekreftelseslenken',
  'account.pseudo': 'Visningsnavn',
  'account.pseudoPlaceholder': 'Visningsnavnet ditt',
  'account.pseudo.lengthHint': '3–40 tegn, uten @',
  'account.pseudo.customizeHint':
    'Visningsnavnet ditt ble generert automatisk. Tilpass det så det vises under delte sanger.',
  'account.pseudo.available': 'ledig',
  'account.pseudo.unavailable': 'opptatt',
  'account.pseudo.current': 'mitt nåværende navn',
  'account.save': 'Lagre',
  'account.saving': 'Lagrer…',
  'account.saved': 'Lagret.',
  'account.error.pseudoTooShort': 'Visningsnavn må ha minst 3 tegn.',
  'account.error.pseudoTooLong': 'Visningsnavn for langt (maks 40 tegn).',
  'account.error.pseudoInvalidChars':
    'Visningsnavn kan ikke inneholde tegnet @.',
  'account.error.pseudoTaken': 'Dette visningsnavnet er allerede tatt.',
  'account.error.invalidEmail': 'Ugyldig e-postadresse.',
  'account.error.emailTaken': 'Denne e-postadressen er allerede i bruk.',
  'account.error.emailRateLimited':
    'For mange forespørsler for denne e-posten. Prøv igjen om en time.',
  'account.error.emailFailed': 'Kunne ikke sende e-posten. Prøv igjen senere.',
  'account.error.saveFailed': 'Kunne ikke lagre. Prøv igjen.',
  'account.delete.button': 'Slett kontoen min',
  'account.delete.confirmBody':
    'Denne handlingen kan ikke angres. Alle data knyttet til kontoen din slettes permanent, og delte lenker slutter å fungere.',
  'account.delete.confirm': 'Ja, slett permanent',
  'account.delete.cancel': 'Avbryt',
  'account.delete.deleting': 'Sletter…',
  'account.delete.error': 'Kunne ikke slette kontoen. Prøv igjen.',

  'auth.close': 'Lukk innlogging',
  'auth.signIn.title': 'Logg inn eller opprett konto',
  'auth.signIn.lead':
    'Skriv inn e-post eller visningsnavn: vi oppretter kontoen om den mangler (e-post), og sender en engangs magisk lenke (gyldig i 30 minutter). Ingen passord.',
  'auth.signIn.email': 'E-post',
  'auth.signIn.emailPlaceholder': 'deg@eksempel.com',
  'auth.signIn.identifier': 'E-post eller visningsnavn',
  'auth.signIn.identifierPlaceholder': 'deg@eksempel.com eller raf_prague',
  'auth.signIn.submit': 'Fortsett',
  'auth.signIn.sending': 'Sender…',
  'auth.sent.title': 'Sjekk innboksen',
  'auth.sent.body':
    'En e-post med innloggingslenke er nettopp sendt. Åpne den for å fortsette — kontoen opprettes ved første klikk om nødvendig.',
  'auth.sent.bodyWithEmail':
    'En e-post med innloggingslenke er nettopp sendt til {email}. Åpne den for å fortsette — kontoen opprettes ved første klikk om nødvendig.',
  'auth.sent.hint':
    'Lenken utløper om 30 minutter og kan bare brukes én gang. Sjekk søppelpost om nødvendig.',
  'auth.sent.retry': 'Bruk en annen identifikator',
  'auth.sent.devHint':
    'Lokalt kan e-posten utebli — bruk knappen under for å logge inn med en gang.',
  'auth.sent.openLink': 'Åpne innloggingslenken',
  'auth.error.invalidEmail': 'Ugyldig e-postadresse.',
  'auth.error.invalidIdentifier': 'Ugyldig e-post eller visningsnavn.',
  'auth.error.rateLimited':
    'For mange forespørsler for denne e-posten. Prøv igjen om en time.',
  'auth.error.emailFailed': 'Kunne ikke sende e-posten. Prøv igjen senere.',
  'auth.error.linkInvalid': 'Ugyldig innloggingslenke.',
  'auth.error.linkExpired': 'Denne lenken er utløpt. Be om en ny.',
  'auth.error.linkUsed': 'Denne lenken er allerede brukt. Be om en ny.',
  'auth.email.welcome.subject': 'Velkommen til PolyRecorder',
  'auth.email.welcome.text':
    'Velkommen! PolyRecorder-kontoen din er klar.\n\nFor å aktivere den og logge inn, åpne denne lenken (gyldig i 30 minutter, engangsbruk):\n\n{link}\n\nDeretter kan du ta opp, legge lag på lag og laste ned.\n\nHvis du ikke ba om dette, kan du ignorere denne e-posten.',
  'auth.email.welcome.html':
    '<p>Velkommen&nbsp;! <strong>PolyRecorder</strong>-kontoen din er klar.</p><p>For å aktivere den og logge inn, åpne denne lenken (gyldig i 30&nbsp;minutter, engangsbruk):</p><p><a href="{link}">Aktiver kontoen min</a></p><p>Deretter kan du ta opp, legge lag på lag og laste ned.</p><p>Hvis du ikke ba om dette, kan du ignorere denne e-posten.</p>',
  'auth.email.signIn.subject': 'Innloggingslenken din til PolyRecorder',
  'auth.email.signIn.text':
    'Her er innloggingslenken din til PolyRecorder (gyldig i 30 minutter, engangsbruk):\n\n{link}\n\nHvis du ikke ba om dette, kan du ignorere denne e-posten.',
  'auth.email.signIn.html':
    '<p>Her er innloggingslenken din til <strong>PolyRecorder</strong> (gyldig i 30&nbsp;minutter, engangsbruk):</p><p><a href="{link}">Logg inn</a></p><p>Hvis du ikke ba om dette, kan du ignorere denne e-posten.</p>',
  'auth.emailChange.subject': 'Forespørsel om e-postendring for PolyRecorder',
  'auth.emailChange.text':
    'Det er bedt om å endre e-postadressen knyttet til en PolyRecorder-konto til denne innboksen.\n\nHvis du ikke ba om dette, kan du ignorere e-posten — adressen din endres ikke.\n\nEllers bekreft endringen ved å åpne denne lenken (gyldig i 30 minutter, engangsbruk):\n\n{link}',
  'auth.emailChange.html':
    '<p>Det er bedt om å endre e-postadressen knyttet til en <strong>PolyRecorder</strong>-konto til denne innboksen.</p><p>Hvis du ikke ba om dette, kan du ignorere e-posten — adressen din endres ikke.</p><p>Ellers bekreft endringen ved å åpne denne lenken (gyldig i 30&nbsp;minutter, engangsbruk):</p><p><a href="{link}">Bekreft ny e-post</a></p>',

  'locale.select.aria': 'Velg språk',
  'settings.language': 'Språk:',
  'settings.language.aria': 'Grensesnittspråk',

  'theme.switchToDark': 'Bytt til mørkt tema',
  'theme.switchToLight': 'Bytt til lyst tema',
  'theme.darkSystem': 'Mørkt tema (for øyeblikket auto)',
  'theme.lightSystem': 'Lyst tema (for øyeblikket auto)',
  'theme.dark': 'Mørkt tema',
  'theme.light': 'Lyst tema',

  'session.title.aria': 'Opptakstittel',
  'session.defaultTitle': 'Min polyfoni',

  'capture.nextTrack': 'Neste spor',
  'capture.nextTrack.hint':
    'Neste spor: spiller av dette opptaket og tar opp det neste samtidig.',
  'capture.discard': 'Forkast opptaket og start på nytt',
  'capture.record': 'Ta opp',
  'capture.stop': 'Stopp',

  'mix.restart': 'Tilbake til start',
  'mix.play': 'Spill av',
  'mix.pause': 'Pause',
  'mix.download': 'Last ned mix (MP3)',
  'mix.download.hint': 'Last ned mix av valgte spor (MP3)',
  'mix.seekAria': 'Avspillingsposisjon',
  'mix.masterVolume': 'Mastervolum',

  'mode.groupAria': 'Arbeidsmoduser',
  'mode.label': 'Modus',
  'mode.mix': 'Mix',
  'mode.mix.hint': 'Mix-modus: volum per spor og master',
  'mode.align': 'Justering',
  'mode.align.hint': 'Justeringsmodus: synkronisering av spor',

  'align.latency.label': 'Avspillingsforskyvning',
  'align.latency.about': 'Om avspillingsforskyvning',
  'align.latency.adjust': 'Juster monitoring-forskyvning',
  'align.latency.minus': 'Start monitoring litt tidligere (−5 ms)',
  'align.latency.plus': 'Start monitoring litt senere (+5 ms)',
  'align.latency.input': 'Avspillingsforskyvning i millisekunder',
  'align.latency.tip':
    'Under «Neste spor» spilles tidligere opptak i hodetelefonene med litt maskinvarelatens. PolyRecorder starter denne monitoringen litt tidlig, slik at den nye stemmen lander på rett sted på tidslinjen. Juster verdien (±5 ms eller skriv den inn) hvis monitoringen fortsatt føles sen eller tidlig (lagres på denne enheten). Dette er ikke autojustering fra 3–4-markørene: det gjelder bare under opptak.',

  'volume.percentAria': '{label} i prosent',

  'tracks.muteAll.hint': 'Demp / slå på alle spor',
  'tracks.muteAll.aria': 'Aktiver alle spor',
  'tracks.deleteAll': 'Slett alle spor',
  'tracks.deleteOne.confirm': 'Slette sporet «{name}»?',
  'tracks.deleteAll.confirm':
    'Slette {count} spor? De går tapt for godt.',
  'tracks.alignAll.hint':
    'Slå autojustering av/på (unntatt spor 1)',
  'tracks.alignAll.aria': 'Autojuster alle spor',
  'tracks.reorder': 'Omorganiser {name}',
  'tracks.audible': 'Hørbar',
  'tracks.muted': 'Dempet',
  'tracks.listen': 'Lytt til {name}',
  'tracks.name.aria': 'Spornavn',
  'tracks.defaultName': 'Spor {index}',
  'tracks.filenameFallback': 'spor',
  'tracks.volume': 'Volum {name}',
  'tracks.highlight': 'Fremhev {name}',
  'tracks.delete': 'Slett {name}',
  'tracks.delete.confirm': 'Slette «{name}»?',
  'tracks.cloudSave': 'Lagre {name} i skyen',
  'tracks.cloudSaving': 'Lagrer…',
  'tracks.ref.hint': 'Referansespor (1–2–3–4-markører)',
  'tracks.ref.aria': 'Referanse',
  'tracks.ref.badge': 'ref.',
  'tracks.autoAlign': 'Autojustering',
  'tracks.autoAlign.named': 'Autojustering {name}',
  'tracks.offset.hint': 'Forskyv dette sporet ved avspilling',
  'tracks.offset.minus': 'Flytt {name} 5 ms tidligere',
  'tracks.offset.plus': 'Flytt {name} 5 ms senere',
  'tracks.offset.input': 'Justering av {name} i millisekunder',
  'tracks.drag': 'Dra for å omorganisere',

  'warn.attention': 'Obs',
  'warn.openAlignMode': 'Åpne justeringsmodus',
  'warn.skew.tooltip':
    'Autojustering over 300 ms tyder ofte på synkproblemer (uklare markører, latens osv.). Åpne justeringsmodus for å sjekke og justere.',
  'warn.skew.short': 'Høy autojustering på {names}.',
  'warn.skew.long':
    'Høy autojustering på {names}. Sjekk synk i justeringsmodus.',
  'warn.beat.irregular':
    'Uregelmessig eller uoppdaget 1-2-3-4-opptakt på referansesporet ({name}).',
  'warn.beat.missing':
    '1-2-3-4-opptakt ikke funnet på «{name}» ({count}/4 treff).',
  'warn.beat.error': 'Kunne ikke analysere opptakten på «{name}».',

  'howto.title': 'Slik bruker du',
  'howto.step1': 'trykk på den røde «Ta opp»-knappen',
  'howto.step2':
    'si 1-2-3-4 høyt og jevnt (eller et annet tydelig 4-taktsignal), og syng deretter første stemme',
  'howto.step3':
    'trykk «Neste spor» (chevron til høyre) for å gå rett til opptak av andre stemme',
  'howto.step4':
    'si bare 3. og 4. taktslag høyt nøyaktig når du hører dem, og syng deretter andre stemme',
  'howto.step5': 'gjenta for flere stemmer',
  'howto.step6':
    'trykk på den røde «Stopp»-knappen ved slutten av siste stemme',
  'howto.tips':
    'Tips: ta opp i rolige omgivelser, gjerne med hodetelefoner eller ørepropp—særlig på mobil!',
  'howto.latency':
    'Nettlesere og lydutstyr gir latens (hodetelefoner, mikrofon, buffer). Uten felles markører sklir opptakene. De fire markørene på referansesporet og «3-4» på senere spor lar PolyRecorder måle og rette denne forskyvningen automatisk. Tydelige, jevne, godt adskilte lyder justerer bedre; en uregelmessig eller svak opptakt kan ødelegge synken.',

  'help.title': 'Hjelp',
  'help.close': 'Lukk hjelp',
  'help.customize.title': 'Tilpasning',
  'help.customize.body1':
    'Prosjektnavnet endres øverst ved å klikke på tittelen{f2}. Du kan også gi nytt navn til hvert spor ved å klikke på det i listen.',
  'help.customize.f2': ' (eller med F2)',
  'help.customize.body2':
    'Disse navnene brukes i MP3-filen: prosjekttittelen, og — hvis ikke alle spor er valgt — navnene på eksporterte spor, f.eks. «Min polyfoni_Bass 1 - Bass 2.mp3».',
  'help.sync.title': 'Synkronisering',
  'help.sync.body1':
    'For å justere sporene bør det første (referanse) starte med fire tydelige, jevne markører (1-2-3-4, eller et annet hørbart 4-taktsignal). Senere spor tar bare 3. og 4. taktslag på nytt, deretter stemmen. PolyRecorder bruker dem til å måle og rette latensforskyvning automatisk.',
  'help.sync.body2':
    'Bakgrunnsstøy kan hindre gjenkjenning av 1-2-3-4. Start da opptaket på nytt for et solid referansespor—ellers må alt justeres for hånd. Det samme gjelder 3-4 på senere spor: en svak eller støyete markør ødelegger autojustering for det opptaket.',
  'help.shortcuts.title': 'Hurtigtaster',
  'help.shortcuts.recording': 'Opptak',
  'help.shortcuts.record': 'Ta opp',
  'help.shortcuts.next': 'Neste spor',
  'help.shortcuts.discard': 'Forkast opptak',
  'help.shortcuts.stop': 'Stopp',
  'help.shortcuts.playback': 'Avspilling',
  'help.shortcuts.playPause': 'Play / Pause',
  'help.shortcuts.downloadCat': 'Nedlasting',
  'help.shortcuts.download': 'Last ned MP3',
  'help.shortcuts.general': 'Generelt',
  'help.shortcuts.editTitle': 'Rediger tittel',
  'help.shortcuts.closePanels':
    'Lukk Hjelp / Innstillinger / Konto / Bibliotek',

  'nav.library': 'Bibliotek',

  'cloud.error.tooLarge': 'Filen er for stor (maks 100 MB).',
  'cloud.error.s3NotConfigured': 'Skylagring er ikke konfigurert.',
  'cloud.error.unauthorized': 'Logg inn for å lagre i skyen.',
  'cloud.error.uploadFailed': 'Opplasting til skyen mislyktes. Prøv igjen.',
  'cloud.error.openFailed': 'Kunne ikke åpne denne sangen.',

  'library.title': 'Bibliotek',
  'library.close': 'Lukk bibliotek',
  'library.empty': 'Ingen grupper ennå.',
  'library.group': 'Gruppe',
  'library.repertoire': 'Repertoar',
  'library.song': 'Sang',
  'library.group.meta': '{repertoires} · {songs}',
  'library.count.repertoire.one': '{count} repertoar',
  'library.count.repertoire.other': '{count} repertoar',
  'library.count.song.one': '{count} sang',
  'library.count.song.other': '{count} sanger',
  'library.count.track.one': '{count} spor',
  'library.count.track.other': '{count} spor',
  'library.addGroup': 'Ny gruppe',
  'library.addRepertoire': 'Nytt repertoar',
  'library.addSong': 'Ny sang',
  'library.rename': 'Gi nytt navn',
  'library.delete': 'Slett',
  'library.open': 'Åpne',
  'library.namePrompt': 'Navn',
  'library.deleteConfirm': 'Slette «{name}» og innholdet?',
  'library.opening': 'Åpner…',
  'library.expand': 'Utvid {name}',
  'library.collapse': 'Skjul {name}',
  'library.error': 'Handlingen mislyktes. Prøv igjen.',
  'library.public': 'Gjør offentlig',
  'library.private': 'Gjør privat',
  'library.public.on': 'Offentlig',
  'library.public.off': 'Privat',
  'library.share': 'Del',
  'library.share.disabled': 'Gjør sangen offentlig for å dele den.',
  'library.share.copy': 'Kopier lenke',
  'library.share.copied': 'Lenke kopiert',
  'library.share.whatsapp': 'WhatsApp',
  'library.share.native': 'Del…',
  'library.share.title': 'Del «{name}»',

  'song.view.notFound': 'Denne sangen mangler eller er privat.',
  'song.view.shared': 'delt',
  'song.og.description': '{tracks} · Lytt på PolyRecorder',

  'settings.title': 'Innstillinger',
  'settings.close': 'Lukk innstillinger',
  'settings.appearance': 'Utseende:',
  'settings.theme.aria': 'Tema',
  'settings.theme.system': 'Auto (nettleser)',
  'settings.theme.light': 'Lyst',
  'settings.theme.dark': 'Mørkt',
  'settings.autoplay': 'Spill av automatisk når opptaket er ferdig',
  'settings.autoCloudSave': 'Lagre spor automatisk i skyen',
  'settings.autoCloudSave.hint':
    'Hvis avkrysset, vises en knapp på hvert lokalt spor for manuell opplasting.',
  'settings.skipCountIn': 'Fjern 1-2-3-4',
  'settings.skipCountIn.play.hint':
    'Avspilling starter rett etter «4»',
  'settings.skipCountIn.play': 'ved avspilling',
  'settings.skipCountIn.download.hint':
    'MP3-en starter rett etter «4»',
  'settings.skipCountIn.download': 'ved MP3-nedlasting',
  'settings.devices': 'Lydenheter',
  'settings.devices.mobileNote':
    'På telefon eller nettbrett skaper valg av inngang/utgang i nettleseren ofte flere problemer enn det løser (Bluetooth-hodetelefoner feildetektert, stille lyd, systemmikrofon…). Koble heller til hodetelefoner og la telefonen styre lydveien.',
  'settings.devices.playback': 'Avspilling',
  'settings.devices.playback.hint':
    'For at mikrofonen ikke skal ta opp det du hører: bruk hodetelefoner.',
  'settings.devices.duringRecord': 'under opptak',
  'settings.devices.sinkMonitor': 'Utgang under opptak',
  'settings.devices.duringPlayback': 'under avspilling',
  'settings.devices.sinkPlayback': 'Utgang under avspilling',
  'settings.devices.sinkUnsupported':
    'Denne nettleseren kan ikke velge lydutgang fra siden. Koble til hodetelefoner for monitoring, eller endre utgangen i systeminnstillingene.',
  'settings.devices.record': 'Opptak',
  'settings.devices.record.hint':
    'Mikrofon som brukes til opptak. Etiketter vises etter at du har gitt tilgang.',
  'settings.devices.inputMonitor': 'Mikrofon under opptak',
  'settings.devices.inputOverride':
    'Systemet åpnet «{label}» i stedet for mikrofonen du valgte. Prøv igjen eller sjekk mikrofontillatelser.',
  'settings.devices.inputOverrideGeneric':
    'Systemet åpnet en annen mikrofon enn den du valgte. Prøv igjen eller sjekk mikrofontillatelser.',

  'devices.outputFallback': 'Utgang',
  'devices.inputFallback': 'Mikrofon',

  'hint.recording.headphonesBleed':
    'Hodetelefoner anbefales: uten dem kan mikrofonen ta opp høyttalere og ødelegge justeringen.',
  'hint.recording.headphonesLatency':
    'Hodetelefoner anbefales. Monitoring kompensert for lydlatens.',
  'hint.listening': 'Spiller av…',

  'error.needTwoTracks': 'Du trenger minst to spor for å justere.',
  'error.missingReference': 'Referansespor mangler.',
  'error.refPeaks':
    '{name}: fant {count}/4 treff. Lag 4 godt adskilte lyder (stemme eller klapp).',
  'error.trackPeaks':
    '{name}: fant {count}/2 treff. Lag 2 tydelige lyder for «3 4» (stemme eller klapp).',
  'error.autoAlignDeferred': 'Autojustering utsatt: {message}',
  'error.autoAlignDeferredGeneric': 'Autojustering utsatt.',
  'error.refPeaksSkipCountIn':
    '{name}: fant {count}/4 treff. Lag 4 godt adskilte lyder for å fjerne 1-2-3-4.',
  'error.exportNoTracks': 'Velg minst ett spor å eksportere.',
  'error.exportNoneSelected': 'Ingen spor valgt for eksport.',
  'error.countInTooLate':
    '«4» er for nær slutten: ingenting å eksportere etter opptakten.',
  'error.exportFailed': 'MP3-eksport mislyktes.',
  'error.emptyTrack': 'Tomt spor, ingenting å spille.',
  'error.recordFailed': 'Opptak mislyktes.',
  'error.recordStart': 'Kunne ikke starte opptak.',
  'error.noActiveRecording': 'Ingen opptak pågår.',
  'error.noAudioData': 'Ingen lyd fanget. Prøv å ta opp på nytt.',
  'error.discardFailed': 'Kunne ikke starte opptaket på nytt.',
  'error.micAccess': 'Fikk ikke tilgang til mikrofonen.',
  'error.nextTrackFailed': 'Kunne ikke gå til neste spor.',
  'error.stopFailed': 'Kunne ikke stoppe rent.',
  'error.playbackFailed': 'Avspilling mislyktes.',
  'error.pauseFailed': 'Kunne ikke pause.',
  'error.autoAlignFailed': 'Autojustering mislyktes.',

  'align.refPeaks.ok':
    '1-2-3-4 ({name}): {times}\navstand {gaps} ms',
  'align.refPeaks.partial':
    '1-2-3-4-opptakt ({name}): {times} ({count}/4)',
}
