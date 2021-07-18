Title: WebGL Indexed Vertices
Description: gl.drawElements를 사용하는 방법
TOC: Indexed Vertices (gl.drawElements)


이 글은 최소한 [기초에 대한 글](webgl-fundamentals.html)을 읽었다고 가정합니다.
아직 읽지 않았다면 [거기](webgl-fundamentals.html)부터 시작해야 합니다.

이건 `gl.drawElements`를 다루는 짧은 글입니다.
WebGL에는 2가지 기본 드로잉 함수가 있는데요.
`gl.drawArrays`와 `gl.drawElements`입니다.
하나 혹은 또 다른 걸 명시적으로 호출하는 사이트 글의 대부분은 가장 복잡하지 않기 때문에 `gl.drawArrays`를 호출합니다.

반면에 `gl.drawElements`는 정점 색인으로 채워진 버퍼를 사용하고 이를 기반으로 그립니다.

[첫 글](webgl-fundamentals.html)에서 사각형을 그리는 예제를 가져와서 `gl.drawElements`를 사용하도록 만들어봅시다.

해당 코드에서 각 3개의 정점을 가진 삼각형 2개, 총 6개의 정점으로 사각형을 만들었습니다.

다음은 6개의 정점 위치를 제공하는 코드입니다.

```js
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,  // 정점 0
    x2, y1,  // 정점 1
    x1, y2,  // 정점 2
    x1, y2,  // 정점 3
    x2, y1,  // 정점 4
    x2, y2,  // 정점 5
  ]), gl.STATIC_DRAW);
```

대신에 4개의 정점 데이터를 사용할 수도 있습니다.

```js
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,  // 정점 0
    x2, y1,  // 정점 1
    x1, y2,  // 정점 2
    x2, y2,  // 정점 3
  ]), gl.STATIC_DRAW);
```

하지만, 여전히 삼각형 2개를 그리려면 총 6개의 정점을 그리도록 WebGL에 지시해야 하기 때문에 색인을 사용하는 다른 버퍼를 추가해야 합니다.

이를 위해 또 다른 버퍼를 생성하지만 다른 바인딩 포인트를 사용하는데요.
`ARRAY_BUFFER` 바인딩 포인트 대신에 항상 색인에 사용되는 `ELEMENT_ARRAY_BUFFER` 바인딩 포인트를 사용합니다.

```js
// 버퍼 생성
const indexBuffer = gl.createBuffer();

// 이 버퍼를 현재 'ELEMENT_ARRAY_BUFFER'로 만들기
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

// 현재 요소 배열 버퍼를 데이터로 채우기
const indices = [
  0, 1, 2,   // 첫 번째 삼각형
  2, 1, 3,   // 두 번째 삼각형
];
gl.bufferData(
  gl.ELEMENT_ARRAY_BUFFER,
  new Uint16Array(indices),
  gl.STATIC_DRAW
);
```

WebGL에 있는 모든 데이터처럼 색인에 대한 특정한 표현이 필요합니다.
`new Uint16Array(indices)`를 사용하여 색인을 unsigned 16bit integer로 변환한 뒤 버퍼에 업로드합니다.

그릴 때 사용하고자 하는 색인을 담고있는 버퍼를 바인딩해야 합니다.

```js
  // 색인을 포함하는 버퍼 할당
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
```

그런 다음 `drawElements`를 사용하여 그립니다.

```js
// 사각형 그리기
var primitiveType = gl.TRIANGLES;
var offset = 0;
var count = 6;
-gl.drawArrays(primitiveType, offset, count);
+var indexType = gl.UNSIGNED_SHORT;
+gl.drawElements(primitiveType, count, indexType, offset);
```

이전과 동일한 결과를 얻었지만 6개 대신에 4개의 정점 데이터를 제공하면 됩니다.
여전히 WebGL에 정점 6개를 그리라고 요청해야 하지만 색인을 통해 4개의 정점 데이터를 재사용할 수 있습니다.

{{{example url="../webgl-2d-rectangles-indexed.html"}}}

색인된 데이터를 사용할지 색인되지 않은 데이터를 사용할지 여부는 여러분이 정하시면 됩니다.

일반적으로 정점 위치가 사용되는 면에 따라 다른 데이터를 각 정점에 연결하고 싶어 하기 때문에, 색인된 정점은 보통 8개의 정점 위치를 가지는 큐브를 만들 수 없다는 점에 유의해야 합니다.
예를 들어 큐브의 각 면에 다른 색상을 주고 싶다면 위치와 함께 해당 색상을 제공해야 합니다.
따라서 정점에 닿는 각 면에 한 번씩 동일한 위치가 세 번 사용되더라도, 각자 다른 색상이 결합된 각 면마다 한 번씩 위치를 반복해야 합니다.
이는 큐브의 각 면에 4개씩 총 24개의 정점이, 필요한 12개의 삼각형을 그리려면 36개의 색인이 필요하다는 걸 의미합니다.

WebGL1에서 위의 `indexType`에 유효한 type은 색인을 0에서 255까지만 가질 수 있는 `gl.UNSIGNED_BYTE`와 최대 색인이 65535인 `gl.UNSIGNED_SHORT`임에 주의하세요.
`gl.UNSIGNED_INT`와 최대 4294967296까지 색인을 허용하는 `OES_element_index_uint` extension이 있는지 확인하고 활성화할 수 있습니다.

```js
const ext = gl.getExtension('OES_element_index_uint');
if (!ext) {
  // gl.UNSIGNED_SHORT 사용으로 되돌아 가거나 사용자에게 알림
}
```

[WebGLStats](https://webglstats.com/webgl/extension/OES_element_index_uint)에 따르면 거의 모든 기기에서 이 extension을 지원합니다.

<div class="webgl_bottombar">
<p>
참고: 위에서 색인을 버퍼에 넣을 때 <code>indexBuffer</code>를 <code>ELEMENT_ARRAY_BUFFER</code> 바인딩 포인트로 바인딩한 다음 나중에 다시 바인딩합니다.
왜 두 번 바인딩할까요?
</p>
<p>
이건 오로지 패턴을 보여주기 위한 겁니다.
일반적으로 하나 이상의 항목을 그리므로, 그리려는 각 항목에 대해 하나씩, 여러 색인 버퍼가 있는데요.
초기화할 때 이러한 버퍼를 만들고 데이터를 넣습니다.
렌더링할 때, 각 개별 항목을 그리기 전에 올바른 버퍼를 바인딩해야 합니다.
따라서, 여기에 있는 코드는 한 가지 항목이라 할지라도 해당 패턴을 따릅니다.
</p>
</div>

