Title: WebGL 램프 텍스처
Description: 램프 텍스처 사용하기
TOC: 램프 텍스처 (툰 셰이딩)


WebGL에서 중요한 사실은 [텍스처가 텍스처에 대한 글](webgl-3d-textures.html)에서 다룬 것처럼 삼각형에 직접 적용되는 게 아니라는 겁니다.
텍스처는 랜덤 접근 데이터 배열이며, 일반적으로 데이터의 2D 배열입니다.
따라서 데이터의 랜덤 접근 배열을 사용할 수 있는 솔루션은 텍스처를 사용할 수 있는 곳입니다.

[방향성 조명에 대한 글](webgl-3d-lighting-directional.html)에서 *스칼라곱*을 사용하여 두 벡터 사이의 각도를 계산하는 방법을 다뤘었습니다.
모델 표면의 법선에 대한 조명 방향의 *스칼라곱*을 계산했는데요.
이는 두 벡터 사이 각도의 코사인을 제공합니다.
코사인은 -1에서 +1사이의 값이며 색상에 직접 곱했습니다.

```glsl
float light = dot(normal, u_reverseLightDirection);

gl_FragColor = u_color;
gl_FragColor.rgb *= light;
```

이렇게 하면 빛에서 멀어질수록 색상이 어두워집니다.

스칼라곱을 직접 사용하는 대신에 1차원 텍스처에서 값을 찾는 데 사용하면 어떨까요?

```glsl
precision mediump float;

// 정점 셰이더에서 전달됩니다.
varying vec3 v_normal;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;
+uniform sampler2D u_ramp;

void main() {
  // v_normal이 베링이기 때문에 보간되므로 단위 벡터가 아닙니다.
  // 정규화하면 다시 단위 벡터가 됩니다.
  vec3 normal = normalize(v_normal);

-  float light = dot(normal, u_reverseLightDirection);
+  float cosAngle = dot(normal, u_reverseLightDirection);
+
+  // -1 <-> 1에서 0 <-> 1로 변환
+  float u = cosAngle * 0.5 + 0.5;
+
+  // 텍스처 좌표 만들기
+  vec2 uv = vec2(u, 0.5);
+
+  // 1차원 텍스처에서 값 조회
+  vec4 rampColor = texture2D(u_ramp, uv);
+
  gl_FragColor = u_color;
-  gl_FragColor.rgb *= light;
+  gl_FragColor *= rampColor;
}
```

텍스처를 만들어야 합니다.
2x1 텍스처로 시작해봅시다.
텍셀당 1바이트만 사용하여 모노크롬 텍스처를 제공하는 `LUMINANCE` 포맷을 사용할 겁니다.

```js
var tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(
    gl.TEXTURE_2D,     // 대상
    0,                 // mip 레벨
    gl.LUMINANCE,      // 내부 포맷
    2,                 // 너비
    1,                 // 높이
    0,                 // 테두리
    gl.LUMINANCE,      // 포맷
    gl.UNSIGNED_BYTE,  // 타입
    new Uint8Array([90, 255]));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

위에서 두 픽셀의 색상은 어두운 회색(90)과 흰색(255)입니다.
또한 필터링이 없도록 텍스처 매개변수를 설정합니다.

새로운 텍스처에 대한 샘플을 수정하려면 `u_ramp` 유니폼을 찾아야 합니다.

```js
var worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
var worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
var colorLocation = gl.getUniformLocation(program, "u_color");
+var rampLocation = gl.getUniformLocation(program, "u_ramp");
var reverseLightDirectionLocation =
    gl.getUniformLocation(program, "u_reverseLightDirection");
