const StoreConfig = '$_store_config'

const btn = document.querySelector('#btn')
const formEle = document.querySelector('#config');

btn.addEventListener('click', storeConfig)

document.addEventListener('DOMContentLoaded', async function() {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true})
    hideSupplierCode(tabs[0]?.url)
    await setFormValue()
});

function isEmpty(val) {
    if (val === null) return true
    if (Array.isArray(val) || 'length' in val) {
        return !val.length
    }
    if (typeof val === 'object' && val instanceof Object) {
        return !Object.keys(val).length
    }
    return true
}

function verifyValues(obj, errFields = []) {
    const reg = /^[a-zA-Z]{1,10}$/
    Object.keys(obj).forEach((name) => {
        const val = obj[name]
        const success = reg.test(val)
        if (!success) {
            errFields.push(name)
        }
    })
}

async function storeConfig() {
    const form = new FormData(formEle);
    const formEntries = form.entries()
    const persist = {}
    for (let entry of formEntries) {
        persist[entry[0]] = entry[1]
    }
    if (!isEmpty(persist)) {
       const failedFields = []
       verifyValues(persist, failedFields)
       if (!isEmpty(failedFields)) {
        failedFields.forEach((fieldName) => {
            const i = document.querySelector(`#${fieldName}`)
            const labelElement = document.querySelector(`label[for="${fieldName}"]`);
            const iLabel = labelElement.textContent.match(/[^\:]+/)[0]
            const errNode = document.createElement('span')
            errNode.style.color = 'red'
            errNode.textContent = `${iLabel} 需要 1 - 10 位英文字符`
            i.parentElement.appendChild(errNode)
        })
        return
       }
       await chrome.storage.local.set({[StoreConfig]: JSON.stringify(persist)})
    }
    window.close()
}

function justCookies(url) {
    return /^\w+\.(jd|jdl|wal\-mart)/.test(url)
}

function hideSupplierCode(url) {
    if (typeof url === 'string') {
        const urlObj = new URL(url)
        const host = urlObj.host
        if (justCookies(host)) {
            const sw = document.querySelector('#supplierCodeWrapper')
            sw.classList.add('hide')
        }
    }
}

async function setFormValue() {
    const preConfig = await chrome.storage.local.get([StoreConfig])
    if (preConfig?.[StoreConfig]) {
        const parsed = JSON.parse(preConfig[StoreConfig])
        Object.keys(parsed).forEach((name) => {
            const ele = document.getElementById(name)
            ele.setAttribute('value', parsed[name])
        })
    }
}


