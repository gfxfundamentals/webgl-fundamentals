Title: WebGL Pulling Vertices
Description: 독립적인 인덱스 사용
TOC: Pulling Vertices


이 글은 [기초](webgl-fundamentals.html)를 포함한 다른 글들을 이미 읽었다고 가정합니다.
아직 읽지 않았다면 거기부터 시작해주세요.

전통적으로 WebGL 앱은 지오메트리 데이터를 버퍼에 넣습니다.
그런 다음 속성을 사용하여 정점 데이터를 버퍼에서 정점 셰이더로 전달하고, 이를 클립 공간으로 변환하기 위한 코드를 프로그래머가 작성합니다.

**전통적**이란 단어가 중요합니다.
이런 식으로 하는 것은 **전통**일 뿐입니다.
결코 요구사항이 아닌데요.
WebGL은 우리가 어떻게 하든 상관하지 않으며, 정점 셰이더가 클립 공간 좌표를 `gl_Position`에 할당하는 것만 신경씁니다.

[텍스처에 대한 글](webgl-3d-textures.html)의 예제와 같은 코드를 사용하여 텍스처가 매핑된 큐브를 그려봅시다.
최소 24개의 고유한 정점이 필요하다고 말했었는데요.
이는 모서리 위치가 8개여도 동일한 모서리가 큐브의 다른 면 3개에 사용되고 각 면이 다른 텍스처 좌표가 필요하기 때문입니다.

<div class="webgl_center"><img src="resources/cube-vertices-uv.svg" style="width: 400px;"></div>

위 다이어그램에서 왼쪽 면이 사용하는 3번 모서리는 텍스처 좌표 1,1이 필요하지만 오른쪽 면이 사용하는 3번 모서리는 텍스처 좌표 0,1이 필요합니다.
윗면도 다른 텍스처 좌표가 필요할 겁니다.

이는 일반적으로 8개의 모서리 위치에서 24개의 정점으로 확장됩니다.

```js
  // 앞쪽
  { pos: [-1, -1,  1], uv: [0, 1], }, // 0
  { pos: [ 1, -1,  1], uv: [1, 1], }, // 1
  { pos: [-1,  1,  1], uv: [0, 0], }, // 2
  { pos: [ 1,  1,  1], uv: [1, 0], }, // 3
  // 오른쪽
  { pos: [ 1, -1,  1], uv: [0, 1], }, // 4
  { pos: [ 1, -1, -1], uv: [1, 1], }, // 5
  { pos: [ 1,  1,  1], uv: [0, 0], }, // 6
  { pos: [ 1,  1, -1], uv: [1, 0], }, // 7
  // 뒤쪽
  { pos: [ 1, -1, -1], uv: [0, 1], }, // 8
  { pos: [-1, -1, -1], uv: [1, 1], }, // 9
  { pos: [ 1,  1, -1], uv: [0, 0], }, // 10
  { pos: [-1,  1, -1], uv: [1, 0], }, // 11
  // 왼쪽
  { pos: [-1, -1, -1], uv: [0, 1], }, // 12
  { pos: [-1, -1,  1], uv: [1, 1], }, // 13
  { pos: [-1,  1, -1], uv: [0, 0], }, // 14
  { pos: [-1,  1,  1], uv: [1, 0], }, // 15
  // 위쪽
  { pos: [ 1,  1, -1], uv: [0, 1], }, // 16
  { pos: [-1,  1, -1], uv: [1, 1], }, // 17
  { pos: [ 1,  1,  1], uv: [0, 0], }, // 18
  { pos: [-1,  1,  1], uv: [1, 0], }, // 19
  // 아래쪽
  { pos: [ 1, -1,  1], uv: [0, 1], }, // 20
  { pos: [-1, -1,  1], uv: [1, 1], }, // 21
  { pos: [ 1, -1, -1], uv: [0, 0], }, // 22
  { pos: [-1, -1, -1], uv: [1, 0], }, // 23
```

