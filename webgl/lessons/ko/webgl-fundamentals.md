Title: WebGL 기초
Description: 기초부터 시작하는 WebGL 첫 강의

WebGL은 종종 3D API로 치부되는데요.
사람들은 "WebGL을 사용해서 *멋진 3D*를 만들어야지!"라고 생각합니다.
하지만 사실 WebGL은 그저 Rasterization 엔진일 뿐입니다.
당신이 작성한 코드를 이용해 점, 선, 삼각형 등을 그리죠.
WebGL로 원하는 결과물을 얻기 위해서는 점, 선, 삼각형을 그리는 코드를 잘 이용해야 합니다.

WebGL은 컴퓨터에 있는 GPU에서 실행됩니다.
따라서 GPU에서 실행되는 코드를 작성해야 하는데, 이 코드는 함수 쌍 형태로 제공됩니다.
각각 Vertex Shader와 Fragment Shader라고 불리며 C/C++처럼 엄격한 Type을 가지는 [GLSL](webgl-shaders-and-glsl.html)로 작성되어 있습니다.
그리고 이 두 개를 합쳐서 *Shader Program*이라고 부릅니다.

Vertex Shader의 역할은 Vertex 위치들을 계산하는 겁니다.
출력 위치에 따라서 WebGL은 점, 선, 삼각형을 포함한 다양한 종류의 Primitive를 Rasterization 할 수 있습니다.
이 Primitive들을 rasterization하면 Fragment Shader 함수를 두 번째로 호출합니다.
Fragment Shader의 역할은 현재 그려진 Primitive의 모든 화소에 색을 계산하는 겁니다.

대부분의 WebGL API는 함수 쌍 실행을 위한 상태 설정에 관한 것입니다.
당신이 원하는 것을 그리기 위해서는 여러 상태를 설정하고 GPU에서 Shader를 실행하는 `gl.drawArrays` 또는 `gl.drawElements`을 실행해야 합니다.

함수들이 접근해야 하는 모든 데이터는 GPU에 제공되어야 하는데요.
Shader가 데이터를 받는 방법에는 4가지가 있습니다.


1. Attribute와 Buffer

   Buffer는 GPU에 올리는 2진 데이터 배열입니다.
   일반적으로 Buffer는 위치, 법선, Texture 좌표, Vertex 색상 등을 포함하지만 당신이 원하는 것을 자유롭게 넣어도 됩니다.

   Attribute는 어떻게 Buffer에서 데이터를 가져오고 Vertex Shader에 제공할지 방법을 지정하는데 사용됩니다.
   예를 들어 3개의 32bit 부동 소수점으로 각각의 위치를 buffer에 넣을 수 있는데요.
   특정한 Attribute에게 어느 Buffer에서 위치를 가져올지, 어떤 데이터 형식을 가져와야 하는지 (3개의 32bit 부동 소수점),
   Buffer의 어디에서 offset이 시작되는지 그리고 한 위치에서 다음 위치로 얼마나 많은 바이트를 이동시킬 것인지 알려줘야 합니다.
   
   Buffer는 무작위 접근로 접근할 수 없는데요.
   대신에 Vertex Shader가 지정한 횟수만큼 실행됩니다.
   그리고 실행될 때마다 지정된 다음 buffer 값이 Attribute에 할당됩니다.

2. Uniform

   Uniform은 Shader Program을 실행하기 전에 선언하는 유용한 전역 변수입니다.

3. Texture

   Texture는 Shader Program이 무작위로 접근할 수 있는 데이터 배열입니다.
   일반적으로 Texture에 들어가는 것은 대부분 이미지 데이터지만 색상 이외에 다른 것도 쉽게 넣을 수 있습니다.

4. Varying

   Varying는 Vertex Shader가 Fragment Shader에 데이터를 넘기는 방법입니다.
   렌더링 되는 점, 선 또는 삼각형에 따라 Vertex Shader의 Varying 값은 Fragment Shader를 실행하는 동안 보간됩니다.

## WebGL Hello World

WebGL은 오직 2가지(clip 공간 좌표와 색상)만 관여합니다.
WebGL을 사용하는 프로그래머가 할 일은 이 2가지를 작성하는 겁니다.

