Title: WebGL 최적화 - 인스턴스 드로잉
Description: 동일한 객체의 여러 인스턴스 그리기
TOC: 인스턴스 드로잉


WebGL은 *인스턴스 드로잉*라는 기능을 가지고 있습니다.
기본적으로 개별적으로 그릴 때보다 빠르게 같은 걸 여러 번 그리는 방법입니다.

참고로 이 기능은 WebGL1의 선택적 확장이지만 [거의 모든 브라우저와 기기에서 사용 가능](https://web3dsurvey.com/webgl/extensions/ANGLE_instanced_arrays)합니다.

먼저 동일한 항목의 여러 인스턴스를 그리는 예제부터 만들어 봅시다.

[직교 투영](webgl-3d-orthographic.html)에 관한 글의 마지막 부분과 유사한 코드로 출발하여 다음과 같은 두 셰이더로 시작합니다.

```html
<!-- 정점 셰이더 -->
<script id="vertex-shader-3d" type="x-shader/x-vertex">
attribute vec4 a_position;
uniform mat4 matrix;

void main() {
  // 위치에 행렬 곱하기
  gl_Position = matrix * a_position;
}
</script>
```

그리고

```html
<!-- 프래그먼트 셰이더 -->
<script id="fragment-shader-3d" type="x-shader/x-fragment">
precision mediump float;

uniform vec4 color;

void main() {
  gl_FragColor = color;
}
</script>  
```

정점 셰이더는 각 정점을 [해당 글](webgl-3d-orthographic.html)에서 다룬 상당히 유연한 배열인 단일 행렬로 곱합니다.
프래그먼트 셰이더는 유니폼을 통해 전달한 색상을 사용합니다.

그리기 위해서는 세이더를 컴파일하고 서로 연결한 다음 속성과 유니폼의 위치를 찾아야 합니다.

```js
const program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getUniformLocation(program, 'color');
const matrixLoc = gl.getUniformLocation(program, 'matrix');
```

그런 다음 버퍼를 통해 위치에 대한 데이터를 제공해야 합니다.

```js
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -0.1,  0.4,
  -0.1, -0.4,
   0.1, -0.4,
   0.1, -0.4,
  -0.1,  0.4,
   0.1,  0.4,
   0.4, -0.1,
  -0.4, -0.1,
  -0.4,  0.1,
  -0.4,  0.1,
   0.4, -0.1,
   0.4,  0.1,
]), gl.STATIC_DRAW);
const numVertices = 12;
```

5개의 인스턴스를 그려봅시다.
각 인스턴스에 대해 5개의 행렬과 5개의 색상을 만들겁니다.

```js
const numInstances = 5;
const matrices = [
  m4.identity(),
  m4.identity(),
  m4.identity(),
  m4.identity(),
  m4.identity(),
];

const colors = [
  [ 1, 0, 0, 1, ],  // 빨간색
  [ 0, 1, 0, 1, ],  // 초록색
  [ 0, 0, 1, 1, ],  // 파란색
  [ 1, 0, 1, 1, ],  // 자주색
  [ 0, 1, 1, 1, ],  // 청록색
];
```

그리기 위해서는 먼저 셰이더 프로그램을 사용해서, 속성을 설정하고, 5개의 인스턴스를 반복한 다음, 각각에 대한 새로운 행렬을 계산하고, 행렬의 유니폼과 색상을 설정 후 그립니다.

```js
function render(time) {
  time *= 0.001; // 초 단위

  gl.useProgram(program);

  // 위치 속성 설정
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(
    positionLoc,  // 위치
    2,            // 크기 (반복마다 버퍼에서 가져오는 값의 개수)
    gl.FLOAT,     // 버퍼 데이터 타입
    false,        // 정규화
    0,            // 스트라이드 (0 = 위 크기와 타입으로 계산)
    0,            // 버퍼 오프셋
  );

  matrices.forEach((mat, ndx) => {
    m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
    m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

    const color = colors[ndx];

    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(matrixLoc, false, mat);

    gl.drawArrays(
      gl.TRIANGLES,
      0,             // 오프셋
      numVertices,   // 인스턴스당 정점 수
    );
  });

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

참고로 행렬 수학 라이브러리는 각 행렬 수학 함수의 끝에서 선택적 대상 행렬을 사용합니다.
대부분의 글에서 이 기능을 사용하지 않고 라이브러리가 새로운 행렬을 할당하도록 했지만 이번에는 이미 생성된 행렬에 결과를 저장하려 합니다.

이는 잘 동작하며 다른 색상을 가진 5개의 더하기 기호가 회전합니다.

{{{example url="../webgl-instanced-drawing-not-instanced.html"}}}

`gl.uniform4v`, `gl.uniformMatrix4fv`, `gl.drawArrays`를 각각 5번 호출하여 총 15번의 WebGL 호출을 가지는데요.
셰이더가 더 복잡하다면, [스포트라이트](webgl-3d-lighting-spot.html)의 셰이더처럼, 6번의 `gl.uniformXXX` 호출과 한 번의 `gl.drawArrays` 호출로, 객체당 최소 7번의 호출을 가집니다.
400개의 객체를 그린다면 2800 WebGL 호출이 될 겁니다.

색인화은 이러한 호출을 줄이는 방법입니다.
이는 동일한 항목을 몇 번 그려야 하는지 WebGL에 알려주는 방식으로 작동합니다.
각 속성에 대해 정점 셰이더가 호출될 때마다 해당 속성을 할당된 버퍼에서 *다음 값*으로 진행할지(기본값), 또는 일반적으로 N이 1인 모든 N 인스턴스만 진행할지 지정합니다.

예를 들어 유니폼에서 `matrix`와 `color`를 제공하는 대신, `attribute`를 통해 제공할 수 있는데요.
각 인스턴스의 행렬과 색상을 버퍼에 넣고, 속성이 해당 버퍼에서 데이터를 가져오도록 설정한 다음, 인스턴스당 한 번만 다음 값으로 진행하도록 WebGL에 지시할 겁니다.

해봅시다!

먼저 해야할 일은 WebGL의 해당 선택적 기능을 확인하고 활성화하는 겁니다.
[`ANGLE_instanced_arrays`](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays)라고 합니다.

```js
const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
  return;
}