이러한 위치와 텍스처 좌표를 버퍼에 저장되고 속성을 통해 정점 셰이더에 제공됩니다.

하지만 꼭 이런 식으로 해야 할까요?
실제로 모서리 8개와 텍스처 좌표 4개만 있으면 어떨까요?

```js
positions = [
  -1, -1,  1,  // 0
   1, -1,  1,  // 1
  -1,  1,  1,  // 2
   1,  1,  1,  // 3
  -1, -1, -1,  // 4
   1, -1, -1,  // 5
  -1,  1, -1,  // 6
   1,  1, -1,  // 7
];
uvs = [
  0, 0,  // 0
  1, 0,  // 1
  0, 1,  // 2
  1, 1,  // 3
];
```

그런 다음 24개의 정점 각각에 대해 사용할 정점을 지정합니다.

```js
positionIndexUVIndex = [
  // 앞쪽
  0, 1, // 0
  1, 3, // 1
  2, 0, // 2
  3, 2, // 3
  // 오른쪽
  1, 1, // 4
  5, 3, // 5
  3, 0, // 6
  7, 2, // 7
  // 뒤쪽
  5, 1, // 8
  4, 3, // 9
  7, 0, // 10
  6, 2, // 11
  // 왼쪽
  4, 1, // 12
  0, 3, // 13
  6, 0, // 14
  2, 2, // 15
  // 위쪽
  7, 1, // 16
  6, 3, // 17
  3, 0, // 18
  2, 2, // 19
  // 아래쪽
  1, 1, // 20
  0, 3, // 21
  5, 0, // 22
  4, 2, // 23
];
```

이걸 GPU에서 사용할 수 있을까요?

위치와 텍스처 좌표를 각각의 텍스처에 업로드할 텐데요.
먼저 부동 소수점 텍스처를 확인하고 활성화하여 위치를 텍스처에 넣기 쉽도록 만듭니다.
그렇지 않으면 다른 방식으로 인코딩해야 합니다.

```js
const gl = canvas.getContext("webgl");
if (!gl) {
  return;
}
+const ext = gl.getExtension('OES_texture_float');
+if (!ext) {
+  alert('need OES_texture_float');
+  return;
+}
```

그런 다음 [데이터 텍스처에 대한 글](webgl-data-textures.html)에서 다룬 것처럼 데이터를 텍스처에 넣을 겁니다.

```js
function makeDataTexture(gl, data, numComponents) {
  // 픽셀당 4개의 값으로 데이터를 확장합니다.
  const numElements = data.length / numComponents;
  const expandedData = new Float32Array(numElements * 4);
  for (let i = 0; i < numElements; ++i) {
    const srcOff = i * numComponents;
    const dstOff = i * 4;
    for (let j = 0; j < numComponents; ++j) {
      expandedData[dstOff + j] = data[srcOff + j];
    }
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
      gl.TEXTURE_2D,
      0,            // mip level
      gl.RGBA,      // 포맷
      numElements,  // 너비
      1,            // 높이
      0,            // 테두리
      gl.RGBA,      // 포맷
      gl.FLOAT,     // 타입
      expandedData,
  );
  // 2의 거듭제곱이 아닌 텍스처를 사용할 수 있도록 만들면 필터링이 필요하지 않습니다.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return tex;
}

const positionTexture = makeDataTexture(gl, positions, 3);
const texcoordTexture = makeDataTexture(gl, uvs, 2);
```

텍스처는 픽셀당 최대 4개의 값을 가지기 때문에 `makeDataTexture`는 우리가 제공하는 데이터를 픽셀당 4개의 값으로 확장합니다.

다음으로 위치와 텍스처 좌표 인덱스를 버퍼에 업로드해야 합니다.

