import * as React from "react"
import * as ReactDOM from "react-dom"

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

function embedGVNOnFileAttachments(commentFileAttachment: Element) {
    const voiceRecordControlsContainerID = `voice-record-controls-container-${commentFileAttachment.attributes["input"].value}`
    const voiceRecordButtonContainer = `
            <div id="${voiceRecordControlsContainerID}" class="${css.voiceRecordControlsContainer} pt-1">
            </div>
            `
    commentFileAttachment.parentElement.insertAdjacentHTML(
        "beforeend",
        voiceRecordButtonContainer
    )
    ReactDOM.render(
        <App />,
        document.getElementById(voiceRecordControlsContainerID)
    )
}

function setup() {
    // Render in file comments too
    getCommentFileAttachments().forEach(embedGVNOnFileAttachments)

    // insertNewVoiceNoteButton()
}

/*
fileAttachment = document.querySelectorAll("file-attachment.js-upload-markdown-image")[10]
dataTransfer = new DataTransfer()
let fil = new File(['file:///Users/ryanmarvin/Downloads/weather-api-dev-1583096221/pylint/test/functional/access_to_protected_members.txt'], 'testFile.txt', {type: 'text/plain'})
dataTransfer.items.add(fil)
fileAttachment.attach(dataTransfer)
*/
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
console.log("Registered shit")
