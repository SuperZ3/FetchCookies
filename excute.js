const StoreConfig = '$_store_config'
let globalCookie = null

window.removeEventListener('load', main);
window.addEventListener('load', main);

async function main() {
    // const data = await chrome.storage.local.get("cookies")
    // if (data?.cookies?.length > 0) {
    //     await chrome.storage.local.clear()
    // }
    console.log(location.href)
    await postBackground();
}

async function postBackground() {
    const port = await chrome.runtime.connect({name: "cookie"})
    port.postMessage({type: "getCookie", url: location.href})
    port.onMessage.addListener(async function(message, port, sendResponse) {
        if (message?.success) {
            // 全局存储
            setGlobalCookie(message.cookie)
            // 存到 localStorage
            await chrome.storage.local.set({ 'cookies': globalCookie });
        }
        return true
    })
}

// 拼接 cookie
function serializeGlobalCookie(cookie) {
    return Object.entries(cookie).reduce((result, cur) => result += `${cur[0]}=${cur[1]};`, '')
}

function parseGlobalCookie(cookie) {
    const result = {}
    cookie.split(';').forEach((item) => {
        const [name, value] = item.split('=')
        result[name] = value
    })
    return result
}

function setGlobalCookie(cookie) {
    if (typeof cookie === 'object') {
        globalCookie = cookie
    } else if (typeof cookie === 'string') {
        globalCookie = parseGlobalCookie(cookie)
    }
}

function resetGlobalCookie() {
    globalCookie = null
}

function addOneItem(key, value) {
    if (globalCookie !== null) {
        globalCookie[key] = value
    }
}

function deleteOneItem(key) {
    if (globalCookie !== null && key in globalCookie) {
        delete globalCookie[key]
    }
}
