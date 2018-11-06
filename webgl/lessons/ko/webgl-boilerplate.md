Title: WebGL Boilerplate
Description: 모든 WebGL program에 필요한 코드

이건 <a href="webgl-fundamentals.html">WebGL 기초</a>에서 이어지는 글입니다.
대부분의 WebGL 강의들은 모든걸 한 번에 처리하기 때문에 배우기가 복잡해 보이기도 합니다.
가능한 한 그것을 피하도록 노력하고 더 작게 나눠서 배워봅시다.

WebGL을 복잡해 보이도록 만드는 것들 중 하나는 vertex shader와 fragment shader를 사용한다는 겁니다.
두 함수들은 일반적으로 최대 속도가 나오는 GPU에서 실행되는데요.
그렇기 때문에 GPU에서 수행할 수 있는 언어와 동일한 사용자 정의 언어로 작성됩니다.
이 함수 두 개는 컴파일되고 연결되어야 합니다.
해당 처리는 모든 WebGL program 시간의 99%와 같습니다.

여기 shader를 컴파일 하기 위한 boilerplate 코드입니다.

    /**
     * Shader 생성 및 컴파일
     *
     * @param {!WebGLRenderingContext} gl은 WebGL Context
     * @param {string} shaderSource는 shader의 GLSL source 코드
     * @param {number} shaderType은 VERTEX_SHADER 또는 FRAGMENT_SHADER 같은 shader의 종류
     * @return {!WebGLShader} Shader
     */
    function compileShader(gl, shaderSource, shaderType) {
      // Shader 객체 생성
      var shader = gl.createShader(shaderType);

      // Shader source 코드 설정.
      gl.shaderSource(shader, shaderSource);

      // Shader 컴파일
      gl.compileShader(shader);

      // 컴파일 여부 확인
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        // 컴파일하는 동안 문제 발생; throw error
        throw "could not compile shader:" + gl.getShaderInfoLog(shader);
      }

      return shader;
    }

그리고 program에 두 shader를 연결하기 위한 boilerplate 코드

    /**
     * 두 shader로 program 생성합니다.
     *
     * @param {!WebGLRenderingContext) gl은 WebGL Context
     * @param {!WebGLShader} vertexShader는 vertex shader
     * @param {!WebGLShader} fragmentShader는 fragment shader
     * @return {!WebGLProgram} Program
     */
    function createProgram(gl, vertexShader, fragmentShader) {
      // program 생성
      var program = gl.createProgram();

      // shader 할당
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);

      // program 연결
      gl.linkProgram(program);

      // 연결 여부 확인
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
        // 연결에 문제 발생
        throw ("program filed to link:" + gl.getProgramInfoLog (program));
      }

      return program;
    };

물론 오류를 처리하는 방법은 다를 수 있습니다.
예외를 던지는 것이 오류를 처리하는 최고의 방법은 아니죠.
하지만 대부분의 WebGL program에서 이런 코드 몇 줄은 거의 비슷합니다.

저는 shader를 javascript가 아닌 &lt;script&gt; tag에 저장하는 것을 선호하는데요.
이렇게 하면 코드를 수정하기 쉽게 만들어 주므로 이런 식으로 코드를 작성합니다.

    /**
     * script tag의 내용으로 shader 생성
     *
     * @param {!WebGLRenderingContext) gl은 WebGL Context
     * @param {string} scriptId는 script tag의 id
     * @param {string} opt_shaderType는 생성할 shader의 자료형
     *                 전달되지 않으면 script tag의 type 속성 사용
     *
     * @return {!WebGLShader} A shader.
     */
    function createShaderFromScript(gl, scriptId, opt_shaderType) {
      // script tag의 id로 탐색
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

이제 shader를 컴파일할 수 있습니다.

    var shader = compileShaderFromScript(gl, "someScriptTagId");

보통은 한 걸음 더 나아가서 script tag에서 shader 두 개를 컴파일하고 프로그램에 첨부하고 연결하는 함수를 만들겁니다.

    /**
     * script tag 2개로 program 생성
     *
     * @param {!WebGLRenderingContext} gl은 WebGL Context
     * @param {string[]} shaderScriptId는 shader용 script tag의 id 배열입니다.
     *                   첫 번째는 vertex shader, 두 번째는 fragment shader라고 가정합니다.
     *
     * @return {!WebGLProgram} A program
     */
    function createProgramFromScripts(gl, shaderScriptIds) {
      var vertexShader = createShaderFromScript(gl, shaderScriptIds[0], gl.VERTEX_SHADER);
      var fragmentShader = createShaderFromScript(gl, shaderScriptIds[1], gl.FRAGMENT_SHADER);
      return createProgram(gl, vertexShader, fragmentShader);
    }

거의 모든 WebGL program에서 사용하는 다른 코드는 canvas의 크기를 조정하는 코드입니다.
[여기에서 이 함수가 구현된 방법을](webgl-resizing-the-canvas.html) 볼 수 있습니다.

모든 예제는 이 두 가지 함수를 포함하고 있습니다.

    <script src="resources/webgl-utils.js"></script>

그리고 이렇게 사용합니다.

    var program = webglUtils.createProgramFromScripts(gl, [idOfVertexShaderScript, idOfFragmentShaderScript]);

    ...

    webglUtils.resizeCanvasToMatchDisplaySize(canvas);

특정한 예제에 대해 다룰 때는 같은 코드 여러 줄을 묶어서 예제를 복잡하게 하지 않는 것이 최고입니다.

여기까지가 WebGL boilerplate의 minimum set 입니다.
[`webgl-utils.js`](../resources/webgl-utils.js) 코드는 여기서 찾으실 수 있구요.
좀 더 정리된 것을 원하신다면 [TWGL.js](http://twgljs.org)를 확인해주세요.

WebGL을 복잡하게 보이게 만드는 나머지 부분은 shader로 보내는 모든 입력을 설정하는 겁니다.

<a href="webgl-how-it-works.html">작동 원리</a>를 봐주세요.

또한 [코드는 적게 재미는 더](webgl-less-code-more-fun.html)를 읽고 [TWGL](http://twgljs.org)를 확인하는 걸 권장합니다.

참고로 우리가 그것을 추가하는 것과 비슷한 이유로 몇 가지 script가 더 있습니다.

*   [`webgl-lessons-ui.js`](../resources/webgl-lessons-ui.js)

    슬라이더를 드래그할 때 갱신되는 표시 값이 있는 슬라이더를 설정하는 코드를 제공합니다.
    다시 이 코드를 사용해서 모든 파일을 복잡하게 만들고 싶지 않았습니다.

*   [`webgl-lessons-helper.js`](../resources/webgl-lessons-helper.js)

    이 script는 webglfundmentals.org를 제외하고는 필요하지 않습니다.
    live editor에서 다른 것들과 함께 사용하면 화면에 에러 메세지 출력하는 것을 도와줍니다.

*   [`m3.js`](../resources/m3.js)

    이건 2d 수학 함수들의 묶음입니다.
    행렬 수학에 대한 첫 번째 글부터 시작해서 inline으로 만들어졌습니다.
    하지만 너무 복잡하기 때문에 몇몇 예제에서만 이 script가 포함됩니다.

*   [`m4.js`](../resources/m4.js)

    이건 3d 수학 함수들의 묶음입니다.
    3d에 대한 첫 번째 글부터 시작해서 inline으로 만들어졌습니다.
    하지만 너무 복잡하기 때문에 3d에 대한 두 번째 글 이후부터 이 script가 포함됩니다.