+const ext = gl.getExtension('ANGLE_instanced_arrays');
+if (!ext) {
+  return alert('need ANGLE_instanced_arrays');
+}
```

다음은 `matrix`와 `color`에 대해 유니폼 대신 속성을 사용하도록 셰이더를 수정할 겁니다.

```html
<!-- 정점 셰이더 -->
<script id="vertex-shader-3d" type="x-shader/x-vertex">
attribute vec4 a_position;
-uniform mat4 matrix;
+attribute vec4 color;
+attribute mat4 matrix;
+
+varying vec4 v_color;

void main() {
  // 위치에 행렬 곱하기
  gl_Position = matrix * a_position;

+  // 프래그먼트 셰이더로 정점 색상 전달
+  v_color = color;
}
</script>
```

그리고

```html
<!-- 프래그먼트 셰이더 -->
<script id="fragment-shader-3d" type="x-shader/x-fragment">
precision mediump float;

-uniform vec4 color;
+// 정점 셰이더에서 전달됩니다.
+varying vec4 v_color;

void main() {
-  gl_FragColor = color;
+  gl_FragColor = v_color;
}
</script>  
```

속성은 정점 셰이더에서만 작동하므로 정점 셰이더의 속성에서 색상을 가져와서 varying을 통해 프래그먼트 셰이더로 전달해야 합니다.

다음으로 해당 속성의 위치를 찾아야 합니다.

```js
const program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

