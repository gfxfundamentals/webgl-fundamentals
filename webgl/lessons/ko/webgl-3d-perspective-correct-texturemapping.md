Title: WebGL 3D 원근 교정 텍스처 매핑
Description: W의 특별한 점
TOC: 원근 교정 텍스처 매핑


이 포스트는 WebGL 관련 시리즈에서 이어집니다.
첫 번째는 [기초](webgl-fundamentals.html)로 시작했습니다.
이 글은 원근 교정 텍스처 매핑을 다룹니다.
이걸 이해하기 위해서는 [perspective projection](webgl-3d-perspective.html)과 [텍스처](webgl-3d-textures.html)에 대해 읽어야 할 겁니다.
또한 [varying과 그 기능](webgl-how-it-works.html)에 대해 알아야 하지만 여기서 간략하게 설명하겠습니다.

"[동작 원리](webgl-how-it-works.html)"에서 varying이 어떻게 작동하는지 다뤘는데요.
Vertex shader는 varying을 선언하고 어떤 값으로 설정할 수 있습니다.
Vertex shader가 3번 호출되면 WebGL은 삼각형을 그립니다.
해당 삼각형을 그리는 동안 모든 픽셀에 대해 fragment shader를 호출하고 해당 픽셀을 어떤 색상으로 만들지 묻습니다.
삼각형의 정점 3개 사이에서 3개의 값 사이를 보간한 varying을 전달할 겁니다.

{{{diagram url="resources/fragment-shader-anim.html" width="600" height="400" caption="v_color는 v0, v1, v2 사이에서 보간" }}}

[첫 번째 글](webgl-fundamentals.html)로 돌아가보면 우리는 clip space에서 삼각형을 그렸는데요.
다음과 같이 간단한 vertex shader에 clip space 좌표를 전달했습니다.

      // Attribute는 버퍼에서 데이터를 받음
      attribute vec4 a_position;

      // 모든 셰이더는 main 함수를 가짐
      void main() {

        // gl_Position은 vertex shader가 설정을 담당하는 특수 변수
        gl_Position = a_position;
      }

일정한 색상으로 그리는 간단한 fragment shader가 있습니다.

      // fragment shader는 기본 정밀도를 가지고 있지 않으므로 하나를 선택해야 합니다.
      // mediump은 좋은 기본값으로 "중간 정밀도"를 의미합니다.
      precision mediump float;

      void main() {
        // gl_FragColor는 fragment shader가 설정을 담당하는 특수 변수
        gl_FragColor = vec4(1, 0, 0.5, 1); // 붉은 보라색 반환
      }

Clip space에 2개의 사각형을 그리도록 만들어봅시다.
각 정점의 `X`, `Y`, `Z`, `W`인 데이터를 전달할 겁니다.

    var positions = [
      -.8, -.8, 0, 1,  // 1번째 사각형의 1번째 삼각형
       .8, -.8, 0, 1,
      -.8, -.2, 0, 1,
      -.8, -.2, 0, 1,  // 1번째 사각형의 2번째 삼각형
       .8, -.8, 0, 1,
       .8, -.2, 0, 1,

      -.8,  .2, 0, 1,  // 2번째 사각형의 1번째 삼각형
       .8,  .2, 0, 1,
      -.8,  .8, 0, 1,
      -.8,  .8, 0, 1,  // 2번째 사각형의 2번째 삼각형
       .8,  .2, 0, 1,
       .8,  .8, 0, 1,
    ];

여기 결과입니다.

{{{example url="../webgl-clipspace-rectangles.html" }}}

Varying float 하나를 추가해봅시다.
해당 varying을 vertex shader에서 fragment shader로 전달할 겁니다.

      attribute vec4 a_position;
    +  attribute float a_brightness;

    +  varying float v_brightness;

      void main() {
        gl_Position = a_position;

    +    // Fragment shader로 밝기 전달
    +    v_brightness = a_brightness;
      }

Fragment shader에서는 해당 varying을 사용하여 색상을 설정할 겁니다.

      precision mediump float;

    +  // Vertex shader에서 전달받아 보간
    +  varying float v_brightness;  

      void main() {
    *    gl_FragColor = vec4(v_brightness, 0, 0, 1);  // 빨강
      }

Varying의 데이터를 제공해야 하므로 버퍼를 만들어 데이터를 넣을 겁니다.
정점 당 하나의 값을 가집니다.
왼쪽을 0으로 오른쪽은 1로 정점에 대한 밝기 값을 설정합니다.

