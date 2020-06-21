// Source: https://github.com/iamovrhere/GoogleMapsEverywhereCsp/blob/master/src/background.js
const GVN_API = "media.w3.org"
const GVN_CSP = {
    "media-src": `${GVN_API}`,
}

/**
 * Runs through the response headers and appends the GVN CSP to
 * the existing CSP.
 * - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onHeadersReceived
 *
 * @param {Event} e
 * @return {object} In the form {responseHeaders: [...]}
 */
function modifyCSP(e) {
    let resultHeaders = [...e.responseHeaders]
    resultHeaders.forEach((header) => {
        const name = header.name

        if (/^Content-Security-Policy$/i.test(name)) {
            let GVNCspKeys = Object.keys(GVN_CSP)
            let existingCsp = header.value.split(";")

            // Map existing values to our desired GVN CSP.
            const updatedCsp = existingCsp.map((csp) => {
                for (let i = 0; i < GVNCspKeys.length; i++) {
                    const githubCSP = GVNCspKeys[i]
                    if (csp.includes(githubCSP)) {
                        // remove 'none'
                        csp = csp.replace(" 'none'", "")
                        // If csp matches is one we need; remove our item and return our value to existing map.
                        GVNCspKeys.splice(i, 1)
                        return `${csp} ${GVN_CSP[githubCSP]}`
                    }
                }
                // Existing value.
                return csp
            })

            header.value = updatedCsp.join(";")
        }
    })
    return { responseHeaders: resultHeaders }
}
browser.webRequest.onHeadersReceived.addListener(
    modifyCSP,
    {
        urls: ["https://github.com/*/*/pull/*"],
    },
    ["blocking", "responseHeaders"]
)
