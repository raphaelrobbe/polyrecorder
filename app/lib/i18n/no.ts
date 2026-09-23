import type { MessageKey } from './fr'

/** Norwegian (Bokmål) UI copy — please review. */
export const no: Record<MessageKey, string> = {
  'brand.tagline': 'Ta opp, lag på lag, lytt, last ned.',

  'deck.ariaLabel': 'Opptaker',

  'common.close': 'Lukk',
  'common.delete': 'Slett',

  'nav.help': 'Hjelp',
  'nav.settings': 'Innstillinger',
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
  'tracks.delete': 'Slett {name}',
  'tracks.delete.confirm': 'Slette «{name}»?',
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
  'help.shortcuts.closePanels': 'Lukk Hjelp / Innstillinger',

  'settings.title': 'Innstillinger',
  'settings.close': 'Lukk innstillinger',
  'settings.appearance': 'Utseende:',
  'settings.theme.aria': 'Tema',
  'settings.theme.system': 'Auto (nettleser)',
  'settings.theme.light': 'Lyst',
  'settings.theme.dark': 'Mørkt',
  'settings.autoplay': 'Spill av automatisk når opptaket er ferdig',
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