이를 위해 2개의 "Shader"를 제공합니다.
Vertex Shader는 clip 공간 좌표를 제공하고 Fragment Shader는 색상을 제공하죠.

clip 공간 좌표는 canvas 크기에 상관없이 항상 -1에서 +1까지 사용합니다.

<div class="webgl_center"><img src="resources/clipspace.svg" style="width: 400px"></div>

여기에 WebGL을 보여주는 간단한 WebGL 예제가 있는데요.

Vertex Shader부터 시작해봅시다.

    // Attribute는 Buffer로부터 데이터를 받습니다.
    attribute vec4 a_position;

    // 모든 shader는 main 함수를 가지고 있습니다.
    void main() {
      // gl_Position은 Vertex Shader가 설정을 담당하는 특수 변수입니다.
      gl_Position = a_position;
    }

실행될 때, GLSL 대신에 JavaScript로 작성된 것이라면 이렇게 쓰일 것입니다.

    // *** PSEUDO CODE!! ***

    var positionBuffer = [
        0,   0, 0, 0,
        0, 0.5, 0, 0,
      0.7,   0, 0, 0,
    ];
    var attributes = {};
    var gl_Position;

    drawArrays(..., offset, count) {
      var stride = 4;
      var size = 4;
      for (var i = 0; i < count; ++i) {
        // positionBuffer의 다음 값 4개를 a_position 속성에 복사합니다.
        const start = (offset + i) * stride;
        attributes.a_position = positionBuffer.slice(start, start + size);
        runVertexShader();
        ...
        doSomethingWith_gl_Position();
      }
    }

실제로는 `positionBuffer`가 2진 데이터(아래 참조)로 전환되기 때문에 그렇게 간단하지 않습니다.
이렇게 하면 Buffer에서 가져오는 데이터는 실제 계산과 약간 다르지만, 이걸로 Vertex Shader가 어떻게 실행되는지 알 수 있습니다.

다음으로 필요한 것은 Fragment Shader 입니다.

    // Fragment Shader는 기본 정밀도를 가지고 있지 않기 때문에 하나를 선언해야 합니다.
    // mediump(중간 정도 정밀도)은 기본값으로 좋습니다.
    precision mediump float;

    void main() {
      // gl_FragColor는 Fragment Shader의 설정을 담당하는 특수 변수입니다.
      gl_FragColor = vec4(1, 0, 0.5, 1); // 붉은-보라색 반환
    }

위에서 우리는 `gl_FragColor`을 빨강 1, 초록 0, 파랑 0.5, 투명도 1인 `1, 0, 0.5, 1`로 설정했는데요.
WebGL에서 색상은 0에서 1까지 사용합니다.

이제 두 Shader 함수를 작성해서 WebGL을 시작할 수 있습니다.

먼저 HTML canvas 요소가 필요합니다.

     <canvas id="c"></canvas>

그러면 JavaScript에서 찾을 수 있습니다.

     var canvas = document.getElementById("c");

이제 WebGLRenderingContext을 만들 수 있습니다.

     var gl = canvas.getContext("webgl");
     if (!gl) {
       // webgl을 쓸 수 없어요!
       ...
     }

Shader를 컴파일해서 GPU에 넣어야 하므로 우선 문자열로 가져와야 합니다.
JavaScript에서 문자열을 만드는 방법으로 GLSL 문자열을 만들 수 있습니다.
예를 들어, 여러 줄의 template 문자열을 연결한 걸 AJAX를 이용해 내려받을 수 있겠죠.
또는 이 경우, JavaScript type이 아닌 script 태그를 넣어야 합니다.

    <script id="2d-vertex-shader" type="notjs">

      // Attribute는 Buffer로부터 데이터를 받습니다.
      attribute vec4 a_position;

      // 모든 shader는 main 함수를 가지고 있습니다.
      void main() {
        // gl_Position은 Vertex Shader가 설정을 담당하는 특수 변수입니다.
        gl_Position = a_position;
      }

    </script>

    <script id="2d-fragment-shader" type="notjs">

      // Fragment Shader는 기본 정밀도를 가지고 있지 않기 때문에 하나를 선언해야 합니다.
      // mediump(중간 정도 정밀도)은 기본값으로 좋습니다.
      precision mediump float;

      void main() {
        // gl_FragColor는 Fragment Shader의 설정을 담당하는 특수 변수입니다.
        gl_FragColor = vec4(1, 0, 0.5, 1); // 붉은-보라색 반환
      }

    </script>

