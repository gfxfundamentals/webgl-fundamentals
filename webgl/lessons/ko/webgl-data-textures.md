Title: WebGL 3D - 데이터 텍스처
Description: 텍스처에 데이터 공급하기
TOC: 데이터 텍스처


이 포스트는 WebGL 관련 시리즈에서 이어집니다.
첫 번째는 [기초](webgl-fundamentals.html)로 시작했고, 이전에는 [텍스처](webgl-3d-textures.html)에 관한 것이었습니다.

지난 포스트에서 텍스처가 작동하는 방법과 이를 적용하는 방법에 대해 살펴봤습니다.
다운로드된 이미지로 텍스처를 생성했는데요.
이번 글에서는 이미지 대신 JavaScript에서 직접 데이터를 생성할 겁니다.

JavaScript에서 텍스처 데이터를 생성하는 것은 굉장히 간단합니다.
기본적으로 WebGL1은 텍스처의 몇 가지 type만 지원하는데

<div class="webgl_center">
  <table class="tabular-data tabular-data1">
    <thead>
      <tr><td>Format</td><td>Type</td><td>Channels</td><td>Bytes per pixel</td></tr>
    </thead>
    <tbody>
      <tr><td>RGBA</td><td>UNSIGNED_BYTE</td><td>4</td><td>4</td></tr>
      <tr><td>RGB</td><td>UNSIGNED_BYTE</td><td>3</td><td>3</td></tr>
      <tr><td>RGBA</td><td>UNSIGNED_SHORT_4_4_4_4</td><td>4</td><td>2</td></tr>
      <tr><td>RGBA</td><td>UNSIGNED_SHORT_5_5_5_1</td><td>4</td><td>2</td></tr>
      <tr><td>RGB</td><td>UNSIGNED_SHORT_5_6_5</td><td>3</td><td>2</td></tr>
      <tr><td>LUMINANCE_ALPHA</td><td>UNSIGNED_BYTE</td><td>2</td><td>2</td></tr>
      <tr><td>LUMINANCE</td><td>UNSIGNED_BYTE</td><td>1</td><td>1</td></tr>
      <tr><td>ALPHA</td><td>UNSIGNED_BYTE</td><td>1</td><td>1</td></tr>
    </tbody>
  </table>
</div>

3x2 pixel `LUMINANCE` 텍스처를 생성해봅시다.
`LUMINANCE` 텍스처이기 때문에 픽셀 당 1개의 값만 있고 각각의 R, G, B 채널로 반복됩니다.

[지난 글](webgl-3d-textures.html)에서 샘플을 가져올 겁니다.
먼저 큐브의 각 면에 전체 텍스처를 사용하기 위해 텍스처 좌표를 수정합시다.

```
// 큐브의 텍스처 좌표로 버퍼 채우기
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // 앞면
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
        ...
```

그런 다음 텍스처 생성 코드를 수정하는데

```
// 텍스처 생성
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

-// 1x1 파란색 픽셀로 텍스처 채우기
-gl.texImage2D(
-  gl.TEXTURE_2D,
-  0,
-  gl.RGBA,
-  1,
-  1,
-  0,
-  gl.RGBA,
-  gl.UNSIGNED_BYTE,
-  new Uint8Array([0, 0, 255, 255])
-);

// 3x2 픽셀로 텍스처 채우기
const level = 0;
const internalFormat = gl.LUMINANCE;
const width = 3;
const height = 2;
const border = 0;
const format = gl.LUMINANCE;
const type = gl.UNSIGNED_BYTE;
const data = new Uint8Array([
  128,  64, 128,
    0, 192,   0,
]);
gl.texImage2D(
  gl.TEXTURE_2D,
  level,
  internalFormat,
  width,
  height,
  border,
  format,
  type,
  data
);

// 필터링을 설정했으므로 mip은 필요없으며 필터링되지 않습니다.
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

-// 비동기적으로 이미지 로드
-...
```

그리고 여기 결과입니다.

{{{example url="../webgl-data-texture-3x2-bad.html" }}}

이런! 왜 작동하지 않죠?!?!?

JavaScript console을 확인하면 이런 오류가 표시됩니다.

```
WebGL: INVALID_OPERATION: texImage2D: ArrayBufferView not big enough for request
```

WebGL에는 OpenGL이 처음 만들어졌을 때의 모호한 설정들이 남아있는데요.
데이터가 어떤 크기일 때 가끔씩 컴퓨터가 더 빨라집니다.
예를 들어 한 번에 1byte가 아닌 2, 4, 8 byte를 복사하는 것이 더 빠를 수 있습니다.
WebGL은 기본적으로 한 번에 4byte를 사용하므로 각 데이터 행을 4byte의 배수로 생각합니다.

위의 데이터는 행마다 3byte, 총 6byte에 불과하지만, WebGL은 첫 번째 행에 대해 4byte, 두 번째 행에 대해 3byte, 총 7byte를 읽습니다.

다음과 같이 한 번에 1byte를 처리하도록 WebGL에 지시할 수 있습니다.

    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);

1, 2, 4, 8이 alignment에 유효한 값입니다.

WebGL에서 정렬된 데이터와 비정렬 데이터 사이의 속도 차이를 측정할 수 없다고 생각합니다.
이 문제가 새로운 사용자들에게 영향을 주지 않도록 4가 아닌 1을 기본값으로 하고 싶지만, OpenGL과의 호환성을 유지하기 위해 기본값은 유지되어야 했습니다.
이렇게 하면 포팅된 앱이 패딩된 행을 제공하는 경우 변경없이 작동될 겁니다.
동시에 새 앱에서 항상 `1`로 설정한 다음 끝낼 수 있습니다.

{{{example url="../webgl-data-texture-3x2.html" }}}

이 부분을 다뤘으니 이제 [텍스처 렌더링](webgl-render-to-texture.html)으로 넘어갑시다.

<div class="webgl_bottombar">
<h3>Pixel vs Texel</h3>
<p>
가끔씩 texture의 pixel이 texel로 불리는데요.
Pixel은 Picture Element의 줄임말입니다.
Texel은 Texture Element의 줄임말이죠.
</p>
<p>
물론 그래픽 전문가들의 말에 귀 기울일 것이지만, 제가 아는 한 "texel"은 전문 용어의 한 예시입니다.
개인적으로 저는 별생각 없이 texture element를 언급할 때 일반적으로 "pixel"을 사용합니다 &#x1f607;
</p>
</div>

