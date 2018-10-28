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
     * @param {!WebGLRenderingContext} gl은 WebGL Context입니다.
     * @param {string} shaderSource는 shader의 GLSL source 코드입니다.
     * @param {number} shaderType은 VERTEX_SHADER 또는 FRAGMENT_SHADER 같은 shader의 종류입니다.
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
     * @param {!WebGLRenderingContext) gl은 WebGL Context입니다.
     * @param {!WebGLShader} vertexShader는 vertex shader입니다.
     * @param {!WebGLShader} fragmentShader는 fragment shader입니다.
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

Of course how you decide to handle errors might be different.
Throwing exceptions might not be the best way to handle things.
Still, those few lines of code are pretty much the same in nearly every WebGL program.

I like to store my shaders in non javascript &lt;script&gt; tags.
It makes them easy to edit so I use code like this.

    /**
     * Creates a shader from the content of a script tag.
     *
     * @param {!WebGLRenderingContext} gl The WebGL Context.
     * @param {string} scriptId The id of the script tag.
     * @param {string} opt_shaderType. The type of shader to create.
     *     If not passed in will use the type attribute from the script tag.
     *
     * @return {!WebGLShader} A shader.
     */
    function createShaderFromScript(gl, scriptId, opt_shaderType) {
      // look up the script tag by id.
      var shaderScript = document.getElementById(scriptId);
      if (!shaderScript) {
        throw("*** Error: unknown script element" + scriptId);
      }

      // extract the contents of the script tag.
      var shaderSource = shaderScript.text;

      // If we didn't pass in a type, use the 'type' from
      // the script tag.
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

Now to compile a shader I can just do

    var shader = compileShaderFromScript(gl, "someScriptTagId");

I'll usually go one step further and make a function to compile two shaders from script tags, attach them to a program and link them.

    /**
     * Creates a program from 2 script tags.
     *
     * @param {!WebGLRenderingContext} gl The WebGL Context.
     * @param {string[]} shaderScriptIds Array of ids of the script tags for the shaders.
     *        The first is assumed to be the vertex shader, the second the fragment shader.
     *
     * @return {!WebGLProgram} A program
     */
    function createProgramFromScripts(gl, shaderScriptIds) {
      var vertexShader = createShaderFromScript(gl, shaderScriptIds[0], gl.VERTEX_SHADER);
      var fragmentShader = createShaderFromScript(gl, shaderScriptIds[1], gl.FRAGMENT_SHADER);
      return createProgram(gl, vertexShader, fragmentShader);
    }

The other piece of code I use in almost every WebGL program is something to resize the canvas.
You can see [how that function is implemented here](webgl-resizing-the-canvas.html).

In the case of all the samples these 2 functions are included with

    <script src="resources/webgl-utils.js"></script>

and used like this

    var program = webglUtils.createProgramFromScripts(
      gl, [idOfVertexShaderScript, idOfFragmentShaderScript]);

    ...

    webglUtils.resizeCanvasToMatchDisplaySize(canvas);

It seems best not to clutter all the samples with many lines of the same code as they just get in the way of what that specific example is about.

That's most of my minimum set of WebGL boilerplate code.
[You can find `webgl-utils.js` code here](../resources/webgl-utils.js).
If you want something slightly more organized check out [TWGL.js](http://twgljs.org).

The rest of what makes WebGL look complicated is setting up all the inputs to your shaders.
See <a href="webgl-how-it-works.html">how it works</a>.

I'd also suggest you read up on [less code more fun](webgl-less-code-more-fun.html) and check out [TWGL](http://twgljs.org).

Note while we're add it there are several more scripts for similar reasons

*   [`webgl-lessons-ui.js`](../resources/webgl-lessons-ui.js)

    This provides code to setup sliders that have a visible value that updates when you drag the slider.
    Again I didn't want to clutter all the files with this code so it's in one place.

*   [`webgl-lessons-helper.js`](../resources/webgl-lessons-helper.js)

    This script is not needed except on webglfundmentals.org.
    It helps print error messages to the screen when used inside the live editor among other things.

*   [`m3.js`](../resources/m3.js)

    This is a bunch of 2d math functions.
    They get created started with the first article about matrix math and as they are created they are inline
    but eventually they're just too much clutter so after few example they are used by including this script.

*   [`m4.js`](../resources/m4.js)

    This is a bunch of 3d math functions.
    They get created started with the first article about 3d and as they are created they are inline
    but eventually they're just too much clutter so after the 2nd article on 3d they are used by including this script.
