Title: WebGL Attribute
Description: WebGL의 attribute는 뭔가요?
TOC: Attribute


이 글은 WebGL에서 attribute 상태가 어떻게 설정되는지에 대한 대략적인 이미지를 제공하기 위해 작성되었습니다.
Texture unit에 관한 [비슷한 글](webgl-texture-units.html)이 있습니다.

이 글을 읽기 전에 [WebGL 작동 원리](webgl-how-it-works.html)와 [WebGL 셰이더와 GLSL](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html)을 읽어보시길 바랍니다.

## Attribute

WebGL의 attribute는 버퍼에서 데이터를 가져오는 vertex shader에 대한 입력 값입니다.
WebGL은 `gl.drawArrays`나 `gl.drawElements`가 호출될 때 사용자가 제공한 vertex shader를 N번 실행하는데요.
각 반복마다 attribute는 바인딩된 버퍼에서 데이터를 가져와 vertex 셰이더 내부의 attribute에 제공하는 방법을 정의합니다.

javascript로 구현되었다면 이런식으로

```js
// 의사 코드
const gl = {
  arrayBuffer: null,
  vertexArray: {
    attributes: [
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
    ],
    elementArrayBuffer: null,
  },
}
```

위에서 볼 수 있듯이 8개의 attribute가 있습니다.

`gl.enableVertexAttribArray(location)`나 `gl.disableVertexAttribArray`를 호출한다면 이렇게 생각할 수 있는데

```js
// 의사 코드
gl.enableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = true;
};

gl.disableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = false;
};
```

즉 location은 attributes의 index를 직접 참조합니다.

마찬가지로 `gl.vertexAttribPointer`는 attribute의 거의 모든 설정에 사용됩니다.
다음과 같이 구현되는데

```js
// 의사 코드
gl.vertexAttribPointer = function(location, size, type, normalize, stride, offset) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.size = size;
  attrib.type = type;
  attrib.normalize = normalize;
  attrib.stride = stride ? stride : sizeof(type) * size;
  attrib.offset = offset;
  attrib.buffer = gl.arrayBuffer;  // !!!! <-----
};
```

참고로 `gl.vertexAttribPointer`를 호출할 때 `attrib.buffer`는 현재 `gl.arrayBuffer`가 설정된 값으로 설정되는데요.
위 의사 코드에서 `gl.arrayBuffer`는 `gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer)`를 호출하여 설정됩니다.

```js
// 의사 코드
gl.bindBuffer = function(target, buffer) {
  switch (target) {
    case ARRAY_BUFFER:
      gl.arrayBuffer = buffer;
      break;
    case ELEMENT_ARRAY_BUFFER;
      gl.vertexArray.elementArrayBuffer = buffer;
      break;
  ...
};
```

자, 다음은 vertex shader입니다.
Vertex shader에서는 attribute를 선언합니다.
예를 들어:

```glsl
attribute vec4 position;
attribute vec2 texcoord;
attribute vec3 normal;

...

void main() {
  ...
}
```

`gl.linkProgram(someProgram)`를 호출하여 vertex shader와 fragment shader를 연결할 때 WebGL(driver/GPU/browser)은 각 attribute에 사용할 index/location를 자체적으로 결정하는데요.
수동(아래 참조)으로 location을 지정하지 않는 한 어떤 location을 선택할지 알 수 없습니다.
오직 browser/driver/GPU에 달려있죠.
따라서 position, texcoord, normal에 어떤 attribute를 사용했는지 물어봐야 합니다.
`gl.getAttribLocation`을 호출하면 되는데

```js
const positionLoc = gl.getAttribLocation(program, 'position');
const texcoordLoc = gl.getAttribLocation(program, 'texcoord');
const normalLoc = gl.getAttribLocation(program, 'normal');
```

`positionLoc` = `5`라고 해봅시다.
이건 vertex shader가 실행될 때(`gl.drawArrays`나 `gl.drawElements`를 호출할 때) vertex shader는 여러분이 알맞은 type, size, offset, stride, buffer 등으로 attribute 5를 설정할 것이라 예상한다는 걸 의미합니다.

참고로 program을 연결하기 전에는 `gl.bindAttribLocation(program, location, nameOfAttribute)`을 호출하여 location을 선택할 수 있습니다.
예제:

```js
// attribute #7을 사용해 `position`을 할당하도록 `gl.linkProgram`에 지시
gl.bindAttribLocation(program, 7, 'position');
```

## Full Attribute State

위 설명에서 누락된 것이 있는데 각 attribute에도 기본값이 있다는 겁니다.
사용하는 경우가 드물기 때문에 위 설명에서 생략했는데요.