사실 대부분의 3D 엔진은 다양한 종류의 template, concatenation 등을 사용하여 GLSL Shader를 바로 생성합니다.
하지만 이 사이트에 있는 예제들은 runtime에서 GLSL 생성해야 할 만큼 복잡하지 않습니다.

다음으로 Shader를 만들고, GLSL을 올리고, Shader를 컴파일하는 함수가 필요합니다.
참고로 함수의 이름을 보면 어떤 일을 하는지 명확하기 때문에 주석을 작성하지 않았습니다.

    function createShader(gl, type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader;
      }

      console.log(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
    }

이제 우리는 두 Shader를 만드는 함수를 호출할 수 있습니다.

    var vertexShaderSource = document.getElementById("2d-vertex-shader").text;
    var fragmentShaderSource = document.getElementById("2d-fragment-shader").text;

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

다음으로 두 Shader를 *program*으로 *link*해야 합니다.

    function createProgram(gl, vertexShader, fragmentShader) {
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;
      }

      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
    }

그리고 호출합니다.

    var program = createProgram(gl, vertexShader, fragmentShader);

GPU에 GLSL Program을 만들었고 이제 데이터를 제공해줘야 합니다.
대부분의 WebGL API는 GLSL Program에 데이터 제공을 위한 상태 설정에 관한 것입니다.

이 경우 우리는 그저 GLSL Program에 Attribute인 `a_position`을 입력하면 됩니다.
먼저 해야 할 일은 우리가 방금 작성한 Program의 Attribute 위치를 찾는 것인데요.

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

Attribute(또는 uniform) 위치를 찾는 것은 Render Loop가 아니라 초기화 과정에서 해야 합니다.

Attribute는 buffer로부터 데이터를 가져오기 때문에 버퍼를 생성해야 합니다.

    var positionBuffer = gl.createBuffer();

전역 bind point로 WebGL의 많은 자원을 조작할 수 있습니다.
bind point를 WebGL 내부의 전역 변수라고 생각하시면 됩니다.
먼저 bind point에 자원을 할당합시다.
그러면 모든 함수가 bind point를 통해 자원을 참조합니다.
자, point buffer를 할당해봅시다.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

이제 bind point를 통해 buffer를 참조해서 데이터를 넣을 수 있습니다.

    // 2d point 3개
    var positions = [
        0, 0,
        0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(positions),
      gl.STATIC_DRAW
    );

여기까지 한 것들을 정리해보겠습니다.
먼저 JavaScript 배열인 `positions`가 있습니다.
반면에 WebGL은 강력한 type을 가지는 데이터 필요하므로 `new Float32Array(positions)`는 새로운 32bit 부동 소수점 배열을 생성해서 `positions`의 값을 복사합니다.
그다음 `gl.bufferData`는 데이터를 GPU의 `positionBuffer`로 복사합니다.
위에서 `ARRAY_BUFFER` bind point로 할당했기 때문에 position buffer를 사용합니다.

마지막 매개변수, `gl.STATIC_DRAW`는 WebGL에게 데이터를 어떻게 사용할지 알려줍니다.
WebGL은 확정된 것들을 이용해서 최적화하려고 합니다.
`gl.STATIC_DRAW`는 WebGL에 데이터가 많이 바뀌지는 않을 것 같다고 알려줍니다.

지금까지 작성한 것은 *초기화 코드*입니다.
이 코드는 페이지가 로드될 때 한 번 실행됩니다.
아래부터는 render/draw 할 때마다 실행되는 *렌더링 코드*입니다.

## Rendering

