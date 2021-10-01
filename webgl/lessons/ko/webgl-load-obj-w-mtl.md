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

To use the textures we need to change the shader.
Let's use them one at a time.
We'll first use the diffuse map.

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

And we get textures!

{{{example url="../webgl-load-obj-w-mtl-w-textures.html"}}}

Looking back in the .MTL file we can see a `map_Ks` which is basically
a black and white texture that specifies how shiny a particular surface
is or another way to think of it is how much of the specular reflection is used.

<div class="webgl_center"><img src="../resources/models/windmill/windmill_001_base_SPEC.jpg" style="width: 512px;"></div>

To use it we just need to update the shader since we're already loading
all the textures.

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

We should also add a default for any material that doesn't have a specular map

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

It would be hard to see what this does with the material settings as they are in the
.MTL file so let's hack the specular settings so they're more pleasing.

```js
// hack the materials so we can see the specular map
Object.values(materials).forEach(m => {
  m.shininess = 25;
  m.specular = [3, 2, 1];
});
```

And with that we can see only the windows and blades are set to show specular highlights.

{{{example url="../webgl-load-obj-w-mtl-w-specular-map.html"}}}

I'm actually surprised the blades are set to reflect. If you look back up at the
.MTL file you'll see shininess `Ns` is set to 0.0 which means the specular highlights
would be extremely blown out. But, also `illum` is specified as 1 for both materials.
According to the docs illum 1 means

```
color = KaIa + Kd { SUM j=1..ls, (N * Lj)Ij }
```

Which translated into something more readable is

```
color = ambientColor * lightAmbient + diffuseColor * sumOfLightCalculations
```

As you can see there nothing about using specular whatsoever and yet the file
has a specular map! ¯\_(ツ)_/¯. Specular highlights require illum 2 or higher.
This is my experience with .OBJ/.MTL files,
that there is always some manual tweaking required for the materials. How you fix
it is up to you. You can edit the .MTL file or you can add code. For now we'll
go the "add code" direction.

The last map this .MTL file uses is a `map_Bump` bump map.
This is another place where the .OBJ/.MTL files show there age.
The file referenced is clearly a normal map, not a bump map.

<div class="webgl_center"><img src="../resources/models/windmill/windmill_001_base_NOR.jpg" style="width: 512px;"></div>

There is no option in the .MTL file to specify normal maps or that bump maps
should be used as normal maps. We could use some heuristic like maybe if the
filename has 'nor' in it? Or, maybe we could just assume all files referenced by
`map_Bump` are normal maps in 2020 and beyond since I'm not sure I've seen an
.OBJ file with an actual bump map in over a decade. Let's go that route for now.

We'll grab the code for generating tangents from [the article on normal mapping](webgl-3d-lighting-normal-mapping.html).

```js
const parts = obj.geometries.map(({material, data}) => {
  ...

+  // generate tangents if we have the data to do so.
+  if (data.texcoord && data.normal) {
+    data.tangent = generateTangents(data.position, data.texcoord);
+  } else {
+    // There are no tangents
+    data.tangent = { value: [1, 0, 0] };
+  }

  // create a buffer for each array by calling
  // gl.createBuffer, gl.bindBuffer, gl.bufferData

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

We also need to add a default normal map for materials that don't have one

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

And then we need to incorporate the shader changes from [the article on normal mapping](webgl-3d-lighting-normal-mapping.html).

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

And we that we get normal maps. Note: I moved the camera closer so they are easier to see.

{{{example url="../webgl-load-obj-w-mtl-w-normal-maps.html"}}}

I'm sure there are way more features of the .MTL file we could try to support.
For example the `refl` keyword specifies reflection maps which is another word
for [environment map](webgl-environment-maps.html). They also show the various
`map_` keywords take a bunch of optional arguments. A few are:

* `-clamp on | off` specifies whether the texture repeats
* `-mm base gain` specifies an offset and multiplier for texture values
* `-o u v w` specifies an offset for texture coordinates. You'd apply those using a texture matrix similar to what we did in [the article on drawImage](webgl-2d-drawimage.html)
* `-s u v w` specifies a scale for texture coordinates. As above you'd put those in a texture matrix

I have no idea how many .MTL files are out there that use those settings or how
far to take it. For example if we add support for `-o` and `-s` do we want
to add that support for every texture under the assumption they might be different
for the diffuseMap vs the normalMap vs the specularMap etc..? That then requires
that we pass in a separate texture matrix for each texture which would then
require either passing a different set of texture coordinates per texture from
the vertex shader to the fragment shader or else doing the texture matrix
multiplication in the fragment shader instead of the traditional way of doing it
in the vertex shader.

A bigger point to take home is that adding support for every feature makes
the shaders bigger and more complicated. Above we have a form of *uber shader*,
a shader that tries to handle all cases. To make it work we passed in various
defaults. For example we set the `diffuseMap` to a white texture so if we
load something without textures it will still display. The diffuse color will
be multiplied by white which is 1.0 so we'll just get the diffuse color.
Similarly we passed in a white default vertex color in case there are no
vertex colors.

This is a common way to get things working and if it works fast enough for your
needs then there is no reason to change it. But, it's more common to generate
shaders that turn these features on/off. If there are no vertex colors then
generate a shader, as in manipulate the shader strings, so they don't have an
`a_color` attribute nor all the related code. Similarly if a material doesn't
have a diffuse map then generate a shader that doesn't have a `uniform sampler2D
diffuseMap` and removes all related code. If it doesn't have any maps then we
don't need texture coordinates so we'd leave those out as well.

When you add up all the combinations there can be 1000s of shader variations.
With just what we have above there is

* diffuseMap yes/no
* specularMap yes/no
* normalMap yes/no
* vertex colors yes/no
* ambientMap yes/no (we didn't support this but .MTL file does)
* reflectionMap yes/no (we didn't support this but the .MTL file does)

Just those represent 64 combinations. If we add in say 1 to 4 lights, and those
lights can be spot, or point, or, directional we end up with 8192 possible
shader feature combinations.

Managing all of that is a lot of work. This is one reason why many people
chose a 3D engine like [three.js](https://threejs.org) instead of doing this
all themselves. But least hopefully this article gives some idea of
the types of things involved in displaying arbitrary 3D content.

<div class="webgl_bottombar">
<h3>Avoid conditionals in shaders where possible</h3>
<p>The traditional advice is to avoid conditionals in shaders. As an example
we could have done something like this</p>
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
<p>Conditionals like that are generally discouraged because depending on the
GPU/driver they are often not very performant.</p>
<p>Either do like we did above and try to make the code have no conditionals. We used
a single 1x1 white pixel texture when there is no texture so our math would work
without a conditional.<p>
<p>Or, use different shaders. One that doesn't have the feature and one the does
and choose the correct one for each situation.</p>
</div>

