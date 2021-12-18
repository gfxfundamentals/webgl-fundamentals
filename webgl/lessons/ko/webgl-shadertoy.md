Title: WebGL Shadertoy
Description: Shadertoy 셰이더
TOC: Shadertoy


이 글은 [기초](webgl-fundamentals.html)로 시작한 다른 글을 이미 읽었다고 가정합니다.
아직 읽지 않았다면 거기부터 시작해주세요.

[데이터 없이 그리기에 대한 글](webgl-drawing-without-data.html)에서 정점 셰이더를 사용하여 데이터 없이 그리는 예제들을 보여드렸습니다.
이 글은 프래그먼트 셰이더를 사용하여 데이터 없이 그리는 것에 관한 겁니다.

[제일 첫 번째 글](webgl-fundamentals.html)의 코드를 사용하여 수식 없는 간단한 단색 셰이더로 시작해봅시다.

간단한 정점 셰이더:

```js
const vs = `
  // 속성은 버퍼에서 데이터를 받습니다.
  attribute vec4 a_position;

  // 모든 셰이더는 main 함수를 가집니다.
  void main() {

    // gl_Position은 정점 셰이더가 설정을 담당하는 특수 변수입니다.
    gl_Position = a_position;
  }
`;
```

간단한 프래그먼트 셰이더:

```js
const fs = `
  precision highp float;
  void main() {
    // gl_FragColor는 프래그먼트 셰이더가 설정을 담당하는 특수 변수입니다.

    gl_FragColor = vec4(1, 0, 0.5, 1); // 자주색 반환
  }
`;
```

셰이더를 컴파일하고 연결한 다음 `a_position` 속성의 위치를 찾아야 합니다.

```js
function main() {
  // WebGL 컨텐스트 가져오기
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // GLSL 프로그램 설정
  const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  // 정점 데이터가 어디로 가야 하는지 탐색
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
```

그리고 x와 y의 -1에서 +1까지의 클립 공간에 사각형을 만드는 2개의 삼각형으로 버퍼를 채웁니다.

```js
  // 3개의 2D 클립 공간 포인트를 넣을 버퍼 생성
  const positionBuffer = gl.createBuffer();

  // ARRAY_BUFFER에 바인딩 (ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // 클립 공간을 덮는 2개의 삼각형으로 채우기
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  // 첫 번째 삼각형
     1, -1,
    -1,  1,
    -1,  1,  // 두 번째 삼각형
     1, -1,
     1,  1,
  ]), gl.STATIC_DRAW);  
```

그런 다음 그립니다.

```js
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // 클립 공간에서 픽셀로 변환하는 방법을 WebGL에 지시
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // 프로그램(셰이더 쌍)을 사용하도록 지시
  gl.useProgram(program);

  // 속성 활성화
  gl.enableVertexAttribArray(positionAttributeLocation);

  // positionBuffer 바인딩
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // positionBuffer(ARRAY_BUFFER)에서 데이터 가져오는 방법을 속성에 지시
  gl.vertexAttribPointer(
      positionAttributeLocation,
      2,          // 반복마다 2개의 컴포넌트
      gl.FLOAT,   // 데이터는 32비트 부동 소수점
      false,      // 데이터 정규화 안 함
      0,          // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
      0,          // 버퍼의 처음부터 시작
  );

  gl.drawArrays(
      gl.TRIANGLES,
      0,     // 오프셋
      6,     // 처리할 정점 수
  );
```

그리고 당연히 캔버스를 덮는 단색이 생깁니다.

{{{example url="../webgl-shadertoy-solid.html"}}}

[WebGL 작동 방식에 대한 글](webgl-how-it-works.html)에서 각 정점에 대해 색상을 제공하여 더 많은 색상을 추가했습니다.
[텍스처에 관한 글](webgl-3d-textures.html)에서는 텍스처와 텍스처 좌표를 제공하여 더 많은 색상을 추가했습니다.
그렇다면 더 이상의 데이터 없이 단색 이상의 무언가를 얻으려면 어떻게 해야 할까요?
WebGL은 현재 그려지고 있는 픽셀의 **픽셀 좌표**와 동일한 `gl_FragCoord`라는 변수를 제공합니다.

