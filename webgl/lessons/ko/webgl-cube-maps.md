Title: WebGL Cubemap
Description: WebGL에서 cubemap을 사용하는 방법
TOC: Cubemap


이 글은 WebGL 관련 시리즈의 일부입니다.
첫 글은 [기초](webgl-fundamentals.html)로 시작했는데요.
이 글은 [텍스처에 관한 글](webgl-3d-textures.html)에서 이어집니다.
또한 [조명에 대한 글](webgl-3d-lighting-directional.html)에서 다룬 개념을 사용합니다.
아직 읽지 않으셨다면 해당 글들을 먼저 읽어주세요.

[이전 글](webgl-3d-textures.html)에서는 텍스처를 사용하는 방법, 텍스처를 가로지르는 0부터 1까지의 텍스처 좌표로 참조하는 방법, mip을 사용하여 선택적으로 필터링하는 방법 등을 다뤘습니다.

*Cubemap*은 또 다른 종류의 텍스처입니다.
큐브의 여섯 면을 나타내는 6개의 면으로 구성됩니다.
2차원을 가지는 전통적인 텍스처 좌표 대신에, cubemap은 법선, 즉 3D 방향을 사용합니다.
법선이 가리키는 방향에 따라 큐브의 여섯 면 중 하나가 선택되고 해당 면 내에서 픽셀이 샘플링되어 색상을 생기게 합니다.

6개의 면은 큐브의 중심에서의 방향으로 참조됩니다.

```js
gl.TEXTURE_CUBE_MAP_POSITIVE_X
gl.TEXTURE_CUBE_MAP_NEGATIVE_X
gl.TEXTURE_CUBE_MAP_POSITIVE_Y
gl.TEXTURE_CUBE_MAP_NEGATIVE_Y
gl.TEXTURE_CUBE_MAP_POSITIVE_Z
gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
```

간단한 예제를 만들어 볼텐데, 2D 캔버스를 사용하여 6개의 면에 각각 사용되는 이미지를 만들겁니다.

다음은 색상과 중앙 정렬된 메세지로 채우는 코드입니다.

```js
function generateFace(ctx, faceColor, textColor, text) {
  const {width, height} = ctx.canvas;
  ctx.fillStyle = faceColor;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `${width * 0.7}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.fillText(text, width / 2, height / 2);
}
```

그리고 여기 6개의 이미지를 생성하기 위해 호출하는 코드입니다.

```js
// 2D Context 가져오기
/** @type {Canvas2DRenderingContext} */
const ctx = document.createElement("canvas").getContext("2d");

ctx.canvas.width = 128;
ctx.canvas.height = 128;

const faceInfos = [
  { faceColor: '#F00', textColor: '#0FF', text: '+X' },
  { faceColor: '#FF0', textColor: '#00F', text: '-X' },
  { faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
  { faceColor: '#0FF', textColor: '#F00', text: '-Y' },
  { faceColor: '#00F', textColor: '#FF0', text: '+Z' },
  { faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
];
faceInfos.forEach((faceInfo) => {
  const {faceColor, textColor, text} = faceInfo;
  generateFace(ctx, faceColor, textColor, text);

  // 결과 보여주기
  ctx.canvas.toBlob((blob) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img);
  });
});
```

{{{example url="../webgl-cubemap-faces.html" }}}

이제 그걸 큐브에 적용해봅시다.
[이전 글](webgl-3d-textures.html)의 텍스처 아틀라스 예제 코드에서 시작할 겁니다.

먼저 큐브맵을 사용하도록 셰이더를 수정합시다.

```glsl
attribute vec4 a_position;

uniform mat4 u_matrix;

varying vec3 v_normal;

