Title: WebGL 데이터 없이 그리기
Description: 창의적 코딩 - 데이터 없이 그리기
TOC: 데이터 없이 그리기

이 글은 [기초](webgl-fundamentals.html)로 시작한 다른 글을 이미 읽었다고 가정합니다.
아직 읽지 않았다면 거기부터 시작해주세요.

[최소 WebGL 프로그램에 대한 글](webgl-smallest-programs.html)에서 굉장히 적은 코드로 그리는 예제를 다뤘는데요.
이 글에서는 데이터 없이 그려볼 겁니다.

관례적으로 WebGL 앱은 geometry 데이터를 버퍼에 넣습니다.
그런 다음 속성을 사용하여 버퍼에서 정점 데이터를 셰이더로 가져와 클립 공간으로 변환하는데요.

**관례적**이라는 점이 중요합니다.
이런 식으로 하는 것은 **관례**일 뿐입니다.
이는 결코 요구 사항이 아닙니다.
우리가 어떻게 하던지 WebGL은 상관하지 않고, 정점 셰이더가 클립 공간 좌표를 `gl_Position`에 할당하는 것만 신경씁니다.

그러니 위치 대신 개수만 속성에 제공해봅시다.

```js
const numVerts = 20;
const vertexIds = new Float32Array(numVerts);
vertexIds.forEach((v, i) => {
  vertexIds[i] = i;
});

const idBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertexIds, gl.STATIC_DRAW);
```

이제 그 개수만큼의 점으로 원을 그리는 정점 셰이더를 만듭니다.

```glsl
attribute float vertexId;
uniform float numVerts;

#define PI radians(180.0)

void main() {
  float u = vertexId / numVerts;      // 0 ~ 1
  float angle = u * PI * 2.0;         // 0 ~ 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;
  
  gl_Position = vec4(pos, 0, 1);
  gl_PointSize = 5.0;
}
```

위 코드는 아주 복잡하지 않아야 합니다.
`vertexId`은 0에서 `numVerts`까지 세어지는데요.
이를 기반으로 원의 위치를 생성합니다.

거기서 멈춘다면 클립 공간이 캔버스의 상하좌우로 정규화(-1 ~ 1)되기 때문에 원은 타원일 겁니다.
하지만 해상도를 전달하여 캔버스의 가로 -1부터 1까지가 세로 -1부터 1까지와 동일한 공간을 나타내지 않도록 할 수 있는데요.

```glsl
attribute float vertexId;
uniform float numVerts;
+uniform vec2 resolution;

#define PI radians(180.0)

void main() {
  float u = vertexId / numVerts;      // 0 ~ 1
  float angle = u * PI * 2.0;         // 0 ~ 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;
  
+  float aspect = resolution.y / resolution.x;
+  vec2 scale = vec2(aspect, 1);
  
+  gl_Position = vec4(pos * scale, 0, 1);
  gl_PointSize = 5.0;
}
```

그리고 fragment shader는 단색을 그리기만 하면 됩니다.

```glsl
precision mediump float;

void main() {
  gl_FragColor = vec4(1, 0, 0, 1);
}
```

초기화할 때 자바스크립트에서 셰이더를 컴파일하고 속성과 유니폼을 찾고,

```js
// setup GLSL program
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const vertexIdLoc = gl.getAttribLocation(program, 'vertexId');
const numVertsLoc = gl.getUniformLocation(program, 'numVerts');
const resolutionLoc = gl.getUniformLocation(program, 'resolution');
```

렌더링을 위해 프로그램을 사용하고, vertexId로 속성을 설정하며, `resolution` 그리고 `numVerts` 유니폼을 설정한 다음, 마지막으로 점을 그립니다.

```js
gl.useProgram(program);

{
  // 속성 활성화
  gl.enableVertexAttribArray(vertexIdLoc);

  // idBuffer 할당
  gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);

  // idBuffer(ARRAY_BUFFER)에서 데이터 가져오는 방법을 속성에 지시
  const size = 1;          // 반복마다 1개의 컴포넌트
  const type = gl.FLOAT;   // 데이터는 32bit float
  const normalize = false; // 데이터 정규화 안 함
  const stride = 0;        // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동 
  const offset = 0;        // 버퍼의 처음부터 시작
  gl.vertexAttribPointer(vertexIdLoc, size, type, normalize, stride, offset);
}

// 셰이더에게 정점의 개수를 알림
gl.uniform1f(numVertsLoc, numVerts);
// 셰이더에게 해상도를 알림
gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

const offset = 0;
gl.drawArrays(gl.POINTS, offset, numVerts);
```

