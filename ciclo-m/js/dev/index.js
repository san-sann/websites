//#region \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
//#endregion
//#region src/js/common/functions.js
var isMobile = {
	Android: function() {
		return navigator.userAgent.match(/Android/i);
	},
	BlackBerry: function() {
		return navigator.userAgent.match(/BlackBerry/i);
	},
	iOS: function() {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	},
	Opera: function() {
		return navigator.userAgent.match(/Opera Mini/i);
	},
	Windows: function() {
		return navigator.userAgent.match(/IEMobile/i);
	},
	any: function() {
		return isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows();
	}
};
function getDigFormat(item, sepp = " ") {
	return item.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, `$1${sepp}`);
}
//#endregion
//#region src/components/layout/fullpage/fullpage.js
var FullPage = class {
	constructor(element, options) {
		let config = {
			noEventSelector: "[data-fls-fullpage-noevent]",
			classInit: "--fullpage-init",
			wrapperAnimatedClass: "--fullpage-switching",
			selectorSection: "[data-fls-fullpage-section]",
			activeClass: "active-section",
			previousClass: "previous-section",
			nextClass: "next-section",
			idActiveSection: 0,
			mode: element.dataset.flsFullpageEffect ? element.dataset.flsFullpageEffect : "slider",
			bullets: element.hasAttribute("data-fls-fullpage-bullets") ? true : false,
			bulletsClass: "--fullpage-bullets",
			bulletClass: "--fullpage-bullet",
			bulletActiveClass: "--fullpage-bullet-active",
			onInit: function() {},
			onSwitching: function() {},
			onDestroy: function() {}
		};
		this.options = Object.assign(config, options);
		this.wrapper = element;
		this.sections = this.wrapper.querySelectorAll(this.options.selectorSection);
		this.activeSection = false;
		this.activeSectionId = false;
		this.previousSection = false;
		this.previousSectionId = false;
		this.nextSection = false;
		this.nextSectionId = false;
		this.bulletsWrapper = false;
		this.stopEvent = false;
		if (this.sections.length) this.init();
	}
	init() {
		if (this.options.idActiveSection > this.sections.length - 1) return;
		this.setId();
		this.activeSectionId = this.options.idActiveSection;
		this.setEffectsClasses();
		this.setClasses();
		this.setStyle();
		if (this.options.bullets) {
			this.setBullets();
			this.setActiveBullet(this.activeSectionId);
		}
		this.events();
		setTimeout(() => {
			this.emitSectionWatcher(this.activeSection);
			document.documentElement.classList.add(this.options.classInit);
			this.options.onInit(this);
			document.dispatchEvent(new CustomEvent("fpinit", { detail: { fp: this } }));
		}, 0);
	}
	emitSectionWatcher(section) {
		if (!section) return;
		const watchItems = this.wrapper.querySelectorAll("[data-fls-watcher], [data-watch]");
		if (!watchItems.length) return;
		watchItems.forEach((item) => {
			const isIntersecting = section.contains(item);
			isIntersecting ? item.classList.add("--watcher-view") : item.classList.remove("--watcher-view");
			document.dispatchEvent(new CustomEvent("watcherCallback", { detail: { entry: {
				target: item,
				isIntersecting
			} } }));
		});
	}
	destroy() {
		this.removeEvents();
		this.removeClasses();
		document.documentElement.classList.remove(this.options.classInit);
		this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
		this.removeEffectsClasses();
		this.removeZIndex();
		this.removeStyle();
		this.removeId();
		this.options.onDestroy(this);
		document.dispatchEvent(new CustomEvent("fpdestroy", { detail: { fp: this } }));
	}
	setId() {
		for (let index = 0; index < this.sections.length; index++) this.sections[index].setAttribute("data-fls-fullpage-id", index);
	}
	removeId() {
		for (let index = 0; index < this.sections.length; index++) this.sections[index].removeAttribute("data-fls-fullpage-id");
	}
	setClasses() {
		this.previousSectionId = this.activeSectionId - 1 >= 0 ? this.activeSectionId - 1 : false;
		this.nextSectionId = this.activeSectionId + 1 < this.sections.length ? this.activeSectionId + 1 : false;
		this.activeSection = this.sections[this.activeSectionId];
		this.activeSection.classList.add(this.options.activeClass);
		for (let index = 0; index < this.sections.length; index++) document.documentElement.classList.remove(`--fullpage-section-${index}`);
		document.documentElement.classList.add(`--fullpage-section-${this.activeSectionId}`);
		if (this.previousSectionId !== false) {
			this.previousSection = this.sections[this.previousSectionId];
			this.previousSection.classList.add(this.options.previousClass);
		} else this.previousSection = false;
		if (this.nextSectionId !== false) {
			this.nextSection = this.sections[this.nextSectionId];
			this.nextSection.classList.add(this.options.nextClass);
		} else this.nextSection = false;
	}
	removeEffectsClasses() {
		switch (this.options.mode) {
			case "slider":
				this.wrapper.classList.remove("slider-mode");
				break;
			case "cards":
				this.wrapper.classList.remove("cards-mode");
				this.setZIndex();
				break;
			case "fade":
				this.wrapper.classList.remove("fade-mode");
				this.setZIndex();
				break;
			default: break;
		}
	}
	setEffectsClasses() {
		switch (this.options.mode) {
			case "slider":
				this.wrapper.classList.add("slider-mode");
				break;
			case "cards":
				this.wrapper.classList.add("cards-mode");
				this.setZIndex();
				break;
			case "fade":
				this.wrapper.classList.add("fade-mode");
				this.setZIndex();
				break;
			default: break;
		}
	}
	setStyle() {
		switch (this.options.mode) {
			case "slider":
				this.styleSlider();
				break;
			case "cards":
				this.styleCards();
				break;
			case "fade":
				this.styleFade();
				break;
			default: break;
		}
	}
	styleSlider() {
		for (let index = 0; index < this.sections.length; index++) {
			const section = this.sections[index];
			if (index === this.activeSectionId) section.style.transform = "translate3D(0,0,0)";
			else if (index < this.activeSectionId) section.style.transform = "translate3D(0,-100%,0)";
			else if (index > this.activeSectionId) section.style.transform = "translate3D(0,100%,0)";
		}
	}
	styleCards() {
		for (let index = 0; index < this.sections.length; index++) {
			const section = this.sections[index];
			if (index >= this.activeSectionId) section.style.transform = "translate3D(0,0,0)";
			else if (index < this.activeSectionId) section.style.transform = "translate3D(0,-100%,0)";
		}
	}
	styleFade() {
		for (let index = 0; index < this.sections.length; index++) {
			const section = this.sections[index];
			if (index === this.activeSectionId) {
				section.style.opacity = "1";
				section.style.pointerEvents = "all";
			} else {
				section.style.opacity = "0";
				section.style.pointerEvents = "none";
			}
		}
	}
	removeStyle() {
		for (let index = 0; index < this.sections.length; index++) {
			const section = this.sections[index];
			section.style.opacity = "";
			section.style.visibility = "";
			section.style.transform = "";
		}
	}
	checkScroll(yCoord, element) {
		this.goScroll = false;
		if (!this.stopEvent && element) {
			this.goScroll = true;
			if (this.haveScroll(element)) {
				this.goScroll = false;
				const position = Math.round(element.scrollHeight - element.scrollTop);
				if (Math.abs(position - element.scrollHeight) < 2 && yCoord <= 0 || Math.abs(position - element.clientHeight) < 2 && yCoord >= 0) this.goScroll = true;
			}
		}
	}
	haveScroll(element) {
		return element.scrollHeight !== window.innerHeight;
	}
	removeClasses() {
		for (let index = 0; index < this.sections.length; index++) {
			const section = this.sections[index];
			section.classList.remove(this.options.activeClass);
			section.classList.remove(this.options.previousClass);
			section.classList.remove(this.options.nextClass);
		}
	}
	events() {
		this.events = {
			wheel: this.wheel.bind(this),
			touchdown: this.touchDown.bind(this),
			touchup: this.touchUp.bind(this),
			touchmove: this.touchMove.bind(this),
			touchcancel: this.touchUp.bind(this),
			transitionEnd: this.transitionend.bind(this),
			click: this.clickBullets.bind(this)
		};
		if (isMobile.iOS()) document.addEventListener("touchmove", (e) => {
			e.preventDefault();
		});
		this.setEvents();
	}
	setEvents() {
		this.wrapper.addEventListener("wheel", this.events.wheel);
		this.wrapper.addEventListener("touchstart", this.events.touchdown);
		if (this.options.bullets && this.bulletsWrapper) this.bulletsWrapper.addEventListener("click", this.events.click);
	}
	removeEvents() {
		this.wrapper.removeEventListener("wheel", this.events.wheel);
		this.wrapper.removeEventListener("touchdown", this.events.touchdown);
		this.wrapper.removeEventListener("touchup", this.events.touchup);
		this.wrapper.removeEventListener("touchcancel", this.events.touchup);
		this.wrapper.removeEventListener("touchmove", this.events.touchmove);
		if (this.bulletsWrapper) this.bulletsWrapper.removeEventListener("click", this.events.click);
	}
	clickBullets(e) {
		const bullet = e.target.closest(`.${this.options.bulletClass}`);
		if (bullet) {
			const idClickBullet = Array.from(this.bulletsWrapper.children).indexOf(bullet);
			this.switchingSection(idClickBullet);
		}
	}
	setActiveBullet(idButton) {
		if (!this.bulletsWrapper) return;
		const bullets = this.bulletsWrapper.children;
		for (let index = 0; index < bullets.length; index++) {
			const bullet = bullets[index];
			if (idButton === index) bullet.classList.add(this.options.bulletActiveClass);
			else bullet.classList.remove(this.options.bulletActiveClass);
		}
	}
	touchDown(e) {
		this._yP = e.changedTouches[0].pageY;
		this._eventElement = e.target.closest(`.${this.options.activeClass}`);
		if (this._eventElement) {
			this._eventElement.addEventListener("touchend", this.events.touchup);
			this._eventElement.addEventListener("touchcancel", this.events.touchup);
			this._eventElement.addEventListener("touchmove", this.events.touchmove);
			this.clickOrTouch = true;
			if (isMobile.iOS()) {
				if (this._eventElement.scrollHeight !== this._eventElement.clientHeight) {
					if (this._eventElement.scrollTop === 0) this._eventElement.scrollTop = 1;
					if (this._eventElement.scrollTop === this._eventElement.scrollHeight - this._eventElement.clientHeight) this._eventElement.scrollTop = this._eventElement.scrollHeight - this._eventElement.clientHeight - 1;
				}
				this.allowUp = this._eventElement.scrollTop > 0;
				this.allowDown = this._eventElement.scrollTop < this._eventElement.scrollHeight - this._eventElement.clientHeight;
				this.lastY = e.changedTouches[0].pageY;
			}
		}
	}
	touchMove(e) {
		const targetElement = e.target.closest(`.${this.options.activeClass}`);
		if (isMobile.iOS()) {
			let up = e.changedTouches[0].pageY > this.lastY;
			let down = !up;
			this.lastY = e.changedTouches[0].pageY;
			if (targetElement) {
				if (up && this.allowUp || down && this.allowDown) e.stopPropagation();
				else if (e.cancelable) e.preventDefault();
			}
		}
		if (!this.clickOrTouch || e.target.closest(this.options.noEventSelector)) return;
		let yCoord = this._yP - e.changedTouches[0].pageY;
		this.checkScroll(yCoord, targetElement);
		if (this.goScroll && Math.abs(yCoord) > 20) this.choiceOfDirection(yCoord);
	}
	touchUp(e) {
		this._eventElement.removeEventListener("touchend", this.events.touchup);
		this._eventElement.removeEventListener("touchcancel", this.events.touchup);
		this._eventElement.removeEventListener("touchmove", this.events.touchmove);
		return this.clickOrTouch = false;
	}
	transitionend(e) {
		this.stopEvent = false;
		document.documentElement.classList.remove(this.options.wrapperAnimatedClass);
		this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
	}
	wheel(e) {
		if (e.target.closest(this.options.noEventSelector)) return;
		const yCoord = e.deltaY;
		const targetElement = e.target.closest(`.${this.options.activeClass}`);
		this.checkScroll(yCoord, targetElement);
		if (this.goScroll) this.choiceOfDirection(yCoord);
	}
	choiceOfDirection(direction) {
		if (direction > 0 && this.nextSection !== false) this.activeSectionId = this.activeSectionId + 1 < this.sections.length ? ++this.activeSectionId : this.activeSectionId;
		else if (direction < 0 && this.previousSection !== false) this.activeSectionId = this.activeSectionId - 1 >= 0 ? --this.activeSectionId : this.activeSectionId;
		this.switchingSection(this.activeSectionId, direction);
	}
	switchingSection(idSection = this.activeSectionId, direction) {
		if (!direction) {
			if (idSection < this.activeSectionId) direction = -100;
			else if (idSection > this.activeSectionId) direction = 100;
		}
		this.activeSectionId = idSection;
		this.stopEvent = true;
		if (this.previousSectionId === false && direction < 0 || this.nextSectionId === false && direction > 0) this.stopEvent = false;
		if (this.stopEvent) {
			document.documentElement.classList.add(this.options.wrapperAnimatedClass);
			this.wrapper.classList.add(this.options.wrapperAnimatedClass);
			this.removeClasses();
			this.setClasses();
			this.setStyle();
			this.emitSectionWatcher(this.activeSection);
			if (this.options.bullets) this.setActiveBullet(this.activeSectionId);
			let delaySection;
			if (direction < 0) {
				delaySection = this.activeSection.dataset.flsFullpageDirectionUp ? parseInt(this.activeSection.dataset.flsFullpageDirectionUp) : 500;
				document.documentElement.classList.add("--fullpage-up");
				document.documentElement.classList.remove("--fullpage-down");
			} else {
				delaySection = this.activeSection.dataset.flsFullpageDirectionDown ? parseInt(this.activeSection.dataset.flsFullpageDirectionDown) : 500;
				document.documentElement.classList.remove("--fullpage-up");
				document.documentElement.classList.add("--fullpage-down");
			}
			setTimeout(() => {
				this.events.transitionEnd();
			}, delaySection);
			this.options.onSwitching(this);
			document.dispatchEvent(new CustomEvent("fpswitching", { detail: { fp: this } }));
		}
	}
	setBullets() {
		this.bulletsWrapper = document.querySelector(`.${this.options.bulletsClass}`);
		if (!this.bulletsWrapper) {
			const bullets = document.createElement("div");
			bullets.classList.add(this.options.bulletsClass);
			this.wrapper.append(bullets);
			this.bulletsWrapper = bullets;
		}
		if (this.bulletsWrapper) for (let index = 0; index < this.sections.length; index++) {
			const span = document.createElement("span");
			span.classList.add(this.options.bulletClass);
			this.bulletsWrapper.append(span);
		}
	}
	setZIndex() {
		let zIndex = this.sections.length;
		for (let index = 0; index < this.sections.length; index++) {
			const section = this.sections[index];
			section.style.zIndex = zIndex;
			--zIndex;
		}
	}
	removeZIndex() {
		for (let index = 0; index < this.sections.length; index++) {
			const section = this.sections[index];
			section.style.zIndex = "";
		}
	}
};
if (document.querySelector("[data-fls-fullpage]")) window.addEventListener("load", () => window.flsFullpage = new FullPage(document.querySelector("[data-fls-fullpage]")));
//#endregion
//#region src/components/layout/digcounter/digcounter.js
function digitsCounter() {
	function digitsCountersInit(digitsCountersItems) {
		let digitsCounters = digitsCountersItems ? digitsCountersItems : document.querySelectorAll("[data-fls-digcounter]");
		if (digitsCounters.length) digitsCounters.forEach((digitsCounter) => {
			if (digitsCounter.hasAttribute("data-fls-digcounter-go")) return;
			digitsCounter.setAttribute("data-fls-digcounter-go", "");
			digitsCounter.dataset.flsDigcounter = digitsCounter.innerHTML;
			digitsCounter.innerHTML = `0`;
			digitsCountersAnimate(digitsCounter);
		});
	}
	function digitsCountersAnimate(digitsCounter) {
		let startTimestamp = null;
		const duration = parseFloat(digitsCounter.dataset.flsDigcounterSpeed) ? parseFloat(digitsCounter.dataset.flsDigcounterSpeed) : 1e3;
		const startValue = parseFloat(digitsCounter.dataset.flsDigcounter);
		const format = digitsCounter.dataset.flsDigcounterFormat ? digitsCounter.dataset.flsDigcounterFormat : " ";
		const startPosition = 0;
		const step = (timestamp) => {
			if (!startTimestamp) startTimestamp = timestamp;
			const progress = Math.min((timestamp - startTimestamp) / duration, 1);
			const value = Math.floor(progress * (startPosition + startValue));
			digitsCounter.innerHTML = typeof digitsCounter.dataset.flsDigcounterFormat !== "undefined" ? getDigFormat(value, format) : value;
			if (progress < 1) window.requestAnimationFrame(step);
			else digitsCounter.removeAttribute("data-fls-digcounter-go");
		};
		window.requestAnimationFrame(step);
	}
	function digitsCounterAction(e) {
		const entry = e.detail.entry;
		const targetElement = entry.target;
		if (targetElement.querySelectorAll("[data-fls-digcounter]").length && !targetElement.querySelectorAll("[data-fls-watcher], [data-watch]").length && entry.isIntersecting) digitsCountersInit(targetElement.querySelectorAll("[data-fls-digcounter]"));
	}
	document.addEventListener("watcherCallback", digitsCounterAction);
}
document.querySelector("[data-fls-digcounter]") && window.addEventListener("load", digitsCounter);
//#endregion
//#region src/components/effects/parallax/parallax.js
var Parallax = class Parallax {
	constructor(elements) {
		if (elements.length) this.elements = Array.from(elements).map((el) => new Parallax.Each(el, this.options));
	}
	destroyEvents() {
		this.elements.forEach((el) => {
			el.destroyEvents();
		});
	}
	setEvents() {
		this.elements.forEach((el) => {
			el.setEvents();
		});
	}
};
Parallax.Each = class {
	constructor(parent) {
		this.parent = parent;
		this.elements = this.parent.querySelectorAll("[data-fls-parallax]");
		this.animation = this.animationFrame.bind(this);
		this.offset = 0;
		this.value = 0;
		this.smooth = parent.dataset.flsParallaxSmooth ? Number(parent.dataset.flsParallaxSmooth) : 15;
		this.setEvents();
	}
	setEvents() {
		this.animationID = window.requestAnimationFrame(this.animation);
	}
	destroyEvents() {
		window.cancelAnimationFrame(this.animationID);
	}
	animationFrame() {
		const topToWindow = this.parent.getBoundingClientRect().top;
		const heightParent = this.parent.offsetHeight;
		const heightWindow = window.innerHeight;
		const positionParent = {
			top: topToWindow - heightWindow,
			bottom: topToWindow + heightParent
		};
		const centerPoint = this.parent.dataset.flsParallaxCenter ? this.parent.dataset.flsParallaxCenter : "center";
		if (positionParent.top < 30 && positionParent.bottom > -30) switch (centerPoint) {
			case "top":
				this.offset = -1 * topToWindow;
				break;
			case "center":
				this.offset = heightWindow / 2 - (topToWindow + heightParent / 2);
				break;
			case "bottom":
				this.offset = heightWindow - (topToWindow + heightParent);
				break;
		}
		this.value += (this.offset - this.value) / this.smooth;
		this.animationID = window.requestAnimationFrame(this.animation);
		this.elements.forEach((el) => {
			const parameters = {
				axis: el.dataset.axis ? el.dataset.axis : "v",
				direction: el.dataset.flsParallaxDirection ? el.dataset.flsParallaxDirection + "1" : "-1",
				coefficient: el.dataset.flsParallaxCoefficient ? Number(el.dataset.flsParallaxCoefficient) : 5,
				additionalProperties: el.dataset.flsParallaxProperties ? el.dataset.flsParallaxProperties : ""
			};
			this.parameters(el, parameters);
		});
	}
	parameters(el, parameters) {
		if (parameters.axis == "v") el.style.transform = `translate3D(0, ${(parameters.direction * (this.value / parameters.coefficient)).toFixed(2)}px,0) ${parameters.additionalProperties}`;
		else if (parameters.axis == "h") el.style.transform = `translate3D(${(parameters.direction * (this.value / parameters.coefficient)).toFixed(2)}px,0,0) ${parameters.additionalProperties}`;
	}
};
if (document.querySelector("[data-fls-parallax-parent]")) new Parallax(document.querySelectorAll("[data-fls-parallax-parent]"));
//#endregion
