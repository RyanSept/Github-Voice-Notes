import * as StateMachine from "javascript-state-machine"
import * as React from "react"
import Countdown, { CountdownTimeDelta } from "react-countdown"

import GVNMediaRecorderSingelton from "./audio-recorder"
import {
    AttachFileMessageEvent,
    ATTACH_FILE_MESSAGE_EVENT_TYPE,
    FILE_ATTACHED_MESSAGE_EVENT_TYPE,
} from "./constants"

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
    recordingFSMState: string
    isGlobalRecording: Boolean
    isAudioInputAllowed: Boolean
    recordingEndTime: number
}

// in milliseconds
const MAX_RECORDING_LENGTH = 120 * 1000

class App extends React.Component<IAppProps, IAppState> {
    recordingFSM: StateMachine
    timeEndedTimeout: NodeJS.Timeout
    countdownComponentRef: React.RefObject<Countdown>

    constructor(props) {
        super(props)
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
                        () => {
                            thatScope.setState({ isAudioInputAllowed: false })
                        }
                    )
                },
                onAccept: function () {
                    clearTimeout(thatScope.timeEndedTimeout)
                },
                onEnded: function () {
                    GVNMediaRecorderSingelton.stop()
                    thatScope.setState({ isGlobalRecording: false })
                },
                onCancel: function () {
                    GVNMediaRecorderSingelton.stop(false)
                    clearTimeout(thatScope.timeEndedTimeout)
                    thatScope.setState({ isGlobalRecording: false })
                    // because we can't transition within transition
                    setImmediate(() => this.reset())
                },
                onEnterState: function (lifecycle) {
                    thatScope.setState({ recordingFSMState: lifecycle.to })
                },
            },
        })

        this.state = {
            isAudioInputAllowed: true,
            recordingFSMState: this.recordingFSM.state,
            get isGlobalRecording() {
                return GVNMediaRecorderSingelton.isRecording
            },
            recordingEndTime: Date.now(),
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
        this.setState({ isGlobalRecording: true })

        this.countdownComponentRef.current.getApi().start()

        // Add listener for file attached to dom element from page script
        window.addEventListener(
            "message",
            (event: MessageEvent) => {
                // We only accept messages from ourselves
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
        const gvnIcon = chrome.runtime.getURL("static/gvn-icon-128.png")
        return (
            <>
                <div
                    className={css.voiceRecordStartButton}
                    onClick={() => {
                        if (!this.state.isGlobalRecording) {
                            this.recordingFSM.start()
                        }
                    }}
                    style={{
                        backgroundImage: `url(${gvnIcon})`,
                    }}
                ></div>
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
        <div className={`${css.voiceRecordControls} d-flex pl-1`}>
            {props.isAudioInputAllowed ? (
                <>
                    {/* octicon check-circle-fill */}
                    <svg
                        className="octicon color-icon-success mr-1"
                        onClick={() => {
                            props.countDownComponentRef.current.getApi().stop()
                            props.handleAccept()
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        width="20"
                        height="20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.5-4.5z"
                        ></path>
                    </svg>
                    <Countdown
                        date={props.recordingEndTime}
                        // autoStart={false}
                        renderer={countDownRenderer}
                        ref={props.countDownComponentRef}
                    />
                    {/* octicon check-circle-fill */}
                    <svg
                        className="octicon color-icon-danger ml-1"
                        onClick={() => {
                            props.handleCancel()
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        width="20"
                        height="20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M2.343 13.657A8 8 0 1113.657 2.343 8 8 0 012.343 13.657zM6.03 4.97a.75.75 0 00-1.06 1.06L6.94 8 4.97 9.97a.75.75 0 101.06 1.06L8 9.06l1.97 1.97a.75.75 0 101.06-1.06L9.06 8l1.97-1.97a.75.75 0 10-1.06-1.06L8 6.94 6.03 4.97z"
                        ></path>
                    </svg>
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
            className="tooltipped tooltipped-e"
            aria-label="Please enable microphone permissions and reload."
        >
            <svg
                className="octicon color-icon-warning ml-1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                width="16"
                height="16"
            >
                <path
                    fill-rule="evenodd"
                    d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"
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
