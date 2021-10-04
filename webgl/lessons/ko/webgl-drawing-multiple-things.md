Title: WebGL - 여러 물체 그리기
Description: WebGL에서 다른 종류의 여러 물체를 그리는 방법
TOC: 여러 물체 그리기


이 글은 [이전 글](webgl-fundamentals.html)에서 이어집니다.
아직 읽지 않았다면 거기부터 시작하는 게 좋습니다.

처음으로 WebGL에서 무언가를 한 다음 물어보는 대다수의 공통적인 질문 중 하나는 어떻게 여러 물체를 그리는가 입니다.

먼저 알아야 할 점은 몇 가지 예외를 제외하고, WebGL은 함수에 매개변수를 많이 전달하는 대신, 물체를 그리는 단일 함수와 해당 함수를 위한 70개 이상의 상태 설정 함수가 있습니다.
예를 들어 원을 그리는 함수가 있다고 상상해보세요.
이는 다음과 같이 프로그래밍할 수 있습니다.

    function drawCircle(centerX, centerY, radius, color) { ... }

혹은 이렇게 코드를 짤 수도 있겠죠.

    var centerX;
    var centerY;
    var radius;
    var color;

    function setCenter(x, y) {
      centerX = x;
      centerY = y;
    }

    function setRadius(r) {
      radius = r;
    }

    function setColor(c) {
      color = c;
    }

    function drawCircle() {
      ...
    }

WebGL은 두 번째 방법으로 동작하는데요.
`gl.createBuffer`, `gl.bufferData`, `gl.createTexture`, `gl.texImage2D`와 같은 함수들은 버퍼(vertex)와 텍스처(color, etc..) 데이터를 WebGL에 업로드 해줍니다.
`gl.createProgram`, `gl.createShader`, `gl.compileShader`, `gl.linkProgram`과 같은 함수들은 GLSL 셰이더를 만들어 줍니다.
그 외 WebGL의 거의 모든 함수들은 이러한 전역 변수나 *상태*를 설정하여 최종적으로 `gl.drawArrays`나 `gl.drawElements`가 호출될 때 사용됩니다.

전형적인 WebGL program은 기본적으로 이런 구조를 따릅니다.

초기화할 때

*   모든 셰이더와 program을 만들고 location 탐색
*   버퍼를 생성하고 정점 데이터 업로드
*   텍스처를 생성하고 텍스처 데이터 업로드

렌더링할 때

*   Viewport와 전역 상태를 지우고 설정
    (depth testing 활성화, culling 활성화, 등등..)
*   그리려는 각각에 대해
    *   그려야 하는 program에 대해 `gl.useProgram` 호출
    *   그리려는 것에 대한 attribute 설정
        *   각각의 attribute에 대해 `gl.bindBuffer`, `gl.vertexAttribPointer`, `gl.enableVertexAttribArray` 호출
    *   그리려는 것에 대한 uniform 설정
        *   각각의 uniform에 대한 `gl.uniformXXX` 호출
        *   `gl.activeTexture`와 `gl.bindTexture`를 호출하여 texture unit에 텍스처 할당
    *   `gl.drawArrays` 혹은 `gl.drawElements` 호출

기본적으로 이렇습니다.
해당 작업을 해내기 위해 어떻게 코드를 구성하냐는 여러분이 정하시면 됩니다.

텍스처 데이터(또한 정점 데이터) 업로드같은 일부 작업은 인터넷으로 다운로드가 끝날 때까지 기다려야 하기 때문에 비동기적으로 발생할 수 있습니다.

3가지 물체를 그리는 간단한 앱을 만들어봅시다.
큐브와 구체 그리고 원뿔입니다.

큐브, 구체, 원뿔 데이터를 계산하는 방법에 대해 자세히 설명하진 않겠습니다.
그냥 이들을 생성하는 함수가 있고 [이전 글](webgl-less-code-more-fun.html)에서 설명한 bufferInfo 객체가 반환된다고 가정해봅시다.

여기 해당 코드입니다.
정점 색상을 곱하기 위해 `u_colorMult`를 추가한 걸 제외하고는 [perspective 예제](webgl-3d-perspective.html)와 같은 간단한 셰이더입니다.

    // Vertex shader에서 전달
    varying vec4 v_color;

    uniform vec4 u_colorMult;

    void main() {
      gl_FragColor = v_color * u_colorMult;
    }


초기화할 때

    // 그리려는 각각에 대한 uniform
    var sphereUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var cubeUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var coneUniforms = {
      u_colorMult: [0.5, 0.5, 1, 1],
      u_matrix: m4.identity(),
    };

    // 각 객체에 대한 translation
    var sphereTranslation = [  0, 0, 0];
    var cubeTranslation   = [-40, 0, 0];
    var coneTranslation   = [ 40, 0, 0];

