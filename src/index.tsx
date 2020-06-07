import * as React from "react"
import * as ReactDOM from "react-dom"

import App from "./App"

function getIssueCommentDivs(): NodeList {
    const commentDivs = document.querySelectorAll(
        "div.timeline-comment-group[id^=issuecomment]"
    )
    return commentDivs
}

getIssueCommentDivs().forEach((commentDiv: Element) => {
    const voiceNoteContainerID = `${commentDiv.id}-voice-note-container`
    const voiceNoteContainer = `
            <voiceNoteContainer class="d-block">
                <td class="d-block comment-body js-comment-body gvn-container" id="${voiceNoteContainerID}">
                </td>
            </tr>
            `
    commentDiv
        .querySelector("task-lists table")
        .insertAdjacentHTML("beforeend", voiceNoteContainer)
    ReactDOM.render(<App />, document.getElementById(voiceNoteContainerID))
})
