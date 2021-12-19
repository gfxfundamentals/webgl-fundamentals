Title: WebGL 속성
Description: WebGL의 속성이 뭔가요?
TOC: 속성


이 글은 WebGL에서 attribute 상태가 어떻게 설정되는지에 대한 대략적인 이미지를 제공하기 위해 작성되었습니다.
텍스처 유닛에 관한 [비슷한 글](webgl-texture-units.html)이 있습니다.

이 글을 읽기 전에 [WebGL 작동 방식](webgl-how-it-works.html)와 [WebGL 셰이더와 GLSL](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html)을 읽어보시길 바랍니다.

## 속성

WebGL의 속성은 버퍼에서 데이터를 가져오는 정점 셰이더에 대한 입력 값입니다.
WebGL은 `gl.drawArrays`나 `gl.drawElements`가 호출될 때 사용자가 제공한 정점 셰이더를 N번 실행하는데요.
각 반복마다 속성은 바인딩된 버퍼에서 데이터를 가져와 정점 셰이더 내부의 속성에 제공하는 방법을 정의합니다.

자바스크립트로 구현되었다면 이런식으로,

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

위에서 볼 수 있듯이 8개의 속성이 있습니다.

`gl.enableVertexAttribArray(location)`나 `gl.disableVertexAttribArray`를 호출한다면 이렇게 생각할 수 있는데,

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

즉 위치는 속성의 인덱스를 직접 참조합니다.

마찬가지로 `gl.vertexAttribPointer`는 속성의 거의 모든 설정에 사용됩니다.
다음과 같이 구현되는데요.

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

다음은 정점 셰이더입니다.
정점 셰이더에서는 속성을 선언합니다.
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

`gl.linkProgram(someProgram)`를 호출하여 정점 셰이더와 프래그먼트 셰이더를 연결할 때 WebGL(driver/GPU/browser)은 각 속성에 사용할 인덱스/위치를 자체적으로 결정하는데요.
수동(아래 참조)으로 위치를 지정하지 않는 한 어떤 위치를 선택할지 알 수 없습니다.
오직 브라우저/드라이버/GPU에 달려있죠.
따라서 위치, 텍스처 좌표, 법선에 어떤 속성을 사용했는지 물어봐야 하는데 `gl.getAttribLocation`을 호출하면 됩니다.

```js
const positionLoc = gl.getAttribLocation(program, 'position');
const texcoordLoc = gl.getAttribLocation(program, 'texcoord');
const normalLoc = gl.getAttribLocation(program, 'normal');
```

`positionLoc` = `5`라고 해봅시다.
이건 정점 셰이더가 실행될 때(`gl.drawArrays`나 `gl.drawElements`를 호출할 때) 정점 셰이더는 여러분이 알맞은 타입, 크기, 오프셋, 스트라이드, 버퍼 등으로 속성 5를 설정할 것이라 예상한다는 걸 의미합니다.

참고로 프로그램을 연결하기 전에는 `gl.bindAttribLocation(program, location, nameOfAttribute)`을 호출하여 위치를 선택할 수 있습니다.
예제:

```js
// 속성 #7을 사용해 "position"을 할당하도록 "gl.linkProgram"에 지시
gl.bindAttribLocation(program, 7, 'position');
```

## 속성 상태

위 설명에서 누락된 것이 있는데 각 속성에도 기본값이 있다는 겁니다.
사용하는 경우가 드물기 때문에 위 설명에서 생략했는데요.

```js
attributes: [
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, value: [0, 0, 0, 1], },
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, value: [0, 0, 0, 1], },
   ..
```

다양한 `gl.vertexAttribXXX` 함수로 각 속성의 값을 설정할 수 있습니다.
그 값은 `enable`이 false일 때 사용되는데요.
`enable`이 true면 속성의 데이터는 할당된 버퍼에서 가져옵니다.

<a id="vaos"></a>
## Vertex Array Object (VAO)

WebGL에는 `OES_vertex_array_object`라는 확장이 있습니다.

위 다이어그램에서 `OES_vertex_array_object` 확장으로 `vertexArray`를 대체할 수 있습니다.

