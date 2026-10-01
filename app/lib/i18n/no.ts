import type { MessageKey } from './fr'

/** Norwegian (Bokmål) UI copy — please review. */
export const no: Record<MessageKey, string> = {
  'brand.tagline': 'Ta opp, lag på lag, del, samarbeid.',
  'brand.homeAria': 'Tilbake til polyrecorder-startsiden',
  'seo.home.title': 'polyrecorder — Ta opp, lag på lag, del, samarbeid',
  'seo.home.description':
    'Flerkanalsopptaker i nettleseren: legg spor oppå hverandre, del økter og samarbeid på nett. Gratis, uten installasjon.',
  'seo.help.description':
    'polyrecorder-hjelp: gjestemodus, Simple/Mix/Justering/Klipp, skybibliotek, deling, FAQ og hurtigtaster.',
  'seo.legal.description':
    'Juridisk informasjon for polyrecorder: utgiver, hosting og åndsverk.',
  'seo.privacy.description':
    'Personvernerklæring for polyrecorder: data vi samler inn, formål og dine rettigheter.',
  'seo.register.description':
    'Behandlingsprotokoll for polyrecorder (GDPR art. 30): konto, skybibliotek, kontakt og logger.',
  'seo.terms.description':
    'Vilkår for bruk av polyrecorder: konto, innhold og ansvar.',
  'seo.contact.description':
    'Kontakt polyrecorder: skjema for spørsmål, rapporter og kontohenvendelser.',
  'seo.sitemap.description':
    'Nettstedskart for polyrecorder: appsider, konto og juridisk informasjon.',
  'seo.library.user.description':
    'Offentlig bibliotek til @{pseudo} på polyrecorder — delte grupper, repertoarer og økter.',
  'seo.library.group.description':
    'Gruppe «{name}» på polyrecorder — delte repertoarer og sanger.',
  'seo.library.repertoire.description':
    'Repertoar «{name}» på polyrecorder — delte sanger og økter.',
  'seo.library.song.description':
    '«{name}» på polyrecorder — delte opptaksøkter.',

  'deck.ariaLabel': 'Opptaker',
  'deck.toolsAria': 'Bibliotek og modi',
  'deck.newSession': 'Ny økt',
  'deck.newSession.back': 'Tilbake',

  'common.close': 'Lukk',
  'common.delete': 'Slett',
  'common.validate': 'Bekreft',
  'common.yes': 'Ja',
  'common.no': 'Nei',
  'common.listen': 'Lytt',

  'error.title': 'Oi',
  'error.lead':
    'Noe gikk galt. Du kan gå tilbake til opptakeren og prøve igjen.',
  'error.home': 'Tilbake til opptakeren',

  'nav.help': 'Hjelp',
  'nav.settings': 'Preferanser',
  'nav.signIn': 'Logg inn',
  'nav.signOut': 'Logg ut',
  'nav.accountMenu': 'Kontomeny',
  'nav.accountSettings': 'Kontoinnstillinger',
  'nav.legal': 'Juridisk',
  'nav.privacy': 'Personvern',
  'nav.processingRegister': 'Behandlingsprotokoll',
  'nav.terms': 'Vilkår',
  'nav.contact': 'Kontakt',
  'nav.sitemap': 'Nettstedskart',

  'contact.title': 'Kontakt',
  'contact.close': 'Lukk kontaktskjemaet',
  'contact.formLink': 'kontaktskjemaet',
  'contact.lead':
    'Et spørsmål, et problem, en idé? Send oss en melding — vi svarer på e-post.',
  'contact.email': 'E-post',
  'contact.message': 'Melding',
  'contact.captcha': 'Anti-robot-sjekk',
  'contact.submit': 'Send',
  'contact.sending': 'Sender…',
  'contact.success':
    'Melding sendt. Du får svar på adressen du oppga.',
  'contact.error.email': 'Oppgi en gyldig e-postadresse.',
  'contact.error.message': 'Skriv en melding før du sender.',
  'contact.error.captcha': 'Fullfør anti-robot-sjekken.',
  'contact.error.rateLimited':
    'For mange meldinger. Prøv igjen om noen minutter.',
  'contact.error.send': 'Kan ikke sende akkurat nå. Prøv igjen senere.',

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
    '{name} ({site}), {address}, kontaktbar via {email}, er behandlingsansvarlig for personopplysninger samlet inn via applikasjonen.',
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
    'Som gjest setter polyrecorder ingen informasjonskapsler.',
  'privacy.cookies.signedIn':
    'Etter innlogging brukes én httpOnly-sesjonskapsel ({cookie}), strengt nødvendig for autentisering. Den brukes ikke til reklamesporing.',
  'privacy.cookies.localStorage':
    'Grensesnittpreferanser (språk, tema, opptaksvalg, aktiv sang) lagres i nettleserens localStorage, ikke i informasjonskapsler.',
  'privacy.legalLink': 'Se også',
  'privacy.termsLink': 'og',
  'privacy.gdpr.title': 'GDPR-samsvar',
  'privacy.gdpr.body':
    'I tråd med GDPR beskriver en behandlingsprotokoll formål, datakategorier, mottakere, lagringstid og sikkerhetstiltak. Se',

  'register.title': 'Protokoll over behandlingsaktiviteter',
  'register.close': 'Lukk behandlingsprotokollen',
  'register.intro':
    'Dette dokumentet er protokollen over behandlingsaktiviteter som føres av behandlingsansvarlig for polyrecorder (GDPR artikkel 30). Den gir oversikt over personopplysningsbehandling knyttet til tjenesten.',
  'register.dates':
    'Protokoll opprettet {created}. Sist oppdatert {updated}.',
  'register.controller.title': 'Behandlingsansvarlig',
  'register.controller.body':
    '{name} ({site}), {address}.',
  'register.controller.contact':
    'Kontakt for rettighetsforespørsler og personvernspørsmål: {email}.',
  'register.controller.dpo':
    'Ingen personvernombud (DPO) er utpekt.',
  'register.summary.title': 'Oversikt over behandlinger',
  'register.summary.col.ref': 'Nr. / ref.',
  'register.summary.col.name': 'Behandlingsnavn',
  'register.summary.col.purpose': 'Formål',
  'register.summary.col.sensitive': 'Særlige kategorier',
  'register.sensitive.no': 'Nei',
  'register.fiche.created': 'Opprettet',
  'register.fiche.updated': 'Sist oppdatert',
  'register.fiche.purpose': 'Hovedformål',
  'register.fiche.data': 'Personopplysninger',
  'register.fiche.retention': 'Lagringstid',
  'register.fiche.subjects': 'Registrerte',
  'register.fiche.recipients': 'Mottakere',
  'register.fiche.security': 'Sikkerhetstiltak',
  'register.fiche.transfers': 'Overføringer utenfor EU',
  'register.fiche.sensitive': 'Særlige kategorier',
  'register.privacyLink': 'Mer om dine rettigheter i',
  'register.legalLink': 'og',

  'register.account.ref': '1',
  'register.account.name': 'Konto og autentisering',
  'register.account.purpose':
    'Opprette og autentisere brukerkontoer',
  'register.account.subPurposes':
    'Underformål: sende magiske lenker for innlogging / e-postbekreftelse; tillate tilpasning av visningsnavn (pseudo); sikre tilgang til skybiblioteket.',
  'register.account.data':
    'E-postadresse, pseudo, autentiseringstokener / økter (httpOnly-sesjonskapsel), kontorelaterte datoer.',
  'register.account.retention':
    'Så lenge kontoen eksisterer; sletting av konto sletter tilknyttede data. Magiske lenker utløper raskt (engang, kortvarige).',
  'register.account.subjects':
    'Brukere som har opprettet polyrecorder-konto.',
  'register.account.recipients':
    'Behandlingsansvarlig; hostingleverandør og transaksjons-e-post (Scaleway, Frankrike / Nederland). Pseudo kan være synlig offentlig hvis brukeren aktiverer deling.',
  'register.account.security':
    'Autentisering med magisk lenke, httpOnly-sesjonskapsel, applikasjonsmessig tilgangskontroll, HTTPS, sikkerhetskopier hos vert.',
  'register.account.transfers':
    'Ingen overføring utenfor EU for denne behandlingen (Scaleway-hosting og e-post i EØS).',

  'register.cloud.ref': '2',
  'register.cloud.name': 'Skybibliotek',
  'register.cloud.purpose':
    'Hoste og organisere brukerens opptak',
  'register.cloud.subPurposes':
    'Underformål: lagre grupper, repertoarer, sanger, metadata og lydfiler; gjenåpne økter; muliggjøre offentlig deling når brukeren aktiverer det.',
  'register.cloud.data':
    'Biblioteksmetadata (navn, struktur, volum, forskyvninger osv.), opplastede lydfiler, tekniske objekt-ID-er, kobling til eierkonto, innstillinger for offentlig deling.',
  'register.cloud.retention':
    'Så lenge konto eller innhold eksisterer; slettes når brukeren sletter konto eller innhold.',
  'register.cloud.subjects':
    'Innloggede brukere av skybiblioteket; besøkende av innhold som er eksplisitt delt offentlig.',
  'register.cloud.recipients':
    'Kontoeier; personer gitt tilgang via offentlig deling (hvis aktivert); objektlagring / databaseleverandør (Scaleway, Frankrike / Nederland).',
  'register.cloud.security':
    'Kontotilknyttet tilgangskontroll, forhåndssignerte opplastings-URL-er, HTTPS, applikasjonsisolering, sikkerhetskopier hos vert.',
  'register.cloud.transfers':
    'Ingen overføring utenfor EU for lagring (Frankrike / Nederland).',

  'register.contact.ref': '3',
  'register.contact.name': 'Kontaktskjema',
  'register.contact.purpose':
    'Behandle henvendelser via kontaktskjemaet',
  'register.contact.subPurposes':
    'Underformål: begrense spam (anti-robot-sjekk); levere meldingen til utgiveren og svare på e-post.',
  'register.contact.data':
    'Oppgitt e-post, meldingsinnhold, anti-robot-token (Cloudflare Turnstile), minimale tekniske metadata for innsendingen.',
  'register.contact.retention':
    'Så lenge det trengs for å behandle henvendelsen og påfølgende korrespondanse; ingen markedsføringsarkiv.',
  'register.contact.subjects':
    'Alle som bruker kontaktskjemaet (med eller uten konto).',
  'register.contact.recipients':
    'Behandlingsansvarlig; Scaleway (e-postutsending); Cloudflare (Turnstile-verifisering).',
  'register.contact.security':
    'HTTPS, hastighetsbegrensning, Turnstile-captcha, begrenset tilgang til kontaktinnboksen.',
  'register.contact.transfers':
    'Cloudflare (Turnstile) kan innebære behandling utenfor EU under databehandlerens kontraktsmessige garantier (SCC / DPA). E-postutsending forblir hos Scaleway (EØS).',

  'register.logs.ref': '4',
  'register.logs.name': 'Tekniske logger og sikkerhet',
  'register.logs.purpose':
    'Sikre drift, diagnostikk og sikkerhet for tjenesten',
  'register.logs.subPurposes':
    'Underformål: analysere serverfeil; forebygge misbruk (f.eks. begrensning på kontaktskjema); opprettholde tilgjengelighet.',
  'register.logs.data':
    'Feillogger og minimale tekniske spor (tidsstempel, feiltype, eventuelt IP eller tekniske ID-er avhengig av komponent).',
  'register.logs.retention':
    'Begrenset til diagnostikk- og sikkerhetsbehov (kort, deretter sletting eller rotasjon).',
  'register.logs.subjects':
    'Brukere og besøkende hvis tekniske aktivitet genererer logger.',
  'register.logs.recipients':
    'Behandlingsansvarlig; vert (Scaleway) som del av infrastrukturdrift.',
  'register.logs.security':
    'Begrenset infrastrukturtilgang, HTTPS, driftsmessige beste praksiser.',
  'register.logs.transfers':
    'Ingen overføring utenfor EU planlagt for logger hostet hos Scaleway (EØS).',

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
    'Disse vilkårene er underlagt fransk rett. Ved tvist kan du bruke {email}. Dersom minnelig løsning ikke oppnås, er franske domstoler kompetente, med forbehold om ufravikelige forbrukervernregler.',
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
  'account.pseudo.lengthHint':
    '3–20 tegn, kun bokstaver, tall og _',
  'account.pseudo.customizeHint':
    'Visningsnavnet ditt ble generert automatisk. Tilpass det så det vises under delte sanger.',
  'account.pseudo.available': 'ledig',
  'account.pseudo.unavailable': 'opptatt',
  'account.pseudo.current': 'mitt nåværende navn',
  'account.save': 'Lagre',
  'account.saving': 'Lagrer…',
  'account.saved': 'Lagret.',
  'account.error.pseudoTooShort': 'Visningsnavn må ha minst 3 tegn.',
  'account.error.pseudoTooLong': 'Visningsnavn for langt (maks 20 tegn).',
  'account.error.pseudoInvalidChars':
    '3–20 tegn, kun bokstaver, tall og _',
  'account.error.pseudoDoubleUnderscore': 'Ikke to _ på rad',
  'account.error.pseudoEdgeUnderscore': 'Ingen _ først eller sist',
  'account.error.pseudoReserved': 'Dette visningsnavnet er reservert.',
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
  'account.stats.recording': 'Opptakstid',
  'account.stats.library': 'Bibliotek',
  'account.stats.hour.one': '{count} time',
  'account.stats.hour.other': '{count} timer',
  'account.stats.minute.one': '{count} minutt',
  'account.stats.minute.other': '{count} minutter',
  'account.stats.second.one': '{count} sekund',
  'account.stats.second.other': '{count} sekunder',

  'auth.close': 'Lukk innlogging',
  'auth.signIn.title': 'Logg inn eller opprett konto',
  'auth.signIn.lead':
    'Ingen passord.\nSkriv inn e-post eller visningsnavn.\nKontoen opprettes hvis den ikke finnes.\nÅpne lenken i e-posten (gyldig i 30 minutter, engangsbruk).\nDu forblir innlogget på enheten til du logger ut.',
  'auth.signIn.email': 'E-post',
  'auth.signIn.emailPlaceholder': 'deg@eksempel.com',
  'auth.signIn.identifier': 'E-post eller visningsnavn',
  'auth.signIn.identifierPlaceholder': 'deg@eksempel.com eller max22',
  'auth.signIn.submit': 'Fortsett',
  'auth.signIn.sending': 'Sender…',
  'auth.sent.title': 'Sjekk innboksen',
  'auth.sent.body':
    'En e-post med innloggingslenke er nettopp sendt. Åpne den for å fortsette — kontoen opprettes ved første klikk om nødvendig.',
  'auth.sent.bodyWithEmail':
    'En e-post med innloggingslenke er nettopp sendt til {email}. Åpne den for å fortsette — kontoen opprettes ved første klikk om nødvendig.',
  'auth.sent.hint':
    'Lenken utløper om 30 minutter og kan bare brukes én gang. Sjekk søppelpost om nødvendig.',
  'auth.sent.draftHint':
    'Opptakene dine blir på denne enheten til du åpner lenken. Bruk samme nettleser — ingenting sendes til serveren før du er innlogget.',
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
  'auth.email.welcome.subject': 'Velkommen til polyrecorder',
  'auth.email.welcome.text':
    'Velkommen! polyrecorder-kontoen din er klar.\nHusk å endre visningsnavnet (det ble generert automatisk).\n\nFor å aktivere kontoen din og logge inn, åpne denne lenken (gyldig i 30 minutter, engangsbruk):\n\n{link}\n\nDeretter kan du ta opp, legge lag på lag og laste ned.\n\nHvis du ikke ba om dette, kan du ignorere denne e-posten.',
  'auth.email.welcome.html':
    '<p>Velkommen&nbsp;! <strong style="font-weight:800">polyrecorder</strong>-kontoen din er klar.</p><p>Husk å endre visningsnavnet (det ble generert automatisk).</p><p>For å aktivere kontoen din og logge inn, åpne denne lenken (gyldig i 30&nbsp;minutter, engangsbruk):</p><p><a href="{link}">Aktiver kontoen min</a></p><p>Deretter kan du ta opp, legge lag på lag og laste ned.</p><p>Hvis du ikke ba om dette, kan du ignorere denne e-posten.</p>',
  'auth.email.signIn.subject': 'Innloggingslenken din til polyrecorder',
  'auth.email.signIn.text':
    'Her er innloggingslenken din til polyrecorder (gyldig i 30 minutter, engangsbruk):\n\n{link}\n\nHvis du ikke ba om dette, kan du ignorere denne e-posten.',
  'auth.email.signIn.html':
    '<p>Her er innloggingslenken din til <strong style="font-weight:800">polyrecorder</strong> (gyldig i 30&nbsp;minutter, engangsbruk):</p><p><a href="{link}">Logg inn</a></p><p>Hvis du ikke ba om dette, kan du ignorere denne e-posten.</p>',
  'auth.emailChange.subject': 'Forespørsel om e-postendring for polyrecorder',
  'auth.emailChange.text':
    'Det er bedt om å endre e-postadressen knyttet til en polyrecorder-konto til denne innboksen.\n\nHvis du ikke ba om dette, kan du ignorere e-posten — adressen din endres ikke.\n\nEllers bekreft endringen ved å åpne denne lenken (gyldig i 30 minutter, engangsbruk):\n\n{link}',
  'auth.emailChange.html':
    '<p>Det er bedt om å endre e-postadressen knyttet til en <strong style="font-weight:800">polyrecorder</strong>-konto til denne innboksen.</p><p>Hvis du ikke ba om dette, kan du ignorere e-posten — adressen din endres ikke.</p><p>Ellers bekreft endringen ved å åpne denne lenken (gyldig i 30&nbsp;minutter, engangsbruk):</p><p><a href="{link}">Bekreft ny e-post</a></p>',

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
  'song.title.aria': 'Sangttittel',
  'song.title.openLibrary': 'Åpne sangen i biblioteket',
  'session.defaultTitle': 'Min polyfoni',
  'session.prev': 'Forrige økt',
  'session.next': 'Neste økt',

  'capture.nextTrack': 'Neste spor',
  'capture.nextTrack.hint':
    'Neste spor: spiller av dette opptaket og tar opp det neste samtidig.',
  'capture.discard': 'Forkast opptaket og start på nytt',
  'capture.record': 'Ta opp',
  'capture.import': 'Importer en lydfil',
  'capture.import.hint':
    'Importer en lydfil fra denne enheten (blir et spor)',
  'capture.metronome': 'Metronom',
  'capture.metronome.hint':
    'Legg til et metronomspor (tempo justeres på sporet, standard 60 BPM)',
  'capture.metronome.bpm': 'Tempo i slag per minutt',
  'capture.metronome.unit': 'BPM',
  'capture.metronome.apply': 'OK',
  'capture.dropHint': 'Slipp for å importere',
  'capture.stop': 'Stopp',
  'capture.forgottenStop': 'Har du glemt å stoppe opptaket?',
  'capture.forgottenStop.discard':
    'Hvis ja, kan du avbryte opptaket som pågår med knappen {discard}',

  'track.metronome': 'Metronom {bpm} BPM',
  'track.metronome.label': 'Metronom',

  'mix.restart': 'Tilbake til start',
  'mix.stop': 'Stopp',
  'mix.play': 'Spill av',
  'mix.pause': 'Pause',
  'mix.download': 'Last ned mix (MP3)',
  'mix.download.hint': 'Last ned mix av valgte spor (MP3)',
  'mix.seekAria': 'Avspillingsposisjon',
  'mix.seek.back': '- {seconds} s',
  'mix.seek.back.aria': 'Hopp {seconds} sekunder bakover',
  'mix.seek.back.hint': 'Flytt avspillingshodet {seconds} sekunder bakover',
  'mix.seek.forward': '+ {seconds} s',
  'mix.seek.forward.aria': 'Hopp {seconds} sekunder frem',
  'mix.seek.forward.hint': 'Flytt avspillingshodet {seconds} sekunder frem',
  'mix.masterVolume': 'Mastervolum',
  'mix.clip.record.hint':
    'Klipping ved opptak. Ta opp sporet på nytt og sjekk mikrofonens inngangsnivå.',
  'mix.clip.record.aria': 'Klipping ved opptak',
  'mix.clip.bus':
    'Mix klipper: senk mastervolumet (eller sporvolumene).',
  'settings.autoMasterPreventClip':
    'Senk mastervolum automatisk for å unngå klipping',
  'settings.autoMasterPreventClip.hint':
    'Hvis mixen går over 0 dBFS, senkes master mot ~0,85. Du kan fortsatt heve den manuelt; advarsel vises hvis den klipper igjen.',
  'settings.autoMasterBoost':
    'Øk mastervolum automatisk mot ~0,85',
  'settings.autoMasterBoost.hint':
    'Hvis mixen er for lav, heves master mot en peak på ~0,85. Slå av hvis du foretrekker å holde deg lavere.',
  'mix.autoMaster.hint.prevent':
    'Mastervolumet ble senket automatisk for å unngå klipping.',
  'mix.autoMaster.hint.boost':
    'Mastervolumet ble økt automatisk mot ~0,85.',

  'mode.groupAria': 'Arbeidsmoduser',
  'mode.label': 'Modus',
  'mode.simple': 'Enkel',
  'mode.simple.hint': 'Enkel modus: opptak og avspilling',
  'mode.mix': 'Mix',
  'mode.mix.hint': 'Mix-modus: volum per spor og master',
  'mode.align': 'Justering',
  'mode.align.hint': 'Justeringsmodus: synkronisering av spor',
  'mode.cut': 'Klipp',
  'mode.cut.hint': 'Klippemodus: del, demp segmenter, flett',

  'cut.idle.hint':
    'Sett avspillingsmarkøren, del deretter for å klippe sporene',
  'cut.select.hint': 'Velg ett eller flere spor',
  'cut.select.confirm': 'Bekreft',
  'cut.cancel': 'Avbryt',
  'cut.reset': 'Tilbakestill',
  'cut.rate.aria': 'Avspillingshastighet',
  'cut.rate.half': 'Avspilling i halv hastighet',
  'cut.rate.quarter': 'Avspilling i kvart hastighet',
  'cut.edit.hint':
    'Del ved avspillingsmarkøren, velg segmenter, deretter Gjør stum eller Flett',
  'cut.scissors': 'Del ved avspillingsmarkøren',
  'cut.scissors.hint': 'Del alle segmenter ved avspillingsmarkøren',
  'cut.scissors.aria': 'Del ved avspillingsmarkøren',
  'cut.mute': 'Gjør stum',
  'cut.mute.hint': 'Gjør valgte segmenter stumme (ikke-destruktivt)',
  'cut.mute.barAria': 'Dempede områder for {name}',
  'cut.mute.barTitle': 'Dempet del',
  'cut.mute.remove': 'Fjern denne dempingen',
  'cut.mute.removeAria': 'Fjern dempet område',
  'cut.merge': 'Flett',
  'cut.merge.hint': 'Flett valgte segmenter til et nytt spor',
  'cut.merge.busy': 'Fletter…',
  'cut.merge.progress': 'Fletting pågår…',
  'cut.merge.disabledEmpty': 'Velg minst ett segment',
  'cut.merge.disabledOverlap':
    'Utilgjengelig: valgte segmenter overlapper på tidslinjen',
  'cut.merge.trackName': 'Flett · {names}',
  'cut.merge.trackNameFallback': 'Flett',
  'cut.track.select': 'Inkluder dette sporet i klippemodus',
  'cut.track.selectAria': 'Velg {name} for klipping',
  'cut.segments.aria': 'Segmenter av {name}',
  'cut.segment.toggle': 'Velg eller fjern dette segmentet',

  'piano.toggle': 'Piano',
  'piano.toggle.show': 'Vis piano',
  'piano.toggle.hide': 'Skjul piano',
  'piano.keyboardAria': 'Pianotastatur (to oktaver)',
  'piano.keyAria': 'Tangent {note}',

  'deck.autoAlign.label': 'Autojustering med opptakt',
  'deck.autoAlign.on': 'På',
  'deck.autoAlign.off': 'Av',
  'deck.metronome': 'Metronom',
  'deck.metronome.add': 'Legg til metronom',
  'deck.howtoLink': 'Bruksanvisning',

  'align.latency.label': 'Avspillingsforskyvning',
  'align.latency.about': 'Om avspillingsforskyvning',
  'align.latency.adjust': 'Juster monitoring-forskyvning',
  'align.latency.minus': 'Start monitoring litt tidligere (−5 ms)',
  'align.latency.plus': 'Start monitoring litt senere (+5 ms)',
  'align.latency.input': 'Avspillingsforskyvning i millisekunder',
  'align.latency.tip':
    'Under «Neste spor» spilles tidligere opptak i hodetelefonene med litt maskinvarelatens. polyrecorder starter denne monitoringen litt tidlig, slik at den nye stemmen lander på rett sted på tidslinjen. Juster verdien (±5 ms eller skriv den inn) hvis monitoringen fortsatt føles sen eller tidlig (lagres på denne enheten). Dette er ikke autojustering fra 3–4-markørene: det gjelder bare under opptak.',

  'volume.percentAria': '{label} i prosent',

  'tracks.muteAll.hint': 'Demp / slå på alle spor',
  'tracks.muteAll.aria': 'Aktiver alle spor',
  'tracks.deleteAll': 'Slett alle spor',
  'tracks.deleteOne.confirm': 'Slette sporet «{name}»?',
  'tracks.deleteAll.confirm':
    'Slette {count} spor? De går tapt for godt.',
  'tracks.alignAll.hint':
    'Beregn autojustering på nytt for alle spor (unntatt spor 1)',
  'tracks.alignAll.aria': 'Beregn autojustering på nytt for alle spor',
  'tracks.alignCol': 'Auto',
  'tracks.offsetCol': 'Manuell',
  'tracks.align.legend':
    'Auto: beregn justering på nytt fra 3–4-markørene. Manuell: forskyv sporet for hånd (± ms).',
  'tracks.reorder': 'Omorganiser {name}',
  'tracks.audible': 'Hørbar',
  'tracks.muted': 'Dempet',
  'tracks.listen': 'Lytt til {name}',
  'tracks.name.aria': 'Spornavn',
  'tracks.uploadedBy': 'Innspilt av {pseudo}',
  'tracks.uploadedBy.me': 'Meg',
  'tracks.defaultName': 'Spor {index}',
  'tracks.filenameFallback': 'spor',
  'tracks.volume': 'Volum {name}',
  'tracks.highlight': 'Fremhev {name}',
  'tracks.download.progress': 'Laster spor…',
  'tracks.delete': 'Slett {name}',
  'tracks.delete.confirm': 'Slette «{name}»?',
  'tracks.delete.referenceLocked':
    'Kan ikke slette referansesporet mens autojustering på opptakt er aktivert.',
  'tracks.cloudSave': 'Lagre {name} i skyen',
  'tracks.cloudSaving': 'Lagrer…',
  'tracks.ref.hint': 'Referansespor (1–2–3–4-markører) — klikk for å velge et annet',
  'tracks.ref.aria': 'Referanse',
  'tracks.ref.badge': 'ref.',
  'tracks.ref.pickHint': 'Velg det nye referansesporet',
  'tracks.ref.pickTarget.aria': 'Sett {name} som referansespor',
  'tracks.ref.pickCancel': 'Avbryt',
  'tracks.contentSync': 'sync',
  'tracks.contentSync.aria': 'Synkroniser {name} mot et annet spor',
  'tracks.contentSync.hint':
    'Finjuster med innholdskorrelasjon: trykk Sync, deretter sporet å følge',
  'tracks.contentSync.pickHint': 'Velg sporet å justere mot',
  'tracks.contentSync.pickAbout': 'Om Sync',
  'tracks.contentSync.pickTip':
    'Etter punch-in (opptak under avspilling) starter det nye sporet ved markøren med en midlertidig offset. Sync finjusterer justeringen ved å korrelere lydinnhold: klikk sporet som har samme passasje (ofte det du hørte i monitor). polyrecorder finner beste treff rundt gjeldende offset. Avbryt lukker valget uten endring.',
  'tracks.contentSync.pickTarget.aria': 'Juster {from} mot {name}',
  'tracks.contentSync.pickCancel': 'Avbryt',
  'tracks.contentSync.weak':
    'Sync: for lite felles innhold — beholder foreløpig offset',
  'tracks.contentSync.failed': 'Kunne ikke synkronisere dette sporet',
  'tracks.contentSync.invite.listenSync':
    'Sync ferdig. Lytte til resultatet?',
  'tracks.contentSync.invite.satisfied': 'Fornøyd med synken?',
  'tracks.contentSync.invite.goCalage':
    'Du kan finjustere manuelt i Justering-modus.',
  'tracks.contentSync.invite.goCalage.action': 'Justering',
  'tracks.contentSync.invite.mergeAsk':
    'Flette de to sporene ved en stillhet?',
  'tracks.contentSync.invite.goCut':
    'Du kan flette selv i Klipp-modus.',
  'tracks.contentSync.invite.goCut.action': 'Klipp',
  'tracks.contentSync.invite.merging': 'Fletter…',
  'tracks.contentSync.invite.listenMerge':
    'Fletting klar. Lytte til skjøten?',
  'tracks.contentSync.invite.acceptMerge':
    'Beholde flettingen og slette kildesporene?',
  'tracks.contentSync.invite.mergeNoSilence':
    'Ingen tydelig stillhet i overlappingen — flett i Klipp-modus.',
  'tracks.contentSync.invite.mergeFailed': 'Automatisk fletting mislyktes',
  'tracks.contentSync.invite.help': 'Om opptak underveis',
  'tracks.span.aria': 'Plassering av {name} på mix-tidslinjen',
  'tracks.span.seekAria':
    'Sett avspillingsmarkøren på tidslinjen (spor {name})',
  'tracks.span.seekHint': 'Klikk eller dra for å sette avspillingsmarkøren',
  'tracks.autoAlign': 'Beregn justering på nytt',
  'tracks.autoAlign.named': 'Beregn justering for {name} på nytt',
  'tracks.offset.hint': 'Forskyv dette sporet ved avspilling',
  'tracks.offset.minus': 'Flytt {name} 5 ms tidligere',
  'tracks.offset.plus': 'Flytt {name} 5 ms senere',
  'tracks.offset.input': 'Justering av {name} i millisekunder',
  'tracks.drag': 'Dra for å omorganisere',

  'warn.attention': 'Obs',
  'warn.openAlignMode': 'Åpne justeringsmodus',
  'warn.disableAutoAlign': 'Slå av autojustering',
  'warn.duplicateName.hint':
    'To spor har samme navn. Gi ett av dem et nytt navn for å skille dem.',
  'warn.duplicateName.aria': 'Duplikatnavn: {name}',
  'warn.beat.chip.aria':
    'Obs: problem med opptakten på referansesporet. Åpne justeringsmodus.',
  'warn.skew.tooltip':
    'Autojustering over 300 ms tyder ofte på synkproblemer (uklare markører, latens osv.). Åpne justeringsmodus for å sjekke og justere.',
  'warn.skew.short': 'Høy autojustering på {names}.',
  'warn.skew.long':
    'Høy autojustering på {names}. Sjekk synk i justeringsmodus.',
  'warn.skew.chip.aria':
    'Høy autojustering på {name}. Åpne justeringsmodus.',
  'warn.beat.irregular':
    'Uregelmessig eller uoppdaget 1-2-3-4-opptakt på referansesporet ({name}).',
  'warn.beat.missing':
    '1-2-3-4-opptakt ikke funnet på «{name}» ({count}/4 treff).',
  'warn.beat.error': 'Kunne ikke analysere opptakten på «{name}».',

  'howto.title': 'Bruksanvisning',
  'howto.metro.off': 'Uten metronom',
  'howto.metro.on': 'Med metronom',
  'howto.metro.add':
    'Legg først til metronomen med knappen «Metronom» under opptakeren (ved siden av Piano). Den blir referansesporet (syntetisk 1-2-3-4): på hver stemme markerer du bare 3. og 4. taktslag høyt.',
  'howto.step1': 'trykk på regnbue-mikrofonen for å ta opp',
  'howto.step2':
    'si 1-2-3-4 høyt og jevnt (eller et annet tydelig 4-taktsignal), og syng deretter første stemme',
  'howto.step2.metro':
    'la metronomen spille 1-2-3-4, men si 3. og 4. taktslag høyt (eller en tydelig lyd), og syng deretter første stemme',
  'howto.step3':
    'trykk «Neste spor» (chevron til høyre) for å gå rett til opptak av andre stemme',
  'howto.step4':
    'si bare 3. og 4. taktslag høyt nøyaktig når du hører dem, og syng deretter andre stemme',
  'howto.step4.metro':
    'samme som første stemme: på metronomens 3. og 4. klikk, marker dem høyt, og syng deretter andre stemme',
  'howto.step5': 'gjenta for flere stemmer',
  'howto.step6':
    'trykk på regnbue-«Stopp»-knappen ved slutten av siste stemme',
  'howto.tips':
    'Tips: ta opp i rolige omgivelser, gjerne med hodetelefoner eller ørepropp—særlig på mobil!',
  'howto.whyNeeded': 'Hvorfor er dette nødvendig',
  'howto.whyNeeded.about': 'Hvorfor autojustering med opptakt er nødvendig',
  'howto.latency':
    'Nettlesere og lydutstyr gir latens (hodetelefoner, mikrofon, buffer). Uten felles markører sklir opptakene. De fire markørene på referansesporet og «3-4» på senere spor lar polyrecorder måle og rette denne forskyvningen automatisk.',

  'help.title': 'Hjelp',
  'help.close': 'Lukk hjelp',
  'help.search.placeholder': 'Søk…',
  'help.search.aria': 'Søk i hjelpen',
  'help.search.empty': 'Ingen rubrikker matcher dette søket.',
  'help.toc.aria': 'Innholdsfortegnelse for hjelp',
  'help.toc.start': 'Kom i gang',
  'help.toc.guest': 'Gjest og konto',
  'help.toc.metronome': 'Metronom',
  'help.toc.piano': 'Piano',
  'help.toc.record': 'Generelle kommandoer',
  'help.toc.sync': 'Modus Justering',
  'help.toc.cut': 'Modus Klipp',
  'help.toc.mix': 'Modus Mix',
  'help.toc.library': 'Bibliotek',
  'help.toc.share': 'Deling',
  'help.toc.account': 'Konto',
  'help.toc.devices': 'Innstillinger',
  'help.toc.shortcuts': 'Hurtigtaster',
  'help.toc.faq': 'FAQ',

  'help.start.title': 'Kom i gang',
  'help.start.body1':
    'Du kan starte med en gang, uten å opprette konto. Bruk hodetelefoner: ellers kan mikrofonen ta opp lyden fra høyttalerne på nytt.',
  'help.start.body2':
    'For å legge flere stemmer oppå hverandre i takt: på 1. spor, si tydelig «1-2-3-4» før du synger; på de neste, si bare «3-4». Se Synkronisering lenger ned.',
  'help.start.howtoLink': 'Se veiledning for justering',

  'help.guest.title': 'Gjestemodus og innlogging',
  'help.guest.body1':
    'Uten konto lagres ikke opptakene dine. Etter et opptak får du tilbud om å logge inn for å beholde og dele dem.',
  'help.guest.body2':
    'Du logger inn med en lenke på e-post (ingen passord). Åpne den i samme nettleser: lokale opptak hentes inn og lagres deretter på kontoen din.',
  'help.guest.body3':
    'Bytter du enhet eller nettleser før innlogging, finner du ikke disse opptakene igjen.',

  'help.metronome.title': 'Metronom',
  'help.metronome.body1':
    'Under opptakeren kan du legge til en metronom. Den er en rytmereferanse: på hver stemme sier du «3-4» samtidig med 3. og 4. slag for å låse deg på den. Bruk hodetelefoner når du tar opp med metronom (anbefalt også uten!).',

  'help.piano.title': 'Piano',
  'help.piano.body1':
    'Piano-knappen under opptakeren åpner et lite tastatur som gir deg tonen. Med hodetelefoner kan du spille en tone diskret også mens du tar opp!',

  'help.record.title': 'Generelle kommandoer',
  'help.record.action.import':
    'importerer en lydfil (dra-og-slipp på opptakeren fungerer også). Vanlige formater: MP3, WAV, OGG, M4A m.m.',
  'help.record.action.record': 'starter et opptak (ved markøren).',
  'help.record.action.next':
    'lagrer gjeldende spor og starter et nytt mens du hører de forrige.',
  'help.record.action.stopCapture':
    'avslutter opptaket og lagrer sporet (med mindre det varer under ett sekund).',
  'help.record.action.discard':
    'avbryter gjeldende opptak og starter på nytt med en gang.',
  'help.record.action.stopPlay':
    'stopper avspillingen og går tilbake til starten.',
  'help.record.action.export':
    'eksporterer en MP3 som matcher det du hører når du spiller av den aktive økten. Sangnavn, øktnavn (innlogget) og spornavn (hvis ikke alle er valgt) havner i filnavnet.',
  'help.record.mode.simple': 'ta opp og lytt',
  'help.record.mode.mix': 'justere volumene',
  'help.record.mode.align': 'synkronisere sporene',
  'help.record.mode.cut': 'dempe et parti eller sette sammen segmenter',
  'help.record.tool.piano': 'viser et lite tastatur som gir deg tonen',
  'help.record.tool.metronome': 'legger til et metronomspor',
  'help.record.body2':
    'Prosjekttittelen endres øverst{f2}. Gi nytt navn til et spor ved å klikke på det. Navnene vises også på den nedlastede MP3-filen.',
  'help.record.f2': ' — snarvei F2',

  'help.sync.title': 'Synkronisering',
  'help.sync.autoAlign.title': 'Autojustering med opptakt',
  'help.sync.autoAlign.body1':
    'Denne modusen retter synkroniseringsproblemer mellom spor under opptak.',
  'help.sync.autoAlign.body2':
    'Hvis du bruker denne modusen (på som standard), må første spor (referanse) starte med fire tydelige, jevne markører (si «1-2-3-4», eller en annen klar 4-taktslyd).',
  'help.sync.autoAlign.body3':
    'På de neste sier du bare «3-4» (eller klare lyder), deretter synger du.',
  'help.sync.autoAlign.body4':
    'polyrecorder bruker dem til å måle og automatisk rette forskyvningen fra lydlatens. Med metronom som referanse markerer du bare «3-4» på opptakene.',
  'help.sync.autoAlign.rerun.before': 'Knappene',
  'help.sync.autoAlign.rerun.after':
    ', som bare vises når autojustering er på, lar deg autojustere i etterkant hvis valget ikke var huket av fra starten.',
  'help.sync.noise.body':
    'Hvis «1-2-3-4» på referansesporet drukner i støy, kjenner ikke appen det godt igjen og sier ifra: ta heller det sporet på nytt. Det samme gjelder «3-4» på senere spor: er det uklart, kan autojusteringen av de sporene feile.',
  'help.sync.ref.body':
    '«ref.» viser referansesporet. Klikk det for å velge et annet.',
  'help.sync.punch.title': 'Opptak underveis',
  'help.sync.punch.body1.before': 'Under avspilling (eller pause midt i),',
  'help.sync.punch.body1.after':
    'starter et nytt spor der. En «Sync»-knapp vises kort i Simple-modus (den blir værende i Justering). Den lar deg synkronisere sporet mot et annet (velg etter klikk på «Sync»).',
  'help.sync.punch.bodyInvite':
    'Etter vellykket Sync foreslår invitasjoner å lytte til resultatet, bekrefte justeringen, og eventuelt flette de to sporene ved en stillhet (med lytting på skjøten). Avviser du synken, kan du gå til Justering for manuell finjustering; uten autofletting står Klipp-modus klar til å gjøre det selv.',
  'help.sync.punch.body2':
    'Funksjonen er tenkt for å fortsette et avbrutt opptak. Start opptaket litt før slutten av det avbrutte, gjør om en vellykket bit først, fortsett så. Den like biten gjør synkronisering mulig. Etter sync kan du flette de to sporene i «Klipp»: sett starten av første og slutten av neste inntil hverandre.',
  'help.sync.punch.seeCut': 'Se rubrikken Klipp',

  'help.cut.title': 'Klipp',
  'help.cut.body1':
    'Denne modusen lar deg dele spor, dempe partier eller sette sammen segmenter til et nytt spor.',
  'help.cut.split.title': 'Del',
  'help.cut.split.body1.before':
    'Sett avspillingsmarkøren der du vil, og bruk',
  'help.cut.split.body1.after':
    '. Sporene deles i segmenter: klikk et segment for å velge det (du kan velge flere).',
  'help.cut.split.body2':
    'Tilbakestill avbryter gjeldende delinger og går tilbake til hele spor.',
  'help.cut.mute.title': 'Demp',
  'help.cut.mute.body1':
    'Demp gjør valgte segmenter stumme uten å skrive om lydfilen. En stripe markerer området; du kan fjerne den senere.',
  'help.cut.merge.title': 'Flett',
  'help.cut.merge.body1':
    'Flett setter sammen valgte segmenter til et nytt spor. Hull mellom segmenter blir stillhet. Umulig hvis segmentene overlapper på tidslinjen.',
  'help.cut.tips.body1':
    'Du kan sakke avspillingen (×0.25 eller ×0.5) for å plassere markøren mer nøyaktig.',
  'help.cut.tips.body2':
    'Å dempe et parti lagres bare på nett hvis du eier sporet. Fletting lager et nytt spor under navnet ditt.',

  'help.mix.title': 'Mix og eksport',
  'help.mix.body1.before':
    'Mix-modus lar deg justere volumet på hvert spor og totalvolumet, fremheve spor med',
  'help.mix.body1.mid':
    '-knappene, og laste ned en MP3 (bare valgte spor). Som i andre modi lar',
  'help.mix.body1.after': '-knappene deg dempe spor.',
  'help.mix.body2.before':
    'Selv om volumet på hvert spor er riktig, kan stablingen bli for kraftig. Et alternativ, på som standard og som kan slås av under',
  'help.mix.body2.after':
    ', senker automatisk totalvolumet ved klipping.',
  'help.mix.body3':
    'Et annet alternativ kan i stedet øke totalvolumet automatisk hvis det er lavt.',
  'help.mix.body4':
    'Et «!» på et spor betyr at det klippet under opptak: ta opp på nytt med lavere mikronivå eller ved å gå lenger unna.',

  'help.library.title': 'Skybibliotek',
  'help.library.body1':
    'Når du er innlogget, ligger prosjektene i Mitt bibliotek, ordnet slik: grupper → repertoarer → sanger → økter. Brødsmulestien, også synlig i opptakeren, viser hvor du er.',
  'help.library.body2':
    'Første lagring lager en sang under Personlig / Generelt.',
  'help.library.body3.before': 'Slett elementer',
  'help.library.body3.mid': ', legg til',
  'help.library.body3.after':
    ', gi nytt navn (klikk på navnet) eller del fra biblioteket. Merk: sletting av et element sletter også alt det inneholder (antallet vises).',

  'help.share.title': 'Deling og samarbeid',
  'help.share.body1':
    'Fra biblioteket eller opptakeren kan du gjøre en sang offentlig. Slå på samarbeid (bare fra biblioteket) så andre innloggede kan legge til spor.',
  'help.share.body2':
    'Del-knappen lar deg kopiere lenken eller, på mobil, dele direkte via appene dine.',
  'help.share.body3':
    'I visning (offentlig sang uten samarbeid) kan du ta opp flere spor, men bare for deg selv—de lagres ikke i det offentlige prosjektet.',

  'help.account.title': 'Konto',
  'help.account.body1':
    'Du logger inn med e-post eller pseudo (lenke på e-post). I kontoinnstillinger kan du endre e-post og pseudo, og se total opptakstid samt antall grupper, repertoarer, sanger og økter.',
  'help.account.body2':
    'Sletting av kontoen sletter tilhørende data for godt. Detaljer i personvern og vilkår.',

  'help.devices.title': 'Innstillinger',
  'help.devices.body1':
    'Under Preferanser finner du alle alternativene beskrevet ovenfor.',
  'help.devices.body2':
    'Avhengig av utstyret ditt (datamaskin, nettleser) kan du sette opp lydinngang og -utgang (mikrofon og høyttaler).',

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
    'Lukk Hjelp / Preferanser / Konto / Bibliotek',

  'help.faq.title': 'FAQ',
  'help.faq.accountNeeded.q': 'Trenger jeg en konto?',
  'help.faq.accountNeeded.a':
    'Ikke for å starte. En konto (med e-post) brukes til å lagre online, dele og samarbeide.',
  'help.faq.guestKeepTakes.q':
    'Hva skjer med opptakene hvis jeg tar opp som gjest og deretter logger inn?',
  'help.faq.guestKeepTakes.a':
    'De gjenopprettes fra det lokale utkastet i denne nettleseren og lastes deretter opp til kontoen din som etter et vanlig ferdig opptak, som en ny sang. Lenken i e-posten må åpnes i samme nettleser.',
  'help.faq.guestLost.q':
    'Mister jeg gjesteopptak hvis jeg bytter enhet?',
  'help.faq.guestLost.a':
    'Ja, hvis du bytter enhet eller nettleser. Logg inn der du tok opp for å hente dem.',
  'help.faq.headphones.q': 'Hvorfor hodetelefoner?',
  'help.faq.headphones.a':
    'Uten dem tar mikrofonen ofte opp høyttalerne på nytt: lyd og timing blir dårligere. Hodetelefoner forhindrer det.',
  'help.faq.modes.q':
    'Hva er modusene Simple, Mix, Justering og Klipp til?',
  'help.faq.modes.a':
    'Simple: ta opp og lytt. Mix: styre volumene. Justering: synke rytmene. Klipp: dempe et parti, sette sammen biter.',
  'help.faq.clipping.q': 'Hvorfor advarsel om klipping i Mix?',
  'help.faq.clipping.a':
    'Et «!» på et spor: det var for sterkt under opptak — ta opp på nytt med lavere mikronivå. En melding ved totalvolumet: mixen er for sterk — senk den, eller slå på auto-senking under Innstillinger.',
  'help.faq.metronome.q': 'Hva er metronomet til?',
  'help.faq.metronome.a':
    'Metronomet kan hjelpe deg å holde tempo, og det kan også brukes til autojustering. Slå da på «Autojustering etter slag» og si «3-4» på 3. og 4. slag mens du tar opp (eller lag to tydelige lyder). Uten det kan forskyvninger oppstå på grunn av maskinvare- eller programvarelatens.',
  'help.faq.piano.q': 'Blir pianoet tatt opp sammen med stemmen?',
  'help.faq.piano.a':
    'Nei. Pianoet gir deg bare tonen. Med hodetelefoner hører du det uten at det kommer inn i opptaket.',
  'help.faq.skew.q': 'Sporene er forskjøvet — hva gjør jeg?',
  'help.faq.skew.a1':
    'Hvis du vil bruke autojustering etter slag og ikke bruker metronom, må de fire startslagene være tydelig hørbare uten støy. Senere spor skal bare ha slag på 3. og 4. telling. Uten autojustering kan du justere manuelt i',
  'help.faq.skew.a2':
    'modus ved å justere millisekundene til høyre for sporene.',
  'help.faq.storage.q': 'Hvor lagres opptakene mine?',
  'help.faq.storage.a':
    'Uten konto lagres ikke spor på internett. Med konto, på sangene dine, ja — og du finner dem i biblioteket (Personlig / Generelt først). Spor du har lagt til på en annen brukers sang lagres på kontoen deres.',
  'help.faq.libraryWhere.q':
    'Hvor finner jeg en nettopp lagret økt?',
  'help.faq.libraryWhere.a':
    'Du finner den via brødsmulene øverst på opptakeren. Hvis du er usikker, sjekk biblioteket — som standard ligger økter i Personlig / Generelt.',
  'help.faq.share.q': 'Hvordan deler jeg en sang og samarbeider?',
  'help.faq.share.a1': 'Gjør sangen offentlig ved å klikke på',
  'help.faq.share.a2': '(fra biblioteket eller opptakeren), deretter',
  'help.faq.share.a3':
    '. Hvis andre skal kunne legge til spor som alle ser, slå på samarbeid ved å klikke på',
  'help.faq.share.a4': '(bare fra biblioteket).',
  'help.faq.browsers.q': 'Hvilke nettlesere og tillatelser?',
  'help.faq.browsers.a':
    'En oppdatert nettleser (Chrome, Firefox, Safari, Edge…) og tillatt mikrofontilgang (nettlesertillatelser).',
  'help.faq.sizeLimit.q': 'Finnes det en størrelsesgrense?',
  'help.faq.sizeLimit.a':
    'Ja: omtrent 100 MB per fil sendt online.',
  'help.faq.deleteAccount.q': 'Hvordan sletter jeg kontoen?',
  'help.faq.deleteAccount.a':
    'Kontoinnstillinger → Slett kontoen min. Det er permanent. Se også Personvern og Vilkår.',
  'help.faq.deleteAccount.privacy': 'Personvern',
  'help.faq.deleteAccount.terms': 'Vilkår',
  'help.faq.pwa.q': 'Fungerer appen frakoblet?',
  'help.faq.pwa.a':
    'Opptak på enheten kan fungere uten Internett; lagring, innlogging og deling krever tilkobling.',
  'help.faq.installable.q': 'Kan appen installeres?',
  'help.faq.installable.a':
    'Ja — åpne nettlesermenyen og velg «Installer appen». Du finner ikke polyrecorder i App Stores, men slik er appen alltid oppdatert.',
  'help.faq.accountStats.q':
    'Hva betyr tallene under Min konto?',
  'help.faq.accountStats.a':
    'Opptakstid summerer sporene dine lagret online. De andre tallene teller grupper, repertoarer, sanger og økter.',

  'nav.library': 'Bibliotek',
  'nav.myLibrary': 'Mitt bibliotek',

  'cloud.error.tooLarge': 'Filen er for stor (maks 100 MB).',
  'cloud.error.s3NotConfigured': 'Skylagring er ikke konfigurert.',
  'cloud.error.unauthorized': 'Logg inn for å lagre i skyen.',
  'guestDraft.quota':
    'Ikke nok lokal lagring til å lagre utkastet. Frigjør plass eller logg inn snart.',
  'guest.prompt.body':
    'Du er i gjestemodus. Uten innlogging blir arbeidet bare på denne enheten: det går tapt hvis du forlater siden, og du kan ikke dele det.',
  'guest.prompt.bodyAccount':
    'En konto opprettes med ett klikk bare med e-postadresse.',
  'guest.prompt.cta': 'Logg inn / Opprett konto',
  'guest.prompt.dismiss': 'Lukk',
  'pwa.install.body': 'Installer polyrecorder på denne enheten for raskere tilgang.',
  'pwa.install.cta': 'Installer',
  'pwa.install.later': 'Senere',
  'pwa.install.dismiss': 'Lukk',
  'pwa.install.ios.howto': 'Trykk Del, deretter «Legg til på Hjem-skjerm».',
  'pwa.install.ios.gotIt': 'Skjønner',
  'cloud.error.uploadFailed': 'Opplasting til skyen mislyktes. Prøv igjen.',
  'cloud.error.openFailed': 'Kunne ikke åpne denne sangen.',
  'cloud.error.openOffline':
    'Frakoblet: kan ikke åpne denne sangen. Sjekk tilkoblingen eller start en ny økt.',

  'library.title': 'Bibliotek',
  'library.close': 'Lukk bibliotek',
  'library.empty': 'Ingen grupper ennå.',
  'library.empty.repertoires': 'Ingen repertoar ennå.',
  'library.empty.songs': 'Ingen sanger ennå.',
  'library.empty.songParts': 'Ingen økter ennå.',
  'library.group': 'Gruppe',
  'library.repertoire': 'Repertoar',
  'library.song': 'Sang',
  'library.songPart': 'Økt',
  'library.level.groups': 'Grupper',
  'library.level.repertoires': 'Repertoar',
  'library.level.songs': 'Sanger',
  'library.level.songParts': 'Økter',
  'library.group.meta': '{repertoires} · {songs}',
  'library.count.group.one': '{count} gruppe',
  'library.count.group.other': '{count} grupper',
  'library.count.repertoire.one': '{count} repertoar',
  'library.count.repertoire.other': '{count} repertoar',
  'library.count.song.one': '{count} sang',
  'library.count.song.other': '{count} sanger',
  'library.count.songPart.one': '{count} økt',
  'library.count.songPart.other': '{count} økter',
  'library.count.track.one': '{count} spor',
  'library.count.track.other': '{count} spor',
  'library.addGroup': 'Ny gruppe',
  'library.addRepertoire': 'Nytt repertoar',
  'library.addSong': 'Ny sang',
  'library.addSongPart': 'Ny økt',
  'library.songPart.default': 'Økt',
  'library.songPart.unnamed': 'Uten navn',
  'library.rename': 'Gi nytt navn',
  'library.reorder': 'Flytt {name}',
  'library.delete': 'Slett',
  'library.deleteSongPart': 'Slett økt',
  'library.deleteSongPartConfirm': 'Slette økten «{name}» og sporene?',
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
  'library.collaborate.enable': 'Tillat samarbeid',
  'library.collaborate.disable': 'Slå av samarbeid',
  'library.collaborate.on':
    'Samarbeid på: innloggede brukere kan legge til spor',
  'library.collaborate.off':
    'Samarbeid av — besøkende kan bare lytte',
  'library.share': 'Del',
  'library.share.disabled': 'Gjør sangen offentlig for å dele den.',
  'library.share.copy': 'Kopier lenke',
  'library.share.copied': 'Lenke kopiert',
  'library.share.whatsapp': 'WhatsApp',
  'library.share.native': 'Del…',
  'library.share.title': 'Del «{name}»',

  'song.view.notFound': 'Denne sangen mangler eller er privat.',
  'song.view.newSession': 'Ny økt',
  'song.view.shared': 'delt',
  'song.view.collaborate': 'åpen for samarbeid',
  'song.og.description': '{tracks} · Lytt på polyrecorder',

  'settings.title': 'Preferanser',
  'settings.close': 'Lukk preferanser',
  'settings.appearance': 'Utseende:',
  'settings.theme.aria': 'Tema',
  'settings.theme.system': 'Auto (nettleser)',
  'settings.theme.light': 'Lyst',
  'settings.theme.dark': 'Mørkt',
  'settings.autoplay': 'Spill av automatisk når opptaket er ferdig',
  'settings.showCalageWarnings': 'Vis justeringsrelaterte advarsler',
  'settings.showCalageWarnings.about': 'Om justeringsadvarsler',
  'settings.showCalageWarnings.tip':
    '«!»-varsler når referansens 1-2-3-4-opptakt virker uregelmessig, eller når autojustering overstiger 300 ms. Skrur av automatisk hvis første spor i en sang er en lydimport (vanligvis uten opptakt).',
  'settings.autoAlign': 'Autojustering med opptakt',
  'settings.autoAlign.about': 'Om autojustering',
  'settings.autoAlign.tip':
    'Måler og retter forskyvning mellom spor ved hjelp av markørene 1-2-3-4 (referanse) og 3-4 (senere spor). Tilpasset polyfoniopptak. Skru den av for lydimporter uten opptakt, for å unngå forskyvninger og varsler.',
  'settings.countInAlign': 'Opptakt og autojustering',
  'settings.defaultsForNewProjects': 'Standardinnstillinger for nye prosjekter',
  'settings.autoCloudSave': 'Lagre spor automatisk i skyen',
  'settings.autoCloudSave.hint':
    'Hvis avkrysset, vises en knapp på hvert lokalt spor for manuell opplasting.',
  'settings.skipCountIn': 'Fjern 1-2-3-4 hvis oppdaget',
  'settings.skipCountIn.play.hint':
    'Avspilling starter rett etter «4» (hvis en opptakt ble oppdaget)',
  'settings.skipCountIn.play': 'ved avspilling',
  'settings.skipCountIn.download.hint':
    'MP3-en starter rett etter «4» (hvis en opptakt ble oppdaget)',
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
  'error.tracksStillLoading': 'Spor lastes fortsatt…',
  'error.recordFailed': 'Opptak mislyktes.',
  'error.recordStart': 'Kunne ikke starte opptak.',
  'error.noActiveRecording': 'Ingen opptak pågår.',
  'error.noAudioData': 'Ingen lyd fanget. Prøv å ta opp på nytt.',
  'error.discardFailed': 'Kunne ikke starte opptaket på nytt.',
  'error.micAccess': 'Fikk ikke tilgang til mikrofonen.',
  'error.importFailed': 'Kunne ikke importere lydfilen.',
  'error.importNoAudio': 'Ingen gjenkjent lydfil.',
  'error.importDecodeFailed':
    'Denne lydfilen kan ikke avkodes av nettleseren.',
  'error.importTooLong':
    'Filen er for lang (maks 5 minutter, som et opptak).',
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