그릴 때

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // ------ 구체 그리기 --------

    gl.useProgram(programInfo.program);

    // 필요한 모든 attribute 설정
    webglUtils.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);

    sphereUniforms.u_matrix = computeMatrix(
      viewProjectionMatrix,
      sphereTranslation,
      sphereXRotation,
      sphereYRotation);

    // 계산한 uniform 설정
    webglUtils.setUniforms(programInfo, sphereUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, sphereBufferInfo.numElements);

    // ------ 큐브 그리기 --------

    // 필요한 모든 attribute 설정
    webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);

    cubeUniforms.u_matrix = computeMatrix(
      viewProjectionMatrix,
      cubeTranslation,
      cubeXRotation,
      cubeYRotation);

    // 계산한 uniform 설정
    webglUtils.setUniforms(programInfo, cubeUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, cubeBufferInfo.numElements);

    // ------ 원뿔 그리기 --------

    // 필요한 모든 attribute 설정
    webglUtils.setBuffersAndAttributes(gl, programInfo, coneBufferInfo);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

    // 계산한 uniform 설정
    webglUtils.setUniforms(programInfo, coneUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, coneBufferInfo.numElements);

그리고 여기 결과입니다.

{{{example url="../webgl-multiple-objects-manual.html" }}}

한 가지 주목할 점은 shader program이 하나뿐이므로 `gl.useProgram`을 한 번만 호출한다는 겁니다.
만약 다른 shader program을 가지고 있다면 각 program을 사용하기 전에 `gl.useProgram`을 호출해야 합니다.

이 또한 단순화하기 좋은데요.
실질적으로 갖춰야 할 3가지 주요 사항은 아래와 같습니다.

1.  Shader program (그리고 uniform과 attribute의 info/setter)
2.  그리려는 것에 대한 buffer와 attribute
3.  주어진 셰이더로 해당 물체를 그리는데 필요한 uniform

따라서 간단하 단순화는 물체의 배열을 만들고 그 배열에 3가지 물체를 모으는 겁니다.

    var objectsToDraw = [
      {
        programInfo: programInfo,
        bufferInfo: sphereBufferInfo,
        uniforms: sphereUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        uniforms: cubeUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: coneBufferInfo,
        uniforms: coneUniforms,
      },
    ];

그릴 때 행렬도 업데이트해야 합니다.

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // 각 객체에 대한 행렬 계산
    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

이제 그리는 코드는 단순 반복일 뿐입니다.

    // ------ 객체 그리기 --------

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;

      gl.useProgram(programInfo.program);

      // 필요한 모든 attribute 설정
      webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      // Uniform 설정
      webglUtils.setUniforms(programInfo, object.uniforms);

      // 그리기
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

그리고 이건 현존하는 대다수 3D 엔진의 주요 렌더링 루프입니다.
일부 코드 혹은 코드들이 `objectsToDraw` 목록에 들어갈 내용을 결정하지만 기본적으로는 그게 전부입니다.

{{{example url="../webgl-multiple-objects-list.html" }}}

몇 가지 기본적인 최적화가 있는데요.
그리려는 program이 이전에 그렸던 program과 같다면 `gl.useProgram`을 호출할 필요가 없습니다.
마찬가지로 이전에 그렸던 것과 동일한 shape/geometry/vertice을 그린다면 다시 설정할 필요가 없겠죠.

따라서 다음과 같이 최적화할 수 있습니다.

    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;
      var bindBuffers = false;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);

        // Program이 사용하는 버퍼만 바인딩하기 때문에 program이 바뀔 때마다 버퍼를 다시 바인딩해야 합니다.
        // 따라서 2개의 program이 동일한 bufferInfo를 사용하지만 첫 번째 버퍼가 position만 사용하면 두 번째 버퍼로 전환할 때 attribute 중 일부는 활성화되지 않을 겁니다.
        bindBuffers = true;
      }

      // 필요한 모든 attribute 설정
      if (bindBuffers || bufferInfo != lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      }

      // Uniform 설정
      webglUtils.setUniforms(programInfo, object.uniforms);

      // 그리기
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

