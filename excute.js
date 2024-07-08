// 同步京东 cookie
iife()

async function iife() {
    let timer = null
    let errorInfo = {
        'vcp.jd': 0,
        'shop.jd': 0,
        'vc.jd': 0,
        'srmn.jd': 0
    }
    const retailLinkAddress = 'https://retaillink2.wal-mart.com/edihome?ukey=W6299'
    const isWalMart = location.href === retailLinkAddress

    function getCookie() {
        setTimeout(() => {
            console.log(isWalMart)
            const {userName, userError} = getUserName(location.href)
            if (userError && !isWalMart) {
                console.log('error:', {name: userName, error: userError})
                errorInfo[userError]++
                if (errorInfo[userError] > 3) {
                    // 告警通知
                    fetch(`https://leyeapp.leye-inc.com/api/ding-talk/msg`, {
                        method: "POST",
                        headers: {
                            "content-type": "application/json"
                        },
                        body: JSON.stringify({
                            user: '133326466724155363',
                            type: "userId",
                            msg: `err: ${userError}, address: ${location.href}, name: ${userName}`
                        })
                    })
                    errorInfo[userError] = 0
                }
            }
            if (isWalMart || userName) {
                console.log(location.href)
                const port = chrome.runtime.connect()
                port.postMessage({type: "getCookie", tabId: window.tabId, url: location.href})
                port.onMessage.addListener(function(message, port) {
                    if (message?.success) {
                        console.log('gotCookie', {name: userName, cookie: message.cookie})
                        const address = getAddress()
                        if (message.tabId === window.tabId && address) {
                            const params = {
                                method: "POST",
                                headers: {
                                    "content-type": "application/json"
                                },
                                body: JSON.stringify({
                                    userName,
                                    cookie: cookieString(message.cookie)
                                })
                            }
                            Promise
                                .allSettled([
                                    fetch("https://pro.leye-inc.com/api/sync/" + address, params), 
                                    fetch("https://leyeapp.leye-inc.com/api/sync/" + address, params)
                                ])
                                .then((result) => {
                                    const [pro, test] = result
                                    console.log(`pro ${pro.status === 'fulfilled' ? 'success' : 'failed'}`, pro)
                                    console.log(`test ${test.status === 'fulfilled' ? 'success' : 'failed'}`, test)

                                    let modal = genModal(pro.status === 'fulfilled' ? "凭证同步成功" : "同步失败", pro.status === 'fulfilled')
                                    document.body.appendChild(modal)
                                    setTimeout(() => {
                                        modal.remove()
                                        modal = null
                                    }, 1000)
                                })
                        }
                    }
                })
            }
        }, 1000)
    }

    function main() {
        getCookie();
        timer = setInterval(getCookie, 1 * 60 * 1000)
    }

    window.removeEventListener('load', main);
    window.addEventListener('load', main);
    window.addEventListener('unload', () => {
        window.removeEventListener('load', main)
        window.clearInterval(timer)
        timer = null
    })
}

// 弹窗
function genModal(text, isSuccess) {
    const wrapper = document.createElement("div")
    const success = '<svg t="1696819849674" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="969" width="20" height="20"><path d="M512 512m-448 0a448 448 0 1 0 896 0 448 448 0 1 0-896 0Z" fill="#07C160" p-id="970"></path><path d="M466.7 679.8c-8.5 0-16.6-3.4-22.6-9.4l-181-181.1c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l158.4 158.5 249-249c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3L489.3 670.4c-6 6-14.1 9.4-22.6 9.4z" fill="#FFFFFF" p-id="971"></path></svg>'
    const error = '<svg t="1696820223189" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="969" width="20" height="20"><path d="M512 512m-448 0a448 448 0 1 0 896 0 448 448 0 1 0-896 0Z" fill="#FA5151" p-id="970"></path><path d="M557.3 512l113.1-113.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L512 466.7 398.9 353.6c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L466.7 512 353.6 625.1c-12.5 12.5-12.5 32.8 0 45.3 6.2 6.2 14.4 9.4 22.6 9.4s16.4-3.1 22.6-9.4L512 557.3l113.1 113.1c6.2 6.2 14.4 9.4 22.6 9.4s16.4-3.1 22.6-9.4c12.5-12.5 12.5-32.8 0-45.3L557.3 512z" fill="#FFFFFF" p-id="971"></path></svg>'
    wrapper.innerHTML = (isSuccess ? success : error) + `<div style='display: inline-block; margin-left: 3px;'>${text}</div>`
    wrapper.setAttribute("style", "display: flex; z-index: 99999; justify-content: center; align-items: center; position: fixed; top: 0; padding: 5px 10px; height: 50px; left: 50%; transform: translateX(-100px); border: 1px solid gray; border-radius: 5px; background-color: #fff; color: #000; font-size: 16px; text-align: center;")
    return wrapper
}
// 获取用户名
function getUserName(url) {
    let userName = ''
    let userError = ''
    try {
        if (url.includes('procurement.jd.com/po/PoQuery')) {
            const root = document.querySelector("#app .ant-layout .ant-layout-header ")
            const parent = root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nextElementSibling.nextElementSibling
            userName = parent.textContent.match(/.*\((.*)\)/)?.[1]
            userError = userName ? false : 'vcp.jd'
        } else if (url.includes('https://wl.jdl.com/')) {
            const root = document.querySelector("#app .navbar .right-menu .avatar-container .avatar-wrapper")
            userName = root.querySelector('.avatar-userpin').textContent
            userError = userName ? false : 'wl.jdl'
        }
        // else if (url.includes('vcp.jd')) {
        //     const root = document.querySelector(".vc-pagecontainer")
        //     const parent = root.firstElementChild.firstElementChild.firstElementChild.firstElementChild
        //     userName = parent.textContent.match(/.*\((.*)\)/)?.[1]
        //     userError = userName ? false : 'vcp.jd'
        // } 
        else if (url.includes('srmn.jd.com')) {
            const root = document.querySelector("#app");
            const parent = root.querySelector(".app-wrapper.openSidebar .navbar .right-menu .users-nickname .el-dropdown-link.el-dropdown-selfdefine .name-wrap");
            userName = parent.title
            userError = userName ? false : 'srmn.jd'
        } else if (url.includes('shop.jd.com')) {
            const root = document.querySelector("#jd-header");
            const parent = root.querySelector(".shop-pageframe-header__container .shop-pageframe-header__right .shop-pageframe-header__item.is-cursor-default .shop-pageframe-header__pin");
            userName = parent.textContent
            userError = userName ? false : 'shop.jd'
        } else if (url.includes('jzt.jd.com')) {
            const root = document.querySelector(".container");
            const parent = root.querySelector(".home-index .index-header .jzt-nav-wrapper .jzt-nav-top .jzt-top-menu-wrapper .jzt-user-pin");
            userName = parent.textContent
            userError = userName ? false : 'jzt.jd'
        }
    } catch (error) {
        userError = ['vcp.jd', 'shop.jd', 'srmn.jd', 'vc.jd'].find((regexp) => location.href.includes(regexp))
        console.error(error)
    }
    return {
        userName,
        userError
    }
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
// 获取同步地址
function getAddress() {
    const index = [/jzt/, /srmn/, /wl/, /jd/, /wal\-mart/].findIndex((regexp) => regexp.test(location.href))
    let address = ''
    switch(index) {
        case 0:
            address = 'jzt'
            break;
        case 1, 2:
            address = 'srmn'
            break;
        case 3:
            address = 'jd'
            break;
        case 4:
            address = 'walmart'
            break;
    }
    if (!address) {
        console.error(new Error("can not get address from location.href"))
    }
    return address
}
