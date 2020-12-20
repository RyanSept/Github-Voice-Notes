// Source: https://github.com/iamovrhere/GoogleMapsEverywhereCsp/blob/master/src/background.js
const GVN_API = "media.w3.org"
const GVN_CSP = {
    "media-src": `${GVN_API}`,
    // "img-src": "moz-extension://*",
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
            let CSPsToOverride = Object.keys(GVN_CSP)
            let existingCsp = header.value.split(";")

            // Map existing values to our desired GVN CSP.
            const updatedCsp = existingCsp.map((csp) => {
                for (let i = 0; i < CSPsToOverride.length; i++) {
                    const CSPDirective = CSPsToOverride[i]
                    if (csp.includes(CSPDirective)) {
                        // remove 'none' and 'self'
                        csp = csp.replace(" 'none'", "")
                        csp = csp.replace(" 'self'", "")
                        // If csp matches is one we need; remove our item and return our value to existing map.
                        CSPsToOverride.splice(i, 1)
                        return `${csp} ${GVN_CSP[CSPDirective]}`
                    }
                }
                // Existing value.
                return csp
            })

            header.value = updatedCsp.join(";")
        }
    })
    console.log(resultHeaders)
    return { responseHeaders: resultHeaders }
}
browser.webRequest.onHeadersReceived.addListener(
    modifyCSP,
    {
        urls: ["https://github.com/*/*/pull/*"],
    },
    ["blocking", "responseHeaders"]
)
