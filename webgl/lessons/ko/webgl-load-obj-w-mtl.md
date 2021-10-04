Title: WebGL Mtl로 Obj 로딩
Description: .MTL 파일을 파싱하는 방법
TOC: .mtl 파일로 .obj 로딩


[이전 글](webgl-load-obj.html)에서 .OBJ 파일을 파싱했었는데요.
이번 글에서는 이를 보완해주는 .MTL material 파일을 파싱해봅시다.

**유의사항:** 이 .MTL 파서는 완벽하거나 모든 .MTL 파일을 처리하기 위한 게 아닙니다.
그보단 도중에 마주할 수 있는 것을 처리하기 위한 연습입니다.
그러니 큰 문제와 해결 방법이 있는 경우 하단에 댓글로 알려주시면 이 코드를 사용하기로 결정한 사람들에게 도움이 될 수 있습니다.

[Sketchfab](https://sketchfab.com/)에서 찾은 [haytonm](https://sketchfab.com/haytonm)의 [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) [의자](https://sketchfab.com/3d-models/chair-aa2acddb218646a59ece132bf95aa558)를 로드했습니다.

<div class="webgl_center"><img src="../resources/models/chair/chair.jpg" style="width: 452px;"></div>

이에 상응하는 .MTL 파일은 다음과 같습니다.

```
# Blender MTL File: 'None'
# Material Count: 11

newmtl D1blinn1SG
Ns 323.999994
Ka 1.000000 1.000000 1.000000
Kd 0.500000 0.500000 0.500000
Ks 0.500000 0.500000 0.500000
Ke 0.0 0.0 0.0
Ni 1.000000
d 1.000000
illum 2

newmtl D1lambert2SG
Ns 323.999994
Ka 1.000000 1.000000 1.000000
Kd 0.020000 0.020000 0.020000
Ks 0.500000 0.500000 0.500000
Ke 0.0 0.0 0.0
Ni 1.000000
d 1.000000
illum 2

newmtl D1lambert3SG
Ns 323.999994
Ka 1.000000 1.000000 1.000000
Kd 1.000000 1.000000 1.000000
Ks 0.500000 0.500000 0.500000
Ke 0.0 0.0 0.0
Ni 1.000000
d 1.000000
illum 2

...
```

[.MTL 파일 포맷의 설명](http://paulbourke.net/dataformats/mtl/)을 확인해보세요.
키워드 `newmtl`로 새로운 material을 시작하고 아래에 해당 material에 대한 모든 설정이 있는 것을 볼 수 있습니다.
각 라인은 .OBJ 파일과 비슷한 키워드로 시작하므로 유사한 프레임워크로 시작할 수 있습니다.

```js
function parseMTL(text) {
  const materials = {};
  let material;

  const keywords = {
    newmtl(parts, unparsedArgs) {
      material = {};
      materials[unparsedArgs] = material;
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);
      continue;
    }
    handler(parts, unparsedArgs);
  }

  return materials;
}
```

그런 다음 각 키워드에 대한 함수를 추가해야 하는데요.
문서에는 이렇게 적혀있습니다.

* `Ns`는 [점 조명에 대한 글](webgl-3d-lighting-point.html)에서 다룬 반사광 설정입니다.
* `Ka`는 material의 ambient color 입니다.
* `Kd`는 [점 조명에 대한 글](webgl-3d-lighting-point.html)에서 다룬 diffuse color 입니다.
* `Ks`는 specular color 입니다.
* `Ke`는 emissive color 입니다.
* `Ni`는 optical density 입니다. 이건 사용하지 않을 겁니다.
* `d`는 투명도인 "dissolve"를 나타냅니다.
* `illum`은 조명의 종류를 지정합니다. 문서에는 11개의 종류가 나열되어 있습니다. 일단 이건 무시할 겁니다.

이 이름들을 그대로 유지할 것인지 여부를 토론했는데요.
수학자들은 짧은 이름을 좋아하는 것 같습니다.
대부분의 코드 스타일 가이드는 기술적인 이름이 선호되므로 그렇게 하기로 결정했습니다.

```js
function parseMTL(text) {
  const materials = {};
  let material;

  const keywords = {
    newmtl(parts, unparsedArgs) {
      material = {};
      materials[unparsedArgs] = material;
    },
+    Ns(parts)     { material.shininess      = parseFloat(parts[0]); },
+    Ka(parts)     { material.ambient        = parts.map(parseFloat); },
+    Kd(parts)     { material.diffuse        = parts.map(parseFloat); },
+    Ks(parts)     { material.specular       = parts.map(parseFloat); },
+    Ke(parts)     { material.emissive       = parts.map(parseFloat); },
+    Ni(parts)     { material.opticalDensity = parseFloat(parts[0]); },
+    d(parts)      { material.opacity        = parseFloat(parts[0]); },
+    illum(parts)  { material.illum          = parseInt(parts[0]); },
  };

  ...

  return materials;
}
```

또한 각 .MTL 파일에 대한 경로를 추측할지 수동으로 지정할지 여부도 토론했는데요.
다시 말해 이렇게 하거나,

```
// pseudo code - .OBJ 및 .MTL 파일에 대한 경로를 수동으로 지정
const obj = downloadAndParseObj(pathToOBJFile);
const materials = downloadAndParseMtl(pathToMTLFile);
```

이렇게 할 수 있습니다.

```
// pseudo code - .OBJ 파일을 기반으로 .MTL 파일의 경로를 추측
const obj = downloadAndParseObj(pathToOBJFile);
const materials = downloadAndParseMtl(pathToOBJFile, obj);
```

좋은 생각인지 확신할 수는 없지만 저는 후자를 선택했습니다.
문서에 따르면 .OBJ 파일은 여러 .MTL 파일에 대한 참조를 포함할 수 있는데요.
그런 예제는 본 적이 없지만 문서 작성자는 그랬을 것이라 생각합니다.

뿐만 아니라 .OBJ 파일과 이름이 다른 .MTL 파일도 본 적이 없습니다.
다시 말해 .OBJ 파일이 `bananas.obj`일 때 .MTL 파일은 대부분 `bananas.mtl`인 것 같습니다.

스펙에 따르면 .MTL 파일은 .OBJ 파일에서 지정하므로 .MTL 파일의 경로를 산출하기로 결정했습니다.

[이전 글](webgl-load-obj.html)의 코드로 시작하여 .OBJ 파일에 대한 URL을 분리한 다음, .OBJ 파일과 관련된 .MTL 파일의 새로운 URL을 만듭니다.
마지막으로 모든 걸 로드하고, 단순 텍스트 파일이기 때문에 이들을 연결한 다음, 그걸 파서에 전달합니다.

```js
-const response = await fetch('resources/models/chair/chair.obj');
+const objHref = 'resources/models/chair/chair.obj';
+const response = await fetch(objHref);
const text = await response.text();
const obj = parseOBJ(text);
+const baseHref = new URL(objHref, window.location.href);
+const matTexts = await Promise.all(obj.materialLibs.map(async filename => {
+  const matHref = new URL(filename, baseHref).href;
+  const response = await fetch(matHref);
+  return await response.text();
+}));
+const materials = parseMTL(matTexts.join('\n'));
```

이제 materials을 사용해야 합니다.
먼저 parts를 설정할 때 .OBJ 파일에서 가져온 material의 이름을 사용하고, 로드한 materials에서 material을 찾는 데 사용할 겁니다.

```js
-const parts = obj.geometries.map(({data}) => {
+const parts = obj.geometries.map(({material, data}) => {

  ...

  // gl.createBuffer, gl.bindBuffer, gl.bufferData 호출로 각 배열의 버퍼 생성
  const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
  return {
-    material: {
-      u_diffuse: [1, 1, 1, 1],
-    },
+    material: materials[material],
    bufferInfo,
  };
});
```

도우미를 렌더링할 때 2개 이상의 uniform 값 세트를 전달할 수 있습니다.

```js
function render(time) {

  ...

  for (const {bufferInfo, material} of parts) {
    // gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer 호출
    webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
    // gl.uniform 호출
    webglUtils.setUniforms(meshProgramInfo, {
      u_world,
-      u_diffuse: material.u_diffuse,
-    });
+    }, material);
    // gl.drawArrays 혹은 gl.drawElements 호출
    webglUtils.drawBufferInfo(gl, bufferInfo);
  }

  requestAnimationFrame(render);
}
```

그런 다음 셰이더를 수정해야 합니다.
Material에 반사 설정이 있기 때문에, [점 조명에 대한 글](webgl-3d-lighting-point.html)에서 한 가지 차이점을 제외하고 반사 계산을 추가하려고 하는데, 점 조명 대신 방향성 조명에서 반사광을 계산할 겁니다.

`ambient`와 `emissive`는 설명이 필요할 것 같은데요.
`ambient`는 방향이 없는 조명의 material 색상입니다.
이를 `u_ambientLight` 색상으로 곱하고 확인하고 싶다면 조명을 더 어두운 색상으로 설정할 수 있습니다.
This tends to wash thing out.

`emissive`는 모든 조명에서 분리된 material의 색상이므로 추가하기만 하면 됩니다.
`emissive`는 빛나는 영역이 있을 때 사용됩니다.

여기 새로운 셰이더입니다.

```js
const vs = `
attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
+uniform vec3 u_viewWorldPosition;

varying vec3 v_normal;
+varying vec3 v_surfaceToView;
varying vec4 v_color;

void main() {
-  gl_Position = u_projection * u_view * a_position;
+  vec4 worldPosition = u_world * a_position;
+  gl_Position = u_projection * u_view * worldPosition;
+  v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
  v_normal = mat3(u_world) * a_normal;
  v_color = a_color;
}
`;

const fs = `
precision highp float;

varying vec3 v_normal;
+varying vec3 v_surfaceToView;
varying vec4 v_color;

-uniform vec4 u_diffuse;
+uniform vec3 diffuse;
+uniform vec3 ambient;
+uniform vec3 emissive;
+uniform vec3 specular;
+uniform float shininess;
+uniform float opacity;
uniform vec3 u_lightDirection;
+uniform vec3 u_ambientLight;

void main () {
  vec3 normal = normalize(v_normal);

+  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
+  vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
+  float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);

-  vec4 diffuse = u_diffuse * v_color;
+  vec3 effectiveDiffuse = diffuse * v_color.rgb;
+  float effectiveOpacity = opacity * v_color.a;

-  gl_FragColor = vec4(diffuse.rgb * fakeLight, diffuse.a);
+  gl_FragColor = vec4(
+      emissive +
+      ambient * u_ambientLight +
+      effectiveDiffuse * fakeLight +
+      specular * pow(specularLight, shininess),
+      effectiveOpacity);
}
`;
```

그리고 위 이미지와 상당히 유사하게 보이는 무언가를 얻게 됩니다.

{{{example url="../webgl-load-obj-w-mtl-no-textures.html"}}}

텍스처를 참조하는 .MTL을 가진 .OBJ 파일을 로드해봅시다.

[ahedov](https://www.blendswap.com/user/ahedov)의 [CC-BY-NC 3.0 풍차 3D 모델](https://www.blendswap.com/blends/view/69174)을 찾았습니다.

<div class="webgl_center"><img src="../resources/models/windmill/windmill-obj.jpg"></div>

.MTL 파일은 다음과 같습니다.

```
# Blender MTL File: 'windmill_001.blend'
# Material Count: 2

newmtl Material
Ns 0.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.000000 0.000000 0.000000
Ke 0.000000 0.000000 0.000000
Ni 1.000000
d 1.000000
illum 1
map_Kd windmill_001_lopatky_COL.jpg
map_Bump windmill_001_lopatky_NOR.jpg

newmtl windmill
Ns 0.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.000000 0.000000 0.000000
Ke 0.000000 0.000000 0.000000
Ni 1.000000
d 1.000000
illum 1
map_Kd windmill_001_base_COL.jpg
map_Bump windmill_001_base_NOR.jpg
map_Ns windmill_001_base_SPEC.jpg
```

`map_Kd`, `map_Bump`, `map_Ns` 모두 이미지 파일을 지정하는 것을 볼 수 있는데요.
.MTL 파서에 추가해봅시다.

```js
function parseMapArgs(unparsedArgs) {
  // TODO: 옵션 처리
  return unparsedArgs;
}

function parseMTL(text) {
  const materials = {};
  let material;

  const keywords = {
    newmtl(parts, unparsedArgs) {
      material = {};
      materials[unparsedArgs] = material;
    },
    Ns(parts)       { material.shininess      = parseFloat(parts[0]); },
    Ka(parts)       { material.ambient        = parts.map(parseFloat); },
    Kd(parts)       { material.diffuse        = parts.map(parseFloat); },
    Ks(parts)       { material.specular       = parts.map(parseFloat); },
    Ke(parts)       { material.emissive       = parts.map(parseFloat); },
+    map_Kd(parts, unparsedArgs)   { material.diffuseMap = parseMapArgs(unparsedArgs); },
+    map_Ns(parts, unparsedArgs)   { material.specularMap = parseMapArgs(unparsedArgs); },
+    map_Bump(parts, unparsedArgs) { material.normalMap = parseMapArgs(unparsedArgs); },
    Ni(parts)       { material.opticalDensity = parseFloat(parts[0]); },
    d(parts)        { material.opacity        = parseFloat(parts[0]); },
    illum(parts)    { material.illum          = parseInt(parts[0]); },
  };

  ...
```

참고: [스펙](http://paulbourke.net/dataformats/mtl/)에 따르면 이 파일에서 볼 수 없는 추가 옵션들이 많기 때문에 `parseMapArgs`를 만들었습니다.
이를 사용하려면 몇 가지 주요 리팩토링이 필요하지만 지금은 옵션 없이 공백이 있는 파일 이름을 처리하려고 합니다.

이 모든 텍스처를 로딩하기 위해 [텍스처에 대한 글](webgl-3d-textures.html)의 코드를 약간 수정하여 사용할 겁니다.

```js
function create1PixelTexture(gl, pixel) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array(pixel));
  return texture;
}

function createTexture(gl, url) {
  const texture = create1PixelTexture(gl, [128, 192, 255, 255]);
  // 비동기적으로 이미지 로드
  const image = new Image();
  image.src = url;
  image.addEventListener('load', function() {
    // 이제 이미지가 로드되었기 때문에 텍스처로 복사
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

    // 이미지의 두 치수 모두 2의 거듭 제곱인지 확인
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // 2의 거듭 제곱이면 mips 생성
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // 2의 거듭 제곱이 아니면 mips를 비활성화하고 가장 자리에 고정되도록 설정
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  });
  return texture;
}
```

두 material이 같은 이미지를 참조할 수 있으므로 객체의 모든 텍스처를 파일 이름으로 유지하여 두 번 로드되지 않도록 합시다.

```js
const textures = {};

// materials의 텍스처 로드
for (const material of Object.values(materials)) {
  Object.entries(material)
    .filter(([key]) => key.endsWith('Map'))
    .forEach(([key, filename]) => {
      let texture = textures[filename];
      if (!texture) {
        const textureHref = new URL(filename, baseHref).href;
        texture = createTexture(gl, textureHref);
        textures[filename] = texture;
      }
      material[key] = texture;
    });
}
```

위 코드는 각 material의 각 속성을 검토합니다.
속성이 `"Map"`으로 끝난다면 상대 URL을 생성하고, 텍스처를 생성한 다음, 다시 material에 할당합니다.
이미지를 비동기적으로 텍스처에 로드할 겁니다.

또한 텍스처를 참조하지 않아 모든 material에 대해 사용할 수 있는 흰색 픽셀 텍스처 하나를 넣을 겁니다.
이렇게 하면 동일한 셰이더를 사용할 수 있습니다.
그렇지 않은 텍스처가 있는 material과 텍스처가 없는 material에 다른 셰이더가 필요합니다.

```js
-const textures = {};
+const textures = {
+  defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
+};
```

누락된 material 매개 변수에 대한 기본값도 지정해봅시다.

```
+const defaultMaterial = {
+  diffuse: [1, 1, 1],
+  diffuseMap: textures.defaultWhite,
+  ambient: [0, 0, 0],
+  specular: [1, 1, 1],
+  shininess: 400,
+  opacity: 1,
+};

const parts = obj.geometries.map(({material, data}) => {

  ...

  // gl.createBuffer, gl.bindBuffer, gl.bufferData 호출로 각 배열의 버퍼 생성
  const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
  return {
-    material: materials[material],
+    material: {
+      ...defaultMaterial,
+      ...materials[material],
+    },
    bufferInfo,
  };
});
```

텍스처를 사용하기 위해 셰이더를 변경해야 합니다.
한 번에 하나씩 사용해봅시다.
먼저 diffuse map을 사용할 겁니다.

```js
const vs = `
attribute vec4 a_position;
attribute vec3 a_normal;
+attribute vec2 a_texcoord;
attribute vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform vec3 u_viewWorldPosition;

varying vec3 v_normal;
varying vec3 v_surfaceToView;
+varying vec2 v_texcoord;
varying vec4 v_color;

void main() {
  vec4 worldPosition = u_world * a_position;
  gl_Position = u_projection * u_view * worldPosition;
  v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
  v_normal = mat3(u_world) * a_normal;
+  v_texcoord = a_texcoord;
  v_color = a_color;
}
`;

const fs = `#version 300 es
precision highp float;

varying vec3 v_normal;
varying vec3 v_surfaceToView;
+varying vec2 v_texcoord;
varying vec4 v_color;

uniform vec3 diffuse;
+uniform sampler2D diffuseMap;
uniform vec3 ambient;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
uniform vec3 u_lightDirection;
uniform vec3 u_ambientLight;

void main () {
  vec3 normal = normalize(v_normal);

  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
  float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);

-  vec3 effectiveDiffuse = diffuse.rgb * v_color.rgb;
-  float effectiveOpacity = v_color.a * opacity;
+  vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);
+  vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
+  float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;

  gl_FragColor = vec4(
      emissive +
      ambient * u_ambientLight +
      effectiveDiffuse * fakeLight +
      specular * pow(specularLight, shininess),
      effectiveOpacity);
}
`;
```

그리고 텍스처를 얻습니다!

{{{example url="../webgl-load-obj-w-mtl-w-textures.html"}}}

.MTL 파일로 돌아가 보면 특정 표면이 얼마나 빛나는지 혹은 얼마나 정반사가 사용되는지 지정하는 `map_Ks`가 기본적으로 검은색과 흰색으로 이루어진 텍스처임을 알 수 있습니다.

<div class="webgl_center"><img src="../resources/models/windmill/windmill_001_base_SPEC.jpg" style="width: 512px;"></div>

이미 모든 텍스처를 로딩했기 때문에 이를 사용하기 위해 셰이더 업데이트만 하면 됩니다.

```js
const fs = `
precision highp float;

varying vec3 v_normal;
varying vec3 v_surfaceToView;
varying vec2 v_texcoord;
varying vec4 v_color;

uniform vec3 diffuse;
uniform sampler2D diffuseMap;
uniform vec3 ambient;
uniform vec3 emissive;
uniform vec3 specular;
+uniform sampler2D specularMap;
uniform float shininess;
uniform float opacity;
uniform vec3 u_lightDirection;
uniform vec3 u_ambientLight;

void main () {
  vec3 normal = normalize(v_normal);

  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
  float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);
+  vec4 specularMapColor = texture2D(specularMap, v_texcoord);
+  vec3 effectiveSpecular = specular * specularMapColor.rgb;

  vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);
  vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
  float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;

  gl_FragColor = vec4(
      emissive +
      ambient * u_ambientLight +
      effectiveDiffuse * fakeLight +
-      specular * pow(specularLight, shininess),
+      effectiveSpecular * pow(specularLight, shininess),
      effectiveOpacity);
}
`;
```

