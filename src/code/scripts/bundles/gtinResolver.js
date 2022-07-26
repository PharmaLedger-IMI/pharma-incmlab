gtinResolverRequire=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/gtin-resolver/builds/tmp/gtinResolver_intermediar.js":[function(require,module,exports){
(function (global){(function (){
global.gtinResolverLoadModules = function(){ 

	if(typeof $$.__runtimeModules["gtin-resolver"] === "undefined"){
		$$.__runtimeModules["gtin-resolver"] = require("gtin-resolver");
	}
};
if (true) {
	gtinResolverLoadModules();
}
global.gtinResolverRequire = require;
if (typeof $$ !== "undefined") {
	$$.requireBundle("gtinResolver");
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"gtin-resolver":"gtin-resolver"}],"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/gtin-resolver/lib/GTIN_DSU_Factory.js":[function(require,module,exports){
function GTIN_DSU_Factory(resolver) {
    this.create = (keySSI, options, callback) => {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        options.dsuFactoryType = "const";
        resolver.createDSU(keySSI, options, callback);
    };


    this.load = (keySSI, options, callback) => {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        options.dsuFactoryType = "const";
        resolver.loadDSU(keySSI, options, callback);
    };
}

module.exports = GTIN_DSU_Factory;

},{}],"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/gtin-resolver/lib/GTIN_SSI.js":[function(require,module,exports){
const openDSU = require("opendsu");
const keyssiSpace = openDSU.loadApi("keyssi");

function GTIN_SSI(arraySSI) {
    const self = this;
    /*arraySSI.getTypeName = () => {
        return SSITypes.WALLET_SSI;
    };*/

    Object.assign(self, arraySSI);

    // this.getIdentifier = (plain) => {
    //     const pskCrypto = require("pskcrypto");
    //     let identifier = arraySSI.getIdentifier(true);
    //     // identifier = identifier.replace("array", "gtin");
    //     return plain ? identifier : pskCrypto.pskBase58Encode(identifier);
    // }
}

function setOptions(gtinSSI){
    if(typeof gtinSSI.options === "undefined"){
        gtinSSI.options = {};
    }
    gtinSSI.options.dsuFactoryType = "const";
}

function createGTIN_SSI(domain, bricksDomain, gtin, batch, expiration, serialNumber) {
    console.log(`New GTIN_SSI in domain:${domain} and bricksDomain:${bricksDomain}`);
    let hint;
    if (typeof bricksDomain !== "undefined") {
        hint = {};
        hint[openDSU.constants.BRICKS_DOMAIN_KEY] = bricksDomain;
        hint = JSON.stringify(hint);
    }
    let realSSI = keyssiSpace.createArraySSI(domain, [gtin, batch], 'v0', hint);

    return realSSI;
}

function parseGTIN_SSI(ssiIdentifier) {
    /*const pskCrypto = require("pskcrypto");
    ssiIdentifier = pskCrypto.pskBase58Decode(ssiIdentifier).toString();
    ssiIdentifier = ssiIdentifier.replace("gtin", "array");
    ssiIdentifier = pskCrypto.pskBase58Encode(ssiIdentifier).toString();
    let realSSI = keyssiSpace.parse(ssiIdentifier);
    let gtinSSI = new GTIN_SSI(realSSI);
    setOptions(gtinSSI);
    return gtinSSI;*/
    return keyssiSpace.parse(ssiIdentifier);
}

module.exports = {
    createGTIN_SSI,
    parseGTIN_SSI
};
},{"opendsu":false}],"gtin-resolver":[function(require,module,exports){
const openDSU = require("opendsu");
const resolver = openDSU.loadApi("resolver");
const GtinDSUFactory = require("./lib/GTIN_DSU_Factory");

resolver.registerDSUFactory("gtin", new GtinDSUFactory(resolver));
module.exports = require("./lib/GTIN_SSI");

},{"./lib/GTIN_DSU_Factory":"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/gtin-resolver/lib/GTIN_DSU_Factory.js","./lib/GTIN_SSI":"/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/gtin-resolver/lib/GTIN_SSI.js","opendsu":false}]},{},["/Users/incm/Downloads/pharmaledger_box_framework/acdc_final/acdc-workspace/gtin-resolver/builds/tmp/gtinResolver_intermediar.js"])
                    ;(function(global) {
                        global.bundlePaths = {"gtinResolver":"build/bundles/gtinResolver.js"};
                    })(typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
                