```

그리고 렌더링할 때 텍스처를 설정해야 합니다.

```js
// 활성 텍스처 유닛 0에 텍스처 바인딩
gl.activeTexture(gl.TEXTURE0 + 0);
gl.bindTexture(gl.TEXTURE_2D, tex);
// u_ramp가 텍스처 유닛 0에서 텍스처를 사용해야 한다고 셰이더에 알림
gl.uniform1i(rampLocation, 0);
```

조명 샘플의 3D `F` 데이터를 저 폴리곤 머리 데이터로 교체했습니다.
실행하면 이렇게 됩니다.

{{{example url="../webgl-ramp-texture.html"}}}

모델을 회전해보면 [툰 셰이딩](https://ko.wikipedia.org/wiki/%EC%85%80_%EC%85%B0%EC%9D%B4%EB%94%A9)과 비슷하게 보이는 걸 확인할 수 있습니다.

위 예제에서 텍스처 필터링을 `NEAREST`로 설정하여 텍스처에서 가장 가까운 텍셀을 색상으로 선택합니다.
단 2개의 텍셀만 있기 때문에 표면이 조명에서 멀어지면 첫 번째 색상(어두운 회색)을 얻고, 표면이 조명에서 가까워지면 두 번째 색상(흰색)을 얻게 됩니다.
색상은 `light`에 사용했던 것처럼 `gl_FragColor`로 곱해집니다.

생각해보니 `LINEAR` 필터링으로 전환하면 텍스처를 사용하기 전과 같은 결과가 나와야 합니다.

```js
-gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
-gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
+gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
+gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
```

{{{example url="../webgl-ramp-texture-linear.html"}}}

비슷하게 보이지만 실제로 나란히 놓고 비교해보면...

<div class="webgl_center"><img src="resources/ramp-vs-light.png" style="width: 598px;"></div>

동일하지 않다는 것을 알 수 있습니다.
어떻게 된 걸까요?

`LINEAR` 필터링은 픽셀 사이를 혼합하는데요.
선형 필터링을 사용한 두 픽셀 텍스처를 확대해보면 문제가 뭔지 알게 됩니다.

<div class="webgl_center"><img src="resources/linear-texture-interpolation.svg" style="width: 500px;"></div>
<div class="webgl_center">램프의 텍스처 좌표 범위</div>

보간없이 양쪽에 0.5픽셀이 있습니다.
텍스처에서 `TEXTURE_WRAP_S`가 `REPEAT`로 설정되었다고 상상해보세요.
We'd then expect the left most half of a red pixel to linearly blend toward green as though the green repeated to the left. 
하지만 `CLAMP_TO_EDGE`를 사용하고 있기 때문에 왼쪽이 더 빨갛습니다.

램프를 실제로 얻으려면 해당 중심 범위에서 값을 선택하면 됩니다.
셰이더에서 약간의 수식으로 이를 수행할 수 있습니다.

```glsl
precision mediump float;

// 정점 셰이더에서 전달됩니다.
varying vec3 v_normal;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;
uniform sampler2D u_ramp;
+uniform vec2 u_rampSize;

void main() {
  // v_normal이 베링이기 보간되므로 단위 벡터가 아닙니다.
  // 정규화하면 다시 단위 벡터가 됩니다.
  vec3 normal = normalize(v_normal);

  float cosAngle = dot(normal, u_reverseLightDirection);

  // -1 <-> 1에서 0 <-> 1로 변환
  float u = cosAngle * 0.5 + 0.5;

  // 텍스처 좌표 만들기
  vec2 uv = vec2(u, 0.5);

+  // 램프의 크기로 크기 조정
+  vec2 texelRange = uv * (u_rampSize - 1.0);
+
+  // 텍셀의 절반만큼 오프셋하고 텍스처 좌표로 변환
+  vec2 rampUV = (texelRange + 0.5) / u_rampSize;

-  vec4 rampColor = texture2D(u_ramp, uv);
+  vec4 rampColor = texture2D(u_ramp, rampUV);

  gl_FragColor = u_color;
  gl_FragColor *= rampColor;
}
```

위에서 우리는 기본적으로 UV 좌표의 크기를 조정하여 텍스처 너비보다 1만큼 작은 0에서 1사이가 됩니다.
그런 다음 픽셀에 0.5를 추가하고 다시 정규화된 텍스처 좌표로 변환합니다.

`u_rampSize`의 위치를 찾아야 합니다.

```js
var colorLocation = gl.getUniformLocation(program, "u_color");
var rampLocation = gl.getUniformLocation(program, "u_ramp");
+var rampSizeLocation = gl.getUniformLocation(program, "u_rampSize");
```

그리고 렌더링할 때 이를 설정해야 합니다.

```js
// 활성 텍스처 유닛 0에 텍스처 바인딩
gl.activeTexture(gl.TEXTURE0 + 0);
gl.bindTexture(gl.TEXTURE_2D, tex);
// u_ramp가 텍스처 유닛 0에서 텍스처를 사용해야 한다고 셰이더에 알림
gl.uniform1i(rampLocation, 0);
+gl.uniform2fv(rampSizeLocation, [2, 1]);
```

실행하기 전에 램프 텍스처가 있을 때와 없을 때를 비교할 수 있도록 플래그를 추가해봅시다.

```glsl
precision mediump float;