그리고 점으로 그려진 원을 얻습니다.

{{{example url="../webgl-no-data-point-circle.html"}}}

이 기술이 유용할까요?
몇 가지 창의적인 코드를 사용해 거의 데이터 없이 단일 그리기 호출로 스타필드나 간단한 비 효과를 만들 수 있습니다.

작동하는지 보기 위해 비를 내리게 해봅시다.
먼저 정점 셰이더를 바꿀 겁니다.

```glsl
attribute float vertexId;
uniform float numVerts;
uniform float time;

void main() {
  float u = vertexId / numVerts;          // 0 ~ 1
  float x = u * 2.0 - 1.0;                // -1 ~ 1
  float y = fract(time + u) * -2.0 + 1.0; // 1.0 -> -1.0

  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 5.0;
}
```

이 경우에는 해상도가 필요하지 않습니다.

페이지가 로드된 이후 초 단위의 시간이 되는 유니폼 `time`을 추가했습니다.

'x'의 경우 -1에서 1사이가 됩니다.

'y'의 경우 `time + u`를 사용하지만 `fract`이 소수 부분만 반환하므로 값은 0.0에서 1.0사이가 됩니다.
이를 1.0에서 -1.0사이로 확장하면 시간이 지남에 따라 반복되지만 각 점에 대해 다르게 오프셋되는 y를 얻습니다.

Fragment shader에서 색상을 파란색으로 바꿔봅시다.

```glsl
precision mediump float;

void main() {
-  gl_FragColor = vec4(1, 0, 0, 1);
+  gl_FragColor = vec4(0, 0, 1, 1);
}
```

그런 다음 자바스크립트에서 유니폼 `time`을 찾아야 합니다.

```js
// GLSL 프로그램 설정
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const vertexIdLoc = gl.getAttribLocation(program, 'vertexId');
const numVertsLoc = gl.getUniformLocation(program, 'numVerts');
-const resolutionLoc = gl.getUniformLocation(program, 'resolution');
+const timeLoc = gl.getUniformLocation(program, 'time');
```

그리고 렌더링 루프를 만들고 유니폼 `time`을 설정하여 [애니메이션](webgl-animation.html)되는 코드로 변환해야 합니다.

```js
+function render(time) {
+  time *= 0.001;  // 초 단위로 변환

+  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(program);

  {
    // 속성 활성화
    gl.enableVertexAttribArray(vertexIdLoc);

    // idBuffer 할당
    gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);

    // idBuffer(ARRAY_BUFFER)에서 데이터 가져오는 방법을 속성에 지시
    const size = 1;          // 반복마다 1개의 컴포넌트
    const type = gl.FLOAT;   // 데이터는 32bit float
    const normalize = false; // 데이터 정규화 안 함
    const stride = 0;        // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
    const offset = 0;        // 버퍼의 처음부터 시작
    gl.vertexAttribPointer(vertexIdLoc, size, type, normalize, stride, offset);
  }

  // 셰이더에 정점의 개수를 알림
  gl.uniform1f(numVertsLoc, numVerts);
+  // 셰이더에 시간을 알림
+  gl.uniform1f(timeLoc, time);

  const offset = 0;
  gl.drawArrays(gl.POINTS, offset, numVerts);

+  requestAnimationFrame(render);
+}
+requestAnimationFrame(render);
```

{{{example url="../webgl-no-data-point-rain-linear.html"}}}

점들이 화면 아래로 내려가긴 하지만 모두 순서대로 내려갑니다.
약간의 무작위성을 추가해야 하는데요.
GLSL에는 랜덤 숫자 생성기가 없습니다.
대신에 충분히 랜덤으로 보이도록 생성하는 함수를 사용할 수 있습니다.

```glsl
// https://www.shadertoy.com/view/4djSRW
// 위의 해시 함수는 0에서 1사이의 값이 주어졌을 때 무작위로 나타나는 0과 1사이의 값을 반환합니다.
float hash(float p) {
  vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
  p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
  return fract(p2.x * p2.y * 95.4337);
}
```

그리고 이렇게 사용할 수 있습니다.

```glsl
void main() {
  float u = vertexId / numVerts;          // 0 ~ 1
-  float x = u * 2.0 - 1.0;                // -1 ~ 1
+  float x = hash(u) * 2.0 - 1.0;          // 랜덤 위치
  float y = fract(time + u) * -2.0 + 1.0; // 1.0 -> -1.0

  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 5.0;
}
```

이전의 0과 1사이 값을 `hash`에 전달하고 이는 0과 1사이의 유사 랜덤 값을 반환합니다.

