if (!chrome.runtime.onConnect.hasListeners()) {
    chrome.runtime.onConnect.addListener(function(port) {
        port.onMessage.addListener(function(message) {
            if (message.type == "getCookie" && message.url) {
                chrome.cookies.getAllCookieStores((storeIds) => {
                    if (storeIds && storeIds instanceof Array && storeIds.length > 0) {
                        storeIds.forEach(({id, tabIds}) => {
                            if (tabIds?.includes(message.tabId)) {
                                const parseUrl = new URL(message.url)
                                const domain = parseUrl.host?.replace(/\w+/, '')
                                const option = {
                                    domain,
                                    storeId: id,
                                    url: message.url
                                }
                                chrome.cookies.getAll(option, function(cookies) {
                                    var obj = {};
                                    for (var i in cookies) {
                                        var cookie = cookies[i];
                                        obj[cookie.name] = cookie.value;
                                    }
                                    port.postMessage({
                                        success: true,
                                        cookie: obj,
                                        userName: message.userName,
                                        tabId: message.tabId
                                    });
                                });
                            }
                        });
                    }
                })
            }
        });
    });
}
chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
    const targetUrl = tab?.url
    if (!targetUrl?.startsWith("chrome://")) {
        chrome.scripting.executeScript({
            target: { tabId: tabId, allFrames : true },
            args: [tabId],
            func: (id) => {
              window.tabId = id;
            }
        });
    }
});