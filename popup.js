const btnAdd = document.querySelector("#add");
const btnDelete = document.querySelector("#delete");
const btnExport = document.querySelector("#export");
const btnSend = document.querySelector("#send");
const cookieList = document.querySelector("#cookieList");
const cookieItemTemp = document.querySelector("#cookieItem");
const cookieItemNames = [
	"domain",
	"httpOnly",
	// "hostOnly",
	"name",
	"value",
	"secure",
	// "session",
	"path",
	"expiration",
];
let globalCookie = null;

// 页面加载时获取 Cookie
document.addEventListener("DOMContentLoaded", getCurrentTabCookies);

// 获取当前标签页的 Cookie
async function getCurrentTabCookies() {
	bindBtn();
	cookieList.innerHTML = "";
	const cookies = await getAllCookies();
	if (!cookies.success) {
		cookieList.innerHTML = "<li>No cookies found for this domain.</li>";
		return;
	}
	if (chrome.runtime.lastError) {
		console.error(chrome.runtime.lastError);
		return;
	}

	const fragement = document.createDocumentFragment();
	setGlobalCookie(cookies.cookies);
	cookies.cookies.forEach((cookie, index) => {
		const itemTemp = cookieItemTemp.content.cloneNode(true);
		const itemHeader = itemTemp.querySelector(".cookieItemHeader");
		const formIns = itemTemp.querySelector(".cookieItemContainer");

		const {
			domain,
			expirationDate,
			// hostOnly,
			httpOnly,
			name,
			path,
			secure,
			// session,
			value,
			storeId,
		} = cookie;
		const computedId = uniqueId(name + domain + storeId + "");
		markCollapse(computedId, name, itemHeader);
		markForm(computedId, formIns);
        bindListener(name, computedId, itemHeader);
		bindChangeLinstener(formIns)
		entryValue({
			formIns,
			id: computedId,
			domain,
			expiration: expirationDate,
			// hostOnly,
			httpOnly,
			name,
			value,
			secure,
			path,
		});

		fragement.appendChild(itemTemp);
	});
	cookieList.append(fragement);
}
// 拼接 cookie
function serializeCookie(cookie) {
	return JSON.stringify(cookie);
}

function Add(e) {}
async function Delete(e) {
	const { activeTab, storeId } = await getCurrentTab();
	const removeFn = globalCookie.map((cookie) => chrome.cookies.remove({
        name: cookie.name,
        storeId,
        url: activeTab.url
    }));
    await Promise.all(removeFn)
    cookieList.innerHTML = "<li>This Page Has No Cookies</li>"
	resetGlobalCookie();
}
async function Export(e) {
	const content = serializeCookie(globalCookie);
	const contentUrl = new Blob([content], { type: "text/plain" });
	const blobUrl = URL.createObjectURL(contentUrl);
	await chrome.downloads.download({
		url: blobUrl,
		filename: "cookie.json",
		saveAs: true,
	});
}
async function Send(e) {
	const address = document.querySelector("#postAddress")?.value
	if (isUrl(address)) {
		await fetch(address, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(globalCookie)
		})
	}
}
async function SetOne(formId, originName) {
    const form = cookieList.querySelector("#" + formId)
    const fd = new FormData(form)
	const {activeTab, storeId} = await getCurrentTab()
	const nextCookie = {}
	const nextCookieSet = {}
	fd.entries().forEach((pair) => {
		let key = pair[0]
		let val = pair[1]
		nextCookie[key] = val
		if (key === "expiration") {
			key = "expirationDate"
			val = Date.parse(val) || 0
		} else if (key === "httpOnly" || key === "secure") {
			val = val === "true" ? true : false
		}
		nextCookieSet[key] = val
	})
	const cookie = await chrome.cookies.set({
		...nextCookieSet,
		storeId,
		url: activeTab.url
	})
	setGlobalCookieOne(originName, nextCookie)
	form.classList.toggle("flink")
}

async function DeleteOne(formId, originName) {
	const {activeTab, storeId} = await getCurrentTab()
	await chrome.cookies.remove({
        name: originName,
        storeId,
        url: activeTab.url
    })
	deleteGlobalCookieOne(originName);
	const form = cookieList.querySelector("#" + formId)
	const formParent = form.parentElement
	cookieList.removeChild(formParent)
}

function isUrl (str) {
	return typeof str === 'string' && /^https?:\/\/([a-zA-Z0-9]+\.)+[a-zA-Z0-9]+/.test(str)
}

