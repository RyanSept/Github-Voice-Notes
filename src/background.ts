function modifyCSP(responseHeaders) {
    debugger
    console.log(responseHeaders)
}

browser.webRequest.onHeadersReceived.addListener(modifyCSP, {
    urls: ["https://github.com/*/pull/*"],
    types: ["xmlhttprequest"],
})