점도 저 작게 만들어봅시다.

```glsl
  gl_Position = vec4(x, y, 0, 1);
-  gl_PointSize = 5.0;
+  gl_PointSize = 2.0;
```

그리고 그리는 점의 개수를 늘립니다.

```js
-const numVerts = 20;
+const numVerts = 400;
```

그러면 다음과 같은 결과를 얻습니다.

{{{example url="../webgl-no-data-point-rain.html"}}}

자세히 보면 일정 패턴의 비가 반복되는 것을 볼 수 있습니다.
바닥에 떨어졌다가 다시 위에서 나오게 됩니다.
3D 게임에서의 비 효과처럼 더 많은 일들이 백그라운드에서 일어나면 아무도 반복되는 걸 눈치채지 못할 겁니다.

약간의 무작위성을 더 추가하여 반복을 고칠 수 있습니다.

```glsl
void main() {
  float u = vertexId / numVerts;          // 0 ~ 1
+  float off = floor(time + u) / 1000.0;   // 각 정점에 대해 초당 한 번씩 변경
-  float x = hash(u) * 2.0 - 1.0;          // 랜덤 위치
+  float x = hash(u + off) * 2.0 - 1.0;    // 랜덤 위치
  float y = fract(time + u) * -2.0 + 1.0; // 1.0 -> -1.0

  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 2.0;
}
```

위 코드에서 `off`를 추가했습니다.
`floor`를 호출하기 때문에 `floor(time + u)`의 값은 각 정점에 대해 초당 한 번만 변경되는 초단위 타이머를 제공합니다.
이 오프셋은 점이 화면 아래로 이동하는 코드와 동기화되기 때문에, 점이 화면의 상단으로 다시 올라가는 동시에 `hash`에 값이 조금 추가되어, 새로운 랜덤 숫자와 이로 인한 새로운 랜덤 수평 위치를 얻게 됩니다.

결과는 반복되지 않는 비 효과입니다.

{{{example url="../webgl-no-data-point-rain-less-repeat.html"}}}

`gl.POINTS` 이상을 할 수 있을까요?
물론입니다! 

원을 만들어봅시다.
이를 위해 파이 조각처럼 중앙 주변의 삼각형이 필요한데요.
각 삼각형을 파이의 가장자리의 점 2개와 중앙에 점 1개가 있다고 생각할 수 있습니다.
파이의 각 조각에 대해 반복하면 다음과 같습니다.

<div class="webgl_center"><img src="resources/circle-points.svg" style="width: 400px;"></div>

따라서 먼저 파이 조각마다 한 번씩 변경되는 일종의 카운터가 필요합니다.

```glsl
float sliceId = floor(vertexId / 3.0);
```

그런 다음 원의 가장자리에 숫자가 필요합니다.

    0, 1, ?, 1, 2, ?, 2, 3, ?, ...

위 다이어그램을 보면 3번째 값이 항상 중앙(0,0)이여서 값에 관계없이 0으로 곱할 수 있기 때문에 ?는 중요하지 않습니다.

To get the pattern above this would work

```glsl
float triVertexId = mod(vertexId, 3.0);
float edge = triVertexId + sliceId;
```

가장자리의 점과 중앙의 점의 경우 이 패턴이 필요한데.
가장자리의 2개 다음 중앙에 1개를 반복합니다.

    1, 1, 0, 1, 1, 0, 1, 1, 0, ...

아래 코드를 이용해 해당 패턴을 얻을 수 있습니다.

```glsl
float radius = step(1.5, triVertexId);
```

a < b이면 `step(a, b)`는 0이고 그렇지 않으면 1인데요.
이렇게 생각할 수 있습니다.

```js
function step(a, b) {
  return a < b ? 0 : 1;
}
```

`triVertexId`이 1.5보다 크면 `step(1.5, triVertexId)`는 1이 됩니다.
각 삼각형의 처음 정점 2개는 `true`고 마지막 정점은 `false`입니다.

다음과 같이 원에 대한 삼각형의 정점을 얻을 수 있습니다.

```glsl
float numSlices = 8.0;
float sliceId = floor(vertexId / 3.0);
float triVertexId = mod(vertexId, 3.0);
float edge = triVertexId + sliceId;
float angleU = edge / numSlices;  // 0.0 to 1.0
float angle = angleU * PI * 2.0;
float radius = step(triVertexId, 1.5);
vec2 pos = vec2(cos(angle), sin(angle)) * radius;
```

이 모든 걸 합쳐서 하나의 원을 그려봅시다.

