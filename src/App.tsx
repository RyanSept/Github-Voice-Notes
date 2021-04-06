import * as React from "react"

const css = require("./index.css")

class App extends React.Component {
    render() {
        const gvnIcon = chrome.runtime.getURL("static/gvn-icon-128.png")
        console.log(css.voiceRecordButton)
        console.log("ashisogi")
        return (
            <>
                <div
                    className={css.voiceRecordButton}
                    style={{
                        backgroundImage: `url(${gvnIcon})`,
                    }}
                >
                    {/* <img src={gvnIcon} className={css.voiceRecordButtonIcon}/> */}
                </div>
            </>
        )
    }
}

export default App