void main() {
  // 위치를 행렬로 곱하기
  gl_Position = u_matrix * a_position;

  // 법선 전달
  // 위치가 원점을 중심으로 하기 때문에 바로 전달할 수 있습니다.
  v_normal = normalize(a_position.xyz);
}
```

셰이더에서 텍스처 좌표를 제거하고 법선을 fragment shader로 전달하는 varying을 추가했는데요.
큐브의 위치가 원점을 중심으로 완벽하게 중앙에 있기 때문에 법선으로 사용할 수 있습니다.

[조명에 대한 글](webgl-3d-lighting-directional.html)을 떠올려보면 법선은 방향이며 일반적으로 일부 정점 표면의 방향을 지정하는데 사용됩니다.
법선에 대해 정규화된 위치를 사용하기 때문에 이걸 비추면 큐브 전체에 부드러운 조명을 줄 수 있습니다.
법선 큐브에 대해 각 면의 각 정점마다 서로 다른 법선을 가져야 합니다.

{{{diagram url="resources/cube-normals.html" caption="standard cube normal vs this cube's normals" }}}

텍스처 좌표를 사용하지 않기 때문에 텍스처 좌표 설정에 관련된 모든 코드를 지울 수 있습니다.

Fragment shader에서 `sampler2D` 대신 `samplerCube`를 사용하고 `texture2D` 대신 `textureCube`를 사용해야 합니다.
`textureCube`는 vec3 방향을 가지므로 정규화된 법선을 전달하는데요.
법선은 varying이고 보간될 것이기 때문에 다시 정규화해야 합니다.

```glsl
precision mediump float;

// Vertex shader에서 전달
varying vec3 v_normal;

// 텍스처
uniform samplerCube u_texture;

void main() {
   gl_FragColor = textureCube(u_texture, normalize(v_normal));
}
```

그러면 JavaScript에서 텍스처를 설정해야 합니다.

```js
// 텍스처 생성
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

// 2D Context 가져오기
/** @type {Canvas2DRenderingContext} */
const ctx = document.createElement("canvas").getContext("2d");

ctx.canvas.width = 128;
ctx.canvas.height = 128;

const faceInfos = [
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, faceColor: '#F00', textColor: '#0FF', text: '+X' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, faceColor: '#FF0', textColor: '#00F', text: '-X' },
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, faceColor: '#0FF', textColor: '#F00', text: '-Y' },
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, faceColor: '#00F', textColor: '#FF0', text: '+Z' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
];
faceInfos.forEach((faceInfo) => {
  const {target, faceColor, textColor, text} = faceInfo;
  generateFace(ctx, faceColor, textColor, text);
  
  // Cubemap의 면에 캔버스 업로드
  const level = 0;
  const internalFormat = gl.RGBA;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  gl.texImage2D(target, level, internalFormat, format, type, ctx.canvas);
});
gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
```

위에서 주의해야 할 사항:

* `gl.TEXTURE_2D` 대신에 `gl.TEXTURE_CUBE_MAP`을 사용합니다.

  이는 2D 텍스처 대신 cubemap을 만들라고 WebGL에 지시합니다.

* 텍스처의 각 면을 업로드하기 위해 특별한 대상을 사용합니다.

  `gl.TEXTURE_CUBE_MAP_POSITIVE_X`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_X`,
  `gl.TEXTURE_CUBE_MAP_POSITIVE_Y`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_Y`,
  `gl.TEXTURE_CUBE_MAP_POSITIVE_Z`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_Z`.

* 각 면은 사각형입니다.
  위에서 크기는 128x128입니다.

  Cubemap은 사각형 텍스처가 필요합니다.
  그리고 2D 텍스처처럼 두 차원에서 2의 거듭 제곱이 아니면 필터링하거나 mip을 사용할 수 없습니다.
  이 경우에는 2의 거듭 제곱(128)이기 때문에 mip을 생성하고 필터링을 활성화하여 mip을 사용합니다.

{{{example url="../webgl-cubemap.html" }}}

Cubemap을 사용하여 큐브에 텍스처를 사용하는 것은 cubemap의 일반적인 사용 용도가 **아닙니다**.
큐브에 텍스처를 사용하는 *올바른* 혹은 보다 일반적인 방법은 이전에 언급한 [텍스처 아틀라스](webgl-3d-textures.html)를 사용하는 겁니다.

오늘은 cubemap이 무엇이고 어떻게 설정하며 cubemap의 용도는 무엇인지 배웠습니다.
아마 cubemap이 사용되는 가장 일반적인 용도는 [*environment map*](webgl-environment-maps.html)일 겁니다.

