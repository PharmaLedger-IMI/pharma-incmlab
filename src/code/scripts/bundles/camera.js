cameraRequire=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"../../../native-integration/src/default":[function(require,module,exports){
const {CameraApi} = require('./CameraApi');
const {handleFrameBinding} = require('../ReferenceHandler');

handleFrameBinding(CameraApi);
},{"../ReferenceHandler":"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/native-integration/src/ReferenceHandler.js","./CameraApi":"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/native-integration/src/default/CameraApi.js"}],"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/native-integration/builds/tmp/camera_intermediar.js":[function(require,module,exports){
(function (global){(function (){
global.cameraLoadModules = function(){ 

	if(typeof $$.__runtimeModules["camera"] === "undefined"){
		$$.__runtimeModules["camera"] = require("../../../native-integration/src/default");
	}
};
if (true) {
	cameraLoadModules();
}
global.cameraRequire = require;
if (typeof $$ !== "undefined") {
	$$.requireBundle("camera");
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../../native-integration/src/default":"../../../native-integration/src/default"}],"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/native-integration/src/CameraCapabilities.js":[function(require,module,exports){
class CameraCapabilities {
    cameraEnv = undefined;
    getConstraints = true;
    bindStreamToElement = true;
    getCameraStream = true;
    closeCameraStream = true;
    switchCamera = true;
    getStatus = true;
    hasPermission = true;
    takePicture = true;
    toggleTorch = true;
    setTorchLevel = true;
    setColorSpace = true;
    setCrop = true;
    toggleContinuousAF = true;
    getDeviceTypes = true;

    constructor(props) {
        if (!!props)
            for(let prop in props)
                if (props.hasOwnProperty(prop))
                    this[prop] = props[prop];
        if (!this.cameraEnv)
            throw new Error(`Missing camera environment - 'ios', 'android' or 'default'`)
    }
}

module.exports = {
    CameraCapabilities
}
},{}],"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/native-integration/src/CameraInterface.js":[function(require,module,exports){
const STATUS = {
    IN_PROGRESS: "Camera detection in progress...",
    DONE: "Scan done.",
    NO_DETECTION: "No camera detected.",
    NO_PERMISSION: "No permission given"
}

const {CameraCapabilities} = require('./CameraCapabilities');

class CameraInterface {

    getCapabilities(){
        return new CameraCapabilities({
            cameraEnv: 'default'
        });
    }

    async isAvailable(){
        throw new Error(`Not implemented`);
    }

    getConstraints(...args){
        throw new Error(`Not implemented`);
    }

    async bindStreamToElement(element, ...args){
        throw new Error(`Not implemented`);
    }

    async getCameraStream(...args){
        throw new Error(`Not implemented`);
    };

    closeCameraStream(...args){
        throw new Error(`Not implemented`);
    };

    switchCamera(...args){
        throw new Error(`Not implemented`);
    };

    /**
     *
     * @param {function(string): void} [handler] when not provided, will return the current status.
     * Otherwise handler will be called on status update
     * @returns {*}
     */
    getStatus(handler, ...args){
        throw new Error(`Not implemented`);
    };

    hasPermissions(...args){
        throw new Error(`Not implemented`);
    };

    async takePicture(...args){
        throw new Error(`Not implemented`);
    }

    toggleTorch(...args){
        throw new Error(`Not implemented`);
    }

    setTorchLevel(...args){
        throw new Error(`Not implemented`);
    }

    setColorSpace(...args){
        throw new Error(`Not implemented`);
    }

    setCrop(x, y, w, h, ...args){
        throw new Error(`Not implemented`);
    }

    toggleContinuousAF(...args){
        throw new Error(`Not implemented`);
    }

    getDeviceTypes(...args){
        throw new Error(`Not implemented`);
    }

    selectPreset(...args){
        throw new Error(`Not implemented`);
    }

}

module.exports = {
    CameraInterface,
    STATUS
}
},{"./CameraCapabilities":"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/native-integration/src/CameraCapabilities.js"}],"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/native-integration/src/ReferenceHandler.js":[function(require,module,exports){

const handleFrameBinding = function(camera){
    if (!window)
        return console.error(`Not in a browser environment...`);

    let currentWindow = window;
    if (!!currentWindow.Native)
        return console.log(`Native APIs already loaded`);

    const bindToWindow = function(){
        window.Native = {};
        window.Native.Camera = new (camera.default || camera)();
    }

    let parentWindow = currentWindow.parent;

    while(parentWindow !== currentWindow && !parentWindow.Native){
        console.log(parentWindow, currentWindow);
        currentWindow = parentWindow;
        parentWindow = currentWindow.parent;
    }

    if (!parentWindow || !parentWindow.Native)
        return bindToWindow();

    window.Native = parentWindow.Native;
}

module.exports = {
    handleFrameBinding
}
},{}],"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/native-integration/src/default/CameraApi.js":[function(require,module,exports){
const {STATUS, CameraInterface} = require('../CameraInterface');
const {CameraCapabilities} = require('../CameraCapabilities');

class CameraApi extends CameraInterface{
    _hasPermissions = undefined;
    _status = undefined;

    __statusHandler;

    __stream = undefined;
    __devices = undefined;
    __activeDeviceId = undefined;

    async getConstraints(){
        const constraints = {
            video: {
                facingMode: 'environment'
            }
        };
        const deviceId = this.activeDeviceId;
        if (deviceId && deviceId !== 'no-camera') {
            delete constraints.video.facingMode;
            constraints.video['deviceId'] = {
                exact: deviceId
            };
        }

        return constraints;
    }

    async _getPermissions(){

        if (!(navigator &&'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
            this._hasPermissions = false;
            this._updateStatus(STATUS.NO_DETECTION);
            return;
        }
        const constraints = await this.getConstraints();

        if (this.__stream)
            this.closeCameraStream();

        try{
            this.__stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e){
            this._hasPermissions = false;
            this._updateStatus(STATUS.NO_PERMISSION);
            return;
        }

        if (!this.__stream){
            this._updateStatus(STATUS.NO_PERMISSION);
            this._hasPermissions = false;
            return;
        }

        this._hasPermissions = true;
        return this.__stream;
    }

    async isAvailable(){
        const self = this;
        return await this.getDeviceTypes().then(devices => {
            self.__devices = devices.filter(d => d.kind === 'videoinput');
            return !!self.__devices.length;
        });
    }

    closeCameraStream(){
        if (!this.__stream || !this.__stream.getTracks)
            return;
        this.__stream.getTracks().forEach(t => t.readyState === 'live' && t.stop());
        this.__stream = undefined;
    };

    getStatus(handler){
        if (!handler)
            return this._status;
        this.__statusHandler = handler;
    }

    _updateStatus(message){
        this._status = message;
        if (this.__statusHandler)
            this.__statusHandler(message);
    }

    hasPermissions(){
        return this._hasPermissions || false;
    };

    async bindStreamToElement(element){
        const stream = await this.getCameraStream();
        if (stream && element)
            element.srcObject = stream;
        else
            console.error(`Missing stream or destination element`, stream, element);
    }

    async getCameraStream(){
        return await this._getPermissions();
    }

    switchCamera(){
        let devices = [undefined];

        for (const device of this.__devices)
            devices.push(device.deviceId);

        let currentIndex = devices.indexOf(this.activeDeviceId);
        if (currentIndex === devices.length - 1)
            currentIndex = -1;

        currentIndex++;

        this.activeDeviceId = devices[currentIndex];

        this._updateStatus(`Current Device Id: ${this.activeDeviceId}`);
    };

    async takePicture(...args){
        console.log(`Not implemented`);
    }

    toggleTorch(...args){
        console.log(`Not implemented`);
    }

    setTorchLevel(...args){
        console.log(`Not implemented`);
    }

    setColorSpace(...args){
        console.log(`Not implemented`);
    }

    setCrop(x, y, w, h, ...args){
        console.log(`Not implemented`);
    }

    toggleContinuousAF(...args){
        console.log(`Not implemented`);
    }

    getCapabilities(){
        return new CameraCapabilities({
            cameraEnv: 'default',
            takePicture: false,
            toggleTorch: false,
            setTorchLevel: false,
            setColorSpace: false,
            setCrop: false,
            toggleContinuousAf: false
        });
    }

    async getDeviceTypes(){
        return await navigator.mediaDevices.enumerateDevices();
    }

    selectPreset(...args){
        console.log(`Not implemented`);
    }
}

module.exports = {
    CameraApi
}
},{"../CameraCapabilities":"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/native-integration/src/CameraCapabilities.js","../CameraInterface":"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/native-integration/src/CameraInterface.js"}]},{},["/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/native-integration/builds/tmp/camera_intermediar.js"])
                    ;(function(global) {
                        global.bundlePaths = {"camera":"build/bundles/default/camera.js"};
                    })(typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
                