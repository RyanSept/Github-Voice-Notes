function modifyCSP(responseDetails) {
    let CSPHeader = responseDetails.responseHeaders.find(
        (header: { name: string; value: string | number }) =>
            header.name.toLowerCase() === "content-security-policy"
    )
    if (CSPHeader) {
        // CSPHeader.value = CSPHeader.value.replace(
        //     /media-src 'none';/,
        //     "media-src ;"
        // )
        CSPHeader.value = CSPHeader.value.replace(
            /media-src 'none'/,
            "media-src media.w3.org"
        )
    }

    console.log(responseDetails.responseHeaders)
    return { responseHeaders: responseDetails.responseHeaders }
}

browser.webRequest.onHeadersReceived.addListener(
    modifyCSP,
    {
        urls: ["https://github.com/*/*/pull/*"],
        types: ["main_frame"],
    },
    ["blocking", "responseHeaders"]
)