// 정점 셰이더에서 전달됩니다.
varying vec3 v_normal;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;
uniform sampler2D u_ramp;
uniform vec2 u_rampSize;
+uniform bool u_useRampTexture;

void main() {
  // v_normal이 베링이기 보간되므로 단위 벡터가 아닙니다.
  // 정규화하면 다시 단위 벡터가 됩니다.
  vec3 normal = normalize(v_normal);

  float cosAngle = dot(normal, u_reverseLightDirection);

  // -1 <-> 1에서 0 <-> 1로 변환
  float u = cosAngle * 0.5 + 0.5;

  // 텍스처 좌표 만들기
  vec2 uv = vec2(u, 0.5);

  // 램프의 크기로 크기 조정
  vec2 texelRange = uv * (u_rampSize - 1.0);

  // 텍셀의 절반만큼 오프셋하고 텍스처 좌표로 변환
  vec2 rampUV = (texelRange + 0.5) / u_rampSize;

  vec4 rampColor = texture2D(u_ramp, rampUV);

+  if (!u_useRampTexture) {
+    rampColor = vec4(u, u, u, 1);
+  }

  gl_FragColor = u_color;
  gl_FragColor *= rampColor;
}
```

유니폼의 위치도 찾을 겁니다.

```js
var rampLocation = gl.getUniformLocation(program, "u_ramp");
var rampSizeLocation = gl.getUniformLocation(program, "u_rampSize");
+var useRampTextureLocation = gl.getUniformLocation(program, "u_useRampTexture");
```

그리고 그걸 설정합니다.

```js
var data = {
  useRampTexture: true,
};

...

// 액티브 텍스처 유닛 0에 텍스처 바인딩
gl.activeTexture(gl.TEXTURE0 + 0);
gl.bindTexture(gl.TEXTURE_2D, tex);
// u_ramp가 텍스처 유닛 0의 텍스처를 사용해야 한다고 셰이더에 알림
gl.uniform1i(rampLocation, 0);
gl.uniform2fv(rampSizeLocation, [2, 1]);

