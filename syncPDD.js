// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Super Man
// @match        https://ppzh.jd.com/brand/homePage/index.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    const originFetch = unsafeWindow.fetch
    const areaMap = {}

    // 劫持 fetch
    unsafeWindow.fetch = async function(...arg) {
        let response = null
        try {
            const isSummary = arg[0].includes("https://ppzh.jd.com/brand/homePage/realTime/realSummary/getSummaryData.ajax?compareDate=2024-05-20&firstCategoryId=&secondCategoryId=&thirdCategoryId=all&channel=0&brandId=all&shopType=all&uuid=c9afec335527a061c1e4-18f9a94ac24")
            const isGoodsQuery = arg[0].includes("https://mc.pinduoduo.com/orianna-mms/goods/pageQuery")
            const isAreaQuery = arg[0].includes("https://mc.pinduoduo.com/patronus-mms/area/list")
            const isOrderQuery = arg[0].includes("https://mc.pinduoduo.com/cartman-mms/orderManagement/pageQueryDetail")
            let isToday = false
            const {userName, userError} = getUserName(location.href)
            if (isSummary) {
                console.log(JSON.parse(arg))
            }
            if (isOrderQuery) {
                const body = JSON.parse(arg[1].body)
                body.pageSize = 100
                arg[1].body = JSON.stringify(body)
                isToday = body.endSessionTime === body.startSessionTime && new Date(new Date().setDate(new Date().getDate())).toLocaleDateString() === new Date(body.startSessionTime).toLocaleDateString()
            }
            response = await originFetch(...arg)
            if (isAreaQuery) {
                response
                    .clone()
                    .json()
                    .then((data) => {
                        if (data.success && data.result) {
                            data.result.forEach(item => {
                                if (item.areaId !== undefined) {
                                    areaMap[item.areaId] = item.areaName
                                }
                            });
                        }
                    })
            } else if (isGoodsQuery) {
                response
                    .clone()
                    .json()
                    .then((data) => {
                        console.log("1. 拦截到商品数据：", data)
                        const requestBody = JSON.parse(arg[1].body)
                        const areaId = requestBody.areaId
                        const onSale = requestBody.isOnSale
                        if (data.success && data?.result && areaMap?.[areaId]) {
                            const queryData = data.result.data
                            const userName = document.querySelector("#ddmc-mc-header .header .mc-header-placeholder .mc-header-placeholder-container .mc-header-user-info .user-info-top .user-name").firstElementChild.title
                            console.log("2. 发送商品同步数据", {
                                name: userName,
                                areaName: areaMap[areaId],
                                data: queryData,
                                areaMap
                            })
                            GM_xmlhttpRequest({
                                url: "https://pro.leye-inc.com/api/sync/pdd/prods",
                                method: "POST",
                                data: JSON.stringify({
                                    name: userName,
                                    areaName: areaMap[areaId],
                                    onSale,
                                    data: queryData
                                }),
                                fetch: true,
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                onload: (resp) => {
                                    const response = JSON.parse(resp.responseText)
                                    console.log("3. 飞天返回结果：", response)
                                    let modal = genModal(response.status === 200 ? "商品同步成功" : "同步失败", response.status === 200)
                                    document.body.appendChild(modal)
                                    setTimeout(() => {
                                        modal.remove()
                                        modal = null
                                    }, 1000)
                                }
                            })
                        }
                    })
            } else if (isOrderQuery && !isToday) {
                response
                    .clone()
                    .json()
                    .then((data) => {
                        console.log("1. 拦截到订单数据：", data)
                        if (data.success && data.result) {
                            console.log("2. 发送订单数据：", {
                                userName,
                                list: data.result.resultList
                            })
                            GM_xmlhttpRequest(
                                {
                                    url: "https://pro.leye-inc.com/api/sync/pdd/orders",
                                    method: "POST",
                                    data: JSON.stringify({
                                        userName,
                                        list: data.result.resultList
                                    }),
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    fetch: true,
                                    onload: (resp) => {
                                        const response = JSON.parse(resp.responseText)
                                        console.log("3. 飞天返回结果：", response)
                                        let modal = genModal(response.status === 200 ? "同步成功" : "同步失败", response.status === 200)
                                        document.body.appendChild(modal)
                                        setTimeout(() => {
                                            modal.remove()
                                            modal = null
                                        }, 1000)
                                    }
                                }
                            )
                        }
                    })
            }
        } catch (error) {
            return Promise.reject(error)
        }
        return response
    }

    function getUserName(url) {
        let userName = ''
        let userError = ''
        try {
            if (url.includes('procurement.jd.com/po/PoQuery')) {
                const root = document.querySelector("#app .ant-layout .ant-layout-header ")
                const parent = root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nextElementSibling.nextElementSibling
                userName = parent.textContent.match(/.*\((.*)\)/)?.[1]
                userError = userName ? false : 'vcp.jd'
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
            } else if (url.includes('pinduoduo')) {
                 const root = document.querySelector("#ddmc-mc-header")
                 const parent= root.querySelector(".mc-header-placeholder .mc-header-user-info .user-name")
                 userName = parent.querySelector(".name").title
                 userError = userName ? false : 'pdd'
            }
        } catch (error) {
            userError = ['pinduoduo', 'vcp.jd', 'shop.jd', 'srmn.jd', 'vc.jd'].find((regexp) => location.href.includes(regexp))
            console.error(error)
        }
        return {
            userName,
            userError
        }
    }

    function genModal(text, isSuccess) {
        const wrapper = document.createElement("div")
        const success = '<svg t="1696819849674" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="969" width="20" height="20"><path d="M512 512m-448 0a448 448 0 1 0 896 0 448 448 0 1 0-896 0Z" fill="#07C160" p-id="970"></path><path d="M466.7 679.8c-8.5 0-16.6-3.4-22.6-9.4l-181-181.1c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l158.4 158.5 249-249c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3L489.3 670.4c-6 6-14.1 9.4-22.6 9.4z" fill="#FFFFFF" p-id="971"></path></svg>'
        const error = '<svg t="1696820223189" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="969" width="20" height="20"><path d="M512 512m-448 0a448 448 0 1 0 896 0 448 448 0 1 0-896 0Z" fill="#FA5151" p-id="970"></path><path d="M557.3 512l113.1-113.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L512 466.7 398.9 353.6c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L466.7 512 353.6 625.1c-12.5 12.5-12.5 32.8 0 45.3 6.2 6.2 14.4 9.4 22.6 9.4s16.4-3.1 22.6-9.4L512 557.3l113.1 113.1c6.2 6.2 14.4 9.4 22.6 9.4s16.4-3.1 22.6-9.4c12.5-12.5 12.5-32.8 0-45.3L557.3 512z" fill="#FFFFFF" p-id="971"></path></svg>'
        wrapper.innerHTML = (isSuccess ? success : error) + `<div style='display: inline-block; margin-left: 3px;'>${text}</div>`
        wrapper.setAttribute("style", "display: flex; z-index: 99999; justify-content: center; align-items: center; position: fixed; top: 0; padding: 5px 10px; height: 50px; left: 50%; transform: translateX(-100px); border: 1px solid gray; border-radius: 5px; background-color: #fff; color: #000; font-size: 16px; text-align: center;")
        return wrapper
    }
})();