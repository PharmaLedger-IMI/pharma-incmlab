import pluqModule from "../../libs/pluq.js";

const {WebcController} = WebCardinal.controllers;
const {PLCameraConfig} = window.Native.Camera;


class AuthFeatureError {
    code = 0;
    message = undefined;

    constructor(error){
        if (typeof error === 'string'){
            this.code = 1;
            this.message = error;
        } else {
            this.code = error.code;
            this.message = error.message;
        }
    }
}


class AuthFeatureResponse  {
    status = false;
    error = undefined;

    constructor(status, error) {
        this.status = status;
        this.error = error ? new AuthFeatureError(error) : undefined;
    }
}


/**
 * https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
 * @param query
 * @returns {*}
 */
const getQueryStringParams = () => {

    const parseQuery = function(query){
        return query.split("?").slice(1).join('?')
    }

    const query = parseQuery(window.frameElement.src);
    return query
        ? (/^[?#]/.test(query) ? query.slice(1) : query)
            .split('&')
            .reduce((params, param) => {
                    let [key, value] = param.split('=');
                    params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
                    return params;
                }, {}
            )
        : {}
};

var pluqConfig = {};
var pluqp = pluqModule();
var pluqInput;
var pluqOutput;

var img_reference;
var img_decomposition;
var decoder;

var mat_image;
var vis_image;


var setPluqApiReady, setPluqApiRejected;
var pluqApi = new Promise(function(resolve, reject){
    setPluqApiReady = resolve;
    setPluqApiRejected = reject;
});


function fillPluqConfig(pluq){
        pluqConfig.decompositionImageSrc =  "assets/resources/masks/pharmaledger_mask_grayscale.png";
        pluqConfig.referenceImageSrc =  "assets/resources/masks/pharmaledger_reference_white.png";
        pluqConfig.validations = new Object;
        // console.log(pluq);
        pluqConfig.validations.enabled = [
            pluq.ValidationTypes.kGraphicCode
            
        ];
        pluqConfig.validations.disabled = [
            pluq.ValidationTypes.kHologramColor,
            pluq.ValidationTypes.kHologramFeatures,
            pluq.ValidationTypes.kGlitter,     
            pluq.ValidationTypes.kQrCode
        ];
}


function setInputValidationStatus(){
    pluqConfig.validations.enabled.forEach(item => pluqInput.EnableValidation(item));
    pluqConfig.validations.disabled.forEach(item => pluqInput.DisableValidation(item));
}


function load_image_to_vis(pluq, image, grayscale=false){
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0 );

    let imageData = context.getImageData(0, 0, image.width, image.height);
    let type = 24;
    let colorspace = pluq.ColorSpace.RGBA;
    
    mat_image.set_mat_from_imagedata(imageData.data, imageData.height, imageData.width, type);

    if (grayscale){
        mat_image.to_grayscale();
        colorspace = pluq.ColorSpace.GRAY;
    }

    vis_image.set_data(mat_image);
    vis_image.set_colorspace(colorspace);
}


function initializePluqApi(pluq){
    fillPluqConfig(pluq);
    img_reference = new Image();
    img_decomposition = new Image();

    mat_image = new pluq.MatJs();
    vis_image = new pluq.VisImage();

    decoder = new pluq.VisualIdentityDecoder();

    img_reference.addEventListener('load', function() {
        load_image_to_vis(pluq, img_reference);
        decoder.set_reference_image(vis_image);

        img_decomposition.src = pluqConfig.decompositionImageSrc;
    }, false);

    img_decomposition.addEventListener('load', function() {
        load_image_to_vis(pluq, img_decomposition, true);
        decoder.set_decomposition_image(vis_image);

        createPluqApi(pluq);
    }, false);

    img_reference.src = pluqConfig.referenceImageSrc;
}

function createPluqApi(pluq){
    // console.log("createPluqApi gc");
    var pluqApi = new pluq.Api();
    pluqApi.set_visual_identity_decoder(decoder.GetReferenceImage(),decoder.GetDecompositionImage());  
    setPluqApiReady(pluqApi);
    mat_image.delete();
    vis_image.delete();
    decoder.delete();
}

function evaluateImage(pluq, plImage, batch_id){
    pluqApi.then((pluqApi) => {
        var channels = 3;
        var type = 16; // 3 channels
        var buf;
    
        // The buffer can be create once when camera is started, and reused for all images,
        // assuming image size is kept constant. For instance, if the image
        // always comes from onFramePreview with the same size
        // The buffer will still need to be destroyed after camera stops.
        buf = pluq._create_buffer(plImage.width, plImage.height, channels);
        pluq.HEAPU8.set(new Uint8Array(plImage.arrayBuffer), buf);
        mat_image.set_mat_from_ptr(buf, plImage.height, plImage.width, type);
        pluq._destroy_buffer(buf);
    
        vis_image.set_data(mat_image)
        vis_image.set_colorspace(pluq.ColorSpace.RGB);
        
        pluqApi.Evaluate(vis_image, batch_id);
        pluqOutput = pluqApi.get_output();
        // console.log(pluqOutput.get_gcode_msg(), pluqOutput.get_qrcode_msg());
    })
}

function startPluqApi(pluq, pluqApi){
    vis_image = new pluq.VisImage();
    mat_image = new pluq.MatJs();
    pluqInput = new pluq.Input();
    setInputValidationStatus();
    pluqApi.Start(pluqInput);
    pluqInput.delete();
}

function stopPluqApi(pluqApi){
    vis_image.delete();
    mat_image.delete();
    pluqApi.Finish();
}

export default class NativeController extends WebcController{
    elements = {};

    _bindElements(){
        // this.elements.flashButton = this.element.querySelector('#flashButton');
        // this.elements.torchLevelRangeLabel = this.element.querySelector('#torchLevelRangeLabel');
        // this.elements.torchRange = this.element.querySelector('#torchLevelRange');
        // this.elements.continuousAFButton = this.element.querySelector("#continuousAFButton");
        this.elements.streamPreview = this.element.querySelector('#streamPreview');
    }

    _bindListeners(){
        // this.elements.torchRange.addEventListener('change', this.setTorchlevel.bind(this));
        // this.elements.continuousAFButton.addEventListener('click', this.toggleContinuousAF.bind(this));
        // this.elements.flashButton.addEventListener('click', this.toggleTorch.bind(this));
    }

    _initializeValues(){
        // this.elements.torchRange.value = "1.0";
        // this.elements.torchLevelRangeLabel.innerHTML = `Torch Level: ${this.elements.torchRange.value}`;
        this.renderer = undefined;
        this.camera = undefined;
        this.scene = undefined;
        this.material = undefined;
        this.previewWidth = 720;
        this.previewHeight = Math.round(this.previewWidth * 16 / 9); // assume 16:9 portrait at start
        this.targetPreviewFPS = 30;
        this.fpsMeasurementInterval = 5;
        this.previewFramesCounter = 0;
        this.previewFramesElapsedSum = 0;
        this.previewFramesMeasuredFPS = 0;
        this.targetRawFPS = 1;

        this.rawCrop_x = undefined;
        this.rawCrop_y = undefined;
        this.rawCrop_w = undefined;
        this.rawCrop_h = undefined;
        this.rawFramesCounter = 0;
        this.rawFramesElapsedSum = 0;
        this.rawFramesMeasuredFPS = 0;
        this.controls = undefined;

        const selected = 'hd1920x1080';

        this.Camera.selectPreset(selected);
        // this.elements.status_test.innerHTML = selected;
        // hardcoded cameras list
        // for (let deviceTypeName of this.Camera.getDeviceTypes())
        //     this.elements.select_cameras.options.add(new Option(deviceTypeName, deviceTypeName));

        // this.elements.select_cameras.selectedIndex = 0;
    }

    // drawTarget(){
    //     console.log("draw TARGET!");

    //     var canvas = document.getElementById("myCanvas");
    //     var ctx = canvas.getContext("2d");
    //     // ctx.lineWidth = 3;
    //     // ctx.strokeStyle = "black"; 
    //     ctx.fillStyle = "black";
    //     ctx.fillRect(canvas.width/2-50, canvas.height/2-70, 100, 200);
    //     ctx.clearRect(canvas.width/2-45, canvas.height/2-65, 90, 190);
    //     console.log(canvas.width, canvas.height);
        
    // }

    constructor(element, history, ...args) {
        super(element, history, ...args);
        const gs1Data = getQueryStringParams();

        // this.drawTarget();

        this.setModel({
            data: '',
            hasCode: false,
            hasError: false,
            nativeSupport: false,
            useScandit: false,
            gs1Data: gs1Data
        });

        this.Camera = window.Native.Camera;
        this.Camera.registerHandlers(
            this.onFramePreview.bind(this),
            // this.onFrameGrabbed.bind(this),
            // this.onPictureTaken.bind(this)

        )
        this._bindElements();
        this._initializeValues();
        this._bindListeners();

        // this.hide(this.elements.rawCropRoiInput);
        // this.hide(this.elements.rawCropCanvas);
        // this.hide(this.elements.rawCropCbCanvas);
        // this.hide(this.elements.rawCropCrCanvas);

        // this.hide(this.elements.canvasgl);
        // this.hide(this.elements.streamPreview);
        // this.hide(this.elements.status_fps_preview);
        // this.hide(this.elements.status_fps_raw);
        
        pluqp.then(pluq => initializePluqApi(pluq));
        this.startCamera('mjpeg');

    }

    async startCamera(mode){
        this.framesCount = 0;
        this.sendToEvaluate = true;

        await pluqApi.then(pluqApi => {
            pluqp.then(pluq => {
                startPluqApi(pluq, pluqApi);
                this.image = new pluq.MatJs();
                this.image_channels = 3;
                this.image_type = 16; // 3 channels
                this.image_height = 1920;
                this.image_width = 1080;
                this.buf = pluq._create_buffer(this.image_width, this.image_height, this.image_channels);

                this.preview_image = new pluq.MatJs();
                this.preview_image_channels = 3;
                this.preview_image_type = 16; // 3 channels
                this.preview_buf = pluq._create_buffer(this.previewWidth, this.previewHeight, this.preview_image_channels);
            })
        });


        let onFramePreviewCallback = undefined;
        let self = this;
        let onCameraInitializedCallback = () => {
            self.elements.streamPreview.src = `${self._serverUrl}/mjpeg`;
        }
        switch(mode){
            case 'gl':
                break;
            default:
                this.usingMJPEG = true;
                // this.elements.continuousAFButton.disabled = true;
                this.show(this.elements.streamPreview);
                this.elements.streamPreview.parentElement.style.display = "block";
                // this.setCropCoords();

                onFramePreviewCallback = this.onFramePreview.bind(this);
        }


        const config = new PLCameraConfig(this.Camera.cameraProps.selectedPresetName,
            this.Camera.cameraProps.flashMode, this.Camera.cameraProps.afOn, true,
            this.Camera.cameraProps.selectedDevicesNames, this.Camera.cameraProps.selectedCamera,
            true, this.Camera.cameraProps.selectedColorspace,
            // parseFloat(this.elements.torchRange.value)
            1.0
            );

        // var onFrameGrabbedBinded = this.onFrameGrabbed.bind(this);
        var onFrameGrabbedBinded = undefined;
        this.Camera.nativeBridge.startNativeCameraWithConfig(
            config,
            onFramePreviewCallback,
            this.targetPreviewFPS,
            this.previewWidth,
            onFrameGrabbedBinded,
            this.targetRawFPS,
            () => {
                this.elements.streamPreview.src = `${this.Camera.cameraProps._serverUrl}/mjpeg`;
            },
            this.rawCrop_x,
            this.rawCrop_y,
            this.rawCrop_w,
            this.rawCrop_h,
            false
            );
    }

    stopCamera(){
        window.close();
        pluqApi.then(pluqApi => stopPluqApi(pluqApi));
        pluqp.then(pluq => {
            this.image.delete();
        })
        this.Camera.closeCameraStream();
        // this.elements.continuousAFButton.disabled = false
    }

    async takePicture(mode){
        await this.Camera.takePicture(mode);
    }

    // toggleTorch(){
    //     const newMode = this.Camera.toggleTorch();
    //     switch (newMode) {
    //         case 'flash':
    //             this.elements.torchRange.disabled = false;
    //             break;
    //         case 'torch':
    //             this.elements.torchRange.disabled = true;
    //             break;
    //         default:
    //             break;
    //     }
    //     this.elements.flashButton.innerHTML = this.Camera.getStatus();
    // }

    // setTorchlevel(){
    //     let level = parseFloat(this.elements.torchRange.value);
    //     if (level === undefined) {
    //         alert('failed to parse torch level value');
    //     } else {
    //         this.Camera.setTorchLevel(level);
    //         this.elements.torchLevelRangeLabel.innerHTML = this.Camera.getStatus();
    //     }
    // }

    // toggleCrop(){
    //     if (this.elements.cropRawFrameCheck.checked) {
    //         this.show(this.elements.rawCropRoiInput);
    //     } else {
    //         this.hide(this.elements.rawCropRoiInput);
    //     }
    // }

    // setCropCoords(){
    //     let rawCrop_x, rawCrop_y, rawCrop_w, rawCrop_h;
     
    //         rawCrop_x = undefined;
    //         rawCrop_y = undefined;
    //         rawCrop_w = undefined;
    //         rawCrop_h = undefined;
    //         this.Camera.cameraProps.cropRawFrameCheck = false;
    //     this.Camera.setCrop(rawCrop_x, rawCrop_y, rawCrop_w, rawCrop_h);
    // }

    // toggleContinuousAF(){
    //     this.Camera.toggleContinuousAF()
    //     this.elements.continuousAFButton.innerHTML = this.Camera.getStatus();
    // }


    hide(element) {
        element.style.display = "none";
    }

    show(element) {
        element.style.display = "block";
    }


    /**
     * @param {PLRgbImage} rgbImage preview data coming from native camera
     * @param {number} elapsedTime time in ms elapsed to get the preview frame
     */
    onFramePreview(rgbImage, elapsedTime) {    
        var self = this;
        let frame = new Uint8Array(rgbImage.arrayBuffer);

        if (rgbImage.width !== this.previewWidth || rgbImage.height !== this.previewHeight) {
            rgbImage.width = this.previewWidth;
            rgbImage.height = this.previewHeight;
        }
        
        if(this.sendToEvaluate){
            pluqp.then( pluq => {
                // var start_timer = performance.now();
                pluq.HEAPU8.set(frame, this.preview_buf);
                this.preview_image.set_mat_from_ptr(this.preview_buf, this.previewHeight, this.previewWidth, this.preview_image_type);
                var qrCodeFound = this.preview_image.search_barcode_test(200, 650, 300, 250);
                if(qrCodeFound){
                    // console.log("QRCode Found: ", qrCodeFound);
                    var raw_frame = self.Camera.nativeBridge.getRawFrame();
                    raw_frame.then( raw_frame => {
                        raw_frame.width = 1080;
                        raw_frame.height = 1920;
                        const batchData = getQueryStringParams();
                        evaluateImage(pluq, raw_frame, batchData.batchNumber);
                        // console.log("BATCH INFO: ",batchData.batchNumber)
                        // console.log("GC MSG: ", pluqOutput.get_gcode_msg());
                        // console.log("QR MSG: ", pluqOutput.get_qrcode_msg());
                        // evaluateImage(pluq, rgbImage);
                        pluqApi.then(pluqApi => {
                            var isevaluating = pluqApi.IsEvaluating();
                            // console.log("Is Evaluating?: ", isevaluating);
                            if (!isevaluating) {
                                this.sendToEvaluate = false;
                                this.stopCamera();
                                // var canvas = document.getElementById("canvas");
                                // var ctx = canvas.getContext("2d");
                                // // ctx.font = "12px Arial";
                                // // ctx.fillText(pluqOutput.get_overall_state().value,0,40);
                                if (pluqOutput.get_overall_state().value == 2) {
                                    console.log("VALID!");

                                    // //ctx.fillText("VALID",40,40);
                                    // var url = 'assets/resources/feedback/valid.png';
                                    // const drawImage = (url) => {
                                    //     const image = new Image();
                                    //     image.src = 'assets/resources/feedback/valid.png';
                                    //     image.onload = () => {
                                    //        ctx.drawImage(image, 0, 0)
                                    //     }
                                    // }
                                    // drawImage(url);

                                    this.report(true, undefined);
                                } else if (pluqOutput.get_overall_state().value == 0) {
                                    console.log("INVALID!");
                                    // //ctx.fillText("INVALID",40,40);
                                    // var url = 'assets/resources/feedback/invalid.png';
                                    // const drawImage = (url) => {
                                    //     const image = new Image();
                                    //     image.src = 'assets/resources/feedback/valid.png';
                                    //     image.onload = () => {
                                    //        ctx.drawImage(image, 0, 0)
                                    //     }
                                    // }
                                    // drawImage(url);
                                    this.report(false, new AuthFeatureError("!"));
                                } else {
                                    console.log("UNKNOWN!");

                                    // //ctx.fillText("UNKWOWN",40,40);
                                    this.report(false, undefined);
                                }
                            }
                            // if (this.framesCount >= 30) {
                            //     this.stopCamera();
                            //     this.report(false, undefined);
                            // }
                        });

                    });
                  
                }
                // var stop_timer = performance.now();
                // console.log("time: ", stop_timer-start_timer);
            });
        };

    }

    report(status, error){
        // console.log("REPORTING!");
        const event = new CustomEvent('ssapp-action', {
            bubbles: true,
            cancelable: true,
            detail: new AuthFeatureResponse(status, error)
        });
        this.element.dispatchEvent(event);
    }

    /**
     * @param {PLRgbImage | PLYCbCrImage} plImage raw data coming from native camera
     * @param {number} elapsedTime time in ms elapsed to get the raw frame
     */    
    onFrameGrabbed(plImage, elapsedTime) {
  
    }

}