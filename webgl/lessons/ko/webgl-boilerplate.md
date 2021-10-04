Title: WebGL Boilerplate
Description: 모든 WebGL program에 필요한 일부 코드
TOC: Boilerplate


이건 <a href="webgl-fundamentals.html">WebGL 기초</a>에서 이어지는 글입니다.
대부분의 WebGL 강의들은 모든걸 한 번에 다루기 때문에 배우기 복잡해 보이기도 하는데요.
가능한 한 그것을 피하기 위해 더 작게 나눠보려고 합니다.

WebGL을 복잡해 보이도록 만드는 것들 중 하나는 vertex shader와 fragment shader, 두 가지 작은 함수가 있다는 겁니다.
이 두 함수는 일반적으로 최대 속도가 나오는 GPU에서 실행되는데요.
그렇기 때문에 GPU에서 수행할 수 있는 언어, 커스텀 언어로 작성됩니다.
이 두 함수는 컴파일되고 연결되어야 하는데요.
해당 처리는 모든 WebGL program에서 99% 동일합니다.

다음은 셰이더를 컴파일 하는 boilerplate 코드입니다.

    /**
     * 셰이더 생성 및 컴파일
     *
     * @param {!WebGLRenderingContext} gl은 WebGL Context
     * @param {string} shaderSource는 셰이더의 GLSL source 코드
     * @param {number} shaderType은 셰이더의 type, VERTEX_SHADER 또는 FRAGMENT_SHADER
     * @return {!WebGLShader} 셰이더
     */
    function compileShader(gl, shaderSource, shaderType) {
      // 셰이더 객체 생성
      var shader = gl.createShader(shaderType);

      // 셰이더 소스 코드 설정
      gl.shaderSource(shader, shaderSource);

      // 셰이더 컴파일
      gl.compileShader(shader);

      // 컴파일 여부 확인
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        // 컴파일하는 동안 문제 발생
        throw "could not compile shader:" + gl.getShaderInfoLog(shader);
      }

      return shader;
    }

그리고 program에 두 셰이더를 연결하는 boilerplate 코드인데

    /**
     * 두 셰이더로 program 생성합니다.
     *
     * @param {!WebGLRenderingContext) gl은 WebGL Context
     * @param {!WebGLShader} vertexShader는 vertex shader
     * @param {!WebGLShader} fragmentShader는 fragment shader
     * @return {!WebGLProgram} program
     */
    function createProgram(gl, vertexShader, fragmentShader) {
      // program 생성
      var program = gl.createProgram();

      // 셰이더 할당
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);

      // program 연결
      gl.linkProgram(program);

      // 연결 여부 확인
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
        // 연결에 문제 발생
        throw ("program failed to link:" + gl.getProgramInfoLog (program));
      }

      return program;
    };

물론 오류를 처리하는 방법은 다를 수 있습니다.
예외를 던지는 것이 오류를 처리하는 최고의 방법은 아니죠.
그럼에도 불구하고 거의 모든 WebGL program에서 이 코드는 거의 비슷합니다.

저는 셰이더를 javascript가 아닌 &lt;script&gt; tag에 저장하는 걸 좋아하는데요.
이 방식은 코드를 수정하기 쉽게 만들주기 때문에 저는 이렇게 코드를 작성합니다.

    /**
     * 스크립트 태그의 내용으로 셰이더 생성
     *
     * @param {!WebGLRenderingContext) gl은 WebGL Context
     * @param {string} scriptId는 script tag의 id
     * @param {string} opt_shaderType는 생성할 shader의 type
     *                 전달되지 않으면 script tag의 type 속성 사용
     * @return {!WebGLShader} 셰이더
     */
    function createShaderFromScript(gl, scriptId, opt_shaderType) {
      // id로 스크립트 태그 탐색
      var shaderScript = document.getElementById(scriptId);
        
      if (!shaderScript) {
        throw("*** Error: unknown script element" + scriptId);
      }

      // script tag의 내용 추출
      var shaderSource = shaderScript.text;

      // type을 넘기지 않으면, script tag의 'type' 사용
      if (!opt_shaderType) {
        if (shaderScript.type == "x-shader/x-vertex") {
          opt_shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript.type == "x-shader/x-fragment") {
          opt_shaderType = gl.FRAGMENT_SHADER;
        } else if (!opt_shaderType) {
          throw("*** Error: shader type not set");
        }
      }

      return compileShader(gl, shaderSource, opt_shaderType);
    };

