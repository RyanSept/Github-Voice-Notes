export const ATTACH_FILE_MESSAGE_EVENT_TYPE = "ATTACH_FILE"
export const FILE_ATTACHED_MESSAGE_EVENT_TYPE = "FILE_ATTACHED"

export type AttachFileMessageEvent = {
    type: typeof ATTACH_FILE_MESSAGE_EVENT_TYPE
    file: File
    elementID: string
    extensionID: string
}
export type FileAttachedMessageEvent = {
    type: typeof FILE_ATTACHED_MESSAGE_EVENT_TYPE
    elementID: string
}
