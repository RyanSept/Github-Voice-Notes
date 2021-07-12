import {
    trackNoBrowserSupport,
    trackRecordingCanceled,
    trackRecordingStarted,
    trackRecordingStartError,
    trackRecordingEnded,
} from "./analytics"
import * as StateMachine from "javascript-state-machine"
import * as React from "react"
import Countdown, { CountdownTimeDelta } from "react-countdown"

import GVNMediaRecorderSingelton from "./audio-recorder"
import {
    AttachFileMessageEvent,
    ATTACH_FILE_MESSAGE_EVENT_TYPE,
    FILE_ATTACHED_MESSAGE_EVENT_TYPE,
} from "./constants"
import { ACTION_TYPES, GlobalStore, TGlobalDispatch } from "./global-state"

const css = require("./index.css")

interface IAppProps {
    id: string
}
interface IVoiceRecordControls {
    handleAccept: Function
    handleCancel: Function
    recordingEndTime: number
    countDownComponentRef: React.RefObject<Countdown>
    isAudioInputAllowed: Boolean
}
interface IAppState {
    isAudioInputAllowed: Boolean
    isGlobalRecordingInProgress: boolean
    recordingEndTime: number
    recordingFSMState: string
}

// in milliseconds
const MAX_RECORDING_LENGTH = 120 * 1000
function calculateRecordingLength(leftOverTime: number): number {
    return MAX_RECORDING_LENGTH - leftOverTime
}

class App extends React.Component<IAppProps, IAppState> {
    globalDispatch: TGlobalDispatch
    recordingFSM: StateMachine
    timeEndedTimeout: NodeJS.Timeout
    countdownComponentRef: React.RefObject<Countdown>

    constructor(props) {
        super(props)
        this.globalDispatch = GlobalStore.subscribe(this, [
            "isGlobalRecordingInProgress",
        ])
        this.countdownComponentRef = React.createRef()
        const thatScope = this
        this.recordingFSM = new StateMachine({
            init: "off",
            transitions: [
                { name: "start", from: "off", to: "recording" },
                { name: "accept", from: "recording", to: "ended" },
                { name: "timeEnd", from: "recording", to: "ended" },
                { name: "cancel", from: "recording", to: "canceled" },
                { name: "reset", from: "*", to: "off" },
            ],
            methods: {
                onStart: function () {
                    GVNMediaRecorderSingelton.start(
                        thatScope.handleMediaRecorderStart,
                        thatScope.handleMediaRecorderStop,
                        (err) => {
                            thatScope.setState({ isAudioInputAllowed: false })
                            trackRecordingStartError({ error: err.name })
                        },
                        trackNoBrowserSupport
                    )
                },
                onLeaveRecording: function (lifecycle) {
                    clearTimeout(thatScope.timeEndedTimeout)
                    if (lifecycle.to === "ended") {
                        trackRecordingEnded({
                            recordingDurationMs: calculateRecordingLength(
                                thatScope.countdownComponentRef.current.calcTimeDelta()
                                    .total
                            ),
                        })
                        GVNMediaRecorderSingelton.stop()
                    }
                    if (lifecycle.to === "canceled") {
                        trackRecordingCanceled({
                            recordingDurationMs: calculateRecordingLength(
                                thatScope.countdownComponentRef.current.calcTimeDelta()
                                    .total
                            ),
                        })
                        thatScope.countdownComponentRef.current.getApi().stop()
                        GVNMediaRecorderSingelton.stop(false)
                        // because we can't transition within transition
                        setImmediate(() => this.reset())
                    }
                    thatScope.globalDispatch({
                        type: ACTION_TYPES.SET_IS_RECORDING_IN_PROGRESS,
                        payload: false,
                    })
                },
                onEnterState: function (lifecycle) {
                    if (lifecycle.transition !== "init") {
                        thatScope.setState({ recordingFSMState: lifecycle.to })
                    }
                },
            },
        })

        this.state = {
            isAudioInputAllowed: true,
            recordingFSMState: this.recordingFSM.state,
            recordingEndTime: Date.now(),
            isGlobalRecordingInProgress:
                GlobalStore.state.isGlobalRecordingInProgress,
        }
    }

    handleMediaRecorderStart = () => {
        this.timeEndedTimeout = setTimeout(() => {
            if (!["ended", "off"].includes(this.state.recordingFSMState)) {
                this.recordingFSM.timeEnd()
            }
        }, MAX_RECORDING_LENGTH)
        // Lives here and not in recordingFSM onStart since this is called after permissions check and stream acquisition
        this.setState({
            recordingEndTime: Date.now() + MAX_RECORDING_LENGTH,
        })
        this.globalDispatch({
            type: ACTION_TYPES.SET_IS_RECORDING_IN_PROGRESS,
            payload: true,
        })

        this.countdownComponentRef.current.getApi().start()

        // Add listener for file attached to dom element event emitted from page script
        window.addEventListener(
            "message",
            (event: MessageEvent) => {
                // We only accept messages from ourselves!
                if (event.source != window) {
                    return
                }
                if (
                    event.data.type === FILE_ATTACHED_MESSAGE_EVENT_TYPE &&
                    this.props.id === event.data.elementID
                ) {
                    this.recordingFSM.reset()
                }
            },
            false
        )

        trackRecordingStarted()
    }

