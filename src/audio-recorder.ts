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
        onStopCallback: (data: File) => void
    ) {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            console.log("getUserMedia supported.")
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
                .catch(function (err) {
                    console.log(
                        "The following getUserMedia error occurred: " + err
                    )
                })
        } else {
            console.log("getUserMedia not supported on your browser!")
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
            // blob of type mp3
            let audioFile = new File(dataArray, "recording.mp4", {
                type: "audio/mp3;",
            })
            const audioURL = window.URL.createObjectURL(audioFile)
            console.log("RECORDING URL", audioURL)
            onStopCallback(audioFile)
            dataArray = []
        }
    },

    /** Start recording */
    stop() {
        if (this.isRecording) {
            this.mediaRecorder.stop()
            this.mediaRecorder = null
        }
    },
}

export default GVNMediaRecorderSingelton
