Title: WebGL 그림자
Description: 그림자를 계산하는 방법
TOC: 그림자

그림자를 그려봅시다!

## 사전지식

기본적인 그림자를 계산하는 것은 *그렇게까지* 어렵지는 않지만 
많은 배경지식을 필요로 합니다. 이 글을 이해하기 위해서는 
아래 내용에 대해 알고 계셔야 합니다.

* [직교 투영](webgl-3d-orthographic.html)
* [원근 투영](webgl-3d-perspective.html)
* [스포트라이트 효과](webgl-3d-lighting-spot.html)
* [텍스처](webgl-3d-textures.html)
* [텍스처에 렌더링하기](webgl-render-to-texture.html)
* [투영 맵핑](webgl-planar-projection-mapping.html)
* [카메라를 가시화하기](webgl-visualizing-the-camera.html)

그러니 위 글들을 아직 읽지 않으셨다면 먼저 읽고 오십시오.

무엇보다, 이 글은 여러분이 [더 적은 코드로 즐겁게](webgl-less-code-more-fun.html)를 이미 읽으셨다고 가정하고 있습니다.
이 글의 예제에서는 그 라이브러리를 사용해서 코드를 단순화 하고 있습니다.
여러분이 버퍼, vertex array와 attribute가 뭔지 모르겠다거나 
`webglUtils.setUniforms`같은 코드를 봤는데 uniform을 set한다는게 무슨 뜻인지 모르시겠다면, 더 앞으로 돌아가서 [기초 부분부터 읽고 오십시오](webgl-fundamentals.html).

우선 그림자를 그리는 데는 여러가지 방법이 있습니다.
각 방법들은 장단점을 가지고 있습니다. 가장 흔히 사용되는 방법은
쉐도우 맵(shadow map)을 사용해서 그림자를 그리는 것입니다.

쉐도우 맵은 사전지식에서 언급한 모든 기술을 사용하여 동작합니다.

[투영 맵핑과 관련된 글](webgl-planar-projection-mapping.html)에서 이미지를 물체게 투영하는 방법을 알아 보았습니다.

{{{example url="../webgl-planar-projection-with-projection-matrix.html"}}}

이미지는 장면에 있는 물체에 직접 그려진 것이 아니라, 물체가 렌더링 될 때 
각 픽셀에 대해 투영된 텍스처 범위 내에 있는지를 확인하고 범위 내에 있다면 
투영된 텍스처로부터 적절한 색상을 샘플링하는 방식이었습니다.
범위 밖이라면 물체에 맵핑된 다른 텍스처로부터 텍스처 좌표를 기반으로 색상을 
샘플링하였습니다.

만일 투영된 텍스처가 조명의 시점에서 얻어진 깊이 데이터라면 어떻게 될까요?
다시말해, 위 예제에서 조명이 절두체의 끝부분에 존재하는 것처럼 가정하고 
투영된 텍스처가 그 조명 위치에서의 깊이값을 가지고 있는겁니다.
그러면 구는 조명에 가까운 깊이값을 가질거고 평면은 더 먼 깊이값을 가질겁니다.

<div class="webgl_center"><img class="noinvertdark" src="resources/depth-map-generation.svg" style="width: 600px;"></div>

그런 데이터를 확보할 수 있다면 렌더링할 색상을 결정할 때 투영된 텍스처로부터 
깊이값을 얻어올 수 있고, 그리려는 픽셀이 그 깊이값보다 조명과 더 먼지 
더 가까운지 알 수 있습니다.
만일 더 멀다면 다른 더 조명과 가까운 물체가 있다는 뜻입니다. 다시말해, 
무언가가 조명을 가리고 있어서 픽셀이 그림자 영역에 있다는 겁니다.

<div class="webgl_center"><img class="noinvertdark" src="resources/projected-depth-texture.svg" style="width: 600px;"></div>