또한 specular map이 없는 material에 대한 기본값을 추가해야 합니다.

```js
const defaultMaterial = {
  diffuse: [1, 1, 1],
  diffuseMap: textures.defaultWhite,
  ambient: [0, 0, 0],
  specular: [1, 1, 1],
+  specularMap: textures.defaultWhite,
  shininess: 400,
  opacity: 1,
};
```

이게 .MTL 파일 안에 있는 material 설정으로 무엇을 하는지 알기 힘들기 때문에 반사 설정을 해킹하여 더 재미있게 만들어 보겠습니다.

```js
// specular map을 볼 수 있도록 materials 해킹
Object.values(materials).forEach(m => {
  m.shininess = 25;
  m.specular = [3, 2, 1];
});
```

이로써 창문과 날개만 반사 하이라이트를 표시하도록 설정된 것을 알 수 있습니다.

{{{example url="../webgl-load-obj-w-mtl-w-specular-map.html"}}}

실제로 날개가 반사되도록 설정되어 있어 놀랐습니다.
.MTL 파일을 다시 보면 shininess `Ns`가 반사 하이라이트가 극단적으로 꺼진다는 의미인 0.0으로 설정된 것을 볼 수 있습니다.
하지만 `illum`도 materials 모두에 1로 지정되어 있는데요.
문서에 따르면 illum 1은 다음과 같습니다.