```js
const vao = ext.createVertexArrayOES();
```

위 *의사 코드*에서 `gl.vertexArray`에 첨부된 객체를 생성하는데요.
`ext.bindVertexArrayOES(vao)`를 호출하면 생성된 정점 배열 객체가 현재 정점 배열로 할당됩니다.

```js
// 의사 코드
ext.bindVertexArrayOES = function(vao) {
  gl.vertexArray = vao ? vao : defaultVAO;
};
```

이렇게 하면 현재 VAO의 모든 속성과 `ELEMENT_ARRAY_BUFFER`를 설정할 수 있으므로 특정한 모양을 그리고 싶을 때 `ext.bindVertexArrayOES` 호출 한 번으로 모든 속성을 효과적으로 설정하는 반면 확장이 없으면 **속성마다** `gl.bindBuffer`, `gl.vertexAttribPointer` 모두 최대 한 번씩 호출할 수 있습니다.

정점 배열 객체를 사용하는 게 확실히 좋다는 걸 보실 수 있을텐데요.
이것들을 사용하려면 종종 더 많은 편성이 필요한데요.
예를 들어 하나의 셰이더와 `gl.TRIANGLES`로 큐브를 그리고 다른 셰이더와 `gl.LINES`로 다시 그리고 싶다고 해봅시다.
삼각형으로 그릴 때 조명에 법선을 사용하여 아래처럼 셰이더에 속성을 선언한다고 가정하겠습니다.

```glsl
// 조명 셰이더
// 삼각형으로 그려진 큐브의 셰이더

attribute vec4 a_position;
attribute vec3 a_normal;
```

그런 다음 [조명에 관한 첫 번째 글](webgl-3d-lighting-directional.html)에서 다룬 것처럼 위치와 법선을 사용합니다.

조명을 원하지 않는 선의 경우, 단색이 필요하므로 튜토리얼 [첫 페이지](webgl-fundamentals.html)에 있는 첫 번째 셰이더와 비슷한 작업을 수행합니다.
색상에 대한 유니폼을 선언하는데요.
이건 정점 셰이더에서 위치만 필요하다는 뜻입니다

```glsl
// 솔리드 셰이더
// 선으로 이루어진 큐브용 셰이더

attribute vec4 a_position;
```

각 셰이더의 속성이 어떤 위치로 결정될지 알 수 없습니다.
위 조명 세이더의 위치로 가정해봅시다.

```
a_position location = 1
a_normal location = 0
```

그리고 속성을 한 개만 가지는 솔리드 셰이더의 경우,

```
a_position location = 0
```

셰이더를 전환할 때 속성을 다르게 설정해야 한다는 건 분명합니다.
어떤 셰이더는 `a_position`의 데이터가 속성 0에 나타날 것이라 예상하죠.
다른 셰이더는 속성 1에 나타날 것이라 예상합니다.

속성 재설정은 추가 작업입니다.
더 나쁜 건, 정점 배열 객체를 사용하는 것의 요점은 해당 작업을 할 필요가 없다는 겁니다.
이 문제를 고치기 위해 셰이더 프로그램을 연결하기 전에 위치를 할당하겠습니다.

```js
gl.bindAttribLocation(solidProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 1, 'a_normal');
```

**gl.linkProgram을 호출하기 전입니다.**
이건 셰이더를 연결할 때 WebGL에 할당할 위치를 알려주는데요.
이제 양쪽 셰이더에서 동일한 VAO를 사용할 수 있습니다.

## 최대 속성 수

WebGL은 적어도 8개의 속성가 지원되어야 하지만 특정 컴퓨터 / 브라우저 / 구현 / 드라이버는 더 많이 지원할 수 있습니다.
아래 호출을 통해 얼마나 많이 지원되는지 확인할 수 있는데

```js
const maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
```

8개보다 많이 사용하기로 결정했다면 실제로 얼마나 지원되는지 확인하고 컴퓨터가 충분히 가지고 있지 않다면 사용자에게 알리거나 더 간단한 셰이더로 폴백하는 게 좋습니다.

