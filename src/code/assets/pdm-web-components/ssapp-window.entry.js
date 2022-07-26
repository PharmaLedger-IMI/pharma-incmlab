import { r as registerInstance, f as createEvent, h, g as getElement } from './index-7447413a.js';

const ssappWindowCss = ":host{display:block}";

let SsappWindow = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
    this.windowAction = createEvent(this, "windowAction", 7);
    this.seed = undefined;
    this.landingPath = "/";
    this.componentInitialized = false;
  }
  connectedCallback() {
    if (navigator.serviceWorker)
      navigator.serviceWorker.addEventListener('message', this.getSWOnMessageHandler());
  }
  disconnectedCallback() {
    if (navigator.serviceWorker)
      navigator.serviceWorker.removeEventListener('message', this.getSWOnMessageHandler());
  }
  componentShouldUpdate(newValue, oldValue, changedState) {
    if (newValue !== oldValue && (changedState === "digestKeySsiHex" || changedState === "parsedParams")) {
      window.document.removeEventListener(oldValue, this.eventHandler);
      window.document.addEventListener(newValue, this.eventHandler);
      return true;
    }
    return false;
  }
  componentWillLoad() {
    if (!this.element.isConnected) {
      return;
    }
    return new Promise((resolve) => {
      this.componentInitialized = true;
      this.loadApp(resolve);
    });
  }
  componentDidLoad() {
    let iframe = this.element.querySelector("iframe");
    console.log("#### Trying to register ssapp reference");
    // getInstanceRegistry().addSSAppReference(this.appName, iframe);
    this.eventHandler = this.ssappEventHandler.bind(this);
    window.document.addEventListener(this.digestKeySsiHex, this.eventHandler);
    window.document.addEventListener(this.parsedParams, this.eventHandler);
    console.log(`### Trying to add listener to iframe document`);
    const self = this;
    iframe.addEventListener('load', () => {
      iframe.contentWindow.addEventListener('ssapp-action', self.handleActionFromWindow.bind(self));
    });
  }
  handleActionFromWindow(evt) {
    evt.preventDefault();
    evt.stopImmediatePropagation();
    const { detail } = evt;
    this.windowAction.emit(detail);
  }
  loadApp(callback) {
    if (!this.seed)
      return;
    if (this.componentInitialized) {
      this.digestKeySsiHex = this.digestMessage(this.seed);
      if (typeof callback === "function") {
        callback();
      }
      if (!!this.params) {
        try {
          this.parsedParams = Object.assign({}, this.params);
        }
        catch (e) {
          console.log("Attribute called 'params' could not be parsed.");
        }
      }
    }
  }
  ;
  getWindows() {
    let currentWindow = window;
    let parentWindow = currentWindow.parent;
    while (currentWindow !== parentWindow) {
      currentWindow = parentWindow;
      parentWindow = currentWindow.parent;
    }
    return { currentWindow, parentWindow };
  }
  sendLoadingProgress(progress, status) {
    const { parentWindow } = this.getWindows();
    parentWindow.document.dispatchEvent(new CustomEvent('ssapp:loading:progress', {
      detail: {
        progress,
        status
      }
    }));
  }
  ssappEventHandler(e) {
    const data = e.detail || {};
    let iframe = this.element.querySelector("iframe");
    if (data.query === 'seed') {
      iframe.contentWindow.document.dispatchEvent(new CustomEvent(this.digestKeySsiHex, {
        detail: {
          seed: this.seed
        }
      }));
      return;
    }
    if (data.status === 'completed') {
      const signalFinishLoading = () => {
        this.sendLoadingProgress(100);
        iframe.removeEventListener('load', signalFinishLoading);
      };
      iframe.addEventListener('load', signalFinishLoading);
      iframe.contentWindow.location.reload();
    }
  }
  getSWOnMessageHandler() {
    if (this.onServiceWorkerMessageHandler) {
      return this.onServiceWorkerMessageHandler;
    }
    /**
     * Listen for seed requests
     */
    this.onServiceWorkerMessageHandler = (e) => {
      if (!e.data || e.data.query !== 'seed') {
        return;
      }
      const swWorkerIdentity = e.data.identity;
      if (swWorkerIdentity === this.digestKeySsiHex) {
        e.source.postMessage({
          seed: this.seed
        });
      }
    };
    return this.onServiceWorkerMessageHandler;
  }
  digestMessage(message) {
    // @ts-ignore
    const crypto = require("opendsu").loadApi("crypto");
    const hash = crypto.sha256(message);
    return hash;
  }
  getQueryParams() {
    let queryParams = "";
    if (this.parsedParams)
      queryParams += Object.keys(this.parsedParams)
        .map((key) => key + "=" + this.parsedParams[key])
        .join('&');
    return queryParams ? '?' + encodeURI(queryParams) : '';
  }
  getIFrameSrc() {
    let basePath;
    const { currentWindow } = this.getWindows();
    basePath = currentWindow.location.origin + currentWindow.location.pathname;
    basePath = basePath.replace("index.html", "");
    if (basePath[basePath.length - 1] !== '/')
      basePath += '/';
    // we are in a context in which SW are not enabled so the iframe must be identified by the seed
    const iframeKeySsi = $$.SSAPP_CONTEXT && $$.SSAPP_CONTEXT.BASE_URL && $$.SSAPP_CONTEXT.SEED ? this.seed : this.digestKeySsiHex;
    return basePath + "iframe/" + iframeKeySsi + this.getQueryParams();
  }
  render() {
    if (!this.seed)
      return;
    const iframeSrc = this.getIFrameSrc();
    console.log("Loading sssap in: " + iframeSrc);
    return (h("iframe", { "landing-page": this.landingPath, frameborder: "0", style: {
        overflow: "hidden",
        height: "100%",
        width: "100%"
      }, src: iframeSrc }));
  }
  get element() { return getElement(this); }
  static get watchers() { return {
    "seed": ["loadApp"],
    "params": ["loadApp"],
    "landingPath": ["loadApp"]
  }; }
};
SsappWindow.style = ssappWindowCss;

export { SsappWindow as ssapp_window };