보시면 깊이 텍스처가 조명 시점에서의 절두체 조명 공간을 통해 투영되고 있습니다.
우리가 바닥면 픽셀을 그릴 때 그 픽셀의 조명으로부터의 깊이를 계산합니다. (위 그림에서 0.3)
그리고 나서 깊이맵 텍스처에서는 이와 대응하는 깊이값을 찾아봅니다.
조명 시점에서 텍스처에 저장된 깊이값은 0.1인데, 구가 있기 때문입니다.
0.1 &lt; 0.3이므로 그 바닥면 픽셀은 그림자 범위에 있다는 것을 알 수 있습니다.

First let's draw the shadow map.
We'll take the last example from [the article on planar projection mapping](webgl-planar-projection-mapping.html) but instead of loading a texture we'll [render to a texture](webgl-render-to-texture.html).
In [that article](webgl-render-to-texture.html) we used a depth renderbuffer.
That gave us a depth buffer for helping to sort pixels but we can't use a depth renderbuffer as a texture.
Fortunately there is an optional WebGL extension called `WEBGL_depth_texture` we can try to enable that will give us depth textures.
With a depth texture we can attach it to a framebuffer and then later use the texture as input to a shader.
The code to check for and enable the extension is:

```js
function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

+  const ext = gl.getExtension('WEBGL_depth_texture');
+  if (!ext) {
+    return alert('need WEBGL_depth_texture');
+  }
```

Now, similarly to the  [article on rendering to a texture](webgl-render-to-texture.html) we create a texture then a framebuffer and a attach the texture to the framebuffer as a `DEPTH_ATTACHMENT`. 

```js
const depthTexture = gl.createTexture();
const depthTextureSize = 512;
gl.bindTexture(gl.TEXTURE_2D, depthTexture);
gl.texImage2D(
    gl.TEXTURE_2D,      // target
    0,                  // mip level
    gl.DEPTH_COMPONENT, // internal format
    depthTextureSize,   // width
    depthTextureSize,   // height
    0,                  // border
    gl.DEPTH_COMPONENT, // format
    gl.UNSIGNED_INT,    // type
    null);              // data
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

const depthFramebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
gl.framebufferTexture2D(
    gl.FRAMEBUFFER,       // target
    gl.DEPTH_ATTACHMENT,  // attachment point
    gl.TEXTURE_2D,        // texture target
    depthTexture,         // texture
    0);                   // mip level
```