```glsl
attribute float vertexId;
uniform float numVerts;
uniform vec2 resolution;

#define PI radians(180.0)

void main() {
  float numSlices = 8.0;
  float sliceId = floor(vertexId / 3.0);
  float triVertexId = mod(vertexId, 3.0);
  float edge = triVertexId + sliceId;
  float angleU = edge / numSlices;  // 0.0 to 1.0
  float angle = angleU * PI * 2.0;
  float radius = step(triVertexId, 1.5);
  vec2 pos = vec2(cos(angle), sin(angle)) * radius;

  float aspect = resolution.y / resolution.x;
  vec2 scale = vec2(aspect, 1);
  
  gl_Position = vec4(pos * scale, 0, 1);
}
```

타원이 되지 않도록 `resolution`을 다시 넣었습니다.

8개의 조각 원은 8 * 3개의 정점이 필요합니다.

```js
-const numVerts = 400;
+const numVerts = 8 * 3;
```

그리고 `POINTS`가 아니라 `TRIANGLES`를 그려야 합니다.

```js
const offset = 0;
-gl.drawArrays(gl.POINTS, offset, numVerts);
+gl.drawArrays(gl.TRIANGLES, offset, numVerts);
```

{{{example url="../webgl-no-data-triangles-circle.html"}}}

그리고 여러 개의 원을 그리고 싶다면 어떻게 해야 할까요?

우리가 해야할 일은 모든 정점에 대해 동일한 각 원의 위치 선택에 사용할 수 있는 `circleId`를 찾는 겁니다.

```glsl
float numVertsPerCircle = numSlices * 3.0;
float circleId = floor(vertexId / numVertsPerCircle);
```

예시로 원으로 구성된 원을 그려봅시다.

먼저 위 코드를 함수로 바꿉니다.

```glsl
vec2 computeCircleTriangleVertex(float vertexId) {
  float numSlices = 8.0;
  float sliceId = floor(vertexId / 3.0);
  float triVertexId = mod(vertexId, 3.0);
  float edge = triVertexId + sliceId;
  float angleU = edge / numSlices;  // 0.0 to 1.0
  float angle = angleU * PI * 2.0;
  float radius = step(triVertexId, 1.5);
  return vec2(cos(angle), sin(angle)) * radius;
}
```

다음은 이 글의 맨 위에서 점들의 원을 그리는데 사용한 원래 코드입니다.

```glsl
float u = vertexId / numVerts;      // 0 ~ 1
float angle = u * PI * 2.0;         // 0 ~ 2PI
float radius = 0.8;

vec2 pos = vec2(cos(angle), sin(angle)) * radius;

float aspect = resolution.y / resolution.x;
vec2 scale = vec2(aspect, 1);

gl_Position = vec4(pos * scale, 0, 1);
```

`vertexId` 대신에 `circleId`를 사용하도록 수정하고 정점 수 대신에 원 개수로 나누도록 변경해야 합니다.

```glsl
void main() {
+  float circleId = floor(vertexId / numVertsPerCircle);
+  float numCircles = numVerts / numVertsPerCircle;

-  float u = vertexId / numVerts;      // 0 ~ 1
+  float u = circleId / numCircles;    // 0 ~ 1
  float angle = u * PI * 2.0;         // 0 ~ 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;

+  vec2 triPos = computeCircleTriangleVertex(vertexId) * 0.1;
  
  float aspect = resolution.y / resolution.x;
  vec2 scale = vec2(aspect, 1);
  
-  gl_Position = vec4(pos * scale, 0, 1);
+  gl_Position = vec4((pos + triPos) * scale, 0, 1);
}
```

그런 다음 정점 수를 늘려야 합니다.

```js
-const numVerts = 8 * 3;
+const numVerts = 8 * 3 * 20;
```

그리고 이제 20개의 원으로 구성된 원이 생겼습니다.

{{{example url="../webgl-no-data-triangles-circles.html"}}}

물론 원 모양의 비를 만들기 위해 위에서 했던 걸 적용할 수 있습니다.
아마 의미가 없을 것이기 때문에 다루지는 않겠지만 정점 셰이더에서 데이터 없이 삼각형 만드는 방법을 보여줍니다.

위 기술은 직사각형이나 정사각형을 만든 다음, UV 좌표를 생성하고, passing those the fragment shader and texture mapping our generated geometry.
이는 [3D 원근법](webgl-3d-perspective.html)에 대한 글에서 사용한 3D 기술을 적용하여 뒤집어지는 눈송이와 나뭇잎이 떨어지는 효과에 유용할 수 있습니다.