```
  // 버퍼를 생성하고 12개의 밝기 값 넣기
  var brightnessBuffer = gl.createBuffer();

  // ARRAY_BUFFER에 바인딩 (ARRAY_BUFFER = brightnessBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);

  var brightness = [
    0,  // 1번째 사각형의 1번째 삼각형
    1, 
    0, 
    0,  // 1번째 사각형의 2번째 삼각형
    1, 
    1, 

    0,  // 2번째 사각형의 1번째 삼각형
    1, 
    0, 
    0,  // 2번째 사각형의 2번째 삼각형
    1, 
    1, 
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(brightness), gl.STATIC_DRAW);
```

또한 초기화할 때 `a_brightness` attribute의 위치를 찾아야 합니다.

```
  // 정점 데이터가 어디로 가야하는지 탐색
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
+  var brightnessAttributeLocation = gl.getAttribLocation(program, "a_brightness");  
```

그리고 렌더링할 때 해당 attribute를 설정합니다.

```
  // Attribute 활성화
  gl.enableVertexAttribArray(brightnessAttributeLocation);

  // 위치 버퍼 바인딩
  gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);

  // brightnessBuffer의 데이터를 가져오는 방법을 attribute에 지시 (ARRAY_BUFFER)
  var size = 1;          // 반복마다 1개의 컴포넌트
  var type = gl.FLOAT;   // 데이터는 32bit float
  var normalize = false; // 데이터 정규화 안 함
  var stride = 0;        // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
  var offset = 0;        // 버퍼의 처음부터 시작
  gl.vertexAttribPointer(
    brightnessAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );
```

그리고 이제 렌더링할 때 `brightness`가 0인 왼쪽은 검은색이고 `brightness`가 1인 오른쪽은 빨간색인 사각형 2개를 얻으며, `brightness` 사이의 영역은 삼각형을 가로질러 보간됩니다.

{{{example url="../webgl-clipspace-rectangles-with-varying.html" }}}

[Perspective에 대한 글](webgl-3d-perspective.html)에서 WebGL은 우리가 입력한 `gl_Position`을 가져와 `gl_Position.w`로 나눕니다.

위의 정점들에는 `W`에 `1`을 제공했지만 WebGL이 `W`로 나누는 걸 알고 있기 때문에 다음과 같이 할 수 있으며 동일한 결과를 얻습니다.

```
  var mult = 20;
  var positions = [
      -.8,  .8, 0, 1,  // 1번째 사각형의 1번째 삼각형
       .8,  .8, 0, 1,
      -.8,  .2, 0, 1,
      -.8,  .2, 0, 1,  // 1번째 사각형의 2번째 삼각형
       .8,  .8, 0, 1,
       .8,  .2, 0, 1,

      -.8       , -.2       , 0,    1,  // 2번째 사각형의 1번째 삼각형
       .8 * mult, -.2 * mult, 0, mult,
      -.8       , -.8       , 0,    1,
      -.8       , -.8       , 0,    1,  // 2번째 사각형의 2번째 삼각형
       .8 * mult, -.2 * mult, 0, mult,
       .8 * mult, -.8 * mult, 0, mult,
  ];
```

위에서 두 번째 사각형의 오른쪽에 있는 모든 점에 대해 `X`와 `Y`에 `mult`를 곱한 것을 알 수 있지만, `W`를 `mult`로 설정하는 것도 볼 수 있습니다.
WebGL이 `W`로 나누기 때문에 똑같은 결과를 얻을 수 있겠죠?

음 여기 결과입니다.

{{{example url="../webgl-clipspace-rectangles-with-varying-non-1-w.html" }}}

두 사각형은 이전과 같은 곳에 그려졌습니다.
이건 `X * MULT / MULT(W)`가 여전히 `X`이고 `Y`에 대해 동일하다는 걸 증명합니다.
하지만 색상이 다릅니다.
무슨 일이 일어난 걸까요?

WebGL은 `W`를 사용하여 원근 교정 텍스처 매핑을 구현하거나 varying의 원근 교정 보간을 수행합니다.

실제로 이걸 더 쉽게 볼 수 있도록 fragment shader를 해킹해봅시다.

    gl_FragColor = vec4(fract(v_brightness * 10.), 0, 0, 1);  // 빨강

`v_brightness`를 10으로 곱하면 값을 0에서 10사이로 만듭니다.
`fract`는 소수 부분만 유지하므로 0에서 1사이, 0에서 1사이, 0에서 1사이, 10번이 됩니다.

{{{example url="../webgl-clipspace-rectangles-with-varying-non-1-w-repeat.html" }}}