색상을 계산하는 데에 사용하도록 프래그먼트 셰이더를 바꿔봅시다.

```js
const fs = `
  precision highp float;
  void main() {
    // gl_FragColor는 프래그먼트 셰이더가 설정을 담당하는 특수 변수입니다.

-    gl_FragColor = vec4(1, 0, 0.5, 1); // 자주색 반환
+    gl_FragColor = vec4(fract(gl_FragCoord.xy / 50.0), 0, 1);
  }
`;
```

위에서 언급한 것처럼 `gl_FragCoord`는 **픽셀 좌표**이기 때문에 캔버스 전체에 걸쳐 계산됩니다.
`gl_FragCoord`가 0에서 50사이일 때 50으로 나누면 0에서 1사이의 값을 얻는데요.
그리고 `fract`를 사용하여 소수 부부만 유지합니다.
예를 들어 `gl_FragCoord`가 75인 경우, 75 / 50 = 1.5, fract(1.5) = 0.5, 이렇게 50픽셀마다 0에서 1사이의 값을 얻습니다.

{{{example url="../webgl-shadertoy-gl-fragcoord.html"}}}

위에서 볼 수 있듯이 50픽셀마다 빨간색과 초록색이 교차하여 나타납니다.

이제 이런 설정을 통해 더 멋진 이미지를 위한 더 복잡한 수식을 만들 수 있습니다.
하지만 한 가지 문제가 있는데 캔버스가 얼마나 큰지 모르기 때문에 특정한 크기로 하드 코딩해야 합니다.
이 문제를 해결하기 위해 캔버스의 크기를 전달한 다음 `gl_FragCoord`를 해당 크기로 나누면 캔버스 크기에 관계없이 0에서 1사이의 값을 얻을 수 있습니다.

```js
const fs = `
  precision highp float;

+  uniform vec2 u_resolution;

  void main() {
    // gl_FragColor는 프래그먼트 셰이더가 설정을 담당하는 특수 변수입니다.

-    gl_FragColor = vec4(fract(gl_FragCoord.xy / 50.0), 0, 1);
+    gl_FragColor = vec4(fract(gl_FragCoord.xy / u_resolution), 0, 1);
  }
`;
```

그리고 유니폼을 찾아 설정합니다.

```js
// 정점 데이터가 어디로 가야 하는지 탐색
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

+// 유니폼 위치 탐색
+const resolutionLocation = gl.getUniformLocation(program, "u_resolution");

...

+gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

gl.drawArrays(
    gl.TRIANGLES,
    0,     // 오프셋
    6,     // 처리할 정점 수
);

...

```

이는 해상도에 상관없이 캔버스에 맞게 빨간색과 초록색이 퍼지도록 만들어줍니다.

{{{example url="../webgl-shadertoy-w-resolution.html"}}}

픽셀 좌표의 마우스 위치도 전달해봅시다.

```js
const fs = `
  precision highp float;

  uniform vec2 u_resolution;
+  uniform vec2 u_mouse;

  void main() {
    // gl_FragColor는 프래그먼트 셰이더가 설정을 담당하는 특수 변수입니다.

-    gl_FragColor = vec4(fract(gl_FragCoord.xy / u_resolution), 0, 1);
:   gl_FragColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), 0, 1);
  }
`;
```

그런 다음 유니폼의 위치를 찾아야 합니다.

```js
// 유니폼 위치 탐색
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
+const mouseLocation = gl.getUniformLocation(program, "u_mouse");
```

그리고 마우스를 추적합니다.

```js
let mouseX = 0;
let mouseY = 0;

function setMousePosition(e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;  // WebGL에서 0은 하단
  render();
}

canvas.addEventListener('mousemove', setMousePosition);
```

다시 유니폼을 설정합니다.