**이러한 기술**이 일반적이지 않다는 점을 강조하고 싶습니다.
간단한 파티클 시스템을 만드는 것은 반쯤 일반적이거나 위의 비 효과일 수 있지만 엄청나게 복잡한 계산을 하면 성능이 저하됩니다.
일반적으로 성능을 원한다면 컴퓨터에 가능한 작은 작업 단위로 요청해야 하므로, 초기화할 때 미리 계산하고 어떤 형태로든 셰이더에 전달할 수 있도록 해야 합니다.

예를 들어 여기 여러 큐브를 계산하는 극단적인 정점 셰이더가 있습니다. (경고, 소리 있음)

<iframe width="700" height="400" src="https://www.vertexshaderart.com/art/zd2E5vCZduc5JeoFz" frameborder="0" allowfullscreen></iframe>

퍼즐에 대한 지적 호기심으로 "Vertex ID 외에는 데이터가 없다면 흥미로운 걸 그릴 수 있을까요?" 이에 대한 대답은 꽤 깔끔합니다.
사실 [해당 웹사이트 전체](https://www.vertexshaderart.com)가 vertex id만 있을 때 흥미로운 걸 만들 수 있을까 하는 퍼즐에 관한 겁니다.
하지만 성능을 위해 큐브 정점 데이터를 버퍼에 전달하고 해당 데이터를 속성이나 다른 글에서 다룰 기술로 읽어들이는 전통적인 방법을 사용하는 게 훨씬 빠릅니다.

어느 정도 균형을 잡아야 합니다.
위의 비가 내리는 예시에서 정확한 효과를 원한다면 위의 코드는 굉장히 효율적입니다.
둘 사이 어딘가에는 한 기술이 다른 기술보다 성능이 좋은 경계가 있습니다.
일반적으로는 전통적인 기술들이 훨씬 유연하지만 어떤 방법을 사용할 지 경우에 따라 결정해야 합니다.

이 글의 요점은 대개 이러한 아이디어를 소개하고 WebGL이 실제로 하는 일에 대한 다른 사고 방식을 강조하는 겁니다.
다시 말하지만 셰이더에서 `gl_Position`과 `gl_FragColor`를 설정하는 것만 신경쓰면 됩니다.
그 외에는 어떻게 하든 상관없습니다.

다음은 [Shadertoy 셰이더의 작동 방식](webgl-shadertoy.html)을 다뤄보겠습니다.

<div class="webgl_bottombar" id="pointsissues">
<h3><code>gl.POINTS</code> 문제</h3>
<p>이와 같은 기술로 할 수 있는 유용한 한 가지는 <code>gl.POINTS</code>로 그리기를 시뮬레이션하는 겁니다.</p>

<code>gl.POINTS</code>에는 2가지 문제가 있는데요.

<ol>
<li>
최대 크기를 가집니다.<br/><br/>
<code>gl.POINTS</code>를 사용하는 대부분의 사람들은 작은 크기를 사용하지만 최대 크기가 필요한 것보다 작으면 다른 해결책을 선택해야 할 겁니다.
</li>
<li>
화면 밖에 있을 때 잘리는 방법이 일치하지 않습니다.<br/><br/>
포인트의 중심을 캔버스 왼쪽 가장자리에서 1픽셀 떨어진 곳으로 설정했지만 <code>gl_PointSize</code>를 32.0으로 설정했다고 상상해보세요.
<div class="webgl_center"><img src="resources/point-outside-canvas.svg" style="width: 400px"></div>
OpenGL ES 1.0 스펙에 따르면 32x32 픽셀의 15개 열이 여전히 캔버스에 있기 때문에 이 부분이 그려져야 합니다.
안타깝지만 OpenGL(ES 아님)은 정반대인데요.
포인트의 중심이 캔버스를 벗어나면 아무것도 그려지지 않습니다.
게다가 OpenGL은 최근까지 테스트 수준이 낮기로 악명 높았기 때문에 일부 드라이버는 이러한 픽셀을 그리기도 하고 안 그리기도 합니다 😭
</li>
</ol>
<p>
따라서 당신이 필요한 게 이러한 문제들 중 하나를 가질 경우, 해결책으로 <code>gl.POINTS</code>를 사용하는 대신에 <code>gl.TRIANGLES</code>로 전용 쿼드를 그려야 하는데요.
그렇게 하면 두 문제 모두 해결됩니다.
일치하지 않는 클리핑 문제와 마찬가지로 최대 크기 문제도 사라집니다.
쿼드를 많이 그리는 여러 방법이 있습니다.
그 중 하나는 이 글에 나온 기술 등을 사용하는 겁니다.
</p>
</div>
