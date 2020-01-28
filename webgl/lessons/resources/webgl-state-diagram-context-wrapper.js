/* eslint no-undef: "error" */

const webglObjects = new Map();
export const formatWebGLObject = v => v ? webglObjects.get(v).name : 'null';
export const formatWebGLObjectOrDefaultVAO = v => v ? webglObjects.get(v).name : 'null (default VAO)';
export function getWebGLObjectInfo(webglObject) {
  return webglObjects.get(webglObject);
}
export function addWebGLObjectInfo(webglObject, info) {
  webglObjects.set(webglObject, info);
}