```js
// 위치와 UV 인덱스용 버퍼 생성
const positionIndexUVIndexBuffer = gl.createBuffer();
// ARRAY_BUFFER에 바인딩 (ARRAY_BUFFER = positionBuffer)
gl.bindBuffer(gl.ARRAY_BUFFER, positionIndexUVIndexBuffer);
// 위치와 텍스처 좌표 인덱스를 버퍼에 넣기
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionIndexUVIndex), gl.STATIC_DRAW);
```

24개의 정점만 필요더라도 여전히 6개의 면, 12개의 삼각형, 36개의 정점을 그려야 합니다.

각 면에 사용할 6개의 정점을 전달하기 위해 [정점 인덱스](webgl-indexed-vertices.html)를 사용할 겁니다.

```js
const indices = [
   0,  1,  2,   2,  1,  3,  // 앞쪽
   4,  5,  6,   6,  5,  7,  // 오른쪽
   8,  9, 10,  10,  9, 11,  // 뒤쪽
  12, 13, 14,  14, 13, 15,  // 왼쪽
  16, 17, 18,  18, 17, 19,  // 위쪽
  20, 21, 22,  22, 21, 23,  // 아래쪽
];
// 인덱스 버퍼 생성
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
// 버퍼에 인덱스 넣기
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
```

큐브에 이미지를 그리고 싶다면 3번째 텍스처가 필요합니다.
체커보드로 또 다른 4x4 데이터 텍스처를 만들어봅시다.
픽셀당 1바이트만 필요하기 때문에 `gl.LUMINANCE` 포맷을 사용할 겁니다.

```js
// 체커 텍스처 생성
const checkerTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, checkerTexture);
// 4x4 회색 체커보드로 텍스처 채우기
gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    4,
    4,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    new Uint8Array([
      0xDD, 0x99, 0xDD, 0xAA,
      0x88, 0xCC, 0x88, 0xDD,
      0xCC, 0x88, 0xCC, 0xAA,
      0x88, 0xCC, 0x88, 0xCC,
    ]),
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

정점 셰이더를 보면... 이런 식으로 텍스처에서 픽셀을 찾을 수 있습니다.

```glsl
vec4 texelFetch(sampler2D tex, vec2 texSize, vec2 pixelCoord) {
  vec2 uv = (pixelCoord + 0.5) / texSize;
  return texture2D(tex, uv);
}
```

따라서 정수 픽셀 좌표와 픽셀 단위의 텍스처 크기가 주어지면 위 코드는 픽셀 값을 가져옵니다.
왜 `+ 0.5`인지 궁금하다면 [스키닝에 대한 글](webgl-skinning.html)을 봐주세요.

`texelFetch` 함수를 사용하여 다음과 같이 1차원 배열 인덱스를 가져와 2D 텍스처에서 값을 찾을 수 있습니다.

```glsl
vec4 getValueByIndexFromTexture(sampler2D tex, vec2 texSize, float index) {
  float col = mod(index, texSize.x);
  float row = floor(index / texSize.x);
  return texelFetch(tex, texSize, vec2(col, row));
}
```

So given those 2 functions here is our shader.

```glsl
attribute vec2 positionAndTexcoordIndices;

uniform sampler2D positionTexture;
uniform vec2 positionTextureSize;
uniform sampler2D texcoordTexture;
uniform vec2 texcoordTextureSize;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

vec4 texelFetch(sampler2D tex, vec2 texSize, vec2 pixelCoord) {
  vec2 uv = (pixelCoord + 0.5) / texSize;
  return texture2D(tex, uv);
} 

vec4 getValueByIndexFromTexture(sampler2D tex, vec2 texSize, float index) {
  float col = mod(index, texSize.x);
  float row = floor(index / texSize.x);
  return texelFetch(tex, texSize, vec2(col, row));
}

