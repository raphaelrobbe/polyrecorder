import type { MessageKey } from './fr'

/** English UI copy — please review. */
export const en: Record<MessageKey, string> = {
  'brand.tagline': 'Record, layer, listen, download.',

  'deck.ariaLabel': 'Recorder',

  'common.close': 'Close',
  'common.delete': 'Delete',

  'error.title': 'Oops',
  'error.lead': 'Something went wrong. You can go back to the recorder and try again.',
  'error.home': 'Back to the recorder',

  'nav.help': 'Help',
  'nav.settings': 'Settings',
  'nav.signIn': 'Sign in',
  'nav.signOut': 'Sign out',
  'nav.accountMenu': 'Account menu',
  'nav.accountSettings': 'Account settings',

  'account.title': 'Account',
  'account.close': 'Close account settings',
  'account.email': 'Email',
  'account.email.hint':
    'A confirmation link will be sent to the new address.',
  'account.email.pending':
    'Almost there: open the link sent to {email} to confirm the change.',
  'account.email.openConfirmLink': 'Open confirmation link',
  'account.pseudo': 'Display name',
  'account.pseudoPlaceholder': 'Your display name',
  'account.pseudo.lengthHint': '3–40 characters',
  'account.pseudo.available': 'available',
  'account.pseudo.unavailable': 'unavailable',
  'account.pseudo.current': 'my current name',
  'account.save': 'Save',
  'account.saving': 'Saving…',
  'account.saved': 'Saved.',
  'account.error.pseudoTooShort': 'Display name must be at least 3 characters.',
  'account.error.pseudoTooLong': 'Display name too long (40 characters max).',
  'account.error.pseudoTaken': 'This display name is already taken.',
  'account.error.invalidEmail': 'Invalid email address.',
  'account.error.emailTaken': 'This email address is already in use.',
  'account.error.emailRateLimited':
    'Too many requests for this email. Try again in an hour.',
  'account.error.emailFailed': 'Could not send the email. Try again later.',
  'account.error.saveFailed': 'Could not save. Try again.',
  'account.delete.button': 'Delete my account',
  'account.delete.confirmBody':
    'This action cannot be undone. All data linked to your account will be permanently erased, and shared links will stop working.',
  'account.delete.confirm': 'Yes, delete permanently',
  'account.delete.cancel': 'Cancel',
  'account.delete.deleting': 'Deleting…',
  'account.delete.error': 'Could not delete the account. Try again.',

  'auth.close': 'Close sign-in',
  'auth.signIn.title': 'Sign in or create an account',
  'auth.signIn.lead':
    'Enter your email: we’ll create an account if needed, then send a one-time magic link (valid 30 minutes). No password.',
  'auth.signIn.email': 'Email',
  'auth.signIn.emailPlaceholder': 'you@example.com',
  'auth.signIn.submit': 'Continue',
  'auth.signIn.sending': 'Sending…',
  'auth.sent.title': 'Check your inbox',
  'auth.sent.body':
    'A sign-in link has just been emailed to you. Open it to continue — your account is created on first click if needed.',
  'auth.sent.bodyWithEmail':
    'A sign-in link has just been emailed to {email}. Open it to continue — your account is created on first click if needed.',
  'auth.sent.hint':
    'The link expires in 30 minutes and can only be used once. Check spam if needed.',
  'auth.sent.retry': 'Use a different email',
  'auth.sent.devHint':
    'Locally, the email may not arrive — use the button below to sign in right away.',
  'auth.sent.openLink': 'Open sign-in link',
  'auth.error.invalidEmail': 'Invalid email address.',
  'auth.error.rateLimited':
    'Too many requests for this email. Try again in an hour.',
  'auth.error.emailFailed': 'Could not send the email. Try again later.',
  'auth.error.linkInvalid': 'Invalid sign-in link.',
  'auth.error.linkExpired': 'This link has expired. Request a new one.',
  'auth.error.linkUsed': 'This link was already used. Request a new one.',
  'auth.email.welcome.subject': 'Welcome to PolyRecorder',
  'auth.email.welcome.text':
    'Welcome! Your PolyRecorder account is ready.\n\nTo activate it and sign in, open this link (valid 30 minutes, one-time use):\n\n{link}\n\nThen you can record, layer, and download your takes.\n\nIf you did not request this, you can ignore this email.',
  'auth.email.welcome.html':
    '<p>Welcome! Your <strong>PolyRecorder</strong> account is ready.</p><p>To activate it and sign in, open this link (valid 30&nbsp;minutes, one-time use):</p><p><a href="{link}">Activate my account</a></p><p>Then you can record, layer, and download your takes.</p><p>If you did not request this, you can ignore this email.</p>',
  'auth.email.signIn.subject': 'Your PolyRecorder sign-in link',
  'auth.email.signIn.text':
    'Here is your PolyRecorder sign-in link (valid 30 minutes, one-time use):\n\n{link}\n\nIf you did not request this, you can ignore this email.',
  'auth.email.signIn.html':
    '<p>Here is your <strong>PolyRecorder</strong> sign-in link (valid 30&nbsp;minutes, one-time use):</p><p><a href="{link}">Sign in</a></p><p>If you did not request this, you can ignore this email.</p>',
  'auth.emailChange.subject': 'PolyRecorder email change request',
  'auth.emailChange.text':
    'A request was made to change the email address linked to a PolyRecorder account to this inbox.\n\nIf you did not make this request, ignore this email — your address will not change.\n\nOtherwise, confirm the change by opening this link (valid 30 minutes, one-time use):\n\n{link}',
  'auth.emailChange.html':
    '<p>A request was made to change the email address linked to a <strong>PolyRecorder</strong> account to this inbox.</p><p>If you did not make this request, ignore this email — your address will not change.</p><p>Otherwise, confirm the change by opening this link (valid 30&nbsp;minutes, one-time use):</p><p><a href="{link}">Confirm my new email</a></p>',

  'locale.select.aria': 'Choose language',
  'settings.language': 'Language:',
  'settings.language.aria': 'Interface language',

  'theme.switchToDark': 'Switch to dark theme',
  'theme.switchToLight': 'Switch to light theme',
  'theme.darkSystem': 'Dark theme (currently auto)',
  'theme.lightSystem': 'Light theme (currently auto)',
  'theme.dark': 'Dark theme',
  'theme.light': 'Light theme',

  'session.title.aria': 'Recording title',
  'session.defaultTitle': 'My polyphony',

  'capture.nextTrack': 'Next track',
  'capture.nextTrack.hint':
    'Next track: replays this take and records the next one at the same time.',
  'capture.discard': 'Discard take and start over',
  'capture.record': 'Record',
  'capture.stop': 'Stop',

  'mix.restart': 'Back to start',
  'mix.play': 'Play',
  'mix.pause': 'Pause',
  'mix.download': 'Download mix (MP3)',
  'mix.download.hint': 'Download the mix of selected tracks (MP3)',
  'mix.seekAria': 'Playback position',
  'mix.masterVolume': 'Master volume',

  'mode.groupAria': 'Work modes',
  'mode.label': 'Mode',
  'mode.mix': 'Mix',
  'mode.mix.hint': 'Mix mode: per-track and master volumes',
  'mode.align': 'Align',
  'mode.align.hint': 'Align mode: track synchronization',

  'align.latency.label': 'Playback lead',
  'align.latency.about': 'About playback lead',
  'align.latency.adjust': 'Adjust monitoring playback lead',
  'align.latency.minus': 'Start monitoring a bit earlier (−5 ms)',
  'align.latency.plus': 'Start monitoring a bit later (+5 ms)',
  'align.latency.input': 'Playback lead in milliseconds',
  'align.latency.tip':
    'During “Next track”, previous takes play in your headphones with some hardware latency. PolyRecorder starts that monitoring a little early so your new voice lands in the right place on the timeline. Adjust the value (±5 ms or type it) if monitoring still feels late or early (saved on this device). This is not auto-align from the 3–4 markers: it only applies while recording.',

  'volume.percentAria': '{label} as percent',

  'tracks.muteAll.hint': 'Mute / unmute all tracks',
  'tracks.muteAll.aria': 'Enable all tracks',
  'tracks.deleteAll': 'Delete all tracks',
  'tracks.deleteOne.confirm': 'Delete track “{name}”?',
  'tracks.deleteAll.confirm':
    'Delete {count} tracks? They will be permanently lost.',
  'tracks.alignAll.hint':
    'Enable / disable auto-align (except track 1)',
  'tracks.alignAll.aria': 'Auto-align all tracks',
  'tracks.reorder': 'Reorder {name}',
  'tracks.audible': 'Audible',
  'tracks.muted': 'Muted',
  'tracks.listen': 'Listen to {name}',
  'tracks.name.aria': 'Track name',
  'tracks.defaultName': 'Track {index}',
  'tracks.filenameFallback': 'track',
  'tracks.volume': 'Volume {name}',
  'tracks.highlight': 'Highlight {name}',
  'tracks.delete': 'Delete {name}',
  'tracks.delete.confirm': 'Delete “{name}”?',
  'tracks.cloudSave': 'Save {name} to the cloud',
  'tracks.cloudSaving': 'Saving…',
  'tracks.ref.hint': 'Reference track (1–2–3–4 markers)',
  'tracks.ref.aria': 'Reference',
  'tracks.ref.badge': 'ref.',
  'tracks.autoAlign': 'Auto-align',
  'tracks.autoAlign.named': 'Auto-align {name}',
  'tracks.offset.hint': 'Offset this track on playback',
  'tracks.offset.minus': 'Nudge {name} earlier by 5 ms',
  'tracks.offset.plus': 'Nudge {name} later by 5 ms',
  'tracks.offset.input': 'Align {name} in milliseconds',
  'tracks.drag': 'Drag to reorder',

  'warn.attention': 'Warning',
  'warn.openAlignMode': 'Open align mode',
  'warn.skew.tooltip':
    'An auto-align over 300 ms often means a sync problem (unclear markers, latency, etc.). Open align mode to inspect and adjust.',
  'warn.skew.short': 'High auto-align on {names}.',
  'warn.skew.long':
    'High auto-align on {names}. Check sync in align mode.',
  'warn.beat.irregular':
    'Irregular or undetected 1-2-3-4 count-in on the reference track ({name}).',
  'warn.beat.missing':
    '1-2-3-4 count-in not detected on “{name}” ({count}/4 hits).',
  'warn.beat.error': 'Could not analyze the count-in on “{name}”.',

  'howto.title': 'How to use',
  'howto.step1': 'tap the red “Record” button',
  'howto.step2':
    'out loud and steadily, say 1-2-3-4 (or any clear 4-beat cue), then sing the first voice',
  'howto.step3':
    'tap “Next track” (chevron right) to jump straight into recording the second voice',
  'howto.step4':
    'only speak beats 3 and 4 out loud exactly when you hear them, then sing the second voice',
  'howto.step5': 'repeat for further voices',
  'howto.step6':
    'tap the red “Stop” button at the end of the last voice',
  'howto.tips':
    'Tips: record in a quiet place, ideally with headphones or an earbud—especially on mobile!',
  'howto.latency':
    'Browsers and audio hardware introduce latency (headphones, mic, buffer). Without shared cues, takes drift. The four markers on the reference track and the “3-4” on later tracks let PolyRecorder measure and correct that drift automatically. Clear, spaced, steady sounds align better; an irregular or quiet count-in can throw sync off.',

  'help.title': 'Help',
  'help.close': 'Close help',
  'help.customize.title': 'Customization',
  'help.customize.body1':
    'Change the project name at the top by clicking the title{f2}. You can also rename each track by clicking its name in the list.',
  'help.customize.f2': ' (or press F2)',
  'help.customize.body2':
    'Those names feed the downloaded MP3: the project title, and — if not every track is selected — the exported track names, e.g. “My polyphony_Bass 1 - Bass 2.mp3”.',
  'help.sync.title': 'Synchronization',
  'help.sync.body1':
    'To align tracks, the first (reference) should start with four clear, steady markers (1-2-3-4, or any audible 4-beat cue). Later tracks only redo beats 3 and 4, then the voice. PolyRecorder uses them to measure and correct latency-related drift automatically.',
  'help.sync.body2':
    'Background noise can block 1-2-3-4 detection. In that case, start the recording over so you get a solid reference track—otherwise everything must be aligned by hand. Same for later tracks’ 3-4: a weak or noisy marker breaks auto-align for that take.',
  'help.shortcuts.title': 'Keyboard shortcuts',
  'help.shortcuts.recording': 'Recording',
  'help.shortcuts.record': 'Record',
  'help.shortcuts.next': 'Next track',
  'help.shortcuts.discard': 'Discard take',
  'help.shortcuts.stop': 'Stop',
  'help.shortcuts.playback': 'Playback',
  'help.shortcuts.playPause': 'Play / Pause',
  'help.shortcuts.downloadCat': 'Download',
  'help.shortcuts.download': 'Download MP3',
  'help.shortcuts.general': 'General',
  'help.shortcuts.editTitle': 'Edit title',
  'help.shortcuts.closePanels': 'Close Help / Settings / Account / Library',

  'nav.library': 'Library',

  'cloud.error.tooLarge': 'File too large (100 MB max).',
  'cloud.error.s3NotConfigured': 'Cloud storage is not configured.',
  'cloud.error.unauthorized': 'Sign in to save to the cloud.',
  'cloud.error.uploadFailed': 'Cloud upload failed. Try again.',
  'cloud.error.openFailed': 'Could not open this song.',

  'library.title': 'Library',
  'library.close': 'Close library',
  'library.empty': 'No groups yet.',
  'library.group': 'Group',
  'library.repertoire': 'Repertoire',
  'library.song': 'Song',
  'library.group.meta': '{repertoires} · {songs}',
  'library.count.repertoire.one': '{count} repertoire',
  'library.count.repertoire.other': '{count} repertoires',
  'library.count.song.one': '{count} song',
  'library.count.song.other': '{count} songs',
  'library.count.track.one': '{count} track',
  'library.count.track.other': '{count} tracks',
  'library.addGroup': 'New group',
  'library.addRepertoire': 'New repertoire',
  'library.addSong': 'New song',
  'library.rename': 'Rename',
  'library.delete': 'Delete',
  'library.open': 'Open',
  'library.namePrompt': 'Name',
  'library.deleteConfirm': 'Delete “{name}” and its contents?',
  'library.opening': 'Opening…',
  'library.expand': 'Expand {name}',
  'library.collapse': 'Collapse {name}',
  'library.error': 'Could not complete that action. Try again.',
  'library.public': 'Make public',
  'library.private': 'Make private',
  'library.public.on': 'Public',
  'library.public.off': 'Private',
  'library.share': 'Share',
  'library.share.disabled': 'Make the song public to share it.',
  'library.share.copy': 'Copy link',
  'library.share.copied': 'Link copied',
  'library.share.whatsapp': 'WhatsApp',
  'library.share.native': 'Share…',
  'library.share.title': 'Share “{name}”',

  'song.view.notFound': 'This song is missing or private.',
  'song.view.shared': 'shared',
  'song.og.description': '{tracks} · Listen on PolyRecorder',

  'settings.title': 'Settings',
  'settings.close': 'Close settings',
  'settings.appearance': 'Appearance:',
  'settings.theme.aria': 'Appearance theme',
  'settings.theme.system': 'Auto (browser)',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.autoplay': 'Play automatically when recording ends',
  'settings.autoCloudSave': 'Automatically save tracks to the cloud',
  'settings.autoCloudSave.hint':
    'If unchecked, a button appears on each local track to upload it manually.',
  'settings.skipCountIn': 'Remove the 1-2-3-4',
  'settings.skipCountIn.play.hint':
    'Playback starts right after the “4”',
  'settings.skipCountIn.play': 'on playback',
  'settings.skipCountIn.download.hint':
    'The MP3 starts right after the “4”',
  'settings.skipCountIn.download': 'on MP3 download',
  'settings.devices': 'Audio devices',
  'settings.devices.mobileNote':
    'On phone or tablet, picking an input or output in the browser often causes more trouble than it solves (Bluetooth headphones misdetected, silent audio, system-forced mic…). Prefer plugging in headphones and let the phone manage the audio route.',
  'settings.devices.playback': 'Playback',
  'settings.devices.playback.hint':
    'To keep the mic from picking up what you hear: use headphones.',
  'settings.devices.duringRecord': 'while recording',
  'settings.devices.sinkMonitor': 'Output while recording',
  'settings.devices.duringPlayback': 'during playback',
  'settings.devices.sinkPlayback': 'Output during playback',
  'settings.devices.sinkUnsupported':
    'This browser cannot choose the audio output from the page. Plug in headphones for monitoring, or change the output in system settings.',
  'settings.devices.record': 'Recording',
  'settings.devices.record.hint':
    'Microphone used to capture takes. Labels appear after you grant access.',
  'settings.devices.inputMonitor': 'Mic while recording',
  'settings.devices.inputOverride':
    'The system opened “{label}” instead of the mic you chose. Try again or check microphone permissions.',
  'settings.devices.inputOverrideGeneric':
    'The system opened a different mic than the one you chose. Try again or check microphone permissions.',

  'devices.outputFallback': 'Output',
  'devices.inputFallback': 'Mic',

  'hint.recording.headphonesBleed':
    'Headphones recommended: without them, the mic may pick up speakers and throw off alignment.',
  'hint.recording.headphonesLatency':
    'Headphones recommended. Monitoring compensated for audio latency.',
  'hint.listening': 'Listening…',

  'error.needTwoTracks': 'You need at least two tracks to align.',
  'error.missingReference': 'Missing reference track.',
  'error.refPeaks':
    '{name}: found {count}/4 hits. Make 4 well-spaced sounds (voice or claps).',
  'error.trackPeaks':
    '{name}: found {count}/2 hits. Make 2 clear sounds for “3 4” (voice or claps).',
  'error.autoAlignDeferred': 'Auto-align deferred: {message}',
  'error.autoAlignDeferredGeneric': 'Auto-align deferred.',
  'error.refPeaksSkipCountIn':
    '{name}: found {count}/4 hits. Make 4 well-spaced sounds to strip the 1-2-3-4.',
  'error.exportNoTracks': 'Select at least one track to export.',
  'error.exportNoneSelected': 'No track selected for export.',
  'error.countInTooLate':
    'The “4” is too close to the end: nothing left to export after the count-in.',
  'error.exportFailed': 'MP3 export failed.',
  'error.emptyTrack': 'Empty track, nothing to play.',
  'error.recordFailed': 'Recording failed.',
  'error.recordStart': 'Could not start recording.',
  'error.noActiveRecording': 'No recording in progress.',
  'error.noAudioData': 'No audio captured. Try recording again.',
  'error.discardFailed': 'Could not restart the take.',
  'error.micAccess': 'Could not access the microphone.',
  'error.nextTrackFailed': 'Could not move to the next track.',
  'error.stopFailed': 'Could not stop cleanly.',
  'error.playbackFailed': 'Playback failed.',
  'error.pauseFailed': 'Could not pause.',
  'error.autoAlignFailed': 'Auto-align failed.',

  'align.refPeaks.ok':
    '1-2-3-4 ({name}): {times}\ngaps {gaps} ms',
  'align.refPeaks.partial':
    '1-2-3-4 count-in ({name}): {times} ({count}/4)',
}
