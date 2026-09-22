/** French UI copy (source language). */
export const fr = {
  'brand.tagline': 'Enregistre, superpose, écoute, télécharge.',

  'deck.ariaLabel': 'Enregistreur',

  'common.close': 'Fermer',
  'common.delete': 'Supprimer',

  'nav.help': 'Aide',
  'nav.settings': 'Paramètres',
  'locale.select.aria': 'Choisir la langue',
  'settings.language': 'Langue :',
  'settings.language.aria': 'Langue de l’interface',

  'theme.switchToDark': 'Passer en thème sombre',
  'theme.switchToLight': 'Passer en thème clair',
  'theme.darkSystem': 'Thème sombre (actuellement auto)',
  'theme.lightSystem': 'Thème clair (actuellement auto)',
  'theme.dark': 'Thème sombre',
  'theme.light': 'Thème clair',

  'session.title.aria': "Titre de l'enregistrement",
  'session.defaultTitle': 'Ma polyphonie',

  'capture.nextTrack': 'Piste suivante',
  'capture.nextTrack.hint':
    'Piste suivante : rejoue cette prise et enregistre la suivante en même temps.',
  'capture.discard': 'Annuler la prise et recommencer',
  'capture.record': 'Enregistrer',
  'capture.stop': 'Stop',

  'mix.restart': 'Revenir au début',
  'mix.play': 'Lecture',
  'mix.pause': 'Pause',
  'mix.download': 'Télécharger le mix (MP3)',
  'mix.download.hint':
    'Télécharger le mix des pistes sélectionnées (MP3)',
  'mix.seekAria': 'Position de lecture',
  'mix.masterVolume': 'Volume maître',

  'mode.groupAria': 'Modes de travail',
  'mode.label': 'Mode',
  'mode.mix': 'Mixage',
  'mode.mix.hint': 'Mode mixage : volumes par piste et maître',
  'mode.align': 'Calage',
  'mode.align.hint': 'Mode calage : synchronisation des pistes',

  'align.latency.label': 'Avance de lecture',
  'align.latency.about': "À propos de l'avance de lecture",
  'align.latency.adjust': "Ajuster l'avance de lecture du monitoring",
  'align.latency.minus':
    'Démarrer le monitoring un peu plus tôt (−5 ms)',
  'align.latency.plus':
    'Démarrer le monitoring un peu plus tard (+5 ms)',
  'align.latency.input': 'Avance de lecture en millisecondes',
  'align.latency.tip':
    "Pendant « Piste suivante », les prises déjà faites sont rejouées dans le casque avec un peu de latence matérielle. PolyRecorder démarre cette écoute un peu plus tôt pour que ta nouvelle voix tombe au bon endroit sur la timeline. Ajuste la valeur (±5 ms ou saisie directe) si le monitoring te paraît encore en retard ou en avance (réglage mémorisé sur cet appareil). Ce n'est pas le calage auto des pistes (marquages 3–4) : celui-ci sert uniquement pendant l'enregistrement.",

  'volume.percentAria': '{label} en pourcent',

  'tracks.muteAll.hint': 'Activer / couper toutes les pistes',
  'tracks.muteAll.aria': 'Activer toutes les pistes',
  'tracks.deleteAll': 'Supprimer toutes les pistes',
  'tracks.deleteOne.confirm': 'Supprimer la piste « {name} » ?',
  'tracks.deleteAll.confirm':
    'Supprimer les {count} pistes ? Elles seront définitivement perdues.',
  'tracks.alignAll.hint':
    'Activer / désactiver le calage auto (sauf piste 1)',
  'tracks.alignAll.aria': 'Calage auto sur toutes les pistes',
  'tracks.reorder': 'Réordonner {name}',
  'tracks.audible': 'Audible',
  'tracks.muted': 'Muet',
  'tracks.listen': 'Écouter {name}',
  'tracks.name.aria': 'Nom de la piste',
  'tracks.defaultName': 'Piste {index}',
  'tracks.filenameFallback': 'piste',
  'tracks.volume': 'Volume {name}',
  'tracks.delete': 'Supprimer {name}',
  'tracks.delete.confirm': 'Supprimer « {name} » ?',
  'tracks.ref.hint': 'Piste de référence (marquages 1–2–3–4)',
  'tracks.ref.aria': 'Référence',
  'tracks.ref.badge': 'réf.',
  'tracks.autoAlign': 'Calage auto',
  'tracks.autoAlign.named': 'Calage auto {name}',
  'tracks.offset.hint': 'Décaler cette piste à la lecture',
  'tracks.offset.minus': 'Avancer {name} de 5 ms',
  'tracks.offset.plus': 'Retarder {name} de 5 ms',
  'tracks.offset.input': 'Calage de {name} en millisecondes',
  'tracks.drag': 'Glisser pour réordonner',

  'warn.attention': 'Attention',
  'warn.openAlignMode': 'Ouvrir le mode calage',
  'warn.skew.tooltip':
    'Un calage auto supérieur à 300 ms indique souvent un problème de sync (marquages peu clairs, latence, etc.). Ouvre le mode calage pour inspecter et ajuster.',
  'warn.skew.short': 'Calage auto élevé sur {names}.',
  'warn.skew.long':
    'Calage auto élevé sur {names}. Vérifie le sync en mode calage.',
  'warn.beat.irregular':
    'Battue 1-2-3-4 irrégulière ou non détectée sur la piste de référence ({name}).',
  'warn.beat.missing':
    'Battue 1-2-3-4 non détectée sur « {name} » ({count}/4 attaques).',
  'warn.beat.error': "Impossible d'analyser la battue de « {name} ».",

  'howto.title': "Mode d'emploi",
  'howto.step1': 'cliquer sur le bouton rouge « Enregistrer »',
  'howto.step2':
    'à haute voix et de manière régulière, dire 1-2-3-4 (ou quoi que ce soit d’audible en 4 temps) puis chanter la première voix',
  'howto.step3':
    'cliquer sur le bouton « Piste suivante » (chevron vers la droite), on passe directement à l’enregistrement de la deuxième voix',
  'howto.step4':
    'ne répéter que les 3ème et 4ème temps à haute voix exactement quand vous les entendez, puis chanter la deuxième voix',
  'howto.step5': 'recommencer pour les voix suivantes',
  'howto.step6':
    'cliquer sur le bouton rouge « Stop » à la fin de la dernière voix',
  'howto.tips':
    'Conseils : enregistrez-vous dans un environnement silencieux, si possible avec un casque ou une oreillette, surtout sur mobile\u00a0!',
  'howto.latency':
    'Les navigateurs et le matériel audio introduisent une latence (casque, micro, buffer). Sans repères communs, les prises se décalent. Les quatre marquages de la piste de référence et les «\u00a03-4\u00a0» des pistes suivantes permettent à PolyRecorder de mesurer et corriger ce décalage automatiquement. Des sons nets, espacés et réguliers donnent un meilleur calage ; une battue irrégulière ou peu audible peut fausser la synchronisation.',

  'help.title': 'Aide',
  'help.close': "Fermer l'aide",
  'help.customize.title': 'Personnalisation',
  'help.customize.body1':
    'Le nom du projet se modifie en haut, en cliquant sur le titre{f2}. Le nom de chaque piste se modifie aussi en cliquant dessus dans la liste.',
  'help.customize.f2': ' (ou avec F2)',
  'help.customize.body2':
    'Ces noms servent au fichier MP3 téléchargé : le titre du projet, et — si toutes les pistes ne sont pas sélectionnées — les noms des pistes exportées, par exemple «\u00a0Ma polyphonie_Basses 1 - Basses 2.mp3\u00a0».',
  'help.sync.title': 'Synchronisation',
  'help.sync.body1':
    'Pour caler les pistes entre elles, la première (référence) doit commencer par quatre marquages nets et réguliers (1-2-3-4, ou tout signal audible en 4 temps). Les pistes suivantes ne reprennent que les 3ème et 4ème temps, puis la voix. PolyRecorder s’en sert pour mesurer et corriger automatiquement le décalage dû à la latence audio.',
  'help.sync.body2':
    'Des bruits parasites peuvent empêcher la reconnaissance du 1-2-3-4. Dans ce cas, mieux vaut recommencer l’enregistrement de zéro pour repartir sur une bonne piste de référence : sinon tout devra être calé à la main. Idem pour le 3-4 des pistes suivantes : un marquage peu clair ou noyé dans le bruit fausse le calage auto de cette prise.',
  'help.shortcuts.title': 'Raccourcis clavier',
  'help.shortcuts.recording': 'Enregistrement',
  'help.shortcuts.record': 'Enregistrer',
  'help.shortcuts.next': 'Piste suivante',
  'help.shortcuts.discard': 'Annuler la prise',
  'help.shortcuts.stop': 'Stop',
  'help.shortcuts.playback': 'Lecture',
  'help.shortcuts.playPause': 'Play / Pause',
  'help.shortcuts.downloadCat': 'Téléchargement',
  'help.shortcuts.download': 'Télécharger le MP3',
  'help.shortcuts.general': 'Général',
  'help.shortcuts.editTitle': 'Éditer le titre',
  'help.shortcuts.closePanels': 'Fermer Aide / Paramètres',

  'settings.title': 'Paramètres',
  'settings.close': 'Fermer les paramètres',
  'settings.appearance': 'Apparence :',
  'settings.theme.aria': "Thème d'apparence",
  'settings.theme.system': 'Auto (navigateur)',
  'settings.theme.light': 'Clair',
  'settings.theme.dark': 'Sombre',
  'settings.autoplay':
    "Lire automatiquement après la fin de l'enregistrement",
  'settings.skipCountIn': 'Supprimer le 1-2-3-4',
  'settings.skipCountIn.play.hint':
    'La lecture commence juste après le « 4 »',
  'settings.skipCountIn.play': 'à la lecture',
  'settings.skipCountIn.download.hint':
    'Le MP3 commence juste après le « 4 »',
  'settings.skipCountIn.download': 'au téléchargement du mp3',
  'settings.devices': 'Périphériques audio',
  'settings.devices.mobileNote':
    'Sur téléphone ou tablette, choisir une entrée ou une sortie depuis le navigateur pose plus de problèmes que ça n’en résout (casque Bluetooth mal détecté, son coupé, micro imposé par le système…). Branche plutôt un casque : le téléphone gère la route audio.',
  'settings.devices.playback': 'Lecture',
  'settings.devices.playback.hint':
    'Pour éviter que le micro reprenne le son lu : utilise un casque.',
  'settings.devices.duringRecord': "pendant l'enregistrement",
  'settings.devices.sinkMonitor': "Sortie pendant l'enregistrement",
  'settings.devices.duringPlayback': 'en lecture',
  'settings.devices.sinkPlayback': 'Sortie en lecture',
  'settings.devices.sinkUnsupported':
    'Ce navigateur ne permet pas de choisir la sortie audio depuis la page. Branche un casque pour le monitoring, ou change la sortie dans les réglages du système.',
  'settings.devices.record': 'Enregistrement',
  'settings.devices.record.hint':
    'Micro utilisé pour capturer les prises. Les libellés apparaissent après l’autorisation d’accès.',
  'settings.devices.inputMonitor': "Micro pendant l'enregistrement",
  'settings.devices.inputOverride':
    'Le système a ouvert « {label} » à la place du micro choisi. Réessaie ou vérifie les permissions micro.',
  'settings.devices.inputOverrideGeneric':
    'Le système a ouvert un autre micro que celui choisi. Réessaie ou vérifie les permissions micro.',

  'devices.outputFallback': 'Sortie',
  'devices.inputFallback': 'Micro',

  'hint.recording.headphonesBleed':
    'Casque conseillé : sans casque, le micro peut reprendre le son des haut-parleurs et fausser le calage.',
  'hint.recording.headphonesLatency':
    'Casque conseillé. Monitoring compensé pour la latence audio.',
  'hint.listening': 'Écoute en cours.',

  'error.needTwoTracks': 'Il faut au moins deux pistes pour caler.',
  'error.missingReference': 'Piste de référence manquante.',
  'error.refPeaks':
    '{name} : {count}/4 attaques trouvées. Fais 4 sons bien espacés (voix ou claquements).',
  'error.trackPeaks':
    '{name} : {count}/2 attaques trouvées. Fais 2 sons nets pour « 3 4 » (voix ou claquements).',
  'error.autoAlignDeferred': 'Calage auto reporté : {message}',
  'error.autoAlignDeferredGeneric': 'Calage auto reporté.',
  'error.refPeaksSkipCountIn':
    '{name} : {count}/4 attaques trouvées. Fais 4 sons bien espacés pour supprimer le 1-2-3-4.',
  'error.exportNoTracks': 'Sélectionne au moins une piste à exporter.',
  'error.exportNoneSelected': 'Aucune piste sélectionnée à exporter.',
  'error.countInTooLate':
    'Le « 4 » est trop près de la fin : rien à exporter après le décompte.',
  'error.exportFailed': 'Export MP3 impossible.',
  'error.emptyTrack': 'Piste vide, rien à lire.',
  'error.recordFailed': "L'enregistrement a échoué.",
  'error.recordStart': "Impossible de démarrer l'enregistrement.",
  'error.noActiveRecording': 'Aucun enregistrement en cours.',
  'error.noAudioData':
    "Aucune donnée audio capturée. Réessaie l'enregistrement.",
  'error.discardFailed': 'Impossible de recommencer la prise.',
  'error.micAccess': "Impossible d'accéder au micro.",
  'error.nextTrackFailed': 'Impossible de passer à la piste suivante.',
  'error.stopFailed': "Impossible d'arrêter proprement.",
  'error.playbackFailed': 'Lecture impossible.',
  'error.pauseFailed': 'Impossible de mettre en pause.',
  'error.autoAlignFailed': 'Calage auto impossible.',

  'align.refPeaks.ok':
    '1-2-3-4 ({name}) : {times}\nécarts {gaps} ms',
  'align.refPeaks.partial':
    'Battue 1-2-3-4 ({name}) : {times} ({count}/4)',
} as const

export type MessageKey = keyof typeof fr