이제 셰이더를 컴파일할 수 있는데

    var shader = compileShaderFromScript(gl, "someScriptTagId");

한 걸음 더 나아가서 script tag에서 두 셰이더를 컴파일하며, program에 첨부하고 연결하는 함수를 만들겁니다.

    /**
     * 두 script tag에서 program 생성
     *
     * @param {!WebGLRenderingContext} gl은 WebGL Context
     * @param {string[]} shaderScriptId는 shader용 스크립트 태그의 id 배열입니다.
     *                   첫 번째는 vertex shader, 두 번째는 fragment shader라고 가정합니다.
     * @return {!WebGLProgram} program
     */
    function createProgramFromScripts(gl, shaderScriptIds) {
      var vertexShader = createShaderFromScript(gl, shaderScriptIds[0], gl.VERTEX_SHADER);
      var fragmentShader = createShaderFromScript(gl, shaderScriptIds[1], gl.FRAGMENT_SHADER);
      return createProgram(gl, vertexShader, fragmentShader);
    }

거의 모든 WebGL program에서 사용하는 다른 코드는 캔버스의 크기를 조정하는 코드입니다.
[여기](webgl-resizing-the-canvas.html)에서 해당 함수가 어떻게 구현됐는지 볼 수 있습니다.

모든 예제는 이 두 가지 함수를 있고

    <script src="resources/webgl-utils.js"></script>

그리고 이렇게 사용하는데

    var program = webglUtils.createProgramFromScripts(gl, [idOfVertexShaderScript, idOfFragmentShaderScript]);

    ...

    webglUtils.resizeCanvasToMatchDisplaySize(canvas);

특정한 예제의 목적을 방해하기 때문에 여러 줄의 동일한 코드로 어지럽히지 않는 게 가장 좋습니다.

여기까지가 최소한의 WebGL boilerplate 코드 모음입니다.
`webgl-utils.js` 코드는 [여기](../resources/webgl-utils.js)에서 찾으실 수 있습니다.
좀 더 정리된 것을 원하신다면 [TWGL.js](https://twgljs.org)를 확인해주세요.

WebGL을 복잡하게 보이게 만드는 나머지 부분은 셰이더에 모든 입력을 설정하는 겁니다.
이건 <a href="webgl-how-it-works.html">작동 원리</a>를 봐주세요.

또한 [Less Code, More Fun](webgl-less-code-more-fun.html)를 읽고 [TWGL](https://twgljs.org)를 확인하는 걸 추천합니다.

참고로 비슷한 이유로 추가하는 몇 가지 script가 더 있습니다.

*   [`webgl-lessons-ui.js`](../resources/webgl-lessons-ui.js)

    이건 슬라이더를 드래그할 때 업데이트되는 표시 값이 있는 슬라이더를 설정하는 코드를 제공합니다.
    다시 이 코드를 사용해서 모든 파일을 어지럽히고 싶지 않아서 한 곳에 뒀습니다.

*   [`lessons-helper.js`](../resources/lessons-helper.js)

    이 script는 webglfundmentals.org를 제외하고는 필요하지 않습니다.
    live editor 내부에서 사용될 때 화면에 에러 메세지 출력하는 걸 도와줍니다.

*   [`m3.js`](../resources/m3.js)

    이건 2d 수학 함수 묶음입니다.
    행렬 수학에 대한 첫 글을 시작했을 때는 inline으로 만들었지만 너무 복잡해져서 이후에는 일부 예제에 이 script가 포함되고 있습니다.

*   [`m4.js`](../resources/m4.js)

    이건 3d 수학 함수 묶음입니다.
    3d에 대한 첫 글을 시작했을 때는 inline으로 만들었지만 너무 복잡해져서 3d에 대한 두 번째 글 이후부터 이 script가 포함되고 있습니다.

