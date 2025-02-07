// let activeTab = {
//   url: "",
//   tabId: 0,
// };

// // chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
//     // setActiveTab(tabId, tab.url)
//     // const targetUrl = tab?.url
//     // if (!targetUrl?.startsWith("chrome://")) {
//     //     await chrome.scripting.executeScript({
//     //         target: { tabId: tabId, allFrames : true },
//     //         args: [tabId],
//     //         func: (id) => {
//     //           window.cookie_post_tabId = id;
//     //         }
//     //     });
//     // }
// // });

// chrome.runtime.onConnect.addListener(function (port) {
//   port.onMessage.addListener(async function (message, _, setResponse) {
//     const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
//     console.log("tabs", tabs)
//     if (message.type === "getCookie" && message.url) {
//       const storeIds = await chrome.cookies.getAllCookieStores();
//       const activeTabs = await chrome.tabs.query({ active: true });
//       const activeTabId = activeTabs.find((tab) => tab.url === message.url)?.id;
//       const storeId = storeIds.find((store) =>
//         store.tabIds.includes(activeTabId)
//       )?.id;
//       if (activeTabId && storeId) {
//         const parseUrl = new URL(message.url);
//         const domain = parseUrl.host?.replace(/\w+/, "");
//         const option = {
//           domain,
//           storeId,
//           url: message.url,
//         };
//         const cookies = await chrome.cookies.getAll(option);
//         console.log("background", cookies)
//         port.postMessage({
//           success: true,
//           cookie: cookies,
//           tabId: activeTabId,
//         });
//       }
//     }
//     return true
//   });
// });

// function setActiveTab(tabId, url) {
//   activeTab.url = url;
//   activeTab.tabId = tabId;
// }

// function resetActiveTab() {
//   activeTab.url = "";
//   activeTab.tabId = 0;
// }