```js
attributes: [
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, value: [0, 0, 0, 1], },
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, value: [0, 0, 0, 1], },
   ..
```

다양한 `gl.vertexAttribXXX` 함수로 각 attribute의 값을 설정할 수 있습니다.
그 값은 `enable`이 false일 때 사용되는데요.
enable이 true면 attribute의 데이터는 할당된 버퍼에서 가져옵니다.

<a id="vaos"></a>
## Vertex Array Object (VAO)

WebGL에는 `OES_vertex_array_object`라는 extension이 있습니다.

위 다이어그램에서 `OES_vertex_array_object` extension으로 `vertexArray`를 대체할 수 있습니다.
다시 말해

```js
const vao = ext.createVertexArrayOES();
```

위 *의사 코드*에서 `gl.vertexArray`에 첨부된 객체를 생성하는데요.
`ext.bindVertexArrayOES(vao)`를 호출하면 생성된 vertex array object가 current vertex array로 할당됩니다.

```js
// 의사 코드
ext.bindVertexArrayOES = function(vao) {
  gl.vertexArray = vao ? vao : defaultVAO;
};
```

이렇게 하면 현재 VAO의 모든 attribute와 `ELEMENT_ARRAY_BUFFER`를 설정할 수 있으므로 특정한 모양을 그리고 싶을 때 `ext.bindVertexArrayOES` 호출 한 번으로 모든 attribute를 효과적으로 설정하는 반면 extension이 없으면 **attribute마다** `gl.bindBuffer`, `gl.vertexAttribPointer` 모두 최대 한 번씩 호출할 수 있습니다.

vertex array object를 사용하는 게 확실히 좋다는 걸 보실 수 있을텐데요.
이것들을 사용하려면 종종 더 많은 organization이 합니다.
예를 들어 하나의 셰이더와 `gl.TRIANGLES`로 큐브를 그리고 다른 셰이더와 `gl.LINES`로 다시 그리고 싶다고 해봅시다.
삼각형으로 그릴 때 조명에 법선을 사용하여 아래처럼 셰이더에 attribute를 선언한다고 가정하면:

```glsl
// lighting-shader
// 삼각형으로 그려진 큐브의 셰이더

attribute vec4 a_position;
attribute vec3 a_normal;
```

그런 다음 [조명에 관한 첫 번째 글](webgl-3d-lighting-directional.html)에서 다룬 것처럼 위치와 법선을 사용합니다.

조명을 원하지 않는 선의 경우, 단색이 필요하므로 튜토리얼 [첫 페이지](webgl-fundamentals.html)에 있는 첫 번째 셰이더와 비슷한 작업을 수행합니다.
color에 대한 uniform을 선언하는데요.
이건 vertex shader에서 position만 필요함을 뜻합니다.

```glsl
// solid-shader
// 선으로 이루어진 큐브용 셰이더

attribute vec4 a_position;
```

각 셰이더의 attribute가 어떤 location으로 결정될지 알 수 없습니다.
위 lighting-shader의 location으로 가정해보면

```
a_position location = 1
a_normal location = 0
```

그리고 attribute를 한 개만 가지는 solid-shader의 경우

```
a_position location = 0
```

셰이더를 전환할 때 attribute를 다르게 설정해야 한다는 건 분명합니다.
어떤 셰이더는 `a_position`의 데이터가 attribute 0에 나타날 것이라 예상하죠.
다른 셰이더는 attribute 1에 나타날 것이라 예상합니다.

attribute 재설정은 추가 작업입니다.
더 나쁜 건, vertex array object 사용하는 것의 요점은 해당 작업을 할 필요가 없다는 겁니다.
이 문제를 고치기 위해 shader program을 연결하기 전에 location을 할당하겠습니다.

```js
gl.bindAttribLocation(solidProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 1, 'a_normal');
```

**gl.linkProgram을 호출하기 전입니다.**
이건 셰이더를 연결할 때 WebGL에 할당할 location을 알려주는데요.
이제 양쪽 셰이더에서 동일한 VAO를 사용할 수 있습니다.

## Maximum Attribute

WebGL은 적어도 8개의 attribute가 지원되어야 하지만 특정 computer / browser / implementation / driver는 더 많이 지원할 수 있습니다.
아래 호출을 통해 얼마나 많이 지원되는지 확인할 수 있는데

```js
const maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
```

8개보다 많이 사용하기로 결정했다면 실제로 얼마나 지원되는지 확인하고 컴퓨터가 충분히 가지고 있지 않다면 사용자에게 알리거나 더 간단한 셰이더로 fallback하는 게 좋습니다.

