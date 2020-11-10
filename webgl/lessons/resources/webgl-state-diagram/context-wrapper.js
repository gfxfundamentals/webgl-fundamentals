// TODO: move all the wrapper stuff in here?
// There is direct integration with the UI at the moment.
// Need to decide if/how to separate


const webglObjects = new Map();

let defaultVAOInfo;
export function setDefaultVAOInfo(vaoInfo) {
  defaultVAOInfo = vaoInfo;
}

let defaultTFOInfo;
export function setDefaultTFOInfo(vaoInfo) {
  defaultTFOInfo = vaoInfo;
}

let canvasInfo;
export function setCanvasInfo(_canvasInfo) {
  canvasInfo = _canvasInfo;
}

export const getWebGLObjectInfoOrCanvas = v => v ? webglObjects.get(v) : canvasInfo;
export const getWebGLObjectInfoOrDefaultVAO = v => v ? webglObjects.get(v) : defaultVAOInfo;
export const getWebGLObjectInfoOrDefaultTFO = v => v ? webglObjects.get(v) : defaultTFOInfo;

export const formatWebGLObject = v => v ? webglObjects.get(v).name : 'null';
export const formatWebGLObjectOrCanvas = v => v ? webglObjects.get(v).name : 'null (canvas)';
export const formatWebGLObjectOrDefaultVAO = v => v ? webglObjects.get(v).name : 'null (default VAO)';
export const formatWebGLObjectOrDefaultTFO = v => v ? webglObjects.get(v).name : 'null (default TFO)';
export function getWebGLObjectInfo(webglObject) {
  return webglObjects.get(webglObject);
}
export function addWebGLObjectInfo(webglObject, info) {
  webglObjects.set(webglObject, info);
}