그리기 전에 canvas를 화면 크기와 일치하도록 조정해야 합니다.
이미지처럼 canvas에는 2가지 크기가 있는데요.
실제로 그 안에 있는 픽셀 수와 표시되는 크기를 개별적으로 나타냅니다.
CSS는 canvas가 표시되는 크기를 결정하는데요.
이건 다른 방법보다 훨씬 유연하기 때문에 **항상 CSS로 원하는 Canvas 크기를 지정해야 합니다.**

Canvas의 픽셀 수와 표시되는 크기를 일치하도록 만들기 위해 [여기에서 읽을 수 있는 도우미 함수를 쓰고 있습니다](webgl-resizing-the-canvas.html).

여기 있는 대부분의 예제는 window에서 실행할 경우 Canvas 크기가 400x300 픽셀이지만 iframe 내부에 있으면 사용 가능한 공간을 채우기 위해 늘어납니다.
CSS로 크기를 결정하고 일치하도록 조정함으로써 우리는 이 두 가지 경우를 모두 쉽게 처리할 수 있습니다.

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

우리는 `gl_Position`으로 설정될 clip 공간 값을 화면 공간이라고 불리는 픽셀로 변환하는 방법을 WebGL에게 알려줘야 합니다.
이를 위해 `gl.viewport`를 호출하고 현재 Canvas 크기를 넘겨야 합니다.

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

이렇게 하면 -1 <-> +1 clip 공간이 x에 0 <-> `gl.canvas.width`, y에 0 <-> `gl.canvas.height`로 대응됩니다.

Canvas를 깨끗하게 지워봅시다.
`0, 0, 0, 0`은 각각 빨강, 초록, 파랑, 투명도이므로 canvas를 투명하게 만듭니다.

    // Canvas 지우기
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

WebGL에게 Shader Program을 실행하라고 지시합니다.

    // Program(Shader 씽) 사용 지시
    gl.useProgram(program);

다음으로 WebGL에게 우리가 위에서 설정한 버퍼에서 데이터를 가져와 shader의 attribute에 공급하는 방법을 알려줘야 하는데요.
우선 attribute를 활성화해야 합니다.

    gl.enableVertexAttribArray(positionAttributeLocation);

그다음 데이터를 어떻게 꺼낼지 지정합니다.

    // position buffer 할당
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // attribute에게 positionBuffer의 데이터를 어떻게 꺼낼지 지시 (ARRAY_BUFFER)
    var size = 2;          // 실행될 때마다 2개 구성 요소 사용
    var type = gl.FLOAT;   // 데이터는 32bit 소수점
    var normalize = false; // 정규화되지 않은 데이터
    var stride = 0;        // 0 = 반복할 때마다 size * sizeof(type)만큼 다음 위치로 이동
    var offset = 0;        // buffer 시작점
    gl.vertexAttribPointer(
      positionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

`gl.vertexAttribPointer`의 숨겨진 부분은 현재 `ARRAY_BUFFER`를 attribute에 할당한다는 겁니다.
다시 말해서 지금 attribute는 `positionBuffer`에 할당됩니다.
이건 우리가 자유롭게 다른 것들을 `ARRAY_BUFFER` bind point에 할당할 수 있다는 걸 의미합니다.
attribute는 `positionBuffer`를 계속 사용합니다.

참고로 GLSL vertex shader 관점에서 `a_position` 속성은 `vec4`입니다.

    attribute vec4 a_position;

`vec4`는 4개의 소수점 값입니다.
JavaScript에서 `a_position = {x: 0, y: 0, z: 0, w: 0}`와 비슷하다고 생각하시면 됩니다.
위에서 저희는 `size = 2`라고 설정했는데요.
Attribute에서 기본값은 `0, 0, 0, 1`이기 때문에 버퍼에서 처음 2개 값(x와 y)을 가져올 겁니다.
그리고 z와 w는 각각 0과 1의 기본값을 가질 겁니다.

이제 우리는 드디어 WebGL에게 GLSL program을 실행해달라고 요청할 수 있습니다.

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);

count가 3이기 때문에 vertex shader는 세 번 실행될 겁니다.
먼저 vertex shader의 `a_position.x`와 `a_position.y` 속성이 positionBuffer의 처음 두 값으로 설정됩니다.
두 번째로 `a_position.xy`가 그다음 두 값으로 설정됩니다.
마지막에는 남아있는 두 값으로 설정됩니다.

