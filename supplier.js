const suppliers = [/gsygroup/]
let port = null
let supplierDomain = 'pro'
let supplierAddress = 'https://pro.leye-inc.com/api/sync/'

window.onload = function() {
    const href = location.href
    port = chrome.runtime.connect()
    embedBtn(href)
    document.documentElement.addEventListener('click', (event) => {
        if (event.target.nodeName === 'A' && event.target.innerText === '订单管理') {
            // 即将跳转到订单管理
            setTimeout(() => {
                handleGSY()
            })
        }
    })
}

async function syncMethod() {
    const preConfig = await chrome.storage.local.get([StoreConfig])
    console.log(preConfig?.[StoreConfig])
    if (preConfig?.[StoreConfig]) {
        const code = JSON.parse(preConfig[StoreConfig])?.[SupplierCode]
        supplierDomain = code ?? 'pro'
    }
    if (!port) {
        port = chrome.runtime.connect()
    }
    postBackground(supplierAddress + supplierDomain, port)
}

function syncBtnEle() {
    const b = document.createElement('button')
    b.type = 'button'
    b.classList = "btn btn-primary"
    b.textContent = "同步订单"
    b.onclick = syncMethod
    return b
}

function embedBtn(url) {
    const i = suppliers.findIndex((reg) => reg.test(url))
    switch (i) {
        case 0:
            handleGSY()
            break;
    }
}

async function waitFrame() {
    return new Promise((resolve) => {
        let counter = 0
        const timer = setInterval(() => {
            if (counter > 100) {
                clearInterval(timer)
                resolve(null)
            }
            counter++
            const frame = document.getElementsByTagName('iframe')[0]
            if (frame) {
                clearInterval(timer)
                resolve(frame)
            }
        }, 300)
    })
}

async function waitActiveList(orderList) {
    return new Promise((resolve) => {
        let counter = 0
        const timer = setInterval(() => {
            if (counter > 100) {
                clearInterval(timer)
                resolve(false)
            }
            counter++
            const active = orderList.classList.contains('active')
            console.log(orderList.classList)
            if (active) {
                clearInterval(timer)
                resolve(true)
            }
        }, 300)
    })
}

async function handleGSY() {
    const frame = await waitFrame()
    frame.onload = async function() {
        const orderList = frame.contentDocument.querySelector('#showOrderList')
        if (orderList) {
            const orderListActive = await waitActiveList(orderList)
            if (orderListActive) {
                const pos = frame.contentDocument.querySelector('.orderList_tab')
                if (pos) {
                    pos.prepend(syncBtnEle())
                }
            }
        }
    }
    
    
    // const isOrderPage = frame.contentDocument.querySelector('#showOrderList').classList.contains('active')
    //     console.log(12345, isOrderPage)
    // frame.addEventListener('DOMContentLoaded', function () {
    //     const isOrderPage = frame.firstElementChild.contentDocument.querySelector('#showOrderList').classList.contains('active')
    //     console.log(12345, isOrderPage)
    // })
}