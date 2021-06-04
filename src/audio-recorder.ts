import { v4 as uuidv4 } from "uuid"
class UninitializedError extends Error {
    constructor(message) {
        super(message)
        this.message = "GVNMediaRecorderSingelton is uninitialized"
        this.name = "UninitializedError"
    }
}

class CurrentlyRecordingError extends Error {
    constructor(message) {
        super(message)
        this.message = "GVNMediaRecorderSingelton is currently recording"
        this.name = "CurrentlyRecordingError"
    }
}

const GVNMediaRecorderSingelton = {
    mediaRecorder: null,
    get isInitialized() {
        return this.mediaRecorder !== null
    },
    /** Init the MediaRecorder and start recording
     *  @param onStartCallback callback for when recording starts
     *  @param onStopCallback callback for when recording stops
     */
    start(
        onStartCallback: EventListener,
        onStopCallback: (data: File) => void,
        onStartErrorCallback: Function
    ) {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
                .getUserMedia({
                    audio: true,
                })
                .then((mediaStreamObj: MediaStream) => {
                    if (!this.isInitialized) {
                        this.mediaRecorder = new MediaRecorder(mediaStreamObj)
                        this._registerCallbacks(onStartCallback, onStopCallback)
                    }
                    this.mediaRecorder.start()
                })
                .catch((err) => {
                    console.error(
                        "The following getUserMedia error occurred: " + err
                    )
                    onStartErrorCallback()
                })
        } else {
            console.error("getUserMedia not supported on your browser!")
        }
    },
    get isRecording(): Boolean {
        return this.mediaRecorder?.state === "recording"
    },

    /** Register mediarecorder callbacks
     *  @param onStartCallback callback for when recording starts
     *  @param onStopCallback callback for when recording stops
     *  @throw {UninitializedError}
     *  @throw {CurrentlyRecordingError}
     */
    _registerCallbacks(
        onStartCallback: EventListener,
        onStopCallback: (data: Blob) => void
    ) {
        if (this.isRecording) {
            throw CurrentlyRecordingError
        }
        if (!this.isInitialized) {
            throw UninitializedError
        }

        this.mediaRecorder.onstart = onStartCallback
        let dataArray: Blob[] = []
        this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
            dataArray.push(e.data)
        }

        this.mediaRecorder.onstop = () => {
            let audioFile = new File(
                dataArray,
                `GithubVoiceNotes-${uuidv4().slice(0, 8)}.mp4`,
                {
                    type: "video/mp4",
                }
            )
            onStopCallback(audioFile)
            dataArray = []
        }
    },

    /** Start recording
     * @param triggerOnStopCallback whether to trigger onstop callback
     */
    stop(triggerOnStopCallback: Boolean = true) {
        if (this.isRecording) {
            if (!triggerOnStopCallback) {
                this.mediaRecorder.onstop = undefined
            }
            this.mediaRecorder.stop()
            this.mediaRecorder.stream
                .getTracks()
                .forEach((track) => track.stop())
            this.mediaRecorder = null
        }
    },
}

export default GVNMediaRecorderSingelton