void main() {
  float positionIndex = positionAndTexcoordIndices.x;
  vec3 position = getValueByIndexFromTexture(
      positionTexture, positionTextureSize, positionIndex).xyz;
 
  // 위치에 행렬 곱하기
  gl_Position = u_matrix * vec4(position, 1);

  float texcoordIndex = positionAndTexcoordIndices.y;
  vec2 texcoord = getValueByIndexFromTexture(
      texcoordTexture, texcoordTextureSize, texcoordIndex).xy;

  // texcoord를 프래그먼트 셰이더에 전달
  v_texcoord = texcoord;
}
```

아래쪽에는 [텍스처에 대한 글](webgl-3d-textures.html)에서 사용한 것과 사실상 동일한 셰이더가 있습니다.
`position`을 `u_matrix`로 곱하고 `texcoord`를 `v_texcoord`로 출력하여 프래그먼트 셰이더로 전달합니다.

차이점은 오직 `position`과 `texcoord`를 얻는 방법입니다.
전달한 인덱스를 사용하여 각각의 텍스처에서 해당 값을 가져옵니다.

셰이더를 사용하기 위해 모든 위치를 찾아야 합니다.

```js
// GLSL 프로그램 설정
const program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

+// 정점 데이터가 어디로 가야하는지 탐색
+const posTexIndexLoc = gl.getAttribLocation(
+    program, "positionAndTexcoordIndices");
+
+// 유니폼 탐색
+const matrixLoc = gl.getUniformLocation(program, "u_matrix");
+const positionTexLoc = gl.getUniformLocation(program, "positionTexture");
+const positionTexSizeLoc = gl.getUniformLocation(program, "positionTextureSize");
+const texcoordTexLoc = gl.getUniformLocation(program, "texcoordTexture");
+const texcoordTexSizeLoc = gl.getUniformLocation(program, "texcoordTextureSize");
+const u_textureLoc = gl.getUniformLocation(program, "u_texture");
```

렌더링할 때 속성을 설정합니다.

```js
// 프로그램(셰이더 쌍)을 사용하도록 지시
gl.useProgram(program);

+// positionIndexUVIndex 버퍼 바인딩
+gl.bindBuffer(gl.ARRAY_BUFFER, positionIndexUVIndexBuffer);
+
+// 위치 인덱스 속성 활성화
+gl.enableVertexAttribArray(posTexIndexLoc);
+
+// positionIndexUVIndexBuffer(ARRAY_BUFFER)에서 데이터 가져오는 방법을 position/texcoord 인덱스 속성에 지시
+{
+  const size = 2;          // 반복마다 2개의 컴포넌트
+  const type = gl.FLOAT;   // 데이터는 32비트 부동 소수점
+  const normalize = false; // 데이터 정규화 안 함
+  const stride = 0;        // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
+  const offset = 0;        // 버퍼의 처음부터 시작
+  gl.vertexAttribPointer(posTexIndexLoc, size, type, normalize, stride, offset);
+}
```

정점당 위치 인덱스 1개와 텍스처 좌표 인덱스 1개이기 때문에 크기는 2입니다.

그런 다음 정점 인덱스를 설정합니다.

```js
// 인덱스 설정
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
```

그리고 3개의 텍스처를 모두 바인딩하고 유니폼을 전부 설정합니다.

```js
// 행렬 설정
gl.uniformMatrix4fv(matrixLoc, false, matrix);

// 텍스처 유닛 0에 positionTexture 넣기
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, positionTexture);
// positionTexture에 텍스처 유닛 0을 사용하도록 셰이더에 지시
gl.uniform1i(positionTexLoc, 0);
// 셰이더에 positionTexture의 크기를 알림
gl.uniform2f(positionTexSizeLoc, positions.length / 3, 1);

// 텍스처 유닛 1에 texcoordTexture 넣기
gl.activeTexture(gl.TEXTURE0 + 1);
gl.bindTexture(gl.TEXTURE_2D, texcoordTexture);
// texcoordTexture에 텍스처 유닛 1을 사용하도록 셰이더에 지시
gl.uniform1i(texcoordTexLoc, 1);
// 셰이더에 texcoordTexture의 크기를 알림
gl.uniform2f(texcoordTexSizeLoc, uvs.length / 2, 1);