[For a bunch of reasons](#attachment-combinations) we also need to create
a color texture and attach it as a color attachment even though we won't
actually use it.

```js
// create a color texture of the same size as the depth texture
const unusedTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, unusedTexture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    depthTextureSize,
    depthTextureSize,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// attach it to the framebuffer
gl.framebufferTexture2D(
    gl.FRAMEBUFFER,        // target
    gl.COLOR_ATTACHMENT0,  // attachment point
    gl.TEXTURE_2D,         // texture target
    unusedTexture,         // texture
    0);                    // mip level
```

이를 사용하기 위해서는 서로다른 셰이더를 사용해서 장면을 두번 이상 그릴 수 있어야 합니다.
한 번은 깊이 텍스처로 렌더링하기위한 간단한 셰이더를 사용해서, 
한 번은 텍스처를 투영하는 현재 셰이더를 사용해서 그릴겁니다.

먼저 `drawScene`을 수정해서 우리가 렌더링을 수행하려는 프로그램을 전달할 수 있도록 합시다.

```js
-function drawScene(projectionMatrix, cameraMatrix, textureMatrix) {
+function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {
  // 카메라 행렬로 뷰 행렬을 만듭니다.
  const viewMatrix = m4.inverse(cameraMatrix);

-  gl.useProgram(textureProgramInfo.program);
+  gl.useProgram(programInfo.program);

  // 구와 평면에 모두 사용되는 uniform을 설정합니다.
  // 주의: 셰이더에 대응되는 uniform이 없는경우 무시됩니다.
-  webglUtils.setUniforms(textureProgramInfo, {
+  webglUtils.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
*    u_textureMatrix: textureMatrix,
-    u_projectedTexture: imageTexture,
+    u_projectedTexture: depthTexture,
  });

  // ------ 구를 그립니다. --------

  // attribute 설정
-  webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, sphereBufferInfo);
+  webglUtils.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);

  // 구에 필요한 uniforms 설정
-  webglUtils.setUniforms(textureProgramInfo, sphereUniforms);
+  webglUtils.setUniforms(programInfo, sphereUniforms);

  // gl.drawArrays 또는 gl.drawElements 호출
  webglUtils.drawBufferInfo(gl, sphereBufferInfo);

  // ------ 평면을 그립니다. --------

  // attribute 설정
-  webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, planeBufferInfo);
+  webglUtils.setBuffersAndAttributes(gl, programInfo, planeBufferInfo);

  // 위에서 계산한 uniforms 설정
-  webglUtils.setUniforms(textureProgramInfo, planeUniforms);
+  webglUtils.setUniforms(programInfo, planeUniforms);

  // gl.drawArrays 또는 gl.drawElements 호출
  webglUtils.drawBufferInfo(gl, planeBufferInfo);
}
```

이제 `drawScene`을 활용해 장면을 조명 시점에서 그리고, 그 후에 깊이 텍스처를 사용해 그립니다.

```js
function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // 조명 시점에서 먼저 그립니다.
-  const textureWorldMatrix = m4.lookAt(
+  const lightWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // target
      [0, 1, 0],                                              // up
  );
-  const textureProjectionMatrix = settings.perspective
+  const lightProjectionMatrix = settings.perspective
      ? m4.perspective(
          degToRad(settings.fieldOfView),
          settings.projWidth / settings.projHeight,
          0.5,  // near
          10)   // far
      : m4.orthographic(
          -settings.projWidth / 2,   // left
           settings.projWidth / 2,   // right
          -settings.projHeight / 2,  // bottom
           settings.projHeight / 2,  // top
           0.5,                      // near
           10);                      // far

+  // 깊이 텍스처에 그립니다.
+  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
+  gl.viewport(0, 0, depthTextureSize, depthTextureSize);
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

-  drawScene(textureProjectionMatrix, textureWorldMatrix, m4.identity());
+  drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgramInfo);

+  // 이제는 캔버스에 그리는데, 깊이 텍스처를 씬에 투영해서 그립니다.
+  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let textureMatrix = m4.identity();
  textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
  textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
-  textureMatrix = m4.multiply(textureMatrix, textureProjectionMatrix);
+  textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
  // 월드 행렬의 역행렬을 사용합니다.
  // 이렇게 하면 다른 위치값들이 이 월드 공간에 상대적인 값이 됩니다.
  textureMatrix = m4.multiply(
      textureMatrix,
-      m4.inverse(textureWorldMatrix));
+      m4.inverse(lightWorldMatrix));

  // 투영 행렬 계산
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  // lookAt을 사용한 카메라 행렬 계산
  const cameraPosition = [settings.cameraX, settings.cameraY, 7];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

-  drawScene(projectionMatrix, cameraMatrix, textureMatrix); 
+  drawScene(projectionMatrix, cameraMatrix, textureMatrix, textureProgramInfo); 
}
```

`textureWorldMatrix`를 `lightWorldMatrix`로, `textureProjectionMatrix`를 `lightProjectionMatrix`로 이름을 바꾼 것에 유의하세요.
전에는 텍스처를 임의의 공간으로 투영했지만 지금은 쉐도우 맵을 조명에서부터 투영하고 있습니다. 계산 방법은 같지만 변수 이름을 바꾸는 것이 적절해 보입니다.

먼저 구와 평면을 절두체 라인을 그리기 위해 만든 색상 셰이더를 사용해 깊이 텍스처에 렌더링 했습니다. 
이 셰이더는 단색을 그리는 셰이더이고 특별히 다른 계산을 하고 있지 않은데 
깊이 텍스처를 렌더링하는데는 이것이면 충분합니다.

이후에 장면을 캔버스에 다시 그리는데 전과 동일하게 텍스처를 장면에 투영해서 그립니다.
셰이더에서 깊이 텍스처를 참조할 때 red값만 유효하기 때문에 
red, gree, blue에 대해 같은 값을 반복하여 할당합니다.

```glsl
void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

-  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
+  // 'r'채널에 깊이값이 저장되어 있습니다.
+  vec4 projectedTexColor = vec4(texture2D(u_projectedTexture, projectedTexcoord.xy).rrr, 1);
  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  float projectedAmount = inRange ? 1.0 : 0.0;
  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
}
```

이제 장면에 육면체를 추가해 봅시다.

```js
+const cubeBufferInfo = primitives.createCubeBufferInfo(
+    gl,
+    2,  // size
+);

...

+const cubeUniforms = {
+  u_colorMult: [0.5, 1, 0.5, 1],  // light green
+  u_color: [0, 0, 1, 1],
+  u_texture: checkerboardTexture,
+  u_world: m4.translation(3, 1, 0),
+};

...

function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {

    ...

+    // ------ 육면체를 그립니다. --------
+
+    // 필요한 attribute들을 설정합니다.
+    webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);
+
+    // 방금 계산한 uniform을 입력합니다.
+    webglUtils.setUniforms(programInfo, cubeUniforms);
+
+    // gl.drawArrays 또는 gl.drawElements를 호출합니다.
+    webglUtils.drawBufferInfo(gl, cubeBufferInfo);

...
```

세팅을 조금 바꿔 보죠. 카메라를 약간 이동하고 시야각(field of view)을 넓혀서 
투영되는 텍스처가 더 많은 부분을 덮도록 해 봅시다.

```js
const settings = {
-  cameraX: 2.5,
+  cameraX: 6,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
  perspective: true,
-  fieldOfView: 45,
+  fieldOfView: 120,
};
```

주의: 절두체를 보여주기 위해 라인을 그리는 코드는 `drawScene` 함수 밖으로 옮겼습니다.

{{{example url="../webgl-shadows-depth-texture.html"}}}

이미지를 로딩하는 대신 장면을 깊이 텍스처에 렌러딩한 결과를 
사용한다는 것만 제외하면 위쪽의 예제와 완전히 동일합니다.
`cameraX`를 2.5로 `fieldOfView`를 45로 바꾸면 위쪽과 동일한 결과를 볼 수 있습니다.
로딩된 이미지 대신 우리의 깊이 텍스처가 투영되고 있다는 점만 제외하면요.

깊이값은 0.0에서 1.0사이의 값인데 절두체 내에서의 위치를 나타냅니다.
그러니 0.0(어두움)은 절두체의 뾰족한 점에 가깝고 1.0(밝음)은 반대쪽 끝에 가깝습니다.

이제 남은 것은 투영된 텍스처 색상과 텍스처 맵핑 색상 사이의 선택을 하는 것이 아니라, 
깊이 텍스처의 깊이값으로부터 얻은 Z값을 사용해 그 값이 우리가 그리려는 픽셀에서 
카메라까지의 거리보다 더 먼지 가까운지를 알아내는데 사용하는 것입니다.
깊이 텍스처의 값이 더 가까우면 무언가가 빛을 가리고 있는 것이고, 따라서 그 픽셀은 
그림자 영역 안에 있습니다.

```glsl
void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
+  float currentDepth = projectedTexcoord.z;

  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

-  vec4 projectedTexColor = vec4(texture2D(u_projectedTexture, projectedTexcoord.xy).rrr, 1);
+  float projectedDepth = texture2D(u_projectedTexture, projectedTexcoord.xy).r;
+  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;  

  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
-  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
+  gl_FragColor = vec4(texColor.rgb * shadowLight, texColor.a);
}
```

위에서 `projectedDepth`가 `currentDepth`보다 작으면 조명의 시점에서 
더 가까운 물체가 있는 것이므로 그리려는 픽셀이 그림자 영역 안에 있는 것입니다.

실행해 보면 그림자가 나타납니다.

{{{example url="../webgl-shadows-basic.html" }}}

구의 그림자가 바닥면에 나타나는 것을 보니 되는 것 같기는 한데, 
그림자가 없어야 하는 곳에 나타나는 이상한 패턴을 뭘까요?
이 패턴은 *그림자 여드름(shadow acne)*이라고 합니다.
깊이 텍스처에 저장된 깊이 데이터가 양자화(quantize)되기 때문입니다.
이는 텍스처 자체가 픽셀의 그리드이기 때문이기도 하고, 
조명의 시점으로 투영되어 생성되었으나 그 값을 카메라 시점에서 비교하고 있기 때문이기도 합니다. 
다시말해 깊이맵 격자의 값들이 카메라와 정렬되지 않아서 `currentDepth`를 
계산할 때 `projectedDepth`보다 약간 작거나 큰 경우가 생기기 때문입니다.

바이어스(bias)를 더해 봅시다.

```glsl
...

+uniform float u_bias;

void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
-  float currentDepth = projectedTexcoord.z;
+  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  float projectedDepth = texture2D(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;  

  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  gl_FragColor = vec4(texColor.rgb * shadowLight, texColor.a);
}
```

값을 설정해 줍니다.

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
  perspective: true,
  fieldOfView: 120,
+  bias: -0.006,
};