이번엔 더 많은 객체를 그려 보겠습니다.
이전처럼 3개 대신 그리는 목록을 더 크게 만들어봅시다.

    // 무작위로 선택하기 쉽도록 shape를 배열에 넣기
    var shapes = [
      sphereBufferInfo,
      cubeBufferInfo,
      coneBufferInfo,
    ];

    // 그리기 위한 배열, 조작하기 위한 배열, 객체 배열 2개 만들기
    var objectsToDraw = [];
    var objects = [];

    // 각 객체에 대한 uniform
    var numObjects = 200;
    for (var ii = 0; ii < numObjects; ++ii) {
      // shape 선택
      var bufferInfo = shapes[rand(0, shapes.length) | 0];

      // 객체 만들기
      var object = {
        uniforms: {
          u_colorMult: [rand(0, 1), rand(0, 1), rand(0, 1), 1],
          u_matrix: m4.identity(),
        },
        translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
        xRotationSpeed: rand(0.8, 1.2),
        yRotationSpeed: rand(0.8, 1.2),
      };
      objects.push(object);

      // 그리는 목록에 추가
      objectsToDraw.push({
        programInfo: programInfo,
        bufferInfo: bufferInfo,
        uniforms: object.uniforms,
      });
    }

렌더링할 때

    // 각 객체에 대한 행렬 계산
    objects.forEach(function(object) {
      object.uniforms.u_matrix = computeMatrix(
          viewMatrix,
          projectionMatrix,
          object.translation,
          object.xRotationSpeed * time,
          object.yRotationSpeed * time);
    });

그런 다음 위 루프를 사용하여 객체를 그립니다.

{{{example url="../webgl-multiple-objects-list-optimized.html" }}}

또한 최적화를 더 자주하도록 `programInfo`나 `bufferInfo`로 정렬할 수 있습니다.
대부분의 게임 엔진은 이를 수행하는데요.
안타깝지만 간단하지 않습니다.
여러분이 그린 모든 게 불투명하면 그냥 정렬하면 됩니다.
하지만 반투명 요소를 그려야 한다면 특정 순서로 그려야 합니다.
대다수의 3D 엔진은 2개 이상의 그리는 객체 목록으로 이를 처리하는데요.
하나는 불투명 요소에 대한 목록입니다.
다른 하나는 투명 요소에 대한 목록입니다.
불투명 목록는 program과 geometry로 정렬됩니다.
투명 목록은 depth로 정렬됩니다.
Overlay나 후처리 효과처럼 다른 것들에 대한 별도의 목록이 있을 수도 있습니다.

여기 <a href="../webgl-multiple-objects-list-optimized-sorted.html" target="_blank">정렬된 예제</a>입니다.
제 컴퓨터에서는 비정렬일 때 ~31fps, 정렬일 때 ~37fps이 나옵니다.
거의 20% 향상되었네요.
하지만 이는 최악의 경우 vs 최고의 경우이며, 대부분의 program은 더 많은 걸 수행하므로, 특별한 경우를 제외하고는 전부 고려할만한 가치가 없습니다.

어떤 셰이더만으로는 어떤 geometry들은 그릴 수 없다는 점에 유의해야 합니다.
예를 들어 법선이 필요한 셰이더는 법선이 없는 geometry에서 작동하지 않을 겁니다.
마찬가지로 텍스처가 필요한 셰이더는 텍스처 없이는 작동하지 않습니다.

이 모든 걸 처리하기 때문에 [Three.js](https://threejs.org)같은 3D 라이브러리를 선택하는 것이 좋습니다.
몇 가지 geometry를 만들고, 어떻게 렌더링하고 싶은지 three.js에 지시하면, 런타임에 필요한 것들을 처리하기 위해 셰이더를 생성합니다.
Unity3D, Unreal, Source, Crytek 등 거의 모든 3D 엔진들이 이를 수행합니다.
일부는 오프라인으로 생성되지만 중요한 점은 셰이더를 *생성*한다는 겁니다.

물론 여러분이 이러한 글들을 읽는 이유는 내부에서 무슨 일이 일어나는지 알고 싶어하기 때문입니다.
그건 훌륭하고 모든 걸 직접 작성하는 것은 재미있습니다.
하지만 [WebGL은 굉장히 로우 레벨](webgl-2d-vs-3d-library.html)이므로, 직접 하고 싶다면 해야 할 작업들이 많고, 다른 기능들은 종종 다른 셰이더가 필요하기 때문에, 대부분 셰이더 생성기 작성이 포함됩니다.

루프 안에 `computeMatrix`를 넣지 않았다는 걸 눈치채셨을 겁니다.
이는 렌더링이 행렬 계산과 분리되어야 하기 때문인데요.
일반적으로 [scene graph](webgl-scene-graph.html)에서 행렬을 계산하는데 이건 또 다른 글에서 설명하겠습니다.

이제 여러 물체를 그리기 위한 프레임워크가 생겼으니 [텍스트](webgl-text-html.html)를 그려봅시다.

