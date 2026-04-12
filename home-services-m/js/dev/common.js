//#region src/js/common/functions.js
function getHash() {
	if (location.hash) return location.hash.replace("#", "");
}
var slideUp = (target, duration = 500, showmore = 0) => {
	if (!target.classList.contains("--slide")) {
		target.classList.add("--slide");
		target.style.transitionProperty = "height, margin, padding";
		target.style.transitionDuration = duration + "ms";
		target.style.height = `${target.offsetHeight}px`;
		target.offsetHeight;
		target.style.overflow = "hidden";
		target.style.height = showmore ? `${showmore}px` : `0px`;
		target.style.paddingTop = 0;
		target.style.paddingBottom = 0;
		target.style.marginTop = 0;
		target.style.marginBottom = 0;
		window.setTimeout(() => {
			target.hidden = !showmore ? true : false;
			!showmore && target.style.removeProperty("height");
			target.style.removeProperty("padding-top");
			target.style.removeProperty("padding-bottom");
			target.style.removeProperty("margin-top");
			target.style.removeProperty("margin-bottom");
			!showmore && target.style.removeProperty("overflow");
			target.style.removeProperty("transition-duration");
			target.style.removeProperty("transition-property");
			target.classList.remove("--slide");
			document.dispatchEvent(new CustomEvent("slideUpDone", { detail: { target } }));
		}, duration);
	}
};
var slideDown = (target, duration = 500, showmore = 0) => {
	if (!target.classList.contains("--slide")) {
		target.classList.add("--slide");
		target.hidden = target.hidden ? false : null;
		showmore && target.style.removeProperty("height");
		let height = target.offsetHeight;
		target.style.overflow = "hidden";
		target.style.height = showmore ? `${showmore}px` : `0px`;
		target.style.paddingTop = 0;
		target.style.paddingBottom = 0;
		target.style.marginTop = 0;
		target.style.marginBottom = 0;
		target.offsetHeight;
		target.style.transitionProperty = "height, margin, padding";
		target.style.transitionDuration = duration + "ms";
		target.style.height = height + "px";
		target.style.removeProperty("padding-top");
		target.style.removeProperty("padding-bottom");
		target.style.removeProperty("margin-top");
		target.style.removeProperty("margin-bottom");
		window.setTimeout(() => {
			target.style.removeProperty("height");
			target.style.removeProperty("overflow");
			target.style.removeProperty("transition-duration");
			target.style.removeProperty("transition-property");
			target.classList.remove("--slide");
			document.dispatchEvent(new CustomEvent("slideDownDone", { detail: { target } }));
		}, duration);
	}
};
var slideToggle = (target, duration = 500) => {
	if (target.hidden) return slideDown(target, duration);
	else return slideUp(target, duration);
};
var bodyLockStatus = true;
var bodyLockToggle = (delay = 500) => {
	if (document.documentElement.hasAttribute("data-fls-scrolllock")) bodyUnlock(delay);
	else bodyLock(delay);
};
var bodyUnlock = (delay = 500) => {
	if (bodyLockStatus) {
		const lockPaddingElements = document.querySelectorAll("[data-fls-lp]");
		setTimeout(() => {
			lockPaddingElements.forEach((lockPaddingElement) => {
				lockPaddingElement.style.paddingRight = "";
			});
			document.body.style.paddingRight = "";
			document.documentElement.removeAttribute("data-fls-scrolllock");
		}, delay);
		bodyLockStatus = false;
		setTimeout(function() {
			bodyLockStatus = true;
		}, delay);
	}
};
var bodyLock = (delay = 500) => {
	if (bodyLockStatus) {
		const lockPaddingElements = document.querySelectorAll("[data-fls-lp]");
		const lockPaddingValue = window.innerWidth - document.body.offsetWidth + "px";
		lockPaddingElements.forEach((lockPaddingElement) => {
			lockPaddingElement.style.paddingRight = lockPaddingValue;
		});
		document.body.style.paddingRight = lockPaddingValue;
		document.documentElement.setAttribute("data-fls-scrolllock", "");
		bodyLockStatus = false;
		setTimeout(function() {
			bodyLockStatus = true;
		}, delay);
	}
};
function uniqArray(array) {
	return array.filter((item, index, self) => self.indexOf(item) === index);
}
function dataMediaQueries(array, dataSetValue) {
	const media = Array.from(array).filter((item) => item.dataset[dataSetValue]).map((item) => {
		const [value, type = "max"] = item.dataset[dataSetValue].split(",");
		return {
			value,
			type,
			item
		};
	});
	if (media.length === 0) return [];
	const breakpointsArray = media.map(({ value, type }) => `(${type}-width: ${value}px),${value},${type}`);
	return [...new Set(breakpointsArray)].map((query) => {
		const [mediaQuery, mediaBreakpoint, mediaType] = query.split(",");
		const matchMedia = window.matchMedia(mediaQuery);
		return {
			itemsArray: media.filter((item) => item.value === mediaBreakpoint && item.type === mediaType),
			matchMedia
		};
	});
}
var gotoBlock = (targetBlock, noHeader = false, speed = 500, offsetTop = 0) => {
	const targetBlockElement = document.querySelector(targetBlock);
	if (targetBlockElement) {
		let headerItem = "";
		let headerItemHeight = 0;
		if (noHeader) {
			headerItem = "header.header";
			const headerElement = document.querySelector(headerItem);
			if (!headerElement.classList.contains("--header-scroll")) {
				headerElement.style.cssText = `transition-duration: 0s;`;
				headerElement.classList.add("--header-scroll");
				headerItemHeight = headerElement.offsetHeight;
				headerElement.classList.remove("--header-scroll");
				setTimeout(() => {
					headerElement.style.cssText = ``;
				}, 0);
			} else headerItemHeight = headerElement.offsetHeight;
		}
		if (document.documentElement.hasAttribute("data-fls-menu-open")) {
			bodyUnlock();
			document.documentElement.removeAttribute("data-fls-menu-open");
		}
		let targetBlockElementPosition = targetBlockElement.getBoundingClientRect().top + scrollY;
		targetBlockElementPosition = headerItemHeight ? targetBlockElementPosition - headerItemHeight : targetBlockElementPosition;
		targetBlockElementPosition = offsetTop ? targetBlockElementPosition - offsetTop : targetBlockElementPosition;
		window.scrollTo({
			top: targetBlockElementPosition,
			behavior: "smooth"
		});
	}
};
//#endregion
//#region src/js/script.js
var blogItems = document.querySelector(".blog__items");
var data;
var startItem = 0;
var endItem = 3;
if (blogItems) loadBlogItems();
function resolveBlogImagePath(imagePath) {
	if (!imagePath) return "";
	if (/^(https?:)?\/\//.test(imagePath) || imagePath.startsWith("data:")) return imagePath;
	const normalizedPath = imagePath.replace(/^\.\//, "").replace(/^img\//, "assets/img/");
	const baseUrl = "./";
	return `${baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`}${normalizedPath}`;
}
async function loadBlogItems() {
	const response = await fetch("files/blog.json", { method: "GET" });
	if (response.ok) {
		data = await response.json();
		initBlog(data, startItem, endItem);
	} else alert("Error!");
}
function initBlog(data, startItem, endItem) {
	data.items.slice(startItem, endItem).forEach((item) => {
		buildBlogItem(item);
	});
	viewMore();
}
function buildBlogItem(item) {
	let blogItemTemplate = ``;
	const imagePath = resolveBlogImagePath(item.image);
	blogItemTemplate += `<article data-id="${item.id}" class="blog__item item-blog">`;
	imagePath && (blogItemTemplate += `<a href="${item.url}" class="item-blog__image-ibg">
			<img src="${imagePath}" alt="Image">
		</a>`);
	blogItemTemplate += `<div class="item-blog__date">${item.date}</div>`;
	blogItemTemplate += `<h4 class="item-blog__title">
			<a href="${item.url}" class="item-blog__link-title">${item.title}</a>
		</h4>`;
	item.text && (blogItemTemplate += `<div class="item-blog__text text">
			${item.text}
		</div>`);
	if (item.tags) {
		blogItemTemplate += `<div class="item-blog__tags">`;
		for (const tag in item.tags) blogItemTemplate += `<a href="${item.tags[tag]}" class="item-blog__tag">${tag}</a>`;
		blogItemTemplate += `</div>`;
	}
	blogItemTemplate += `</article>`;
	blogItems.insertAdjacentHTML("beforeend", blogItemTemplate);
}
document.addEventListener("click", documentActions);
function viewMore() {
	const dataItemsLength = data.items.length;
	const currentItems = document.querySelectorAll(".item-blog").length;
	const vewMore = document.querySelector(".blog__view-more");
	currentItems < dataItemsLength ? vewMore.hidden = false : vewMore.hidden = true;
}
function documentActions(e) {
	if (e.target.closest(".blog__view-more")) {
		startItem = document.querySelectorAll(".item-blog").length;
		endItem = startItem + 3;
		initBlog(data, startItem, endItem);
		e.preventDefault();
	}
}
//#endregion
export { getHash as a, slideUp as c, dataMediaQueries as i, uniqArray as l, bodyLockToggle as n, gotoBlock as o, bodyUnlock as r, slideToggle as s, bodyLockStatus as t };
