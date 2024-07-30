let fetchDomain = "pro"
let fetchAddress = `https://${fetchDomain}.leye-inc.com/api/sync/`
let port = null 

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
                const address = getAddress()
                if (address) {
                    if (!port) {
                        port = chrome.runtime.connect()
                    }
                    postBackground(fetchAddress + address, port, {userName})
                }
            }
        }, 1000)
    }

    async function main() {
        const preConfig = await chrome.storage.local.get([StoreConfig])
        if (preConfig?.[StoreConfig]) {
            const parsed = JSON.parse(preConfig[StoreConfig])
            if (parsed?.[SystemName] && parsed[SystemName] !== 'pro') {
                fetchAddress = `https://${parsed[SystemName]}.leye-inc.com/api/sync/`
                fetchDomain = parsed[SystemName]
            }
        }
        port = chrome.runtime.connect()
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