```
color = KaIa + Kd { SUM j=1..ls, (N * Lj)Ij }
```

좀 더 읽기 쉽도록 아래와 같이 바꿔봅시다.

```
color = ambientColor * lightAmbient + diffuseColor * sumOfLightCalculations
```

반사 사용에 관해서는 아무것도 안 보이지만 파일에는 specular map이 있습니다!
¯\_(ツ)_/¯.
반사 하이하이트는 2개 이상의 illum이 필요합니다.
.OBJ/.MTL 파일에 관한 제 경험으로, materials에 대해 항상 약간의 수동 조정이 필요합니다.
어떻게 고칠지는 당신에게 달렸습니다.
.MTL 파일을 수정할 수도 있고 코드를 추가할 수도 있습니다.
지금은 "코드 추가"를 하는 방향으로 해보겠습니다.

.MTL 파일이 사용하는 마지막 맵은 `map_Bump` bump map 입니다.
This is another place where the .OBJ/.MTL files show there age.
파일은 분명히 bump map이 아니라 법선 맵을 참조합니다.

<div class="webgl_center"><img src="../resources/models/windmill/windmill_001_base_NOR.jpg" style="width: 512px;"></div>

.MTL 파일에 법선 맵을 지정하거나 bump map을 법선 맵으로 사용할 수 있는 옵션이 없습니다.
대신 파일 이름에 'nor'이 있는지와 같은 휴리스틱한 방법을 사용할 수 있지 않을까요?
또는 10년 넘게 실제 bump map이 포함된 .OBJ을 본 적이 없기 때문에, 2020년 이후의 `map_Bump`을 참조하는 모든 파일을 법선 맵으로 가정할 수도 있습니다.
일단 그렇게 해봅시다.