// 텍스처 유닛 2에 checkerTexture 넣기
gl.activeTexture(gl.TEXTURE0 + 2);
gl.bindTexture(gl.TEXTURE_2D, checkerTexture);
// u_texture에 텍스처 유닛 2를 사용하도록 셰이더에 지시
gl.uniform1i(u_textureLoc, 2);
```

마지막으로 그립니다.

```js
// 지오메트리 그리기
gl.drawElements(gl.TRIANGLES, 6 * 6, gl.UNSIGNED_SHORT, 0);
```

그러면 8개의 위치과 4개의 텍스처 좌표만을 사용하여 텍스처 큐브를 얻습니다.

{{{example url="../webgl-pulling-vertices.html"}}}

참고할 사항이 있습니다.
이 코드는 느리고 위치와 텍스처 좌표에 대해 1차원 텍스처를 사용합니다.
그리고 텍스처는 매우 넓을 수 밖에 없는데요.
얼마나 넓은지는 [머신 스펙](https://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE)에 따르며 다음과 같이 쿼리할 수 있습니다.

```js
const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
```

그보다 많은 데이터를 처리하려면 데이터에 맞는 텍스처 크기를 선택하고, 사각형을 만들기 위해 데이터를 여러 행에 분산하여 마지막 행을 채웁니다.

여기서 하는 또 다른 일은 위치용 하나, 텍스처 좌표용 하나, 총 2개의 텍스처를 사용하는 겁니다.
인터리브 처리된 동일한 텍스처에 두 데이터를 넣어도 됩니다.

    pos,uv,pos,uv,pos,uv...

혹은 텍스처의 다른 위치에 넣을 수 있습니다.

    pos,pos,pos,...
    uv, uv, uv,...

텍스처에서 이것들을 어떻게 가져오는지 계산하는 정점 셰이더의 수식만 변경하면 됩니다.

떠오르는 질문으로, 꼭 이런식으로 해야 할까요?
대답은 "GPU에 달려있다"입니다.
GPU에 따라 기존의 방식보다 느릴 수 있습니다.

이 글의 요점은 WebGL이 클립 공간 좌표로 `gl_Position`을 설정하는 방법과 `gl_FragColor`를 설정하는 방법에 대해 신경쓰지 않는다는 겁니다.
설정하는 방법은 여러분이 생각하면 되는데요.
텍스처는 무작위 접근 데이터의 2차원 배열일 뿐입니다.

WebGL에서 해결하려는 문제가 있을 때 WebGL은 셰이더를 실행하고 이러한 셰이더는 유니폼(전역 변수), 속성(정점 셰이더의 반복마다 가져오는 데이터), 텍스처(무작위 접근 2차원 배열)를 통해 데이터에 접근 가능함을 기억하세요.
사용한 기존의 방법으로 인해 WebGL이 가지는 유연성을 못 보는 일이 없으시길 바랍니다.

<div class="webgl_bottombar">
<h3>왜 Vertex Pulling이라고 부르나요?</h3>
<p>
저는 이전부터 이 기술을 사용했음에도 최근(2019년 7월)에서야 이 용어를 들었습니다.
Daniel Rakos의 <a href='https://www.google.com/search?q=OpenGL+Insights+"Programmable+Vertex+Pulling"+article+by+Daniel+Rakos'>OpenGL Insights "Programmable Vertex Pulling"</a>이라는 글에서 가져왔는데요.
</p>
<p>
It's called vertex *pulling* since it's the vertex shader that decides which vertex data to read vs the traditional way where vertex data is supplied automatically via attributes.
사실상 정점 셰이더는 메모리에서 데이터를 *pulling*합니다.
</p>
</div>

