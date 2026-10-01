import type { MessageKey } from './fr'

/** English UI copy — please review. */
export const en: Record<MessageKey, string> = {
  'brand.tagline': 'Record, layer, share, collaborate.',
  'brand.homeAria': 'Back to polyrecorder home',
  'seo.home.title': 'polyrecorder — Record, layer, share, collaborate',
  'seo.home.description':
    'Browser multitrack recorder: layer takes, share sessions, and collaborate online. Free, no install.',
  'seo.help.description':
    'polyrecorder help: guest mode, Simple/Mix/Align/Cut modes, cloud library, sharing, FAQ, and shortcuts.',
  'seo.legal.description':
    'polyrecorder legal notice: publisher, hosting, and intellectual property.',
  'seo.privacy.description':
    'polyrecorder privacy policy: data we collect, why, and your rights.',
  'seo.register.description':
    'polyrecorder processing-activities register (GDPR Art. 30): account, cloud library, contact, and logs.',
  'seo.terms.description':
    'polyrecorder terms of use: account, content, and responsibilities.',
  'seo.contact.description':
    'Contact polyrecorder: form for questions, reports, and account-related requests.',
  'seo.sitemap.description':
    'polyrecorder site map: app pages, account, and legal information.',
  'seo.library.user.description':
    '@{pseudo}’s public library on polyrecorder — shared groups, repertoires, and sessions.',
  'seo.library.group.description':
    'Group “{name}” on polyrecorder — shared repertoires and songs.',
  'seo.library.repertoire.description':
    'Repertoire “{name}” on polyrecorder — shared songs and sessions.',
  'seo.library.song.description':
    '“{name}” on polyrecorder — shared recording sessions.',

  'deck.ariaLabel': 'Recorder',
  'deck.toolsAria': 'Library and modes',
  'deck.newSession': 'New session',
  'deck.newSession.back': 'Back',

  'common.close': 'Close',
  'common.delete': 'Delete',
  'common.validate': 'Confirm',

  'error.title': 'Oops',
  'error.lead': 'Something went wrong. You can go back to the recorder and try again.',
  'error.home': 'Back to the recorder',

  'nav.help': 'Help',
  'nav.settings': 'Preferences',
  'nav.signIn': 'Sign in',
  'nav.signOut': 'Sign out',
  'nav.accountMenu': 'Account menu',
  'nav.accountSettings': 'Account settings',
  'nav.legal': 'Legal notice',
  'nav.privacy': 'Privacy',
  'nav.processingRegister': 'Processing register',
  'nav.terms': 'Terms',
  'nav.contact': 'Contact',
  'nav.sitemap': 'Sitemap',

  'contact.title': 'Contact',
  'contact.close': 'Close the contact form',
  'contact.formLink': 'contact form',
  'contact.lead':
    'A question, an issue, an idea? Send us a message — we’ll reply by email.',
  'contact.email': 'Email',
  'contact.message': 'Message',
  'contact.captcha': 'Anti-robot check',
  'contact.submit': 'Send',
  'contact.sending': 'Sending…',
  'contact.success':
    'Message sent. You’ll get a reply at the address you provided.',
  'contact.error.email': 'Enter a valid email address.',
  'contact.error.message': 'Write a message before sending.',
  'contact.error.captcha': 'Complete the anti-robot check.',
  'contact.error.rateLimited':
    'Too many messages sent. Try again in a few minutes.',
  'contact.error.send': 'Couldn’t send right now. Try again later.',

  'legal.title': 'Legal notice',
  'legal.close': 'Close legal notice',
  'legal.publisher.title': 'Publisher',
  'legal.publisher.status.ei':
    'sole trader under the French micro-enterprise scheme',
  'legal.publisher.intro': '{name}, {status}.',
  'legal.publisher.siret': 'SIRET: {siret}.',
  'legal.publicationDirector': 'Publication director: {name}.',
  'legal.contact': 'Contact: {email}.',
  'legal.host.title': 'Hosting',
  'legal.host.intro':
    'The site is hosted by {name}, {address} (SIREN {siren}).',
  'legal.host.location':
    'Data and services are stored in France and the Netherlands.',
  'legal.ip.title': 'Intellectual property',
  'legal.ip.intro':
    'The name “{site}”, the design and application content (excluding user content) are protected.',
  'legal.ip.reproduction':
    'Unauthorised reproduction is prohibited.',
  'legal.privacyLink': 'For personal data processing, see the',
  'legal.termsLink': 'The terms of use are set out in the',

  'privacy.title': 'Privacy policy',
  'privacy.close': 'Close privacy policy',
  'privacy.controller.title': 'Data controller',
  'privacy.controller.body':
    '{name} ({site}), {address}, reachable via the {email}, is the controller of personal data collected through the application.',
  'privacy.data.title': 'Data collected',
  'privacy.data.account':
    'Account (if you sign in): email address, display name, authentication sessions.',
  'privacy.data.cloud':
    'Cloud library (if you use an account): groups, repertoires, songs, metadata and audio files of uploaded tracks.',
  'privacy.data.technical':
    'Minimal technical data needed to run the service (e.g. server-side error logs).',
  'privacy.purposes.title': 'Purposes and legal bases',
  'privacy.purposes.body':
    'Data is used to let you sign in, save and retrieve tracks in the cloud, and keep the service secure. Legal bases: performance of the contract (providing the service under the Terms of Use) and, where applicable, legitimate interest (security, abuse prevention).',
  'privacy.processors.title': 'Processors',
  'privacy.processors.body':
    'Hosting and storage are provided by {host}. Data and services are stored in France and the Netherlands.',
  'privacy.retention.title': 'Retention',
  'privacy.retention.body':
    'Account and library data are kept for as long as the account exists. You can delete your account in the app; associated data is then erased. Technical logs are kept only as long as needed for diagnostics.',
  'privacy.rights.title': 'Your rights',
  'privacy.rights.body':
    'You have rights of access, rectification, erasure, objection, restriction and portability. You can exercise them via the {email}, or by deleting your account in settings. You may also lodge a complaint with your supervisory authority (in France: CNIL, cnil.fr).',
  'privacy.cookies.title': 'Cookies and local storage',
  'privacy.cookies.guest':
    'As a guest, polyrecorder sets no cookies.',
  'privacy.cookies.signedIn':
    'After sign-in, a single httpOnly session cookie ({cookie}) is used, strictly necessary for authentication. It is not used for advertising tracking.',
  'privacy.cookies.localStorage':
    'Interface preferences (language, theme, recording options, active song) are stored in the browser’s localStorage, not in cookies.',
  'privacy.legalLink': 'See also the',
  'privacy.termsLink': 'and the',
  'privacy.gdpr.title': 'GDPR compliance',
  'privacy.gdpr.body':
    'Under the GDPR, a record of processing activities describes purposes, data categories, recipients, retention, and security measures. See the',

  'register.title': 'Record of processing activities',
  'register.close': 'Close the processing register',
  'register.intro':
    'This document is the record of processing activities kept by the controller for polyrecorder (GDPR Article 30). It gives an overview of personal-data processing related to the service.',
  'register.dates':
    'Record created on {created}. Last updated on {updated}.',
  'register.controller.title': 'Controller',
  'register.controller.body':
    '{name} ({site}), {address}.',
  'register.controller.contact':
    'Contact for data-subject requests and privacy questions: {email}.',
  'register.controller.dpo':
    'No Data Protection Officer (DPO) has been appointed.',
  'register.summary.title': 'Processing overview',
  'register.summary.col.ref': 'No. / ref.',
  'register.summary.col.name': 'Processing name',
  'register.summary.col.purpose': 'Purpose',
  'register.summary.col.sensitive': 'Sensitive data',
  'register.sensitive.no': 'No',
  'register.fiche.created': 'Created',
  'register.fiche.updated': 'Last updated',
  'register.fiche.purpose': 'Main purpose',
  'register.fiche.data': 'Personal data',
  'register.fiche.retention': 'Retention',
  'register.fiche.subjects': 'Data subjects',
  'register.fiche.recipients': 'Recipients',
  'register.fiche.security': 'Security measures',
  'register.fiche.transfers': 'Transfers outside the EU',
  'register.fiche.sensitive': 'Sensitive data',
  'register.privacyLink': 'For more on your rights, see the',
  'register.legalLink': 'and the',

  'register.account.ref': '1',
  'register.account.name': 'Account and authentication',
  'register.account.purpose':
    'Create and authenticate user accounts',
  'register.account.subPurposes':
    'Sub-purposes: send magic links for sign-in / email confirmation; allow display-name (pseudo) customization; secure access to the cloud library.',
  'register.account.data':
    'Email address, display name (pseudo), authentication tokens / sessions (httpOnly session cookie), account-related dates.',
  'register.account.retention':
    'For as long as the account exists; deleting the account erases associated data. Magic links expire quickly (one-time, short-lived).',
  'register.account.subjects':
    'Users who create a polyrecorder account.',
  'register.account.recipients':
    'Controller; hosting and transactional-email processor (Scaleway, France / Netherlands). The pseudo may be publicly visible if the user enables content sharing.',
  'register.account.security':
    'Magic-link authentication, httpOnly session cookie, application access controls, HTTPS, host-side backups.',
  'register.account.transfers':
    'No transfer outside the EU for this processing (Scaleway hosting and mail within the EEA).',

  'register.cloud.ref': '2',
  'register.cloud.name': 'Cloud library',
  'register.cloud.purpose':
    'Host and organise the user’s recordings',
  'register.cloud.subPurposes':
    'Sub-purposes: store groups, repertoires, songs, metadata and audio files; reopen sessions; enable public sharing when the user turns it on.',
  'register.cloud.data':
    'Library metadata (names, structure, volumes, offsets, etc.), uploaded audio files, technical object identifiers, link to the owner account, public-sharing settings.',
  'register.cloud.retention':
    'For as long as the account or content exists; erased when the user deletes the account or the content.',
  'register.cloud.subjects':
    'Signed-in users of the cloud library; visitors of content explicitly shared publicly.',
  'register.cloud.recipients':
    'Account owner; people allowed via public sharing (if enabled); object-storage / database processor (Scaleway, France / Netherlands).',
  'register.cloud.security':
    'Account-bound access control, pre-signed upload URLs, HTTPS, application isolation, host-side backups.',
  'register.cloud.transfers':
    'No transfer outside the EU for storage (France / Netherlands).',

  'register.contact.ref': '3',
  'register.contact.name': 'Contact form',
  'register.contact.purpose':
    'Handle requests sent through the contact form',
  'register.contact.subPurposes':
    'Sub-purposes: limit spam (anti-bot check); deliver the message to the publisher and reply by email.',
  'register.contact.data':
    'Provided email, message body, anti-bot verification token (Cloudflare Turnstile), minimal technical metadata of the submission.',
  'register.contact.retention':
    'As long as needed to handle the request and ensuing correspondence; no marketing archive.',
  'register.contact.subjects':
    'Anyone using the contact form (with or without an account).',
  'register.contact.recipients':
    'Controller; Scaleway (email delivery); Cloudflare (Turnstile verification).',
  'register.contact.security':
    'HTTPS, rate limiting, Turnstile captcha, restricted access to the contact inbox.',
  'register.contact.transfers':
    'Cloudflare (Turnstile) may involve processing outside the EU under the processor’s contractual safeguards (SCCs / DPA). Email delivery remains with Scaleway (EEA).',

  'register.logs.ref': '4',
  'register.logs.name': 'Technical and security logs',
  'register.logs.purpose':
    'Operate, diagnose, and secure the service',
  'register.logs.subPurposes':
    'Sub-purposes: analyse server errors; prevent abuse (e.g. contact-form rate limits); maintain availability.',
  'register.logs.data':
    'Error logs and minimal technical traces (timestamp, error type, possibly IP or technical IDs depending on the component).',
  'register.logs.retention':
    'Limited to diagnostic and security needs (short retention, then purge or rotation).',
  'register.logs.subjects':
    'Users and visitors whose technical activity generates logs.',
  'register.logs.recipients':
    'Controller; host (Scaleway) as part of infrastructure operations.',
  'register.logs.security':
    'Restricted infrastructure access, HTTPS, operational best practices.',
  'register.logs.transfers':
    'No transfer outside the EU intended for logs hosted with Scaleway (EEA).',

  'terms.title': 'Terms of use',
  'terms.close': 'Close terms of use',
  'terms.effective': 'Effective as of {date}.',
  'terms.object.title': 'Purpose',
  'terms.object.body':
    'These terms of use govern access to and use of {site}, a service published by {name}. They form the contractual framework between you and the publisher for use of the service.',
  'terms.acceptance.title': 'Acceptance',
  'terms.acceptance.body':
    'By using the service (as a guest or with an account), you accept these terms. If you do not accept them, you must not use the service.',
  'terms.service.title': 'Service description',
  'terms.service.guest':
    'Without an account, you can use the recorder in your browser. Takes then remain local to your device (unless you explicitly trigger another action).',
  'terms.service.account':
    'With an account, you can save tracks in the cloud (groups, repertoires, songs) and reopen them later, and share certain songs if you enable public sharing.',
  'terms.service.free':
    'The service is currently offered free of charge, within the publisher’s technical means.',
  'terms.service.futurePaid':
    'Paid offers (for example a subscription) may be introduced later. If so, these terms, the legal notice and the privacy policy will be updated before any billing, and pricing will be clearly presented at the time of purchase.',
  'terms.account.title': 'Account',
  'terms.account.body':
    'You are responsible for keeping access to your email secure and for use of your account. Information you provide must be accurate. You may delete your account in settings; deletion removes associated data as described in the privacy policy.',
  'terms.content.title': 'User content',
  'terms.content.ownership':
    'You retain ownership of the recordings and content you create or upload.',
  'terms.content.license':
    'You grant the publisher a non-exclusive, worldwide, royalty-free licence limited to hosting, backup, display and technical delivery needed to operate the service (including public sharing you enable).',
  'terms.content.responsibility':
    'You warrant that you hold the rights needed for uploaded content (voices, works, etc.) and agree not to upload unlawful content.',
  'terms.use.title': 'Acceptable use',
  'terms.use.body':
    'You must not abuse the service (intrusion, deliberate overload, harm to other users, illegal content, bypassing security). The publisher may suspend or delete an account in case of serious breach.',
  'terms.availability.title': 'Availability',
  'terms.availability.body':
    'The publisher aims for continuous service but does not guarantee uninterrupted availability. Maintenance, outages or changes may occur. The service is provided “as is”.',
  'terms.liability.title': 'Liability',
  'terms.liability.body':
    'To the extent permitted by law, the publisher is not liable for indirect damage, loss of local data that was not synced, or consequences of non-compliant use. Nothing in these terms excludes liability for wilful misconduct or gross negligence, or mandatory consumer rights.',
  'terms.privacy.title': 'Personal data',
  'terms.privacy.body':
    'Personal data processing is described in the',
  'terms.changes.title': 'Changes to the terms',
  'terms.changes.body':
    'The publisher may update these terms. The effective date is shown at the top of the page. Continued use after an update means you accept the new terms. For a material change linked to a paid offer, clear information will be provided before purchase.',
  'terms.law.title': 'Governing law',
  'terms.law.body':
    'These terms are governed by French law. In case of dispute, you may use the {email}. Failing amicable settlement, the competent French courts shall have jurisdiction, subject to mandatory consumer protection rules.',
  'terms.legalLink': 'See also the',

  'sitemap.title': 'Sitemap',
  'sitemap.close': 'Close sitemap',
  'sitemap.app.title': 'Application',
  'sitemap.app.home': 'Recorder',
  'sitemap.account.title': 'Account',
  'sitemap.legal.title': 'Legal',

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
  'account.pseudo.lengthHint':
    '3–20 characters, letters, digits and _ only',
  'account.pseudo.customizeHint':
    'Your display name was generated automatically. Customize it so it appears under your shared songs.',
  'account.pseudo.available': 'available',
  'account.pseudo.unavailable': 'unavailable',
  'account.pseudo.current': 'my current name',
  'account.save': 'Save',
  'account.saving': 'Saving…',
  'account.saved': 'Saved.',
  'account.error.pseudoTooShort': 'Display name must be at least 3 characters.',
  'account.error.pseudoTooLong': 'Display name too long (20 characters max).',
  'account.error.pseudoInvalidChars':
    '3–20 characters, letters, digits and _ only',
  'account.error.pseudoDoubleUnderscore': 'No two _ in a row',
  'account.error.pseudoEdgeUnderscore': 'No leading or trailing _',
  'account.error.pseudoReserved': 'This display name is reserved.',
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
  'account.stats.recording': 'Recording time',
  'account.stats.library': 'Library',
  'account.stats.hour.one': '{count} hour',
  'account.stats.hour.other': '{count} hours',
  'account.stats.minute.one': '{count} minute',
  'account.stats.minute.other': '{count} minutes',
  'account.stats.second.one': '{count} second',
  'account.stats.second.other': '{count} seconds',

  'auth.close': 'Close sign-in',
  'auth.signIn.title': 'Sign in or create an account',
  'auth.signIn.lead':
    'No password.\nEnter your email or display name.\nYour account will be created if it doesn’t exist yet.\nOpen the link in the email (valid 30 minutes, one-time use).\nYou’ll stay signed in on this device until you sign out.',
  'auth.signIn.email': 'Email',
  'auth.signIn.emailPlaceholder': 'you@example.com',
  'auth.signIn.identifier': 'Email or display name',
  'auth.signIn.identifierPlaceholder': 'you@example.com or max22',
  'auth.signIn.submit': 'Continue',
  'auth.signIn.sending': 'Sending…',
  'auth.sent.title': 'Check your inbox',
  'auth.sent.body':
    'A sign-in link has just been emailed to you. Open it to continue — your account is created on first click if needed.',
  'auth.sent.bodyWithEmail':
    'A sign-in link has just been emailed to {email}. Open it to continue — your account is created on first click if needed.',
  'auth.sent.hint':
    'The link expires in 30 minutes and can only be used once. Check spam if needed.',
  'auth.sent.draftHint':
    'Your recordings stay on this device until you open the link. Use the same browser — nothing is sent to the server until you are signed in.',
  'auth.sent.retry': 'Use a different identifier',
  'auth.sent.devHint':
    'Locally, the email may not arrive — use the button below to sign in right away.',
  'auth.sent.openLink': 'Open sign-in link',
  'auth.error.invalidEmail': 'Invalid email address.',
  'auth.error.invalidIdentifier': 'Invalid email or display name.',
  'auth.error.rateLimited':
    'Too many requests for this email. Try again in an hour.',
  'auth.error.emailFailed': 'Could not send the email. Try again later.',
  'auth.error.linkInvalid': 'Invalid sign-in link.',
  'auth.error.linkExpired': 'This link has expired. Request a new one.',
  'auth.error.linkUsed': 'This link was already used. Request a new one.',
  'auth.email.welcome.subject': 'Welcome to polyrecorder',
  'auth.email.welcome.text':
    'Welcome! Your polyrecorder account is ready.\nRemember to change your display name (it was generated automatically).\n\nTo activate your account and sign in, open this link (valid 30 minutes, one-time use):\n\n{link}\n\nThen you can record, layer, and download your takes.\n\nIf you did not request this, you can ignore this email.',
  'auth.email.welcome.html':
    '<p>Welcome! Your <strong style="font-weight:800">polyrecorder</strong> account is ready.</p><p>Remember to change your display name (it was generated automatically).</p><p>To activate your account and sign in, open this link (valid 30&nbsp;minutes, one-time use):</p><p><a href="{link}">Activate my account</a></p><p>Then you can record, layer, and download your takes.</p><p>If you did not request this, you can ignore this email.</p>',
  'auth.email.signIn.subject': 'Your polyrecorder sign-in link',
  'auth.email.signIn.text':
    'Here is your polyrecorder sign-in link (valid 30 minutes, one-time use):\n\n{link}\n\nIf you did not request this, you can ignore this email.',
  'auth.email.signIn.html':
    '<p>Here is your <strong style="font-weight:800">polyrecorder</strong> sign-in link (valid 30&nbsp;minutes, one-time use):</p><p><a href="{link}">Sign in</a></p><p>If you did not request this, you can ignore this email.</p>',
  'auth.emailChange.subject': 'polyrecorder email change request',
  'auth.emailChange.text':
    'A request was made to change the email address linked to a polyrecorder account to this inbox.\n\nIf you did not make this request, ignore this email — your address will not change.\n\nOtherwise, confirm the change by opening this link (valid 30 minutes, one-time use):\n\n{link}',
  'auth.emailChange.html':
    '<p>A request was made to change the email address linked to a <strong style="font-weight:800">polyrecorder</strong> account to this inbox.</p><p>If you did not make this request, ignore this email — your address will not change.</p><p>Otherwise, confirm the change by opening this link (valid 30&nbsp;minutes, one-time use):</p><p><a href="{link}">Confirm my new email</a></p>',

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
  'song.title.aria': 'Song title',
  'song.title.openLibrary': 'Open the song in the library',
  'session.defaultTitle': 'My polyphony',
  'session.prev': 'Previous session',
  'session.next': 'Next session',

  'capture.nextTrack': 'Next track',
  'capture.nextTrack.hint':
    'Next track: replays this take and records the next one at the same time.',
  'capture.discard': 'Discard take and start over',
  'capture.record': 'Record',
  'capture.import': 'Import an audio file',
  'capture.import.hint':
    'Import an audio file from this device (becomes a track)',
  'capture.metronome': 'Metronome',
  'capture.metronome.hint':
    'Add a metronome track (tempo adjustable on the track, default 60 BPM)',
  'capture.metronome.bpm': 'Tempo in beats per minute',
  'capture.metronome.unit': 'BPM',
  'capture.metronome.apply': 'OK',
  'capture.dropHint': 'Drop to import',
  'capture.stop': 'Stop',
  'capture.forgottenStop': 'Did you forget to stop recording?',
  'capture.forgottenStop.discard':
    'If so, you can cancel the current take with the {discard} button',

  'track.metronome': 'Metronome {bpm} BPM',
  'track.metronome.label': 'Metronome',

  'mix.restart': 'Back to start',
  'mix.stop': 'Stop',
  'mix.play': 'Play',
  'mix.pause': 'Pause',
  'mix.download': 'Download mix (MP3)',
  'mix.download.hint': 'Download the mix of selected tracks (MP3)',
  'mix.seekAria': 'Playback position',
  'mix.seek.back': '- {seconds} s',
  'mix.seek.back.aria': 'Skip back {seconds} seconds',
  'mix.seek.back.hint': 'Move the playhead back {seconds} seconds',
  'mix.seek.forward': '+ {seconds} s',
  'mix.seek.forward.aria': 'Skip forward {seconds} seconds',
  'mix.seek.forward.hint': 'Move the playhead forward {seconds} seconds',
  'mix.masterVolume': 'Master volume',
  'mix.clip.record.hint':
    'Clipping at recording. Re-record the track and check the mic input level.',
  'mix.clip.record.aria': 'Clipping at recording',
  'mix.clip.bus':
    'Mix clipping: lower the master volume (or individual track volumes).',
  'settings.autoMasterPreventClip':
    'Automatically lower master volume to prevent clipping',
  'settings.autoMasterPreventClip.hint':
    'If the mix exceeds 0 dBFS, lower the master toward ~0.85. You can still raise it by hand; a warning shows if it clips again.',
  'settings.autoMasterBoost':
    'Automatically raise master volume toward ~0.85',
  'settings.autoMasterBoost.hint':
    'If the mix is too quiet, raise the master toward a ~0.85 peak. Turn off if you prefer to stay quieter.',
  'mix.autoMaster.hint.prevent':
    'Master volume was lowered automatically to prevent clipping.',
  'mix.autoMaster.hint.boost':
    'Master volume was raised automatically toward ~0.85.',

  'mode.groupAria': 'Work modes',
  'mode.label': 'Mode',
  'mode.simple': 'Simple',
  'mode.simple.hint': 'Simple mode: record and play',
  'mode.mix': 'Mix',
  'mode.mix.hint': 'Mix mode: per-track and master volumes',
  'mode.align': 'Align',
  'mode.align.hint': 'Align mode: track synchronization',
  'mode.cut': 'Cut',
  'mode.cut.hint': 'Cut mode: split, mute ranges, merge',

  'cut.idle.hint': 'Set the playhead, then split to cut the tracks',
  'cut.select.hint': 'Select one or more tracks',
  'cut.select.confirm': 'Confirm',
  'cut.cancel': 'Cancel',
  'cut.reset': 'Reset',
  'cut.rate.aria': 'Playback speed',
  'cut.rate.half': 'Half-speed playback',
  'cut.rate.quarter': 'Quarter-speed playback',
  'cut.edit.hint': 'Split at the playhead, select segments, then Mute or Merge',
  'cut.scissors': 'Split at playhead',
  'cut.scissors.hint': 'Split all segments at the playhead',
  'cut.scissors.aria': 'Split at playhead',
  'cut.mute': 'Mute',
  'cut.mute.hint': 'Mute the selected segments (non-destructive)',
  'cut.mute.barAria': 'Muted ranges for {name}',
  'cut.mute.barTitle': 'Muted section',
  'cut.mute.remove': 'Remove this mute',
  'cut.mute.removeAria': 'Remove muted range',
  'cut.merge': 'Merge',
  'cut.merge.hint': 'Merge selected segments into a new track',
  'cut.merge.busy': 'Merging…',
  'cut.merge.progress': 'Merging in progress…',
  'cut.merge.disabledEmpty': 'Select at least one segment',
  'cut.merge.disabledOverlap':
    'Unavailable: selected segments overlap on the timeline',
  'cut.merge.trackName': 'Merge · {names}',
  'cut.merge.trackNameFallback': 'Merge',
  'cut.track.select': 'Include this track in cut mode',
  'cut.track.selectAria': 'Select {name} for cutting',
  'cut.segments.aria': 'Segments of {name}',
  'cut.segment.toggle': 'Select or deselect this segment',

  'piano.toggle': 'Piano',
  'piano.toggle.show': 'Show piano',
  'piano.toggle.hide': 'Hide piano',
  'piano.keyboardAria': 'Piano keyboard (two octaves)',
  'piano.keyAria': 'Key {note}',

  'deck.autoAlign.label': 'Auto-align with count-in',
  'deck.autoAlign.on': 'On',
  'deck.autoAlign.off': 'Off',
  'deck.metronome': 'Metronome',
  'deck.metronome.add': 'Add a metronome',
  'deck.howtoLink': 'How to use',

  'align.latency.label': 'Playback lead',
  'align.latency.about': 'About playback lead',
  'align.latency.adjust': 'Adjust monitoring playback lead',
  'align.latency.minus': 'Start monitoring a bit earlier (−5 ms)',
  'align.latency.plus': 'Start monitoring a bit later (+5 ms)',
  'align.latency.input': 'Playback lead in milliseconds',
  'align.latency.tip':
    'During “Next track”, previous takes play in your headphones with some hardware latency. polyrecorder starts that monitoring a little early so your new voice lands in the right place on the timeline. Adjust the value (±5 ms or type it) if monitoring still feels late or early (saved on this device). This is not auto-align from the 3–4 markers: it only applies while recording.',

  'volume.percentAria': '{label} as percent',

  'tracks.muteAll.hint': 'Mute / unmute all tracks',
  'tracks.muteAll.aria': 'Enable all tracks',
  'tracks.deleteAll': 'Delete all tracks',
  'tracks.deleteOne.confirm': 'Delete track “{name}”?',
  'tracks.deleteAll.confirm':
    'Delete {count} tracks? They will be permanently lost.',
  'tracks.alignAll.hint':
    'Recalculate auto-align for all tracks (except track 1)',
  'tracks.alignAll.aria': 'Recalculate auto-align for all tracks',
  'tracks.alignCol': 'Auto',
  'tracks.offsetCol': 'Manual',
  'tracks.align.legend':
    'Auto: recalculate align from the 3–4 count-in marks. Manual: nudge the track by hand (± ms).',
  'tracks.reorder': 'Reorder {name}',
  'tracks.audible': 'Audible',
  'tracks.muted': 'Muted',
  'tracks.listen': 'Listen to {name}',
  'tracks.name.aria': 'Track name',
  'tracks.uploadedBy': 'Recorded by {pseudo}',
  'tracks.uploadedBy.me': 'Me',
  'tracks.defaultName': 'Track {index}',
  'tracks.filenameFallback': 'track',
  'tracks.volume': 'Volume {name}',
  'tracks.highlight': 'Highlight {name}',
  'tracks.delete': 'Delete {name}',
  'tracks.delete.confirm': 'Delete “{name}”?',
  'tracks.delete.referenceLocked':
    'Cannot delete the reference track while auto-align on count-in is enabled.',
  'tracks.cloudSave': 'Save {name} to the cloud',
  'tracks.cloudSaving': 'Saving…',
  'tracks.ref.hint': 'Reference track (1–2–3–4 markers) — click to choose another',
  'tracks.ref.aria': 'Reference',
  'tracks.ref.badge': 'ref.',
  'tracks.ref.pickHint': 'Choose the new reference track',
  'tracks.ref.pickTarget.aria': 'Set {name} as reference track',
  'tracks.ref.pickCancel': 'Cancel',
  'tracks.contentSync': 'sync',
  'tracks.contentSync.aria': 'Sync {name} to another track',
  'tracks.contentSync.hint':
    'Refine align by content correlation: click Sync then the track to follow',
  'tracks.contentSync.pickHint': 'Choose the track to align against',
  'tracks.contentSync.pickAbout': 'About Sync',
  'tracks.contentSync.pickTip':
    'After a punch-in (recording while playing), the new track starts at the playhead with a provisional offset. Sync refines that align by correlating audio content: click the track that holds the same passage (often the one you were monitoring). polyrecorder looks for the best match around the current offset. Cancel closes the pick without changing anything.',
  'tracks.contentSync.pickTarget.aria': 'Align {from} to {name}',
  'tracks.contentSync.pickCancel': 'Cancel',
  'tracks.contentSync.weak':
    'Sync: not enough shared content — keeping provisional offset',
  'tracks.contentSync.failed': 'Could not sync this track',
  'tracks.span.aria': 'Placement of {name} on the mix timeline',
  'tracks.span.seekAria': 'Set the playhead on the timeline (track {name})',
  'tracks.span.seekHint': 'Click or drag to set the playhead',
  'tracks.autoAlign': 'Recalculate align',
  'tracks.autoAlign.named': 'Recalculate align for {name}',
  'tracks.offset.hint': 'Offset this track on playback',
  'tracks.offset.minus': 'Nudge {name} earlier by 5 ms',
  'tracks.offset.plus': 'Nudge {name} later by 5 ms',
  'tracks.offset.input': 'Align {name} in milliseconds',
  'tracks.drag': 'Drag to reorder',

  'warn.attention': 'Warning',
  'warn.openAlignMode': 'Open align mode',
  'warn.disableAutoAlign': 'Disable auto-align',
  'warn.duplicateName.hint':
    'Two tracks share the same name. Rename one to tell them apart.',
  'warn.duplicateName.aria': 'Duplicate name: {name}',
  'warn.beat.chip.aria':
    'Warning: count-in issue on the reference track. Open align mode.',
  'warn.skew.tooltip':
    'An auto-align over 300 ms often means a sync problem (unclear markers, latency, etc.). Open align mode to inspect and adjust.',
  'warn.skew.short': 'High auto-align on {names}.',
  'warn.skew.long':
    'High auto-align on {names}. Check sync in align mode.',
  'warn.skew.chip.aria':
    'High auto-align on {name}. Open align mode.',
  'warn.beat.irregular':
    'Irregular or undetected 1-2-3-4 count-in on the reference track ({name}).',
  'warn.beat.missing':
    '1-2-3-4 count-in not detected on “{name}” ({count}/4 hits).',
  'warn.beat.error': 'Could not analyze the count-in on “{name}”.',

  'howto.title': 'How to',
  'howto.metro.off': 'Without metronome',
  'howto.metro.on': 'With metronome',
  'howto.metro.add':
    'First add the metronome with the “Metronome” button under the recorder (next to Piano). It becomes the reference track (synthetic 1-2-3-4): on every voice, you only mark beats 3 and 4 out loud.',
  'howto.step1': 'tap the rainbow microphone to record',
  'howto.step2':
    'out loud and steadily, say 1-2-3-4 (or any clear 4-beat cue), then sing the first voice',
  'howto.step2.metro':
    'let the metronome play 1-2-3-4, but speak beats 3 and 4 out loud (or a clear sound), then sing the first voice',
  'howto.step3':
    'tap “Next track” (chevron right) to jump straight into recording the second voice',
  'howto.step4':
    'only speak beats 3 and 4 out loud exactly when you hear them, then sing the second voice',
  'howto.step4.metro':
    'same as the first voice: on the metronome’s 3rd and 4th clicks, mark them out loud, then sing the second voice',
  'howto.step5': 'repeat for further voices',
  'howto.step6':
    'tap the rainbow “Stop” button at the end of the last voice',
  'howto.tips':
    'Tip: record in a quiet place, ideally with headphones or an earbud—especially on mobile!',
  'howto.whyNeeded': 'Why is this needed',
  'howto.whyNeeded.about': 'Why auto-align with count-in is needed',
  'howto.latency':
    'Browsers and audio hardware introduce latency (headphones, mic, buffer). Without shared cues, takes drift. The four markers on the reference track and the “3-4” on later tracks let polyrecorder measure and correct that drift automatically.',

  'help.title': 'Help',
  'help.close': 'Close help',
  'help.search.placeholder': 'Search…',
  'help.search.aria': 'Search help',
  'help.search.empty': 'No sections match this search.',
  'help.toc.aria': 'Help table of contents',
  'help.toc.start': 'Getting started',
  'help.toc.guest': 'Guest & account',
  'help.toc.metronome': 'Metronome',
  'help.toc.piano': 'Piano',
  'help.toc.record': 'General controls',
  'help.toc.sync': 'Mode Align',
  'help.toc.cut': 'Mode Cut',
  'help.toc.mix': 'Mode Mix',
  'help.toc.library': 'Library',
  'help.toc.share': 'Sharing',
  'help.toc.account': 'Account',
  'help.toc.devices': 'Settings',
  'help.toc.shortcuts': 'Shortcuts',
  'help.toc.faq': 'FAQ',

  'help.start.title': 'Getting started',
  'help.start.body1':
    'You can get started right away, without creating an account. Put on headphones: otherwise the mic may re-record the speakers.',
  'help.start.body2':
    'To layer several voices in time: on the 1st track, say a clear “1-2-3-4” before you sing; on the next ones, say only “3-4”. See Synchronization below.',
  'help.start.howtoLink': 'See the alignment how-to',

  'help.guest.title': 'Guest mode & sign-in',
  'help.guest.body1':
    'Without an account, your recordings are not saved. After a take, we offer sign-in so you can keep and share them.',
  'help.guest.body2':
    'You sign in with a link sent by email (no password). Open it in the same browser: your local takes are restored, then saved to your account.',
  'help.guest.body3':
    'If you switch device or browser before signing in, you won’t find those takes again.',

  'help.metronome.title': 'Metronome',
  'help.metronome.body1':
    'Under the recorder, you can add a metronome. It is a rhythm cue: on each voice, say “3-4” on the 3rd and 4th beats to lock onto it. Prefer headphones when recording with the metronome (recommended without it too!).',

  'help.piano.title': 'Piano',
  'help.piano.body1':
    'The Piano button under the recorder opens a small keyboard to give you the pitch. Headphones let you play a note quietly even while you record!',

  'help.record.title': 'General controls',
  'help.record.action.import':
    'imports an audio file (drag-and-drop onto the recorder works too). Common formats: MP3, WAV, OGG, M4A, and more.',
  'help.record.action.record': 'starts a take (at the playhead).',
  'help.record.action.next':
    'saves the current track and starts a new one while you hear the previous ones.',
  'help.record.action.stopCapture':
    'ends recording and saves the track (unless it is shorter than one second).',
  'help.record.action.discard':
    'cancels the current take and starts over right away.',
  'help.record.action.stopPlay': 'stops playback and returns to the start.',
  'help.record.action.export':
    'exports an MP3 that matches what you hear when you listen to the active session. The song name, session name (when signed in), and track names (if not all are selected) appear in the downloaded file name.',
  'help.record.mode.simple': 'record and listen',
  'help.record.mode.mix': 'set the volumes',
  'help.record.mode.align': 'sync the tracks',
  'help.record.mode.cut': 'mute a passage or assemble segments',
  'help.record.tool.piano': 'shows a small keyboard to give you the pitch',
  'help.record.tool.metronome': 'adds a metronome track',
  'help.record.body2':
    'Change the project title at the top{f2}. Rename a track by clicking it. Those names also appear on the downloaded MP3.',
  'help.record.f2': ' — F2 shortcut',

  'help.sync.title': 'Synchronization',
  'help.sync.autoAlign.title': 'Auto-align with count-in',
  'help.sync.autoAlign.body1':
    'This mode corrects sync issues between tracks at recording time.',
  'help.sync.autoAlign.body2':
    'If you use this mode (on by default), the first track (reference) must start with four clear, steady markers (say “1-2-3-4”, or any clean 4-beat sound).',
  'help.sync.autoAlign.body3':
    'On later tracks, say only “3-4” (or clean sounds), then sing.',
  'help.sync.autoAlign.body4':
    'polyrecorder uses them to measure and automatically correct the offset from audio latency. With a metronome as reference, mark only “3-4” on your takes.',
  'help.sync.autoAlign.rerun.before': 'The',
  'help.sync.autoAlign.rerun.after':
    'buttons, which only appear when auto-align is on, let you auto-align after the fact if the option was not checked from the start.',
  'help.sync.noise.body':
    'If the reference track’s “1-2-3-4” is buried in noise, the app won’t recognize it well and will tell you: restart that track instead. Same for later tracks’ “3-4”: if it isn’t clear, auto-align for those tracks may fail.',
  'help.sync.ref.body':
    '“ref.” marks the reference track. Click it to choose another.',
  'help.sync.punch.title': 'Punch-in recording',
  'help.sync.punch.body1.before': 'While playing (or paused mid-mix),',
  'help.sync.punch.body1.after':
    'starts a new track at that position. A “Sync” button appears briefly in Simple mode (it stays in Align mode). It lets you sync the take to another track (pick one after clicking “Sync”).',
  'help.sync.punch.body2':
    'This is meant for continuing an interrupted take. Resume recording a little before the end of the interrupted take, redo a successful stretch at the start, then continue. The matching stretch enables sync. After syncing, you can merge the two tracks in Cut mode: keep the start of the first take and the end of the next.',
  'help.sync.punch.seeCut': 'See the Cut section',

  'help.cut.title': 'Cut',
  'help.cut.body1':
    'This mode lets you split tracks, mute passages, or assemble segments into a new track.',
  'help.cut.split.title': 'Split',
  'help.cut.split.body1.before':
    'Place the playhead where you want, then use',
  'help.cut.split.body1.after':
    '. Tracks split into segments: click a segment to select it (you can select several).',
  'help.cut.split.body2':
    'Reset cancels the current splits and goes back to whole tracks.',
  'help.cut.mute.title': 'Mute',
  'help.cut.mute.body1':
    'Mute silences the selected segments without rewriting the audio file. A bar marks the muted range; you can remove it later.',
  'help.cut.merge.title': 'Merge',
  'help.cut.merge.body1':
    'Merge assembles the selected segments into a new track. Gaps between segments become silence. Not possible if segments overlap on the timeline.',
  'help.cut.tips.body1':
    'You can slow playback (×0.25 or ×0.5) to place the playhead more precisely.',
  'help.cut.tips.body2':
    'Muting a passage only saves online if you own the track. Merge creates a new track under your name.',

  'help.mix.title': 'Mix & export',
  'help.mix.body1.before':
    'Mix mode lets you set each track’s volume and the master volume, highlight tracks with the',
  'help.mix.body1.mid':
    'buttons, and download an MP3 (selected tracks only). As in other modes,',
  'help.mix.body1.after': 'buttons let you silence tracks.',
  'help.mix.body2.before':
    'Even when each track’s volume is fine, stacking them can be too loud. An option, on by default and turnable off in',
  'help.mix.body2.after':
    ', automatically lowers the master volume when the mix clips.',
  'help.mix.body3':
    'Another option can instead raise the master volume automatically when it is low.',
  'help.mix.body4':
    'A “!” on a track means it clipped while recording: try again with a lower mic level or by moving farther away.',

  'help.library.title': 'Cloud library',
  'help.library.body1':
    'Once signed in, your projects are in My library, arranged as: groups → repertoires → songs → sessions. The breadcrumb, also shown in the recorder, tells you where you are.',
  'help.library.body2':
    'The first save creates a song under Personal / General.',
  'help.library.body3.before': 'Delete items',
  'help.library.body3.mid': ', add some',
  'help.library.body3.after':
    ', rename them (click the name), or share them from the library. Careful: deleting an item also deletes everything it contains (their count is shown).',

  'help.share.title': 'Sharing & collaboration',
  'help.share.body1':
    'From the library or the recorder, you can make a song public. Turn on collaboration (from the library only) so other signed-in people can add their tracks.',
  'help.share.body2':
    'The share button lets you copy the link or, on mobile, share directly via your usual apps.',
  'help.share.body3':
    'In consultation (public song but no collaboration), you can still record other tracks for yourself only—they will not be saved into the public project.',

  'help.account.title': 'Account',
  'help.account.body1':
    'You sign in with your email or display name (link by email). In Account settings you can change email and display name, and see your total recording time plus the number of groups, repertoires, songs, and sessions.',
  'help.account.body2':
    'Deleting the account permanently erases the associated data. Details in the privacy policy and terms.',

  'help.devices.title': 'Settings',
  'help.devices.body1':
    'In Preferences you will find all the options detailed above.',
  'help.devices.body2':
    'Depending on your hardware (computer, browser), you can configure audio input and output (mic and speakers).',

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
  'help.shortcuts.closePanels': 'Close Help / Preferences / Account / Library',

  'help.faq.title': 'FAQ',
  'help.faq.accountNeeded.q': 'Do I need an account?',
  'help.faq.accountNeeded.a':
    'Not to get started. An account (with email) is for saving online, sharing, and collaborating.',
  'help.faq.guestKeepTakes.q':
    'What happens to my takes if I record as a guest then sign in?',
  'help.faq.guestKeepTakes.a':
    'They are restored from this browser’s local draft, then uploaded to your account like a normal finished take, as a new song. The email link must be opened in the same browser.',
  'help.faq.guestLost.q':
    'Are guest takes lost if I switch devices?',
  'help.faq.guestLost.a':
    'Yes, if you change device or browser. Sign in again where you recorded to recover them.',
  'help.faq.headphones.q': 'Why headphones?',
  'help.faq.headphones.a':
    'Without them, the mic often re-records the speakers: sound quality and timing suffer. Headphones prevent that.',
  'help.faq.modes.q':
    'What are the Simple, Mix, Align, and Cut modes for?',
  'help.faq.modes.a':
    'Simple: record and listen. Mix: manage volumes. Align: sync the rhythms. Cut: mute a passage, assemble pieces.',
  'help.faq.clipping.q': 'Why a clipping warning in Mix mode?',
  'help.faq.clipping.a':
    'A “!” on a track: it was too loud when recording — try again with a lower mic level. A message near the master: the mix is too loud — turn it down, or enable auto-lower in Preferences.',
  'help.faq.metronome.q': 'What is the metronome for?',
  'help.faq.metronome.a':
    'The metronome can help you keep tempo, and it can also help with auto-align. In that case, turn on “Auto-align by beat” and while recording, on the 3rd and 4th beats say “3-4” (or make two clear sounds). Without that, offsets can appear because of hardware or software latency.',
  'help.faq.piano.q': 'Is the piano recorded with my voice?',
  'help.faq.piano.a':
    'No. The piano only gives you the pitch. With headphones you hear it without it entering the recording.',
  'help.faq.skew.q': 'Tracks are out of sync — what should I do?',
  'help.faq.skew.a1':
    'If you want auto-align by beat and you are not using the metronome, make sure the four opening beats are clearly audible without noise. Later tracks should only have beats on the 3rd and 4th counts. If you are not using auto-align, you can align by hand in',
  'help.faq.skew.a2':
    'mode by adjusting the milliseconds to the right of each track.',
  'help.faq.storage.q': 'Where are my takes stored?',
  'help.faq.storage.a':
    'Without an account, tracks are not saved online. With an account, on your songs they are, and you can find them in your library (Personal / General at first). Tracks you added on someone else’s song are stored on their account.',
  'help.faq.libraryWhere.q':
    'Where do I find a freshly saved session?',
  'help.faq.libraryWhere.a':
    'You’ll find it via the breadcrumb at the top of the recorder. If you’re unsure, check the library — by default sessions are stored in Personal / General.',
  'help.faq.share.q': 'How do I share a song or collaborate?',
  'help.faq.share.a1': 'Make the song public by clicking',
  'help.faq.share.a2': '(from the library or the recorder), then',
  'help.faq.share.a3':
    '. If you want others to add tracks that everyone can see, turn on collaboration by clicking',
  'help.faq.share.a4': '(from the library only).',
  'help.faq.browsers.q': 'Which browsers and permissions?',
  'help.faq.browsers.a':
    'An up-to-date browser (Chrome, Firefox, Safari, Edge…) and microphone access allowed (browser permissions).',
  'help.faq.sizeLimit.q': 'Is there a size limit?',
  'help.faq.sizeLimit.a':
    'Yes: about 100 MB per file uploaded online.',
  'help.faq.deleteAccount.q': 'How do I delete my account?',
  'help.faq.deleteAccount.a':
    'Account settings → Delete my account. It’s permanent. See also Privacy and Terms.',
  'help.faq.deleteAccount.privacy': 'Privacy',
  'help.faq.deleteAccount.terms': 'Terms',
  'help.faq.pwa.q': 'Does the app work offline?',
  'help.faq.pwa.a':
    'Recording on the device can work without Internet; saving, signing in, and sharing need a connection.',
  'help.faq.installable.q': 'Can I install the app?',
  'help.faq.installable.a':
    'Yes — open your browser menu and choose “Install app”. You won’t find polyrecorder on the App Stores, but this way is better: the app stays up to date.',
  'help.faq.accountStats.q':
    'What do the numbers in My account mean?',
  'help.faq.accountStats.a':
    'Recording time adds up your tracks saved online. The other figures count your groups, repertoires, songs, and sessions.',

  'nav.library': 'Library',
  'nav.myLibrary': 'My library',

  'cloud.error.tooLarge': 'File too large (100 MB max).',
  'cloud.error.s3NotConfigured': 'Cloud storage is not configured.',
  'cloud.error.unauthorized': 'Sign in to save to the cloud.',
  'guestDraft.quota':
    'Not enough local storage to save the draft. Free some space or sign in soon.',
  'guest.prompt.body':
    'You are in guest mode. Without signing in, your work stays on this device: it will be lost if you leave the page, and you won’t be able to share it.',
  'guest.prompt.bodyAccount':
    'An account is created in one click with just an email address.',
  'guest.prompt.cta': 'Sign in / Create an account',
  'guest.prompt.dismiss': 'Dismiss',
  'pwa.install.body': 'Install polyrecorder on this device for quicker access.',
  'pwa.install.cta': 'Install',
  'pwa.install.later': 'Later',
  'pwa.install.dismiss': 'Dismiss',
  'pwa.install.ios.howto': 'Tap Share, then “Add to Home Screen”.',
  'pwa.install.ios.gotIt': 'Got it',
  'cloud.error.uploadFailed': 'Cloud upload failed. Try again.',
  'cloud.error.openFailed': 'Could not open this song.',

  'library.title': 'Library',
  'library.close': 'Close library',
  'library.empty': 'No groups yet.',
  'library.empty.repertoires': 'No repertoires yet.',
  'library.empty.songs': 'No songs yet.',
  'library.empty.songParts': 'No sessions yet.',
  'library.group': 'Group',
  'library.repertoire': 'Repertoire',
  'library.song': 'Song',
  'library.songPart': 'Session',
  'library.level.groups': 'Groups',
  'library.level.repertoires': 'Repertoires',
  'library.level.songs': 'Songs',
  'library.level.songParts': 'Sessions',
  'library.group.meta': '{repertoires} · {songs}',
  'library.count.group.one': '{count} group',
  'library.count.group.other': '{count} groups',
  'library.count.repertoire.one': '{count} repertoire',
  'library.count.repertoire.other': '{count} repertoires',
  'library.count.song.one': '{count} song',
  'library.count.song.other': '{count} songs',
  'library.count.songPart.one': '{count} session',
  'library.count.songPart.other': '{count} sessions',
  'library.count.track.one': '{count} track',
  'library.count.track.other': '{count} tracks',
  'library.addGroup': 'New group',
  'library.addRepertoire': 'New repertoire',
  'library.addSong': 'New song',
  'library.addSongPart': 'New session',
  'library.songPart.default': 'Session',
  'library.songPart.unnamed': 'Untitled',
  'library.rename': 'Rename',
  'library.reorder': 'Move {name}',
  'library.delete': 'Delete',
  'library.deleteSongPart': 'Delete session',
  'library.deleteSongPartConfirm': 'Delete session “{name}” and its tracks?',
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
  'library.collaborate.enable': 'Allow collaboration',
  'library.collaborate.disable': 'Turn off collaboration',
  'library.collaborate.on':
    'Collaboration on: signed-in users can add tracks',
  'library.collaborate.off':
    'Collaboration off — visitors can listen only',
  'library.share': 'Share',
  'library.share.disabled': 'Make the song public to share it.',
  'library.share.copy': 'Copy link',
  'library.share.copied': 'Link copied',
  'library.share.whatsapp': 'WhatsApp',
  'library.share.native': 'Share…',
  'library.share.title': 'Share “{name}”',

  'song.view.notFound': 'This song is missing or private.',
  'song.view.shared': 'shared',
  'song.view.collaborate': 'open to collaboration',
  'song.og.description': '{tracks} · Listen on polyrecorder',

  'settings.title': 'Preferences',
  'settings.close': 'Close preferences',
  'settings.appearance': 'Appearance:',
  'settings.theme.aria': 'Appearance theme',
  'settings.theme.system': 'Auto (browser)',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.autoplay': 'Play automatically when recording ends',
  'settings.showCalageWarnings': 'Show alignment-related warnings',
  'settings.showCalageWarnings.about': 'About alignment warnings',
  'settings.showCalageWarnings.tip':
    '“!” alerts when the reference 1-2-3-4 count-in looks irregular, or when auto-align exceeds 300 ms. Turns off automatically if a song’s first track is an audio import (usually no count-in).',
  'settings.autoAlign': 'Auto-align with count-in',
  'settings.autoAlign.about': 'About auto-align',
  'settings.autoAlign.tip':
    'Measures and corrects drift between tracks using 1-2-3-4 markers (reference) and 3-4 (later tracks). Suited to polyphonic recording. Turn it off for audio imports without a count-in, to avoid offsets and alerts.',
  'settings.countInAlign': 'Count-in and auto-align',
  'settings.defaultsForNewProjects': 'Default settings for new projects',
  'settings.autoCloudSave': 'Automatically save tracks to the cloud',
  'settings.autoCloudSave.hint':
    'If unchecked, a button appears on each local track to upload it manually.',
  'settings.skipCountIn': 'Remove the 1-2-3-4 if detected',
  'settings.skipCountIn.play.hint':
    'Playback starts right after the “4” (if a count-in was detected)',
  'settings.skipCountIn.play': 'on playback',
  'settings.skipCountIn.download.hint':
    'The MP3 starts right after the “4” (if a count-in was detected)',
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
  'error.importFailed': 'Could not import the audio file.',
  'error.importNoAudio': 'No recognized audio file.',
  'error.importDecodeFailed':
    'This audio file cannot be decoded by the browser.',
  'error.importTooLong':
    'File too long (5 minutes max, same as a recording).',
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
