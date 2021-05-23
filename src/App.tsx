import FileAttachmentElement from "@github/file-attachment-element"
import * as StateMachine from "javascript-state-machine"
import * as React from "react"

import GVNMediaRecorderSingelton from "./audio-recorder"
import {
    AttachFileMessageEvent,
    ATTACH_FILE_MESSAGE_EVENT_TYPE,
    FILE_ATTACHED_MESSAGE_EVENT_TYPE,
} from "./constants"

const css = require("./index.css")

interface AppProps {
    id: string
}
interface AppState {
    recordingFSMState: string
    isRecording: Boolean
}

// in milliseconds
const MAX_RECORDING_LENGTH = 10 * 1000

class App extends React.Component<AppProps, AppState> {
    recordingFSM: StateMachine

    constructor(props) {
        super(props)
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
                onStart: () => {
                    GVNMediaRecorderSingelton.start(
                        this.handleMediaRecorderStart,
                        this.handleMediaRecorderStop
                    )
                },
                onAccept: () => {
                    GVNMediaRecorderSingelton.stop()
                    console.log("Ended recording due to user ...")
                },
                onTimeEnd: () => {
                    GVNMediaRecorderSingelton.stop()
                    console.log("Ended recording due to time end ...")
                },
                onCancel: function () {
                    console.log("Canceled recording ...")
                    GVNMediaRecorderSingelton.stop(false)
                    // because we can't transition within transition
                    setTimeout(() => this.reset(), 1)
                },
                onEnterState: (lifecycle) => {
                    console.log(
                        "Changing state from",
                        lifecycle.from,
                        "to",
                        lifecycle.to
                    )
                    this.setState({ recordingFSMState: lifecycle.to })
                },
            },
        })
        this.state = {
            recordingFSMState: this.recordingFSM.state,
            get isRecording() {
                return GVNMediaRecorderSingelton.isRecording
            },
        }
    }

    handleMediaRecorderStart = () => {
        setTimeout(() => {
            if (!["ended", "off"].includes(this.state.recordingFSMState)) {
                this.recordingFSM.timeEnd()
            }
        }, MAX_RECORDING_LENGTH)
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
                        this.recordingFSM.start()
                    }}
                    style={{
                        backgroundImage: `url(${gvnIcon})`,
                    }}
                ></div>
                {this.state.recordingFSMState === "recording" && (
                    <div className={`${css.voiceRecordControls} d-flex pl-1`}>
                        {/* octicon check-circle-fill */}
                        <svg
                            className="octicon color-icon-success mr-1"
                            onClick={() => {
                                this.recordingFSM.accept()
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
                        <p>00:59</p>
                        {/* octicon check-circle-fill */}
                        <svg
                            className="octicon color-icon-danger ml-1"
                            onClick={() => {
                                this.recordingFSM.cancel()
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
                    </div>
                )}
            </>
        )
    }
}

export default App
