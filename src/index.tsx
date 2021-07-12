import FileAttachmentElement from "@github/file-attachment-element"
import * as React from "react"
import * as ReactDOM from "react-dom"
import { v4 as uuidv4 } from "uuid"

import { trackUnknownError } from "./analytics"
import App from "./App"
import { GlobalStore } from "./global-state"

const css = require("./index.css")

function getCommentFileAttachments(): NodeList {
    const commentFileAttachments = document.querySelectorAll(
        "file-attachment.js-upload-markdown-image"
    )
    return commentFileAttachments
}

function removeEmbededGVN(
    GVNEls: HTMLCollectionOf<Element> | NodeListOf<Element>
) {
    /* Remove embed if one is already embeded. Would make more sense to just
     *  leave it there but the recording start button becomes unclickable. Might be
     *  that the App component's content script objects and functions are dereferenced by this point?
     * TODO: Fix this
     */
    for (let GVNEl of GVNEls) {
        GlobalStore.unsubscribe(GVNEl.id, "all")
        GVNEl.remove()
    }
}

function embedGVNOnFileAttachments(commentFileAttachment: Element) {
    const GVNEls = commentFileAttachment.parentElement.getElementsByClassName(
        css.voiceRecordControlsContainer
    )
    removeEmbededGVN(GVNEls)
    const voiceRecordControlsContainerID = `voice-record-controls-container-${uuidv4()}`
    const voiceRecordButtonContainer = `
            <div id="${voiceRecordControlsContainerID}" class="${css.voiceRecordControlsContainer}">
            </div>
            `
    commentFileAttachment.parentElement.insertAdjacentHTML(
        "beforeend",
        voiceRecordButtonContainer
    )
    ReactDOM.render(
        <App id={voiceRecordControlsContainerID} />,
        document.getElementById(voiceRecordControlsContainerID)
    )
}

function setup() {
    // Render in file comments too
    getCommentFileAttachments().forEach(embedGVNOnFileAttachments)
}

setup()

const observer = new MutationObserver(function (mutations: MutationRecord[]) {
    mutations.forEach(function (mutation: MutationRecord) {
        for (let addedNode of mutation.addedNodes) {
            if (addedNode instanceof Element) {
                const commentFileAttachments = addedNode.querySelectorAll(
                    "file-attachment.js-upload-markdown-image"
                )
                commentFileAttachments.forEach(embedGVNOnFileAttachments)
            }
        }
        for (let removedNode of mutation.removedNodes) {
            if (removedNode instanceof Element) {
                const GVNEls = removedNode.querySelectorAll(
                    `div.${css.voiceRecordControlsContainer}`
                )
                if (GVNEls.length) {
                    removeEmbededGVN(GVNEls)
                }
            }
        }
    })
})
observer.observe(document, { childList: true, subtree: true })

// Inject script into page
const pageScript = document.createElement("script")
pageScript.src = chrome.runtime.getURL("page-script.js")
document.head.appendChild(pageScript)
pageScript.onload = function () {
    pageScript.remove()
}

// Catchall error logger
window.onerror = (message, file, line, col, error) => {
    trackUnknownError({
        errMsg: error.message,
        errorType: error.name,
        stack: error.stack,
    })
    return false
}
