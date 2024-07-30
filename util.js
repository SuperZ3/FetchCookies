// popup 使用的 id
const SystemName = 'systemName'

const SupplierCode = 'supplierCode'

const StoreConfig = '$_store_config'

// 弹窗
function genModal(text, isSuccess) {
    const wrapper = document.createElement("div")
    const success = '<svg t="1696819849674" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="969" width="20" height="20"><path d="M512 512m-448 0a448 448 0 1 0 896 0 448 448 0 1 0-896 0Z" fill="#07C160" p-id="970"></path><path d="M466.7 679.8c-8.5 0-16.6-3.4-22.6-9.4l-181-181.1c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l158.4 158.5 249-249c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3L489.3 670.4c-6 6-14.1 9.4-22.6 9.4z" fill="#FFFFFF" p-id="971"></path></svg>'
    const error = '<svg t="1696820223189" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="969" width="20" height="20"><path d="M512 512m-448 0a448 448 0 1 0 896 0 448 448 0 1 0-896 0Z" fill="#FA5151" p-id="970"></path><path d="M557.3 512l113.1-113.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L512 466.7 398.9 353.6c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L466.7 512 353.6 625.1c-12.5 12.5-12.5 32.8 0 45.3 6.2 6.2 14.4 9.4 22.6 9.4s16.4-3.1 22.6-9.4L512 557.3l113.1 113.1c6.2 6.2 14.4 9.4 22.6 9.4s16.4-3.1 22.6-9.4c12.5-12.5 12.5-32.8 0-45.3L557.3 512z" fill="#FFFFFF" p-id="971"></path></svg>'
    wrapper.innerHTML = (isSuccess ? success : error) + `<div style='display: inline-block; margin-left: 3px;'>${text}</div>`
    wrapper.setAttribute("style", "display: flex; z-index: 99999; justify-content: center; align-items: center; position: fixed; top: 0; padding: 5px 10px; height: 50px; left: 50%; transform: translateX(-100px); border: 1px solid gray; border-radius: 5px; background-color: #fff; color: #000; font-size: 16px; text-align: center;")
    return wrapper
}

// 拼接 cookie
function cookieString(cookie) {
    let  result = ''
    if (typeof cookie === 'object') {
        Object.keys(cookie).forEach((name) => {
            result += `${name}=${cookie[name]};`
        })
        result = result.substring(0, result.length - 1)
    }
    return result
}

function postBackground(hostAddress, port, extraParams = {}) {
    port.postMessage({type: "getCookie", tabId: window.tabId, url: location.href})
    port.onMessage.addListener(async function(message, port) {
        if (message?.success) {
            console.log('gotCookie', message.cookie)
            if (message.tabId === window.tabId) {
                const response = await fetch(hostAddress, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({
                        cookie: cookieString(message.cookie),
                        ...extraParams
                    })
                })
                console.log(`${response.status === 200 ? 'success' : 'failed'}`, response)
                let modal = genModal(response.status === 200 ? "凭证同步成功" : "同步失败", response.status === 200)
                document.body.appendChild(modal)
                setTimeout(() => {
                    modal.remove()
                    modal = null
                }, 1000)
            }
        }
    })
}