`primitiveType`을 `gl.TRIANGLES`로 설정했기 때문에, vertex shader가 세 번 실행될 때마다 WebGL은 `gl_Position`에 설정한 세 값에 따라 삼각형을 그립니다.
Canvas 크기에 상관없이 이 값들은 clip 공간 좌표에 있으며 방향에 따라 -1에서 1사이 값으로 바뀝니다.

Vertex Shader는 단순히 positionBuffer 값을 `gl_Position`에 복사하기 때문에 삼각형은 clip 공간 좌표에 그려질 겁니다.

        0, 0,
        0, 0.5,
      0.7, 0,

clip 공간에서 화면 공간으로 전환할 때 canvas 크기가 400x300이라면 다음과 같이 표시됩니다.

     clip 공간         화면 공간
       0, 0     ->   200, 150
       0, 0.5   ->   200, 225
     0.7, 0     ->   340, 150

WebGL은 이제 삼각형을 렌더링할 겁니다.
WebGL이 그릴 모든 픽셀은 fragment shader를 호출합니다.
우리가 작성한 fragment shader는 `gl_FragColor`를 `1, 0, 0.5, 1`로 설정합니다.
Canvas는 채널당 8bit이기 때문에 WebGL은 `[255, 0, 127, 255]` 값으로 canvas에 작성합니다.

여기 실시간 버전이 있습니다.

{{{example url="../webgl-fundamentals.html" }}}

위 예제에서 vertex shader는 데이터를 전달하는 것 외에는 아무것도 하지 않습니다.
위치 데이터가 이미 clip 공간에 있기 때문에 아무것도 할 게 없습니다.
*WebGL은 단지 rasterization API이기 때문에 만약 당신이 3D를 원한다면 3D에서 clip 공간으로 변환하는 shader를 작성해야 합니다.*

아마 왜 삼각형이 중앙에서 시작해서 우측 상단으로 이동하는지 궁금할 겁니다.
`x`의 clip 공간은 -1부터 1사이 입니다.
그 말은 0이 중앙이고 양수 값이 우측이라는 걸 의미합니다.

상단에 있는 이유는, clip 공간에서 -1은 하단에 +1은 상단에 있기 때문입니다.
즉 0은 중앙이고 양수 값이 중앙보다 위에 있다는 걸 의미합니다.