[법선 매핑에 관한 글](webgl-3d-lighting-normal-mapping.html)에서 접선 생성 코드를 가져옵니다.

```js
const parts = obj.geometries.map(({material, data}) => {
  ...

+  // 데이터가 있다면 접선 생성
+  if (data.texcoord && data.normal) {
+    data.tangent = generateTangents(data.position, data.texcoord);
+  } else {
+    // 접선 없음
+    data.tangent = { value: [1, 0, 0] };
+  }

  // gl.createBuffer, gl.bindBuffer, gl.bufferData을 호출하여 각 배열에 대한 버퍼 생성

  const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
  const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);
  return {
    material: {
      ...defaultMaterial,
      ...materials[material],
    },
    bufferInfo,
    vao,
  };
});
```

또한 법선 맵이 없는 materials에 대한 기본 법선 맵을 추가해야 합니다.

```js
const textures = {
  defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
+  defaultNormal: create1PixelTexture(gl, [127, 127, 255, 0]),
};

...

const defaultMaterial = {
  diffuse: [1, 1, 1],
  diffuseMap: textures.defaultWhite,
+  normalMap: textures.defaultNormal,
  ambient: [0, 0, 0],
  specular: [1, 1, 1],
  specularMap: textures.defaultWhite,
  shininess: 400,
  opacity: 1,
};
...

```