```js
gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
+gl.uniform2f(mouseLocation, mouseX, mouseY);
```

또한 코드를 바꿔서 마우스 위치가 바뀔 때 렌더링합니다.

```js
function setMousePosition(e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;  // WebGL에서 0은 하단
+  render();
}

+function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  ...

  gl.drawArrays(
      gl.TRIANGLES,
      0,     // 오프셋
      6,     // 처리할 정점 수
  );
+}
+render();
```

하는 김에 터치도 처리합시다.

```js
canvas.addEventListener('mousemove', setMousePosition);
+canvas.addEventListener('touchstart', (e) => {
+  e.preventDefault();
+}, {passive: false});
+canvas.addEventListener('touchmove', (e) => {
+  e.preventDefault();
+  setMousePosition(e.touches[0]);
+}, {passive: false});
```

이제 예제 위에서 마우스를 움직이면 이미지에 움직이는 것을 볼 수 있습니다.

{{{example url="../webgl-shadertoy-w-mouse.html"}}}

마지막으로 애니메이션이 가능하도록 하고 싶기 때문에 계산에 추가하여 사용할 수 있는 시간 값을 전달합니다.

```js
const fs = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
+  uniform float u_time;

  void main() {
    // gl_FragColor는 프래그먼트 셰이더가 설정을 담당하는 특수 변수입니다.

-    gl_FragColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), 0, 1);
+    gl_FragColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), fract(u_time), 1);
  }
`;
```

그러면 이제 파란색 채널이 시간에 맞춰 깜박입니다.
유니폼을 찾고 [requestAnimationFrame 루프](webgl-animation.html) 내에서 설정하기만 하면 됩니다.

```js
// 유니폼 위치 탐색
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const mouseLocation = gl.getUniformLocation(program, "u_mouse");
+const timeLocation = gl.getUniformLocation(program, "u_time");

...

-function render() {
+function render(time) {
+  time *= 0.001;  // 초 단위로 변환

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  ...

  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform2f(mouseLocation, mouseX, mouseY);
+  gl.uniform1f(timeLocation, time);

  gl.drawArrays(
      gl.TRIANGLES,
      0,     // 오프셋
      6,     // 처리할 정점 수
  );

+  requestAnimationFrame(render);
+}
+requestAnimationFrame(render);
-render();
```

또한 계속해서 렌더링하기 때문에 mousemove에서 렌더링할 필요가 없습니다.

```js
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;  // WebGL에서 0은 하단
-  render();
});
```

그러면 간단하지만 지루한 애니메이션을 얻게 됩니다.

{{{example url="../webgl-shadertoy-w-time.html"}}}

이제 [Shadertoy.com](https://shadertoy.com)에서 셰이더를 가져올 수 있습니다.
Shadertoy 셰이더는 `mainImage`라는 함수를 이런 형식으로 제공합니다.

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{	
}
```

일반적으로 `gl_FragColor`를 설정하는 것처럼 `fragColor`를 설정면 되고 `fragCoord`는 `gl_FragCoord`와 동일합니다.
이 함수를 추가하면 Shadertoy는 `mainImage` 호출 전후에 추가 작업을 수행할 수 있을 뿐만 아니라 구조를 강제할 수 있습니다.
이걸 사용하려면 그냥 이렇게 호출하면 됩니다.

```glsl
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

//---insert shadertoy code here--

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
```

그 외에는 Shadertoy가 유니폼 이름으로 `iResolution`, `iMouse`, `iTime`를 사용하므로 이름을 바꾸겠습니다.

```glsl
precision highp float;

-uniform vec2 u_resolution;
-uniform vec2 u_mouse;
-uniform float u_time;
+uniform vec2 iResolution;
+uniform vec2 iMouse;
+uniform float iTime;

//---insert shadertoy code here--

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
```

그리고 새로운 이름으로 유니폼의 위치를 찾습니다.