    handleMediaRecorderStop = (data: File) => {
        /* Because content-script doesn't have access to file-attachment
         * expando properties to do this directly we send data to page script for attachment.
         */
        const messageEvent: AttachFileMessageEvent = {
            type: ATTACH_FILE_MESSAGE_EVENT_TYPE,
            file: data,
            elementID: this.props.id,
            extensionID: chrome.runtime.id,
        }
        window.postMessage(messageEvent, "https://github.com")
    }

    render() {
        let gvnIcon = chrome.runtime.getURL("static/gvn-icon-128.png")
        if (
            this.state.recordingFSMState !== "recording" &&
            this.state.isGlobalRecordingInProgress
        ) {
            gvnIcon = chrome.runtime.getURL("static/gvn-icon-128-inactive.png")
        }
        return (
            <>
                <button
                    className={css.voiceRecordStartButton}
                    aria-label="Start recording"
                    type="button"
                    onClick={() => {
                        if (!this.state.isGlobalRecordingInProgress) {
                            this.recordingFSM.start()
                        }
                    }}
                    style={{
                        backgroundImage: `url(${gvnIcon})`,
                    }}
                >
                    {this.state.recordingFSMState !== "recording" &&
                        this.state.isGlobalRecordingInProgress && (
                            <RecordingInProgressMessage />
                        )}
                </button>
                {this.state.recordingFSMState === "recording" && (
                    <VoiceRecordControls
                        handleAccept={() => {
                            this.recordingFSM.accept()
                        }}
                        handleCancel={() => {
                            this.recordingFSM.cancel()
                        }}
                        recordingEndTime={this.state.recordingEndTime}
                        countDownComponentRef={this.countdownComponentRef}
                        isAudioInputAllowed={this.state.isAudioInputAllowed}
                    />
                )}
            </>
        )
    }
}

function VoiceRecordControls(props: IVoiceRecordControls) {
    return (
        <div className={`${css.voiceRecordControls} d-flex`}>
            {props.isAudioInputAllowed ? (
                <>
                    <button
                        aria-label="Accept recording"
                        type="button"
                        onClick={() => {
                            props.handleAccept()
                        }}
                    >
                        {/* octicon check-circle-fill */}
                        <svg
                            className="octicon color-icon-success"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            width="20"
                            height="20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.5-4.5z"
                            ></path>
                        </svg>
                    </button>
                    <Countdown
                        date={props.recordingEndTime}
                        renderer={countDownRenderer}
                        ref={props.countDownComponentRef}
                    />
                    {/* octicon check-circle-fill */}
                    <button
                        aria-label="Cancel recording"
                        type="button"
                        onClick={() => {
                            props.handleCancel()
                        }}
                    >
                        <svg
                            className="octicon color-icon-danger"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            width="20"
                            height="20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M2.343 13.657A8 8 0 1113.657 2.343 8 8 0 012.343 13.657zM6.03 4.97a.75.75 0 00-1.06 1.06L6.94 8 4.97 9.97a.75.75 0 101.06 1.06L8 9.06l1.97 1.97a.75.75 0 101.06-1.06L9.06 8l1.97-1.97a.75.75 0 10-1.06-1.06L8 6.94 6.03 4.97z"
                            ></path>
                        </svg>
                    </button>
                </>
            ) : (
                <NotAllowedErrorMessage />
            )}
        </div>
    )
}

const NotAllowedErrorMessage = () => {
    return (
        <span
            className="tooltipped tooltipped-w"
            aria-label="Please allow microphone permissions and reload."
        >
            <svg
                className="octicon color-icon-warning"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                width="20"
                height="20"
            >
                <path
                    fillRule="evenodd"
                    d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"
                ></path>
            </svg>
        </span>
    )
}

const RecordingInProgressMessage = () => {
    return (
        <span
            className={`tooltipped tooltipped-w ${css.recordingInProgressIcon}`}
            aria-label="Recording is in progress on a different comment on this page."
        >
            <svg
                className="octicon color-icon-warning recording-in-progress-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
            >
                <path d="M12 7a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0112 7zm0 10a1 1 0 100-2 1 1 0 000 2z"></path>
                <path
                    fillRule="evenodd"
                    d="M7.328 1.47a.75.75 0 01.53-.22h8.284a.75.75 0 01.53.22l5.858 5.858c.141.14.22.33.22.53v8.284a.75.75 0 01-.22.53l-5.858 5.858a.75.75 0 01-.53.22H7.858a.75.75 0 01-.53-.22L1.47 16.672a.75.75 0 01-.22-.53V7.858a.75.75 0 01.22-.53L7.328 1.47zm.84 1.28L2.75 8.169v7.662l5.419 5.419h7.662l5.419-5.418V8.168L15.832 2.75H8.168z"
                ></path>
            </svg>
        </span>
    )
}

const countDownRenderer = (props: CountdownTimeDelta) => {
    return (
        <span>
            {zeroPadTimeUnit(props.minutes)}:{zeroPadTimeUnit(props.seconds)}
        </span>
    )
}

function zeroPadTimeUnit(number: number): string {
    let res: string = number.toString()
    if (number < 10) {
        res = res.padStart(2, "0")
    }
    return res
}
export default App