function bindListener(originName, formId, target) {
    const handlers = target.querySelectorAll(".cookieItemHandler")
    if (handlers && handlers.length === 2) {
        handlers[0].addEventListener("click", () => SetOne(formId, originName))
        handlers[1].addEventListener("click", () => DeleteOne(formId, originName))
    }
	const postAddress = document.querySelector("#postAddress")
	postAddress.addEventListener("input", (e) => {
		const v = e.target.value
		if (!isUrl(v)) {
			postAddress.classList.add("borderRed")
			return
		} else {
			postAddress.classList.remove("borderRed")
		}
		postAddress.setAttribute("value", e.target.value)
	})
}

function bindChangeLinstener(container) {
	const eles = container.querySelectorAll("input")
	eles.forEach((ele) => {
		ele.addEventListener("input", (e) => {
			const value = e.target.value
			const name = e.target.name
			ele.setAttribute("value", value);
			const isCheckBox = ele.getAttribute("type") === "checkbox";
			if (isCheckBox) {
				if (value) {
					ele.setAttribute("checked", true);
					ele.setAttribute("value", true);
				} else {
					ele.removeAttribute("checked");
					ele.setAttribute("value", false);
				}
			} else if (name === "expiration") {
				ele.setAttribute("value", new Date(value));
			}
		})
	})
}

// 给 collapse 增加标记
function markCollapse(id, name, target) {
	const collapseHandle = target.firstElementChild;
	const collapseExpand = target.nextElementSibling;

	if (collapseExpand && collapseExpand) {
		collapseHandle.setAttribute("href", "#" + id);
		collapseExpand.setAttribute("id", id);
	}

	const title = target.querySelector(".cookieItemTitle");
	title.textContent = name;
}

function markForm(id, target) {
	target.setAttribute("id", id);
}

function entryValue(props) {
	const formIns = props.formIns;
	cookieItemNames.forEach((item) => {
		const ele = formIns.querySelector("#" + item);
		const isCheckBox = ele.getAttribute("type") === "checkbox";

		if (ele) {
			ele.setAttribute("value", props[item]);
			if (isCheckBox) {
				if (props[item]) {
					ele.setAttribute("checked", true);
					ele.setAttribute("value", true);
				} else {
					ele.removeAttribute("checked");
					ele.setAttribute("value", false);
				}
			} else if (item === "expiration") {
				ele.setAttribute("value", new Date(props[item]));
			}
		}
	});
}

async function getCurrentTab() {
	const currentTabs = await chrome.tabs.query({
		active: true,
		currentWindow: true,
	});
	const storeIds = await chrome.cookies.getAllCookieStores();
	const activeTab = currentTabs[0];
	const storeId = storeIds.find((store) =>
		store.tabIds.includes(activeTab?.id)
	)?.id;
	return {
		activeTab,
		storeId,
	};
}

async function getAllCookies() {
	const result = {
		success: false,
		cookies: null,
	};
	try {
		const { activeTab, storeId } = await getCurrentTab();
		const activeTabId = activeTab?.id;
		const url = activeTab?.url;
		if (activeTabId && storeId) {
			const domain = activeTab?.domain;
			const option = {
				domain,
				storeId,
				url,
			};
			const cookies = await chrome.cookies.getAll(option);
			result.success = true;
			result.cookies = cookies;
		}
	} catch (error) {}
	return result;
}

function bindBtn() {
	// btnAdd.addEventListener("click", Add);
	btnExport.addEventListener("click", Export);
	btnDelete.addEventListener("click", Delete);
	btnSend.addEventListener("click", Send);
}

function parseGlobalCookie(cookie) {
	const result = {};
	cookie.split(";").forEach((item) => {
		const [name, value] = item.split("=");
		result[name] = value;
	});
	return result;
}

function setGlobalCookie(cookie) {
	if (typeof cookie === "object") {
		globalCookie = cookie;
	} else if (typeof cookie === "string") {
		globalCookie = parseGlobalCookie(cookie);
	}
}

function resetGlobalCookie() {
	globalCookie = null;
}

function setGlobalCookieOne(originName, cookie) {
	if (globalCookie !== null) {
		const targetIndex = globalCookie.findIndex((cookie) => cookie.name === originName)
		if (targetIndex > -1) {
			globalCookie[targetIndex] = cookie
		}
	}
}

function deleteGlobalCookieOne(originName) {
	if (globalCookie !== null && originName in globalCookie) {
		delete globalCookie[originName];
	}
}

function uniqueId(str) {
    let result = 'a'
    for (let i = 0; i < str.length; i++) {
        const cur = str[i]
        if (/[a-zA-Z]/.test(cur)) {
            result += cur
        } else {
            result += cur.charCodeAt()
        }
    }
    return result
}
