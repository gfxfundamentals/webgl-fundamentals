// TODO: move all the wrapper stuff in here?
// There is direct integration with the UI at the moment.
// Need to decide if/how to separate


const webglObjects = new Map();

let defaultVAOInfo;
export function setDefaultVAOInfo(vaoInfo) {
  defaultVAOInfo = vaoInfo;
}

export const getWebGLObjectInfoOrDefaultVAO = v => v ? webglObjects.get(v) : defaultVAOInfo;

export const formatWebGLObject = v => v ? webglObjects.get(v).name : 'null';
export const formatWebGLObjectOrCanvas = v => v ? webglObjects.get(v).name : 'null (canvas)';
export const formatWebGLObjectOrDefaultVAO = v => v ? webglObjects.get(v).name : 'null (default VAO)';
export function getWebGLObjectInfo(webglObject) {
  return webglObjects.get(webglObject);
}
export function addWebGLObjectInfo(webglObject, info) {
  webglObjects.set(webglObject, info);
}