const positionLoc = gl.getAttribLocation(program, 'a_position');
-const colorLoc = gl.getUniformLocation(program, 'color');
-const matrixLoc = gl.getUniformLocation(program, 'matrix');
+const colorLoc = gl.getAttribLocation(program, 'color');
+const matrixLoc = gl.getAttribLocation(program, 'matrix');
```

이제, 속성에 적용될 행렬을 넣을 버퍼가 필요합니다.
버퍼는 하나의 *chuck*에서 가장 잘 업데이트되기 때문에 모든 행렬을 동일한 `Float32Array`에 넣을 겁니다.

```js
// 인스턴스당 하나씩 행렬 설정
const numInstances = 5;
+// 행렬당 하나의 뷰로 형식화 배열 만들기
+const matrixData = new Float32Array(numInstances * 16);
```

그런 다음 각 행렬에 대해 하나씩, `Float32Array` 뷰를 만들 겁니다.

```js
-const matrices = [
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-];
const matrices = [];
for (let i = 0; i < numInstances; ++i) {
  const byteOffsetToMatrix = i * 16 * 4;
  const numFloatsForView = 16;
  matrices.push(
    new Float32Array(
      matrixData.buffer,
      byteOffsetToMatrix,
      numFloatsForView
    )
  );
}
```

이렇게 하면 모든 행렬에 대한 데이터를 참조하고 싶을 때 `matrixData`를 사용할 수 있고, 어느 개별적인 행렬을 원한다면 `matrices[ndx]`를 사용할 수 있습니다.

또한 이 데이터를 위해 GPU에 버퍼를 생성해야 합니다.
이 시점에서는 버퍼를 할당하기만 하면 되며, 데이터를 제공할 필요는 없으므로, `gl.bufferData`에 대한 두 번째 매개변수는 버퍼를 할당하는 크기입니다.

```js
const matrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
// 버퍼 할당
gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);
```

`gl.DYNAMIC_DRAW`를 마지막 매개변수로 전달했음에 주목하세요.
이건 WebGL에 이 데이터가 자주 바뀔 것이라는 *hint*입니다.

다음으로 버퍼에도 색상이 필요합니다.
최소한 이 예제에서, 이 데이터는 바뀌지 않을 것이므로, 데이터를 업로드하기만 하면 됩니다.

```js
-const colors = [
-  [ 1, 0, 0, 1, ],  // 빨간색
-  [ 0, 1, 0, 1, ],  // 초록색
-  [ 0, 0, 1, 1, ],  // 파란색
-  [ 1, 0, 1, 1, ],  // 자주색
-  [ 0, 1, 1, 1, ],  // 청록색
-];
+// 인스턴스당 하나씩, 행렬 설정
+const colorBuffer = gl.createBuffer();
+gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
+gl.bufferData(gl.ARRAY_BUFFER,
+  new Float32Array([
+    1, 0, 0, 1,  // 빨간색
+    0, 1, 0, 1,  // 초록색
+    0, 0, 1, 1,  // 파란색
+    1, 0, 1, 1,  // 자주색
+    0, 1, 1, 1,  // 청록색
+  ]),
+  gl.STATIC_DRAW);
```

그릴 때 각 instance를 순환하는 대신, 행렬과 색상 uniform을 설정한 다음, 그리기를 호출하기 전에 각 instance에 대한 행렬을 먼저 계산할 겁니다.

```js
// 모든 행렬 업데이트
matrices.forEach((mat, ndx) => {
  m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
  m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

-  const color = colors[ndx];
-
-  gl.uniform4fv(colorLoc, color);
-  gl.uniformMatrix4fv(matrixLoc, false, mat);
-
-  gl.drawArrays(
-    gl.TRIANGLES,
-    0,             // 오프셋
-    numVertices,   // 인스턴스당 정점 수
-  );
});
```

행렬 라이브러리가 선택적 대상 행렬을 사용하고, 행렬은 `Float32Array` 뷰로 동일하게 더 큰 `Float32Array`일 뿐이기 때문에, 완료되면 모든 행렬 데이터는 GPU에 직접 업로드할 준비가 끝납니다.

```js
// 새로운 행렬 데이터 업로드
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);
```

이제 행렬과 색상에 대한 속성을 설정해야 합니다.
행렬 속성은 `mat4`인데요.
`mat4`는 실제로 4개의 속성 슬롯을 사용합니다.

```js
const bytesPerMatrix = 4 * 16;
for (let i = 0; i < 4; ++i) {
  const loc = matrixLoc + i;
  gl.enableVertexAttribArray(loc);
  // 스트라이드와 오프셋에 유의
  const offset = i * 16;  // 행당 4float, float당 4byte
  gl.vertexAttribPointer(
    loc,              // 위치
    4,                // 크기 (반복마다 버퍼에서 가져오는 값의 개수)
    gl.FLOAT,         // 버퍼 데이터 타입
    false,            // 정규화
    bytesPerMatrix,   // 스트라이드, 다음 값 세트를 가져오기 위해 진행할 바이트 수
    offset,           // 버퍼 오프셋
  );
  // 이 줄은 각 1개의 인스턴스에 대해서만 속성이 변경됨을 나타냄
  ext.vertexAttribDivisorANGLE(loc, 1);
}
```

인스턴스 드로잉과 관련하여 가장 중요한 점은 `ext.vertexAttribDivisorANGLE`에 대한 호출입니다.
인스턴스당 한 번만 다음 값으로 진행하도록 이 속성을 설정하는데요.
이는 `matrix` 속성이 첫 번째 인스턴스에 대한 모든 정점에 대해 첫 번째 행렬을, 두 번째 인스턴스에 대해 두 번째 행렬을 사용하는 식입니다.

색상 속성도 설정해야 하는데,

```js
// 색상에 대한 속성 설정
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.enableVertexAttribArray(colorLoc);
gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
// 이 줄은 각 1개의 인스턴스에 대해서만 속성이 변경됨을 나타냄
ext.vertexAttribDivisorANGLE(colorLoc, 1);
```

이 두 속성을 사용하여 다른 걸 그리고 싶다면 약수를 기본값인 0으로 다시 설정하거나, [정점 배열 객체](webgl-attributes.html#vaos)를 사용해야 합니다.

드디어 단일 그리기 호출로 모든 인스턴스를 그릴 수 있습니다.

```js
ext.drawArraysInstancedANGLE(
  gl.TRIANGLES,
  0,             // 오프셋
  numVertices,   // 인스턴스당 정점 수
  numInstances,  // 인스턴스 수
);
```

{{{example url="../webgl-instanced-drawing.html"}}}

위 예제는 도형당 3번의 WebGL 호출을 하고 도형의 개수는 5개로 총 15번의 호출이 있었습니다.
하나는 행렬 업로드, 다른 하나는 그리기, 이제 5개의 도형에 대해 2번의 호출만 가집니다.
그리기 시작하기 위한 색상과 행렬에 대한 몇 가지 설정이 있습니다.
[Vertex array object](webgl-attributes.html#vaos)를 사용하여 해당 설정을 렌더링 시점에서 초기화 시점으로 옮길 수 있습니다.

말할 필요도 없다고 느껴지지만 하긴 저는 너무 많이 했기 때문에 당연한 것일 수도 있습니다.
위 코드는 캔버스적인 측면을 고려하지 않았는데요.
[투영 행렬](webgl-3d-orthographic.html)이나 [뷰 행렬](webgl-3d-camera.html)을 사용하지 않습니다.
오로지 인스턴스 드로잉을 보여주기 위한 것입니다.
투영 행렬이나 뷰 행렬을 원한다면 자바스크립트에 계산을 추가할 수 있습니다.
이는 자바스크립트의 작업이 더 많아짐을 의미합니다.
좀 더 확실한 방법은 1개 혹은 2개 이상의 유니폼을 정점 셰이더에 추가하는 겁니다.

```html
<!-- 정점 셰이더 -->
<script id="vertex-shader-3d" type="x-shader/x-vertex">
attribute vec4 a_position;
attribute vec4 color;
attribute mat4 matrix;
+uniform mat4 projection;
+uniform mat4 view;

varying vec4 v_color;

void main() {
  // 위치에 행렬 곱하기
-  gl_Position = matrix * a_position;
+  gl_Position = projection * view * matrix * a_position;

  // 프래그먼트 셰이더로 정점 색상 전달
  v_color = color;
}
</script>
```

그런 다음 초기화할 때 위치를 찾고,

```js
const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getAttribLocation(program, 'color');
const matrixLoc = gl.getAttribLocation(program, 'matrix');
+const projectionLoc = gl.getUniformLocation(program, 'projection');
+const viewLoc = gl.getUniformLocation(program, 'view');
```

렌더링할 때 적절하게 설정합니다.

```js
gl.useProgram(program);

+// 모든 인스턴스에 공유되므로 뷰와 투영 행렬 설정
+const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
+gl.uniformMatrix4fv(projectionLoc, false, m4.orthographic(-aspect, aspect, -1, 1, -1, 1));
+gl.uniformMatrix4fv(viewLoc, false, m4.zRotation(time * .1));
```

{{{example url="../webgl-instanced-drawing-projection-view.html"}}}