+gl.uniform1i(useRampTextureLocation, data.useRampTexture);
```

이를 통해 기존 조명 방식과 새로운 램프 텍스처 방식이 일치하는 것을 볼 수 있습니다.

{{{example url="../webgl-ramp-texture-issue-confirm.html"}}}

"useRampTexture" 체크 박스를 클릭하면 현재 두 기술이 일치하기 때문에 변화가 없습니다.

> 참고: 일반적으로 셰이더에서 `u_useRampTexture`와 같은 조건문을 사용하는 것은 권장되지 않는데요.
> 대신에 일반 조명과 램프 텍스처를 사용하는 셰이더 프로그램을 각각 만드는 게 좋습니다.
> 안타깝지만 코드는 [외부 도우미 라이브러리](webgl-less-code-more-fun.html)를 사용하고 있지 않기 때문에 2개의 셰이더 프로그램을 지원하기 위해 꽤 많이 바뀔 겁니다.
> 각 프로그램은 고유한 위치 세트가 필요합니다.
> 하지만 그렇게 많이 변경하면 이 글의 요점에서 벗어날 수 있기 때문에 여기서는 조건문을 사용하기로 결정했습니다.
> In general though I try avoid conditionals to select features in shaders and instead create different shaders for different features.

참고: 이 수식은 `LINEAR` 필터링을 사용하는 경우에만 중요합니다.
`NEAREST` 필터링을 사용하고 있다면 원래 수식이 필요합니다.

이제 램프 수식이 맞다는 것을 알았으니 다양한 램프 텍스처를 만들어 보겠습니다.

```js
+// 0 ~ 127 요소는 64 ~ 191이고 128 ~ 255 요소는 모두 255인 배열을 만듭니다.
+const smoothSolid = new Array(256).fill(255);
+for (let i = 0; i < 128; ++i) {
+  smoothSolid[i] = 64 + i;
+}
+
+const ramps = [
+  { name: 'dark-white',          color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 255] },
+  { name: 'dark-white-skewed',   color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 80, 80, 255, 255] },
+  { name: 'normal',              color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: true,
+    data: [0, 255] },
+  { name: '3-step',              color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 160, 255] },
+  { name: '4-step',              color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 140, 200, 255] },
+  { name: '4-step skewed',       color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 80, 80, 80, 140, 200, 255] },
+  { name: 'black-white-black',   color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 255, 80] },
+  { name: 'stripes',             color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255] },
+  { name: 'stripe',              color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255] },
+  { name: 'smooth-solid',        color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: smoothSolid },
+  { name: 'rgb',                 color: [  1, 1,   1, 1], format: gl.RGB,       filter: true,
+    data: [255, 0, 0, 0, 255, 0, 0, 0, 255] },
+];
+
+var elementsForFormat = {};
+elementsForFormat[gl.LUMINANCE] = 1;
+elementsForFormat[gl.RGB      ] = 3;
+
+ramps.forEach((ramp) => {
+  const {name, format, filter, data} = ramp;
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
+  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
+  const width = data.length / elementsForFormat[format];
  gl.texImage2D(
      gl.TEXTURE_2D,     // 대상
      0,                 // mip 레벨
*      format,            // 내부 포맷
*      width,             // 너비
      1,                 // 높이
      0,                 // 테두리
*     format,            // 포맷
      gl.UNSIGNED_BYTE,  // 타입
*      new Uint8Array(data));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
*  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter ? gl.LINEAR : gl.NEAREST);
*  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter ? gl.LINEAR : gl.NEAREST);
+  ramp.texture = tex;
+  ramp.size = [width, 1];
+});
```

`NEAREST`와 `LINEAR`를 모두 처리할 수 있도록 셰이더를 만들어 보겠습니다.
위에서 언급한 것처럼 일반적으로 셰이더에서 조건문을 사용하진 않지만, 차이점이 간단하고 조건문 없이 할 수 있다면 셰이더 하나만 사용하는 것을 고려할 겁니다.
그렇게 하기 위해 0.0이나 1.0으로 설정할 부동 소수점 유니폼 `u_linearAdjust`를 추가할 수 있습니다.

```glsl
precision mediump float;

// 정점 셰이더에서 전달됩니다.
varying vec3 v_normal;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;
uniform sampler2D u_ramp;
uniform vec2 u_rampSize;
-uniform bool u_useRampTexture;
-uniform float u_linearAdjust;  // "linear"인 경우 1.0, "nearest"인 경우 0.0

void main() {
  // v_normal이 베링이기 보간되므로 단위 벡터가 아닙니다.
  // 정규화하면 다시 단위 벡터가 됩니다.
  vec3 normal = normalize(v_normal);

  float cosAngle = dot(normal, u_reverseLightDirection);

  // -1 <-> 1에서 0 <-> 1로 변환
  float u = cosAngle * 0.5 + 0.5;

  // 텍스처 좌표 만들기
  vec2 uv = vec2(u, 0.5);

  // 램프의 크기로 크기 조정
-  vec2 texelRange = uv * (u_rampSize - 1.0);
+  vec2 texelRange = uv * (u_rampSize - u_linearAdjust);

-  // 텍셀의 절반만큼 오프셋하고 텍스처 좌표로 변환
-  vec2 rampUV = (texelRange + 0.5) / u_rampSize;
+  // "linear"인 경우 텍셀의 절반만큼 오프셋하고 텍스처 좌표로 변환
+  vec2 rampUV = (texelRange + 0.5 * u_linearAdjust) / u_rampSize;

  vec4 rampColor = texture2D(u_ramp, rampUV);

-  if (!u_useRampTexture) {
-    rampColor = vec4(u, u, u, 1);
-  }

  gl_FragColor = u_color;
  gl_FragColor *= rampColor;
}
```

초기화할 때 위치를 찾습니다.

```js
var colorLocation = gl.getUniformLocation(program, "u_color");
var rampLocation = gl.getUniformLocation(program, "u_ramp");
var rampSizeLocation = gl.getUniformLocation(program, "u_rampSize");
+var linearAdjustLocation = gl.getUniformLocation(program, "u_linearAdjust");
```

그리고 렌더링할 때 텍스처 중 하나를 선택합니다.

```js
var data = {
  ramp: 0,
};