이제 perspective를 쉽게 볼 수 있습니다.

하나의 값에서 또 다른 값으로 선형 보간하는 것은 이런 공식이 됩니다.

     result = (1 - t) * a + t * b

여기서 `t`는 `a`와 `b`사이의 위치를 나타내는 0에서 1사이의 값입니다.
`a`가 0이고 `b`가 1입니다.

Varying의 경우 WebGL은 이 공식을 사용합니다.

     result = (1 - t) * a / aW + t * b / bW
              -----------------------------
                 (1 - t) / aW + t / bW

여기서 `aW`는 varying이 `a`로 설정된 경우 `gl_Position.w`에 설정된 `W`이며, `bW` varying이 `b`로 설정된 경우 `gl_Position.w`에 설정된 `W`입니다.

그게 왜 중요할까요?
음 여기 [텍스처에 대한 글](webgl-3d-textures.html)에서 만들었던 간단한 텍스처 큐브가 있습니다.
UV 좌표를 양쪽에 0에서 1로 조정했고 4x4 픽셀 텍스처를 사용하고 있습니다.

{{{example url="../webgl-perspective-correct-cube.html" }}}

이제 해당 예제를 가져와 vertex shader를 변경하여 우리가 직접 `W`로 나눠봅시다.
한 줄만 추가하면 됩니다.

```
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main() {
  // 위치를 행렬로 곱하기
  gl_Position = u_matrix * a_position;

+  // 수동으로 W 나누기
+  gl_Position /= gl_Position.w;

  // fragment shader로 texcoord 전달
  v_texcoord = a_texcoord;
}
```

`W`로 나누는 것은 `gl_Position.w`가 결국 1이 됨을 의미합니다.
`X`, `Y`, `Z`는 WebGL이 자동으로 분할했던 것처럼 나올 겁니다.
음 여기 결과입니다.

{{{example url="../webgl-non-perspective-correct-cube.html" }}}

여전히 3D 큐브를 얻게 되지만 텍스처가 뒤틀리고 있습니다.
이는 이전처럼 `W`를 전달하지 않으면 WebGL이 원근 교정 텍스처 매핑을 할 수 없기 때문입니다.
좀 더 정확하게는 WebGL이 varying의 원근 교정 보간을 수행할 수 없습니다.

[Perspective matrix](webgl-3d-perspective.html)에서 `Z`가 `W`였던 걸 떠올려보면, `W`가 `1`인 경우 WebGL은 선형 보간을 수행합니다.
실제로 위의 방정식을 가져와 봅시다.

     result = (1 - t) * a / aW + t * b / bW
              -----------------------------
                 (1 - t) / aW + t / bW

그리고 모든 `W`를 1로 변경합니다.

     result = (1 - t) * a / 1 + t * b / 1
              ---------------------------
                 (1 - t) / 1 + t / 1

1로 나누는 것은 아무 영향이 없으므로 이렇게 단순화할 수 있습니다.
                 
     result = (1 - t) * a + t * b
              -------------------
                 (1 - t) + t

`(1 - t) + t`는 `1`과 같습니다.
예를 들어 `t`가 `.7`이면, `(1 - .7) + .7`이 되고, 이건 `.3 + .7`이며, 이는 곧 `1`입니다.
즉 분모를 지울 수 있기 때문에 이렇게 남게 됩니다.

     result = (1 - t) * a + t * b

이는 위의 선형 보간 방정식과 동일합니다.

이제 왜 WebGL이 4x4 행렬과 `X`, `Y`, `Z`, `W`가 있는 4개의 벡터를 사용하는지 이해가 되셨으면 좋겠습니다.
`X`와 `Y`는 `W`로 나누어 clipspace 좌표를 얻습니다.
`W`로 나누는 `Z`도 clipspace 좌표를 얻으며, `W`는 varying의 보간 중에 계속 사용되고 원근 교정 텍스처 매핑 기능을 제공합니다.

<div class="webgl_bottombar">
<h3>1990년대 중반 게임 콘솔</h3>
<p>
PlayStation 1과 같은 시대의 일부 게임 콘솔들은 원근 교정 텍스처 매핑을 하지 않았습니다.
위 결과를 보면 왜 그렇게 보였는지 알 수 있습니다.
</p>
<div class="webgl_center"><img src="resources/ridge-racer-01.png" style="max-width: 500px;" /></div>
<p></p>
<div class="webgl_center"><img src="resources/ridge-racer-02.png" style="max-width: 500px;" /></div>
</div>