그런 다음 [법선 매핑에 대한 글](webgl-3d-lighting-normal-mapping.html)의 셰이더 변경 사항을 통합해야 합니다.

```js
const vs = `
attribute vec4 a_position;
attribute vec3 a_normal;
+attribute vec3 a_tangent;
attribute vec2 a_texcoord;
attribute vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform vec3 u_viewWorldPosition;

varying vec3 v_normal;
+varying vec3 v_tangent;
varying vec3 v_surfaceToView;
varying vec2 v_texcoord;
varying vec4 v_color;

void main() {
  vec4 worldPosition = u_world * a_position;
  gl_Position = u_projection * u_view * worldPosition;
  v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;

-  v_normal = mat3(u_world) * a_normal;
+  mat3 normalMat = mat3(u_world);
+  v_normal = normalize(normalMat * a_normal);
+  v_tangent = normalize(normalMat * a_tangent);

  v_texcoord = a_texcoord;
  v_color = a_color;
}
`;

const fs = `
precision highp float;

varying vec3 v_normal;
+varying vec3 v_tangent;
varying vec3 v_surfaceToView;
varying vec2 v_texcoord;
varying vec4 v_color;

uniform vec3 diffuse;
uniform sampler2D diffuseMap;
uniform vec3 ambient;
uniform vec3 emissive;
uniform vec3 specular;
uniform sampler2D specularMap;
uniform float shininess;
uniform sampler2D normalMap;
uniform float opacity;
uniform vec3 u_lightDirection;
uniform vec3 u_ambientLight;