...
+const {texture, color, size, filter} = ramps[data.ramp];

// 사용할 색상 설정
-gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]);
+gl.uniform4fv(colorLocation, color);

// 조명 방향 설정
gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([-1.75, 0.7, 1]));

// 액티브 텍스처 유닛 0에 텍스처 바인딩
gl.activeTexture(gl.TEXTURE0 + 0);
-gl.bindTexture(gl.TEXTURE_2D, tex);
+gl.bindTexture(gl.TEXTURE_2D, texture);
// u_ramp가 텍스처 유닛 0의 텍스처를 사용해야 한다고 셰이더에 알림
gl.uniform1i(rampLocation, 0);
-gl.uniform2fv(rampSizeLocation, [2, 1]);
+gl.uniform2fv(rampSizeLocation, size);

+// "linear"인 경우 조정
+gl.uniform1f(linearAdjustLocation, filter ? 1 : 0);
```

{{{example url="../webgl-ramp-textures.html"}}}

다른 램프 텍스처를 시도하면 이상한 효과를 많이 볼 수 있습니다.
이게 일반적인 조정 셰이더를 만드는 하나의 방법입니다.
다음과 같이 2개의 색상과 임계값을 설정하여 2색 툰 셰이딩 셰이더를 만들 수 있습니다.

```js
uniform vec4 color1;
uniform vec4 color2;
uniform float threshold;

...

  float cosAngle = dot(normal, u_reverseLightDirection);

  // -1 <-> 1에서 0 <-> 1로 변환
  float u = cosAngle * 0.5 + 0.5;

  gl_FragColor = mix(color1, color2, step(cosAngle, threshold));
```

그리고 이것은 잘 동작할 겁니다.
하지만 3단계 혹은 4단계 버전을 하고 싶다면 또 다른 셰이더를 작성해야 합니다.
램프 텍스처로 다른 텍스처를 제공할 수 있습니다.
2단계 툰 셰이더를 하려는 경우에도 텍스처에 데이터를 더 많이 혹은 더 적게 넣어서 단계가 발생하는 위치를 조정할 수 있는데요.

```
[dark, light]
```

예를 들어 위와 같은 텍스처가 있으면 빛을 향하는 방향과 반대하는 방향 사이의 중간에서 나뉘는 2단계 텍스처를 제공합니다.

```
[dark, dark, dark, light, light]
```

하지만 위와 같은 텍스처의 경우 셰이더를 바꾸지 않고도 빛을 향하는 방향과 반대하는 방향 사이의 60% 지점으로 분할을 이동합니다.

툰 셰이딩이나 이상한 효과를 위해 램프 텍스처를 사용하는 이 예제는 여러분에게 유용할 수도 있고 아닐 수도 있지만 더 중요한 점은 텍스처에서 데이터를 찾기 위해 어떤 값을 사용하는 기본 개념입니다.
이렇게 텍스처를 사용하는 것은 단순히 빛 계산을 변환하기 위한 게 아닙니다.
[포토샵의 그레이디언트 맵](https://www.photoshopessentials.com/photo-effects/gradient-map/)과 동일한 효과를 내기 위해 [후처리](webgl-post-processing.html)에 램프 텍스처를 사용할 수 있습니다.

GPU 기반의 애니메이션에 램프 텍스처를 사용할 수도 있습니다.
텍스처에 키/값을 저장하고 "시간"을 값으로 사용하여 텍스처로 이동합니다.
이 기술에는 많은 용도가 있습니다.