```js
// 유니폼 위치 탐색
-const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
-const mouseLocation = gl.getUniformLocation(program, "u_mouse");
-const timeLocation = gl.getUniformLocation(program, "u_time");
+const resolutionLocation = gl.getUniformLocation(program, "iResolution");
+const mouseLocation = gl.getUniformLocation(program, "iMouse");
+const timeLocation = gl.getUniformLocation(program, "iTime");
```

[이 shadertoy 셰이더](https://www.shadertoy.com/view/3l23Rh)를 가져가서 위 셰이더의 `//---insert shadertoy code here--`에 붙여넣으면 다음과 같이 표시됩니다.

{{{example url="../webgl-shadertoy.html"}}}

데이터가 없다니 놀랍도록 아름다운 이미지네요!

위 샘플은 마우스가 캔버스 위에 있거나 터치할 때만 렌더링하도록 만들어졌습니다.
이는 위 이미지를 그릴 때 필요한 수식이 굉장히 복잡하고 느려서 계속 실행하면 페이지 사용하기 매우 힘들어지기 때문입니다.
만약 엄청나게 빠른 GPU를 가지고 있다면 이미지는 부드럽게 실행될 겁니다.
제 노트북에서는 느리고 버벅입니다.

이건 굉장히 중요한 포인트를 알려주는데요.
**Shadertoy 셰이더는 모범 사례가 아닙니다.**
Shadertoy는 *"데이터가 없고 입력을 거의 받지 않는 함수만 있을 때 흥미롭고 아름다운 이미지를 만들 수 있을까?"*라는 퍼즐이자 도전입니다.
성능이 좋은 WebGL을 만드는 방법이 아닙니다.

한 가지 [놀라운 shadertoy 셰이더](https://www.shadertoy.com/view/4sS3zG)를 예로 들어 보겠습니다.

<div class="webgl_center"><img src="resources/shadertoy-dolphin.png" style="width: 639px;"></div>

이는 아름답지만 제 중급 노트북의 작은 창(640x360)에서 초당 19프레임으로 작동합니다.
창을 전체화면으로 확장하면 초당 2~3프레임으로 실행됩니다.
더 높은 스펙의 컴퓨터에서 테스트해도 여전히 640x360에서 45프레임이고 전체화면에서 10프레임에 불과합니다.

이 게임과 비교해보면 이것도 상당히 아릅답지만 저전력 GPU에서 초당 30~60프레임으로 실행됩니다.

<iframe class="webgl_center" style="width:560px; height: 360px;" src="https://www.youtube-nocookie.com/embed/7v9gZK9HqqI" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

이는 게임이 복잡한 수식 대신에 텍스처를 사용한 삼각형으로 그리는 모범 사례를 사용했기 때문입니다.

그러니 부디 명심해주시길 바랍니다.
Shadertoy에 있는 예제들은 데이터가 거의 없는 극한의 제약 아래 만들어지고 예쁜 그림을 그리는 복잡한 함수라는 것을 알기에 정말로 놀랍습니다.
또한 많은 수학을 배울 수 있는 좋은 방법입니다.

하지만 성능 좋은 WebGL을 얻을 수 있는 방법은 아닙니다.
그러니 꼭 명심해주세요.

그러지 않고 더 많은 Shadertoy 셰이더를 실행하고 싶다면 몇 가지 유니폼을 더 제공해야 합니다.
다음은 Shadertoy가 제공하는 유니폼 목록입니다.

<div class="webgl_center"><table  class="tabular-data tabular-data1">
<thead><tr><td>type</td><td>name</td><td>where</td><td>description</td></tr></thead>
<tbody>
<tr><td><b>vec3</b></td><td><b>iResolution</b></td><td>image / buffer</td><td>뷰포트 해상도 (z는 픽셀 종횡비, 일반적으로 1.0)</td></tr>
<tr><td><b>float</b></td><td><b>iTime</b></td><td>image / sound / buffer</td><td>초 단위 현재 시간</td></tr>
<tr><td><b>float</b></td><td><b>iTimeDelta</b></td><td>image / buffer</td><td>프레임 렌더링에 걸리는 초 단위 시간</td></tr>
<tr><td><b>int</b></td><td><b>iFrame</b></td><td>image / buffer</td><td>현재 프레임</td></tr>
<tr><td><b>float</b></td><td><b>iFrameRate</b></td><td>image / buffer</td><td>초당 렌더링되는 프레임 수</td></tr>
<tr><td><b>float</b></td><td><b>iChannelTime[4]</b></td><td>image / buffer</td><td>비디오나 오디오인 경우 초 단위 채널 시간</td></tr>
<tr><td><b>vec3</b></td><td><b>iChannelResolution[4]</b></td><td>image / buffer / sound</td><td>각 채널에 대한 입력 텍스처 해상도</td></tr>
<tr><td><b>vec4</b></td><td><b>iMouse</b></td><td>image / buffer</td><td>xy = 현재 픽셀 좌표 (if LMB is down), zw = 클릭 픽셀</td></tr>
<tr><td><b>sampler2D</b></td><td><b>iChannel{i}</b></td><td>image / buffer / sound</td><td>입력 텍스처 i에 대한 샘플러</td></tr>
<tr><td><b>vec4</b></td><td><b>iDate</b></td><td>image / buffer / sound</td><td>Year, month, day, time in seconds in .xyzw</td></tr>
<tr><td><b>float</b></td><td><b>iSampleRate</b></td><td>image / buffer / sound</td><td>사운드 샘플 레이트 (일반적으로 44100)</td></tr>
</tbody></table></div>

`iMouse`와 `iResolution`은 각각 `vec4`와 `vec3`로 되어 있으므로 이에 맞도록 조정해야할 수 있습니다.

`iChannel`은 텍스처이기 때문에 셰이더에서 사용하려면 [텍스처](webgl-3d-textures.html)를 제공해야 합니다.

또한 Shadertoy로 여러 셰이더를 사용하여 오프스크린 텍스처를 렌더링할 수 있으므로 셰이더에 이런 게 필요할 경우 [렌더링할 텍스처](webgl-render-to-texture.html)를 설정해야 합니다.

"where" 열은 어느 셰이더에서 어떤 유니폼을 사용할 수 있는지 나타냅니다.
"image"는 캔버스에 렌더링하는 셰이더입니다.
"buffer"는 오프스크린 텍스처에 렌더링하는 셰이더입니다.
"sound"는 [사운드 데이터를 텍스처로 생성할 것으로 예상되는 셰이더](https://stackoverflow.com/questions/34859701/how-do-shadertoys-audio-shaders-work)입니다.

마지막으로 shadertoy의 일부 셰이더는 [WebGL2](https://webgl2fundamentals.org)를 필요로 합니다.

이 글이 Shadertoy 설명에 도움이 되었기를 바랍니다.
놀라운 작품들이 있는 훌륭한 사이트지만 실제로 무슨 일이 일어나는건지 아는 게 좋습니다.
이러한 종류의 셰이더에 사용된 기술에 대해 배우고 싶다면 [Shadertoy를 만든 사람의 블로그]("https://www.iquilezles.org/www/index.htm)와 [The Book of Shaders](https://thebookofshaders.com/) 등의 좋은 리소스가 있는데요.
성능 좋은 앱이나 게임이 아니라 shadertoy에 사용되는 종류의 셰이더만 다루기 때문에 오해의 소지가 있지만 그래도 여전히 좋은 리소스입니다!

<div class="webgl_bottombar" id="pixel-coords">
<h3>픽셀 좌표</h3>
<p>
WebGL에서 픽셀 좌표는 가장자리를 참조합니다.
예를 들어 3x2 픽셀 크기의 캔버스의 경우 왼쪽에서 2픽셀이고 아래쪽에서 1픽셀인 <code>gl_FragCoord</code>의 값은 2.5와 1.5가 됩니다.
</p>
<div class="webgl_center"><img src="resources/webgl-pixels.svg" style="width: 500px;"></div>
</div>

