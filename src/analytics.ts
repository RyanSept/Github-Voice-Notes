import { Mixpanel } from "mixpanel-browser"

const mixpanelLib = require("mixpanel-browser")

const mixpanel: Mixpanel = mixpanelLib.init(
    process.env.MIXPANEL_TOKEN,
    {
        debug: process.env.NODE_ENV === "dev",
        api_host: "https://api-eu.mixpanel.com",
        disable_persistence: true,
        opt_out_persistence_by_default: true,
        property_blacklist: ["$initial_referrer", "$initial_referring_domain"],
    },
    "gvn"
)

function __genEventHandler<EventPayloadType>(eventName: string) {
    return (eventPayload?: EventPayloadType) => {
        mixpanel.track(eventName, eventPayload)
    }
}

interface IRecordingStarted {}
export const trackRecordingStarted = __genEventHandler<IRecordingStarted>(
    "recordingStarted"
)

interface IRecordingEnded {
    recordingDurationMs: number
} // file size, recording duration, upload successful?
export const trackRecordingEnded = __genEventHandler<IRecordingEnded>(
    "recordingEnded"
)

interface IRecordingCanceled {
    recordingDurationMs: number
}
export const trackRecordingCanceled = __genEventHandler<IRecordingCanceled>(
    "recordingCanceled"
)

interface IRecordingStartError {
    error: string
}
export const trackRecordingStartError = __genEventHandler<IRecordingStartError>(
    "recordingStartError"
)

interface INoBrowserSupport {}
export const trackNoBrowserSupport = __genEventHandler<INoBrowserSupport>(
    "noBrowserSupport"
)

interface IUnknownError {
    errMsg: string
    errorType: string
    stack: string
}
export const trackUnknownError = __genEventHandler<IUnknownError>(
    "unknownError"
)