2D의 경우 clip 공간보다는 픽셀 단위로 작업해야 합니다.
그러니까 픽셀 단위로 위치를 제공하고 clip 공간으로 변환할 수 있도록 shader를 수정해야 합니다.
여기 새로운 vertex shader 입니다.

    <script id="2d-vertex-shader" type="notjs">

    -  attribute vec4 a_position;
    *  attribute vec2 a_position;

    +  uniform vec2 u_resolution;

      void main() {
    +    // 위치를 픽셀에서 0.0->1.0으로 변환
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // 0->1에서 0->2로 변환
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // 0->2에서 -1->+1로 변환 (clip 공간)
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

    </script>

몇 가지 변경 사항들이 있습니다.
`x`와 `y`만 사용하기 때문에 `a_position`을 `vec2`로 수정했습니다.
`vec2`는 `vec4`와 비슷하지만 `x`와 `y`만을 가집니다.

다음으로 `u_resolution`을 호출하는 `uniform`을 추가했습니다.
설정하기 위해서는 위치를 찾아야 합니다.

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

나머지는 주석을 명확하게 해줍니다.
`u_resolution`을 canvas의 해상도로 설정함으로써 shader는 픽셀 좌표로 제공한 `positionBuffer`에 넣은 위치를 가져와 clip 공간으로 변환할 겁니다.

이제 우리는 위칫값을 clip 공간에서 픽셀로 바꿀 수 있습니다.
이번에는 각각 3개의 점으로 이루어진 삼각형 두 개로 만든 사각형을 그려볼 겁니다.

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

사용할 program을 설정한 뒤 우리는 생성한 uniform 값을 설정할 수 있습니다.
`gl.useProgram`은 위의 `gl.bindBuffer`처럼 현재 program을 설정합니다.
이후 모든 `gl.uniformXXX` 함수들은 현재 program의 uniform을 설정합니다.

    gl.useProgram(program);

    ...

    // set the resolution
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

그리고 두 삼각형을 그리기 위해서는 vertex shader를 6번 호출해야 하므로 `count`를 `6`으로 바꿔야 합니다.

    // 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

여기 예제가 있습니다.

참고: 이다음에 있는 모든 예제는 컴파일하고 shader를 연결하는 함수가 포함된 [`webgl-utils.js`](/webgl/resources/webgl-utils.js)를 사용합니다.
예제를 복잡하게 할 필요 없이 [boilerplate](webgl-boilerplate.html) 코드를 사용합시다.

{{{example url="../webgl-2d-rectangle.html" }}}

다시 사각형이 해당 영역의 아래쪽에 있음을 알 수 있습니다.
WebGL은 양수 Y를 위로, 음수 Y를 아래로 간주합니다.
clip 공간에서 왼쪽 하단 모서리는 -1, -1 입니다.
우린 아직 어떤 부호도 바꾸지 않았기 때문에 현재 0, 0은 좌측 하단이 됩니다.
2D 그래픽 API를 사용해서 전통적인 왼쪽 상단 모서리를 얻으려면 clip 공간 y좌표를 뒤집어서 사용할 수 있습니다.

    *gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

이제 우리가 예상한 위치에 사각형이 놓였습니다.

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

사각형을 정의하는 코드를 함수로 만들어서 다른 크기의 사각형을 호출할 수 있도록 합시다.
사각형을 그리는 동안 우리는 색상 설정이 가능하도록 해봅시다.

먼저 fragment shader가 색상 uniform 입력을 가져오도록 만듭니다.

    <script id="2d-fragment-shader" type="notjs">
      precision mediump float;

    +  uniform vec4 u_color;

      void main() {
    *    gl_FragColor = u_color;
      }
    </script>

여기 무작위 색상의 사각형 50개를 무작위 위치에 그리는 코드가 있습니다.

    var colorUniformLocation = gl.getUniformLocation(program, "u_color");
    ...

    // 무작위 색상의 사각형 50개 무작위로 그리기
    for (var ii = 0; ii < 50; ++ii) {
      // 무작위 사각형 설정
      // 이건 ARRAY_BUFFER bind point에서 마지막으로 할당한 것이기 때문에 positionBuffer에 쓸 것입니다.
      setRectangle(
        gl,
        randomInt(300),
        randomInt(300),
        randomInt(300),
        randomInt(300)
      );

      // 무작위 색상 설정
      gl.uniform4f(
        colorUniformLocation,
        Math.random(),
        Math.random(),
        Math.random(),
        1
      );

      // 사각형 그리기
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // 0부터 -1사이 무작위 정수 반환
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // 사각형을 정의한 값들로 buffer 채우기
    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;

      // 참고: gl.bufferData(gl.ARRAY_BUFFER, ...)는 `ARRAY_BUFFER` bind point에 할당된 buffer에 영향을 주지만 지금까지는 하나만 있었습니다.
      // 만약 우리가 하나 이상의 buffer를 가지고 있다면 그 buffer를 먼저 `ARRAY_BUFFER`에 할당하고 싶을 겁니다.
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          x1, y1,
          x2, y1,
          x1, y2,
          x1, y2,
          x2, y1,
          x2, y2
        ]),
        gl.STATIC_DRAW
      );
    }

여기 사각형이 있습니다.

{{{example url="../webgl-2d-rectangles.html" }}}

WebGL이 실제로는 아주 간단한 API라는 걸 보셨기 바랍니다.
네, 간단하다는 말은 아마 틀릴지도 모르지만 하는 일은 간단합니다.
그저 사용자가 작성한 vertex shader와 fragment shader를 실행시키고 점, 선, 삼각형들을 그릴 뿐입니다.
프로그래머인 여러분이 복잡한 3D를 만들기 위해 더 복잡한 shader를 작성할 수 있습니다.
하지만 WebGL API는 rasterizer 할 뿐이며 개념적으로 꽤 간단합니다.