void main () {
  vec3 normal = normalize(v_normal);
+  vec3 tangent = normalize(v_tangent);
+  vec3 bitangent = normalize(cross(normal, tangent));
+
+  mat3 tbn = mat3(tangent, bitangent, normal);
+  normal = texture2D(normalMap, v_texcoord).rgb * 2. - 1.;
+  normal = normalize(tbn * normal);

  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
  float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);
  vec4 specularMapColor = texture2D(specularMap, v_texcoord);
  vec3 effectiveSpecular = specular * specularMapColor.rgb;

  vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);
  vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
  float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;

  gl_FragColor = vec4(
      emissive +
      ambient * u_ambientLight +
      effectiveDiffuse * fakeLight +
      effectiveSpecular * pow(specularLight, shininess),
      effectiveOpacity);// * 0.0 + vec4(normal * 0.5 + 0.5 + effectiveSpecular * pow(specularLight, shininess), 1);
}
`;
```

그리고 법선 맵을 얻게 됩니다.
참고: 보기 쉽도록 카메라를 가까이 옮겼습니다.

{{{example url="../webgl-load-obj-w-mtl-w-normal-maps.html"}}}

지원할 수 있는 .MTL 파일의 기능이 훨씬 더 많다고 확신합니다.
예를 들어 `refl` 키워드는 [환경 맵](webgl-environment-maps.html)의 또 다른 말인 반사 맵을 지정합니다.
또한 여러 선택적 매개 변수를 가지는 다양한 `map_` 키워드도 있습니다.