...

function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo, /**/u_lightWorldMatrix) {
  // 카메라 행렬로 뷰 행렬을 만듭니다.
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(programInfo.program);

  // 구와 평면에 모두 사용되는 uniform을 설정합니다.
  // 주의: 셰이더에 대응되는 uniform이 없는경우 무시됩니다.
  webglUtils.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
+    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
  });

  ...
```

{{{example url="../webgl-shadows-basic-w-bias.html"}}}

바이어스 값을 바꿔보면 패턴이 나타나는 위치와 시점에 영향을 주는 것을 알 수 있습니다.

코드를 완성하기 위해 [스포트라이트 효과](webgl-3d-lighting-spot.html)의 
스포트라이트 계산 코드를 추가하도록 하겠습니다.

먼저 [이 글](webgl-3d-lighting-spot.html)의 정점 셰이더에서 
필요한 부분을 가져다 붙입시다.

```glsl
attribute vec4 a_position;
attribute vec2 a_texcoord;
+attribute vec3 a_normal;

+uniform vec3 u_lightWorldPosition;
+uniform vec3 u_viewWorldPosition;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;
+varying vec3 v_normal;

+varying vec3 v_surfaceToLight;
+varying vec3 v_surfaceToView;

void main() {
  // 위치와 행렬을 곱합니다.
  vec4 worldPosition = u_world * a_position;

  gl_Position = u_projection * u_view * worldPosition;

  // 프래그먼트 셰이더로 텍스처 좌표를 전달합니다.
  v_texcoord = a_texcoord;

  v_projectedTexcoord = u_textureMatrix * worldPosition;

+  // 법선을 조정하여 프래그먼트 셰이더로 전달합니다.
+  v_normal = mat3(u_world) * a_normal;
+
+  // 표면의 월드공간 위치를 계산합니다.
+  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
+
+  // 표면에서 조명을 향하는 벡터를 계산하고
+  // 프래그먼트 셰이더로 전달합니다.
+  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
+
+  // 표면에서 뷰/카메라를 향하는 벡터를 계산하고
+  // 프래그먼트 셰이더로 전달합니다.
+  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}
```

프래그먼트 셰이더는

```glsl
precision mediump float;