우리는 어떻게 데이터를 attribute와 두 uniform에 제공하는지 보여주는 작은 예제를 다뤘습니다.
일반적으로는 여러 attribute와 많은 uniform을 가집니다.
이 글을 서두에서 *varying*과 *texture*를 언급했는데요.
이것들은 이후 수업에서 소개하겠습니다.

계속하기 전에 애플리케이션 대부분은 `setRectangle`에서 했던 것처럼 buffer의 데이터를 업데이트하는 것이 일반적이지 않다는 것을 말하고 싶습니다.
이를 사용했던 것은 예제에서 입력을 픽셀 좌표를 표시하고 GLSL에서 간단한 수학을 사용하는 것을 보여주기 때문에 이것을 설명하는데 쉬운 방법이라고 생각했기 때문입니다. 
이게 틀린 것은 아니고, 올바르게 하는 많은 경우가 있지만 [WebGL에서 물체의 위치, 방향, 크기를 지정하는 일반적인 방법을 찾으려면 여기를 방문하십시오](webgl-2d-translation.html).

웹 개발이 처음이든 아니든 [설치 및 설정](webgl-setup-and-installation)에서 WebGL 개발 방법에 대한 팁을 확인하십시오.

WebGL을 완전히 새로 배우고 GLSL 또는 쉐이더나 GPU가 무엇을 하는지 전혀 모르는 경우 [WebGL 실제 작동 원리 기초](webgl-how-it-works.html)를 확인하십시오.

최소한 대부분의 예제에서 사용된 [boilerplate 코드](webgl-boilerplate.html)를 쉽게 읽어야 합니다.
또한 거의 모든 예제가 오직 하나만 그릴뿐더러 구조가 어떻게 돼 있는지 볼 수 없기 때문에 일반적인 WebGL 앱이 어떻게 구조화되어 있는지에 대한 몇 가지 아이디어를 얻기 위해 [여러 가지를 그리는 법](webgl-drawing-multiple-things.html)을 봐야 합니다.

아니면 2가지 방향으로 갈 수 있습니다.
이미지 처리에 관심이 있다면 [몇 가지 2D 이미지 처리 방법](webgl-image-processing.html)를 보시면 됩니다.
위치, 회전, 크기에 대하여 관심이 있다면 [여기서 시작하시면 됩니다](webgl-2d-translation.html).

<div class="webgl_bottombar">
<h3>type="notjs"가 무슨 뜻인가요?</h3>
<p><code>&lt;script&gt;</code> 태그는 기본적으로 JavaScript가 있습니다.
type을 넣지 않거나 <code>type="javascript"</code> 또는 <code>type="text/javascript"</code>라고 넣으면 브라우저는 내용을 JavaScript로 해석합니다.
만약 다른 <code>type</code>을 넣으면 브라우저는 스크립트 태그의 내용을 무시합니다.
말인즉슨 <code>type="notjs"</code> 또는 <code>type="foobar"</code> 브라우저에서 아무런 의미가 없습니다.</p>
<p>이건 shader를 수정하기 쉽게 만들어줍니다.
다른 대안은 다음과 같은 문자열을 연결해서 포함하는 겁니다.</p>
<pre class="prettyprint">
var shaderSource = (
  "void main() {\n" +
  "  gl_FragColor = vec4(1,0,0,1);\n" +
  "}"
);
</pre>
<p>또는 ajax 요청으로 shader를 가져올 수 있지만 느리고 비동기 통신입니다.</p>
<p>한 가지 더 현대적인 대안은 multiline template literal을 사용하는 겁니다.</p>
<pre class="prettyprint">
var shaderSource = `
  void main() {
    gl_FragColor = vec4(1,0,0,1);
  }
`;
</pre>
<p>Multiline template literal은 WebGL을 지원하는 모든 브라우저에서 동작합니다.
하지만 불행하게도 오래된 브라우저에서는 동작하지 않습니다.
그러니 만약 이런 브라우저들을 지원해야 한다면 multiline template literal을 사용하지 않거나 <a href="https://babeljs.io/">transpiler</a>를 사용해야 합니다.</p>
</div>
