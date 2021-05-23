import {
    ATTACH_FILE_MESSAGE_EVENT_TYPE,
    FILE_ATTACHED_MESSAGE_EVENT_TYPE,
    AttachFileMessageEvent,
    FileAttachedMessageEvent,
} from "./constants"

/** Handle event to drop recording into file attachment and emit file attached event.
 * @param event from content script
 **/
function handleAttachFileEvent(event: MessageEvent) {
    const gvnElement = document.getElementById(event.data.elementID)
    // @ts-ignore
    const fileAttachmentEl: FileAttachmentElement = gvnElement.parentElement.getElementsByTagName(
        "file-attachment"
    )[0]
    let dataTransfer = new DataTransfer()
    dataTransfer.items.add(event.data.file)

    const attachedEvent: FileAttachedMessageEvent = {
        type: FILE_ATTACHED_MESSAGE_EVENT_TYPE,
        elementID: event.data.elementID,
    }

    fileAttachmentEl.attach(dataTransfer).then(() => {
        console.log("FILE_ATTACHED event")
        window.postMessage(attachedEvent, "https://github.com")
    })
}

window.addEventListener(
    "message",
    // TODO: add AttachFileMessageEvent to MessageEvent generic type
    (event: MessageEvent) => {
        // We only accept messages from ourselves
        if (event.source != window) {
            return
        }

        if (
            event.data.type &&
            event.data.type === ATTACH_FILE_MESSAGE_EVENT_TYPE
        ) {
            handleAttachFileEvent(event)
        }
    },
    false
)
