import {
  ensureAudioContext,
  ensureMic,
  getLastReportedLatencyMs,
  getLatencyTrimMs,
  getMonitorLatencySec,
  refreshAudioDevices,
  releaseMic,
  setInputMonitorId,
  setLatencyTrimMs,
  setSinkMonitorId,
  setSinkPlaybackId,
  toSelectableDeviceOptions,
} from '../audio/runtime.client'
import { t } from '../i18n'
import { get, patch } from './state.client'

export function syncLatencyDisplay() {
  patch({
    latencyTrimMs: getLatencyTrimMs(),
    lastReportedLatencyMs: getLastReportedLatencyMs(),
  })
}

export function updateLatencyTrim(value: number) {
  setLatencyTrimMs(value)
  syncLatencyDisplay()
}

export async function refreshDeviceSnapshot(): Promise<void> {
  const snapshot = await refreshAudioDevices()
  patch({
    deviceApiSupported: snapshot.apiSupported,
    deviceSelectable: snapshot.deviceSelectable,
    sinkSelectable: snapshot.sinkSelectable,
    outputOptions: toSelectableDeviceOptions(
      snapshot.outputs,
      t('devices.outputFallback'),
    ),
    inputOptions: toSelectableDeviceOptions(
      snapshot.inputs,
      t('devices.inputFallback'),
    ),
    sinkMonitorId: snapshot.sinkMonitorId,
    sinkPlaybackId: snapshot.sinkPlaybackId,
    inputMonitorId: snapshot.inputMonitorId,
  })
}

export function applySinkMonitorSelection(deviceId: string) {
  setSinkMonitorId(deviceId)
  patch({ sinkMonitorId: deviceId })
}

export function applySinkPlaybackSelection(deviceId: string) {
  setSinkPlaybackId(deviceId)
  patch({ sinkPlaybackId: deviceId })
}

export function applyInputMonitorSelection(deviceId: string) {
  setInputMonitorId(deviceId)
  patch({ inputMonitorId: deviceId, inputOverrideNote: null })
  if (get().state === 'recording') return
  releaseMic()
  void ensureMic()
    .then(({ inputOverrideNote }) => {
      patch({ inputOverrideNote })
    })
    .catch(() => {
      // Next record will surface the error.
    })
}

/** Probe output latency and mirror it into the session store for the UI. */
export async function initLatencyProbe(): Promise<void> {
  try {
    const ctx = await ensureAudioContext()
    getMonitorLatencySec(ctx)
    syncLatencyDisplay()
  } catch {
    syncLatencyDisplay()
  }
}