* `-clamp on | off`는 텍스처 반복 여부를 지정합니다.
* `-mm base gain`은 텍스처 값에 대한 오프셋과 승수를 지정합니다.
* `-o u v w`는 텍스처 좌표에 대한 오프셋을 지정합니다. [drawImage에 대한 글](webgl-2d-drawimage.html)에서 한 것과 유사한 텍스처 행렬을 사용하여 적용할 겁니다.
* `-s u v w`는 텍스처 좌표에 대한 scale을 지정합니다. 위처럼 텍스처 행렬에 넣게 됩니다.

이 설정들을 사용하는 .MTL 파일이 얼마나 많은지 혹은 얼마나 걸릴지 모릅니다.
예를 들어 `-o`와 `-s`에 대한 지원을 추가한다면 diffuseMap vs the normalMap vs specularMap 등이 다를 수 있다는 가정 하에 모든 텍스처에 대한 지원을 추가할까요..?
각 텍스처에 대한 별도의 텍스처 행렬을 전달해야 하는데, vertex shader에서 fragment shader로 텍스처마다 다른 텍스처 좌표 세트를 전달하거나, vertex shader에서 수행하는 전통적인 방법 대신에 fragment shader에서 텍스처 행렬 곱셈을 수행해야 합니다.

한 가지 더 알아야 할 요점은 모든 기능에 대한 지원 추가가 셰이더를 더 크고 더 복잡하게 만든다는 겁니다.
위에는 모든 경우를 처리하려는 셰이더인 *uber shader* 형식이 있습니다.
이를 작동하게 만들기 위해서는 다양한 기본값을 전달해야 합니다.
예를 들어 `diffuseMap`을 흰 텍스처로 설정했기 때문에 텍스처 없이 무언가를 로딩해도 여전히 표시됩니다.
Diffuse color는 1.0인 흰색으로 곱해지므로 diffuse color만 얻습니다.
마찬가지로 정점 색상이 없는 경우에 흰색을 기본 정점 색상으로 전달했습니다.