// 정점 셰이더에서 전달된 값
varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;
+varying vec3 v_normal;
+varying vec3 v_surfaceToLight;
+varying vec3 v_surfaceToView;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform float u_bias;
+uniform float u_shininess;
+uniform vec3 u_lightDirection;
+uniform float u_innerLimit;          // 내적 공간에서의 값
+uniform float u_outerLimit;          // 내적 공간에서의 값

void main() {
+  // v_normal은 varying 이기 때문에 보간되고, 
+  // 단위 벡터가 아닐 수 있습니다. 정규화를 해서
+  // 다시 단위 벡터로 만들어줍니다.
+  vec3 normal = normalize(v_normal);
+
+  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
+  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
+  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
+
+  float dotFromDirection = dot(surfaceToLightDirection,
+                               -u_lightDirection);
+  float limitRange = u_innerLimit - u_outerLimit;
+  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
+  float light = inLight * dot(normal, surfaceToLightDirection);
+  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  // 'r'채널에 깊이값이 저장되어 있습니다.
  float projectedDepth = texture2D(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
-  gl_FragColor = vec4(texColor.rgb * shadowLight, texColor.a);
+  gl_FragColor = vec4(
+      texColor.rgb * light * shadowLight +
+      specular * shadowLight,
+      texColor.a);
}
```

`shadowLight`를 `light`와 `specular` 효과의 양을 조절하기 위해 사용한 것에 주목하세요. 
물체가 그림자 영역에 있다면 빛이 들지 않는것입니다.

이제 uniform들을 설정해 주기만 하면 됩니다.

```js
-function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {
+function drawScene(
+    projectionMatrix,
+    cameraMatrix,
+    textureMatrix,
+    lightWorldMatrix,
+    programInfo) {
  // 카메라 행렬로부터 뷰 행렬을 만듭니다.
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(programInfo.program);

  // 구와 평면에 모두 사용되는 uniform을 설정합니다.
  // 주의: 셰이더에 대응되는 uniform이 없는경우 무시됩니다.
  webglUtils.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
+    u_shininess: 150,
+    u_innerLimit: Math.cos(degToRad(settings.fieldOfView / 2 - 10)),
+    u_outerLimit: Math.cos(degToRad(settings.fieldOfView / 2)),
+    u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
+    u_lightWorldPosition: lightWorldMatrix.slice(12, 15),
+    u_viewWorldPosition: cameraMatrix.slice(12, 15),
  });

...

function render() {
  ...

-  drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgramInfo);
+  drawScene(
+      lightProjectionMatrix,
+      lightWorldMatrix,
+      m4.identity(),
+      lightWorldMatrix,
+      colorProgramInfo);

  ...

-  drawScene(projectionMatrix, cameraMatrix, textureMatrix, textureProgramInfo);
+  drawScene(
+      projectionMatrix,
+      cameraMatrix,
+      textureMatrix,
+      lightWorldMatrix,
+      textureProgramInfo);

  ...
}
```

설정된 uniform 값들을 되짚어 봅시다. [스포트라이트에 관한 글](webgl-3d-lighting-spot.html)을 떠올려보면 innerLimit와 outerLimit은 내적 공간(코사인 공간)의 값이고 
조명의 방향을 따라서 뻗어나가는 형식이기 때문에 시야각의 절반만 필요합니다.
[카메라에 관한 글](webgl-3d-camera.html)에서 4x4 행렬의 세 번째 행이 Z축인 것을 
기억하시면 `lightWorldMatrix`로부터 세 번째 행의 앞 세개 값을 가져오면 그것이 조명의 -Z방향이라는 것을 알 수 있습니다.
우리는 양의 방향이 필요하기 때문에 뒤집었습니다.
같은 글을 통해 네 번째 행이 월드공간 위치라는 것을 알고 있으므로 관련된 행렬로부터 
lightWorldPosition과 viewWorldPosition(카메라의 월드공간 위치)을 유사하게 얻을 수 있습니다.
물론 이 값들은 변수를 더 추가하거나 세팅할 수 있는 값을 추가해서도 얻을 수 있습니다.

배경도 검은색으로 바꾸고 절두체를 표시하는 선은 흰색으로 합시다.

```js
function render() {

  ...

  // 이제 깊이 텍스처를 장면에 투영하고 캔버스에 그립니다.
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  ...

  // ------ 절두체를 그립니다. ------
  {

    ...

    // 방금 계산한 uniform값들을 설정합니다.
    webglUtils.setUniforms(colorProgramInfo, {
-      u_color: [0, 0, 0, 1],
+      u_color: [1, 1, 1, 1],
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_world: mat,
    });
```

이제 스포트라이트와 그림자를 얻었습니다.

{{{example url="../webgl-shadows-w-spot-light.html" }}}

방향성 조명에 대해서는 [방향성 조명과 관련된 글](webgl-3d-lighting-directional.html)에서 셰이더 코드를 복사하고 
원근 투영을 직교 투영으로 바꾸면 됩니다.

먼저 정점 셰이더는

```glsl
attribute vec4 a_position;
attribute vec2 a_texcoord;
+attribute vec3 a_normal;

-uniform vec3 u_lightWorldPosition;
-uniform vec3 u_viewWorldPosition;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;
varying vec3 v_normal;

-varying vec3 v_surfaceToLight;
-varying vec3 v_surfaceToView;

void main() {
  // 위치를 행렬과 곱합니다.
  vec4 worldPosition = u_world * a_position;

  gl_Position = u_projection * u_view * worldPosition;

  // 텍스처 좌표를 프래그먼트 셰이더로 넘겨줍니다.
  v_texcoord = a_texcoord;

  v_projectedTexcoord = u_textureMatrix * worldPosition;

  // 법선의 방향을 조정하고 프래그먼트 셰이더로 념겨줍니다.
  v_normal = mat3(u_world) * a_normal;

-  // 표면의 월드공간 위치를 계산합니다.
-  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
-
-  // 표면에서 조명을 향하는 벡터를 계산하고
-  // 프래그먼트 셰이더로 전달합니다.
-  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
-
-  // 표면에서 뷰/카메라를 향하는 벡터를 계산하고
-  // 프래그먼트 셰이더로 전달합니다.
-  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}
```

프래그먼트 셰이더에선,

```glsl
precision mediump float;

// 정점 셰이더에서 넘어온 값
varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;
varying vec3 v_normal;
-varying vec3 v_surfaceToLight;
-varying vec3 v_surfaceToView;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform float u_bias;
-uniform float u_shininess;
-uniform vec3 u_lightDirection;
-uniform float u_innerLimit;          // in dot space
-uniform float u_outerLimit;          // in dot space
+uniform vec3 u_reverseLightDirection;

void main() {
  // v_normal은 varying 이기 때문에 보간되고, 
  // 단위 벡터가 아닐 수 있습니다. 정규화를 해서
  // 다시 단위 벡터로 만들어줍니다.
  vec3 normal = normalize(v_normal);

+  float light = dot(normal, u_reverseLightDirection);

-  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
-  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
-  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
-
-  float dotFromDirection = dot(surfaceToLightDirection,
-                               -u_lightDirection);
-  float limitRange = u_innerLimit - u_outerLimit;
-  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
-  float light = inLight * dot(normal, surfaceToLightDirection);
-  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  // 'r'은 깊이 값을 저장하고 있습니다.
  float projectedDepth = texture2D(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  gl_FragColor = vec4(
-      texColor.rgb * light * shadowLight +
-      specular * shadowLight,
+      texColor.rgb * light * shadowLight,
      texColor.a);
}
```

uniform들은

```js
  // 구와 평면에 모두 사용되는 uniform을 설정합니다.
  // 주의: 셰이더에 대응되는 uniform이 없는경우 무시됩니다.
  webglUtils.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
-    u_shininess: 150,
-    u_innerLimit: Math.cos(degToRad(settings.fieldOfView / 2 - 10)),
-    u_outerLimit: Math.cos(degToRad(settings.fieldOfView / 2)),
-    u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
-    u_lightWorldPosition: lightWorldMatrix.slice(12, 15),
-    u_viewWorldPosition: cameraMatrix.slice(12, 15),
+    u_reverseLightDirection: lightWorldMatrix.slice(8, 11),
  });
```

장면을 넓게 보기 위해 카메라를 조정하였습니다.

{{{example url="../webgl-shadows-w-directional-light.html"}}}

코드를 보면 명확한데 원래 방향성 조명은 방향만 가지고 위치는 없지만, 
우리의 쉐도우맵은 너무 커서 특정 위치를 골라 쉐도우 맵을 적용할 부분에 대해서만 
계산을 수행하도록 되어 있습니다.

글이 너무 길어지고 있는데 여전히 그림자와 관련해서는 다룰 내용들이 많이 있습니다.
나머지는 [다음 글](webgl-shadows-continued.html)에서 알아보도록 합시다.

<div class="webgl_bottombar">
<a id="attachment-combinations"></a>
<h3>Why did we need to create an unused color texture?</h3>
<p>Here we get buried in the minutia of the WebGL spec.</p>
<p>WebGL is based on OpenGL ES 2.0 and the <a href="https://www.khronos.org/registry/webgl/specs/latest/1.0/">WebGL spec</a>
basically says WebGL follows the OpenGL ES 2.0 spec except for any exceptions
listed in the WebGL spec.</p>
<p>When you make a framebuffer you add attachments. You can add all kinds of
attachments. Above we added an RGBA/UNSIGNED_BYTE texture color attachment
and a depth texture attachment. In the article on rendering to textures we
attached a similar color attachment but we attached a depth renderbuffer,
not a depth texture. We could also attach an RGB texture, a LUMINANCE texture,
and many other types of textures and renderbuffers.</p>
<p>The <a href="">OpenGL ES 2.0 spec</a> gives a bunch of rules on whether
or not a certain combination of attachments will work together. One rule
is that there must be at least one attachment. Another rule is
that they all have to be the same size. The final rule is</p>
<blockquote>
<h4>4.4.5 Framebuffer Completeness</h4>
<p>
The combination of internal formats of the attached images does not violate an <b>implementation-dependent</b> set of restrictions.
</p>
</blockquote>
<p>
That unfortunate wording means <b>no combinations of attachments are required to work!</b>
</p>
<p>
The WebGL committee saw that and decided to require that WebGL implementations support
at least 3 common combinations. From <a href="https://www.khronos.org/registry/webgl/specs/latest/1.0/#6.8">Section 6.8 of the WebGL spec</a> they are:
<blockquote>
<ul>
  <li><code>COLOR_ATTACHMENT0</code> = <code>RGBA</code>/<code>UNSIGNED_BYTE</code> texture</li>
  <li><code>COLOR_ATTACHMENT0</code> = <code>RGBA</code>/<code>UNSIGNED_BYTE</code> texture + <code>DEPTH_ATTACHMENT</code> = <code>DEPTH_COMPONENT16</code> renderbuffer</li>
  <li><code>COLOR_ATTACHMENT0</code> = <code>RGBA</code>/<code>UNSIGNED_BYTE</code> texture + <code>DEPTH_STENCIL_ATTACHMENT</code> = <code>DEPTH_STENCIL</code> renderbuffer</li>
</blockquote>
<p>
Later the <a href="https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/">WEBGL_depth_texture</a> extensions was created.
All it really says is
that you can create depth textures and you can attach them to framebuffers
but it does not say anything more about required combinations. So, given
the OpenGL ES 2.0 spec rule that says what combinations are allowed to work
is up to the implementation, and given that the WebGL spec only lists 3
combinations required to work and that none of those combinations include
depth textures, only depth renderbuffers, that means there is no guarantee
that using a depth texture will ever work, at least according to the spec.
</p>
<p>In practice it appears that most drivers themselves work with just a depth
texture attached and no other attachments. Unfortunately Safari, at least as of
February 2020, does not allow that combination to work. It requires there be a
color attachment as well, most likely it requires an <code>RGBA</code>/<code>UNSIGNED_BYTE</code>
color attachment. The fact that it fails without it is within the specs above.
</p>
<p>All that is the long way of saying we need the unused color texture to work
in Safari. It also sadly means there's still no guarantee that things will work
across all drivers/gpus/browsers. Fortunately it appears that combination does
work everywhere. Also fortunately OpenGL ES 3.0 on which <a href="https://webgl2fundamentals.org">WebGL2</a>
is based changed the spec and requires many more combinations to just work. Unfortunately
as of February 2020 <a href="https://webgl2fundamentals.org/webgl/lessons/webgl-getting-webgl2.html">Safari does not support WebGL2</a>.
So, in WebGL1, we need to add the unused color texture and then cross our fingers. 😭
</p>
</div>

