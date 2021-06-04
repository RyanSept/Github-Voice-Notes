import FileAttachmentElement from "@github/file-attachment-element"
import * as React from "react"
import * as ReactDOM from "react-dom"
import { v4 as uuidv4 } from "uuid"

import App from "./App"

const css = require("./index.css")

function getCommentFileAttachments(): NodeList {
    const commentFileAttachments = document.querySelectorAll(
        "file-attachment.js-upload-markdown-image"
    )
    return commentFileAttachments
}

/**
 * Insert new voice note button to pull request new comment form.
 */
function insertNewVoiceNoteButton() {
    const newCommentFormActions = document.querySelector(
        "[id=partial-new-comment-form-actions] div.d-flex"
    )
    const gvnIcon = chrome.runtime.getURL("static/gvn-icon-128.png")
    console.log(gvnIcon)
    const newVoiceNoteButton = `
    <div class="bg-gray-light">
        <button class="btn mr-2" type="button" aria-label="Github Voice Notes Icon">
            <!---->
            <img src=${gvnIcon}/>
        </button>
    </div>
    `
    newCommentFormActions.insertAdjacentHTML("afterbegin", newVoiceNoteButton)
}

function embedGVNOnFileAttachments(
    commentFileAttachment: FileAttachmentElement
) {
    const voiceRecordControlsContainerID = `voice-record-controls-container-${uuidv4()}`
    const voiceRecordButtonContainer = `
            <div id="${voiceRecordControlsContainerID}" class="${css.voiceRecordControlsContainer} pt-1">
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

    // insertNewVoiceNoteButton()
}

setup()

const observer = new MutationObserver(function (mutations: MutationRecord[]) {
    mutations.forEach(function (mutation: MutationRecord) {
        for (let addedNode of mutation.addedNodes)
            if (addedNode instanceof Element) {
                const commentFileAttachments = addedNode.querySelectorAll(
                    "file-attachment.js-upload-markdown-image"
                )
                commentFileAttachments.forEach(embedGVNOnFileAttachments)
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