이게 작업을 수행하는 일반적인 방법이고 필요한만큼 충분히 빠르게 작동한다면 바꿀 필요가 없습니다.
하지만 이러한 기능들을 켜고 끄는 셰이더를 생성하는 것이 더 일반적입니다.
정점 색상이 없다면 셰이더 문자열을 조작하듯이 셰이더를 생성하여, `a_color` 속성이나 관련한 모든 코드가 없도록 합니다.

마찬가지로 material이 diffuse map을 가지지 않는다면 `uniform sampler2D diffuseMap`이 없는 셰이더를 생성하고 관련한 모든 코드를 제거합니다.
어떤 맵도 없다면 텍스처 좌표가 필요없기 때문에 생략합니다.

모든 조합을 추가하면 1000가지의 셰이더 변형이 있을 수 있습니다.
위에 있는 것만 해도 아래와 같은데요.

* diffuseMap 예/아니오
* specularMap 예/아니오
* normalMap 예/아니오
* 정점 색상 예/아니오
* ambientMap 예/아니오 (우리는 이걸 지원하지 않았지만 .MTL 파일은 지원)
* reflectionMap 예/아니오 (우리는 이걸 지원하지 않았지만 .MTL 파일은 지원)

이것들만 해도 64가지 조합이 나옵니다.
스포트, 점, 방향성일 수 있는 조명을 1개에서 4개로 추가하면 8192개의 가능한 셰이더 기능 조합이 생깁니다.

이 모든 걸 관리하는 것은 너무 많은 작업입니다.
이게 많은 사람들이 직접 작업하는 대신에 [three.js](https://threejs.org)와 같은 3D 엔진을 선택하는 이유입니다.
하지만 적어도 이 글이 임의의 3D 컨텐츠를 표시하는 것과 관련된 유형에 대한 아이디어를 드렸기를 바랍니다.

<div class="webgl_bottombar">
<h3>가능하다면 셰이더에서 조건문 피하기</h3>
<p>
전통적인 조언은 셰이더에서 조건문을 피해라 입니다.
한 가지 예시로 이렇게 할 수 있었습니다.
</p>
<pre class="prettyprint"><code>
uniform bool hasDiffuseMap;
uniform vec4 diffuse;
uniform sampler2D diffuseMap

...
  vec4 effectiveDiffuse = diffuse;
  if (hasDiffuseMap) {
    effectiveDiffuse *= texture2D(diffuseMap, texcoord);
  }
...
</code></pre>
<p>이와 같은 조건문은 GPU/드라이버에 따라 종종 성능이 매우 좋지 않기 때문에 일반적으로 권장되지 않습니다.</p>
<p>
위에서 했던 것처럼 조건문이 없도록 만들어 보세요.
텍스처가 없을 때 1x1 흰색 픽셀 텍스처를 사용했기 때문에 수식은 조건문 없이 작동할 겁니다.
<p>
<p>
아니면 다른 셰이더를 사용하세요.
기능이 없는 것 하나와 있는 것 하나를 두고 각 상황마다 알맞은 걸 고르는 겁니다.
</p>
</div>

