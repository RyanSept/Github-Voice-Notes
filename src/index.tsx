import * as React from "react"
import * as ReactDOM from "react-dom"

import App from "./App"

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

function setup() {
    // Render in file comments too
    getCommentFileAttachments().forEach((commentFileAttachment: Element) => {
        const voiceRecordButtonContainerID = `voice-record-button-container-${commentFileAttachment.attributes["input"].value}`
        const voiceRecordButtonContainer = `
                <div id="${voiceRecordButtonContainerID}">
                90h8g7f6d8g9hj
                </div>
                `
        commentFileAttachment.parentElement.insertAdjacentHTML(
            "beforeend",
            voiceRecordButtonContainer
        )
        ReactDOM.render(
            <App />,
            document.getElementById(voiceRecordButtonContainerID)
        )
    })

    // insertNewVoiceNoteButton()
}

/*
fileAttachment = document.querySelectorAll("file-attachment.js-upload-markdown-image")[10]
dataTransfer = new DataTransfer()
let fil = new File(['file:///Users/ryanmarvin/Downloads/weather-api-dev-1583096221/pylint/test/functional/access_to_protected_members.txt'], 'testFile.txt', {type: 'text/plain'})
dataTransfer.items.add(fil)
fileAttachment.attach(dataTransfer)

Style
{
    width: 40px;
    height: 40px;
    font-size: 25px;
    position: absolute;
    right: 0;
    z-index: 1;
    text-align: center;
    background: white;
    border-radius: 40px;
    border: 1px solid lightgrey;
    box-shadow: 4px 7px 10px -6px;
    top: 22%;
}
*/
setup()

const observer = new MutationObserver(function (mutations: MutationRecord[]) {
    mutations.forEach(function (mutation: MutationRecord) {
        for (let addedNode of mutation.addedNodes)
            if (
                addedNode instanceof Element &&
                addedNode.classList.contains("new-discussion-timeline")
            ) {
                const commentFileAttachments = addedNode.querySelectorAll(
                    "file-attachment.js-upload-markdown-image"
                )
            }
    })
})
observer.observe(document, { childList: true, subtree: true })
console.log("Registered shit")

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // listen for messages sent from background.js
    if (request.message === "hello!") {
        console.log("CHUBBLEGUM")
        // DOESN'T ACTUALLY SETUP SINCE DOM HASN'T LOADED YET. MUTATION OBSERVER MIGHT BE MORE RELIABLE
        setup()
    }
})
