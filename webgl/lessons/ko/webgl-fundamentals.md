제목: WebGL 기초
설명: 기초부터 시작하는 WebGL 첫 강의

WebGL은 종종 3D API로 치부됩니다. 사람들은 "WebGL을 사용해서 *멋진 3D*를 만들어야지!"라고 생각합니다.
하지만 사실 WebGL은 그저 래스터화 된 엔진일 뿐 입니다. 당신이 작성한 코드를 이용해 점, 선, 삼각형 등을 그리죠.
당신이 원하는 결과물(*멋진 3D*)을 얻기 위해서 점, 선, 삼각형을 그리는 코드를 잘 이용해야 합니다.

WebGL은 컴퓨터의 GPU에서 실행됩니다. 따라서 GPU에서 실행되는 코드를 작성해야 하는데, 이 코드는 함수 쌍 형태로 제공됩니다.
각각 Vertex Shader와 Fragment Shader라고 불리며 C/C++처럼 엄격한 Type을 가지는 [GLSL](webgl-shaders-and-glsl.html)로 작성되어 있습니다.
그리고 이 두 개를 합쳐서 *Shader Program*이라고 부릅니다.

Vertex Shader의 역할은 Vertex 위치들을 계산하는 것 입니다.
출력 위치에 따라서 WebGL은 점, 선, 삼각형을 포함한 다양한 종류의 Primitive를 래스터화를 할 수 있습니다.
이 Primitive들을 래스터화하면 Fragment Shader라고 하는 함수를 두 번째로 호출합니다.
Fragment Shader의 역할은 현재 그려진 Primitive의 모든 화소에 색을 계산합니다.

대부분의 WebGL API는 함수 쌍이 실행되도록 상태를 설정하는 것에 관한 것 입니다.
당신이 원하는 것을 그리기 위해서는 여러 상태를 설정하고 GPU에서 Shader를 실행하는 `gl.drawArrays` 또는 `gl.drawElements`을 실행해야 합니다.

함수들이 접근하기 원하는 모든 데이터는 GPU에 제공되어야 하는데요.
Shader가 데이터를 받을 수 있는 방법에는 4가지가 있습니다.


1. Attribute와 Buffer

   Buffer는 GPU에 업로드하는 2진 데이터 배열입니다.
   일반적으로 Buffer는 위치, 법선, Texture 좌표, Vertex 색상 등 포함하지만 당신이 원하는 것을 자유롭게 넣을 수 있죠.

   Attribute는 Buffer에서 데이터를 가져와서 Vertex Shader 제공하는 방법을 지정하는데 사용됩니다.
   예를 들어 3개의 32비트 부동 소수점으로 각각의 위치를 버퍼에 넣을 수 있는데요.
   특정한 Attribute에게 어느 Buffer에서 위치를 가져올지, 어떤 데이터 형식을 가져와야 하는지 (3개의 32비트 부동 소수점),
   Buffer의 어디에서 offset이 시작되는지 그리고 한 위치에서 다음 위치로 얼마나 많은 바이트를 이동시킬 것인지 알려줘야 합니다.
   
   Buffer는 무작위 접근로 접근할 수 없는데요.
   대신에 Vertex Shader가 지정한 횟수만큼 실행됩니다.
   그리고 실행될 때마다 지정된 다음 버퍼의 값이 Attribute에 할당됩니다.

2. Uniform

   Uniform은 Shader Program을 실행하기 전에 선언하는 유용한 전역 변수입니다.

3. Texture

   Texture는 Shader Program이 무작위로 접근할 수 있는 데이터 배열입니다.
   일반적으로 Texture에 들어가는 것은 대부분 이미지 데이터지만 색상 이외에 다른 것도 쉽게 넣을 수 있습니다.

4. Varying

   Varying는 Vertex Shader가 Fragment Shader에 데이터를 넘기는 방법입니다.
   렌더링되는 점, 선 또는 삼각형에 따라 Vertex Shader의 Varying 값은 Fragment Shader를 실행하는 동안 보간됩니다.

## WebGL Hello World

WebGL은 오직 2가지(clipspace 좌표와 색상)만 관여합니다.
WebGL을 사용하는 프로그래머가 할 일은 이 2가지를 작성하는 겁니다.

이를 위해 2개의 "Shader"를 제공합니다.
Vertex Shader는 clipspace 좌표를 제공하고 Fragment Shader는 색상을 제공하죠.

clipspace 좌표는 Canvas 크기에 상관없 항상 -1에서 +1까지 사용합니다.
여기에 WebGL을 보여주는 간단한 WebGL 예제가 있는데요.

Vertex Shader부터 시작해봅시다.

    // Attribute는 Buffer로 부터 데이터를 받습니다.
    attribute vec4 a_position;

    // 모든 shader는 main 함수를 가지고 있습니다.
    void main() {

      // gl_Position은 Vertex Shader가 설정을 담당하는 특수 변수입니다.
      gl_Position = a_position;
    }

실행될 때, GLSL 대신에 JavaScript로 작성된 것이라면 이렇게 쓰일 것 입니다.

    // *** PSEUDO CODE!! ***

    var positionBuffer = [
      0, 0, 0, 0,
      0, 0.5, 0, 0,
      0.7, 0, 0, 0,
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

실제로는 `positionBuffer`가 이진 데이터(아래 참조)로 전환되기 때문에 그렇게 간단하지 않습니다.
이렇게 Buffer에서 가져오는 데이터의 실제 계산과 약간 다르지만 이걸로 Vertex Shader가 어떻게 실행되는지 알 수 있었습니다.

다음으로 필요한 것은 Fragment Shader 입니다.

    // Fragment Shader는 기본 정밀도를 가지고 있지 않기 때문에 하나를 선언해야 합니다.
    // mediump(중간 정도 정밀도)은 기본 값으로 좋습니다.
    precision mediump float;

    void main() {
      // gl_FragColor는 Fragment Shader의 설정을 담당하는 특수 변수입니다.
      gl_FragColor = vec4(1, 0, 0.5, 1); // 붉은-보라색 반환
    }

위에서 우리는 `gl_FragColor`을 빨강 1, 초록 0, 파랑 0.5, 투명도 1인 `1, 0, 0.5, 1`로 설정했는데요.
WebGL에서 색상은 0에서 1까지 사용합니다.

이제 두 Shader 함수를 작성하여 WebGL을 시작할 수 있습니다.

먼저 HTML canvas element가 필요합니다.

     <canvas id="c"></canvas>

그러면 JavaScript에서 찾을 수 있습니다.

     var canvas = document.getElementById("c");

이제 WebGLRenderingContext을 만들 수 있습니다.

     var gl = canvas.getContext("webgl");
     if (!gl) {
        // webgl을 쓸 수 없어요!
        ...

Shader를 컴파일해서 GPU에 넣어야 하기 때문에 먼저 그것을 문자열로 가져와야 합니다.
JavaScript에서 문자열을 만드는 방법으로 GLSL 문자열을 만들 수 있습니다.
예를 들어, 여러 줄의 template 문자열을 연결한 걸 AJAX를 이용해 다운로드할 수 있습니다.
또는 이 경우에, JavaScript가 type이 아닌 script 태그를 넣어야 합니다.

    <script id="2d-vertex-shader" type="notjs">

      // Attribute는 Buffer로 부터 데이터를 받습니다.
      attribute vec4 a_position;

      // 모든 shader는 main 함수를 가지고 있습니다.
      void main() {

        // gl_Position은 Vertex Shader가 설정을 담당하는 특수 변수입니다.
        gl_Position = a_position;
      }

    </script>

    <script id="2d-fragment-shader" type="notjs">

      // Fragment Shader는 기본 정밀도를 가지고 있지 않기 때문에 하나를 선언해야 합니다.
      // mediump(중간 정도 정밀도)은 기본 값으로 좋습니다.
      precision mediump float;

      void main() {
        // gl_FragColor는 Fragment Shader의 설정을 담당하는 특수 변수입니다.
        gl_FragColor = vec4(1, 0, 0.5, 1); // 붉은-보라색 반환
      }

    </script>

사실 대부분의 3D 엔진은 다양한 종류의 template, concatenation 등을 사용하여 GLSL Shader를 바로 생성합니다.
하지만 이 사이트에 있는 예제들은 runtime에서 GLSL 생성해야 할 만큼 복잡하지는 않습니다.

다음으로 Shader를 만들고, GLSL를 업로드하고, Shader를 컴파일하는 함수가 필요합니다.
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
대부분의 WebGL API는 GLSL Program에 데이터를 제공하기 위한 상태 설정에 대한 것 입니다.

이 경우 우리는 단지 GLSL Program에 Attribute인 `a_position`를 입력하면 됩니다.
먼저 해야할 일은 우리가 방금 작성한 Program의 Attribute 위치를 찾는 것 인데요.

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

Attribute(또는 uniform) 위치를 찾는 것은 Render Loop가 아니라 초기화 과정에서 해야합니다.

Attribute는 버퍼로 부터 데이터를 가져오 때문에 버퍼를 생성해야 합니다.

    var positionBuffer = gl.createBuffer();

WebGL을 사용하면 전역 bind point에서 많은 WebGL resource를 조작할 수 있습니다.
bind point를 WebGL 내부의 전역 변수라고 생각하시면 됩니다.
먼저 bind point에 resource를 할당합시다.
그러면 다른 모든 함수들이 bind point를 통해 resource를 참조합니다.
자, point buffer를 할당해봅시다.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

이제 bind point를 통해 buffer를 참조함해서 데이터를 넣을 수 있습니다.

    // 2d point 3개
    var positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

여기까지 한 것들을 정리해보겠습니다.
먼저 JavaScript 배열인 `positions`가 있습니다.
반면에 WebGL은 강력한 type을 가지는 데이터 필요하므로 `new Float32Array(positions)`는 새로운 32bit 부동 소수점 배열을 생성해서 `positions`의 값을 복사합니다.

`gl.bufferData`는 그 데이터를 GPU의 `positionBuffer`로 복사합니다.

위에서 `ARRAY_BUFFER` bind point에 할당했으므로 position buffer를 사용하고 있습니다.

마지막 매개변수, `gl.STATIC_DRAW`는 WebGL에 데이터를 어떻게 사용할지에 대한 힌트입니다.
WebGL은 확정된 것들을 이용해서 최적화하려고 합니다.
`gl.STATIC_DRAW`는 WebGL에 데이터가 많이 바뀌지는 않을 것 같다고 알려줍니다.

지금까지 작성한 것은 *초기화 코드*입니다.
이 코드는 페이지가 로드될 때 한 번 실행됩니다.
아래부터는 render/draw 할 때마다 실행되는 *렌더링 코드*입니다.

## Rendering

Before we draw we should resize the canvas to match its display size. Canvases just like Images have 2 sizes.
The number of pixels actually in them and separately the size they are displayed. CSS determines the size
the canvas is displayed. **You should always set the size you want a canvas to be with CSS** since it is far
far more flexible than any other method.

To make the number of pixels in the canvas match the size it's displayed
[I'm using a helper function you can read about here](webgl-resizing-the-canvas.html).

In nearly all of these samples the canvas size is 400x300 pixels if the sample is run in its own window
but stretches to fill the available space if it's inside an iframe like it is on this page.
By letting CSS determine the size and then adjusting to match we easily handle both of these cases.

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

We need to tell WebGL how to convert from the clip space
values we'll be setting `gl_Position` to back into pixels, often called screen space.
To do this we call `gl.viewport` and pass it the current size of the canvas.

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

This tells WebGL the -1 +1 clip space maps to 0 &lt;-&gt; `gl.canvas.width` for x and 0 &lt;-&gt; `gl.canvas.height`
for y.

We clear the canvas. `0, 0, 0, 0` are red, green, blue, alpha respectively so in this case we're making the canvas transparent.

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

We tell WebGL which shader program to execute.

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

Next we need to tell WebGL how to take data from the buffer we setup above and supply it to the attribute
in the shader. First off we need to turn the attribute on

    gl.enableVertexAttribArray(positionAttributeLocation);

Then we need to specify how to pull the data out

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

A hidden part of `gl.vertexAttribPointer` is that it binds the current `ARRAY_BUFFER`
to the attribute. In other words now this attribute is bound to
`positionBuffer`. That means we're free to bind something else to the `ARRAY_BUFFER` bind point.
The attribute will continue to use `positionBuffer`.

note that from the point of view of our GLSL vertex shader the `a_position` attribute is a `vec4`

    attribute vec4 a_position;

`vec4` is a 4 float value. In JavaScript you could think of it something like
`a_position = {x: 0, y: 0, z: 0, w: 0}`. Above we set `size = 2`. Attributes
default to `0, 0, 0, 1` so this attribute will get its first 2 values (x and y)
from our buffer. The z, and w will be the default 0 and 1 respectively.

After all that we can finally ask WebGL to execute our GLSL program.

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);

Because the count is 3 this will execute our vertex shader 3 times. The first time `a_position.x` and `a_position.y`
in our vertex shader attribute will be set to the first 2 values from the positionBuffer.
The 2nd time `a_position.xy` will be set to the 2nd two values. The last time it will be
set to the last 2 values.

Because we set `primitiveType` to `gl.TRIANGLES`, each time our vertex shader is run 3 times
WebGL will draw a triangle based on the 3 values we set `gl_Position` to. No matter what size
our canvas is those values are in clip space coordinates that go from -1 to 1 in each direction.

Because our vertex shader is simply copying our positionBuffer values to `gl_Position` the
triangle will be drawn at clip space coordinates

      0, 0,
      0, 0.5,
      0.7, 0,

Converting from clip space to screen space if the canvas size
happened to be 400x300 we'd get something like this

     clip space      screen space
       0, 0       ->   200, 150
       0, 0.5     ->   200, 225
     0.7, 0       ->   340, 150

WebGL will now render that triangle. For every pixel it is about to draw WebGL will call our fragment shader.
Our fragment shader just sets `gl_FragColor` to `1, 0, 0.5, 1`. Since the Canvas is an 8bit
per channel canvas that means WebGL is going to write the values `[255, 0, 127, 255]` into the canvas.

Here's a live version

{{{example url="../webgl-fundamentals.html" }}}

In the case above you can see our vertex shader is doing nothing
but passing on our position data directly. Since the position data is
already in clipspace there is no work to do. *If you want 3D it's up to you
to supply shaders that convert from 3D to clipspace because WebGL is only
a rasterization API*.

You might be wondering why does the triangle start in the middle and go to toward the top right.
Clip space in `x` goes from -1 to +1. That means 0 is in the center and positive values will
be to the right of that.

As for why it's on the top, in clip space -1 is at the bottom and +1 is at the top. That means
0 is in the center and so positive numbers will be above the center.

For 2D stuff you would probably rather work in pixels than clipspace so
let's change the shader so we can supply the position in pixels and have
it convert to clipspace for us. Here's the new vertex shader

    <script id="2d-vertex-shader" type="notjs">

    -  attribute vec4 a_position;
    *  attribute vec2 a_position;

    +  uniform vec2 u_resolution;

      void main() {
    +    // convert the position from pixels to 0.0 to 1.0
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // convert from 0->1 to 0->2
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // convert from 0->2 to -1->+1 (clipspace)
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

    </script>

Some things to notice about the changes. We changed `a_position` to a `vec2` since we're
only using `x` and `y` anyway. A `vec2` is similar to a `vec4` but only has `x` and `y`.

Next we added a `uniform` called `u_resolution`. To set that we need to look up its location.

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

The rest should be clear from the comments. By setting `u_resolution` to the resolution
of our canvas the shader will now take the positions we put in `positionBuffer` supplied
in pixels coordinates and convert them to clip space.

Now we can change our position values from clip space to pixels. This time we're going to draw a rectangle
made from 2 triangles, 3 points each.

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

And after we set which program to use we can set the value for the uniform we created.
`gl.useProgram` is like `gl.bindBuffer` above in that it sets the current program. After
that all the `gl.uniformXXX` functions set uniforms on the current program.

    gl.useProgram(program);

    ...

    // set the resolution
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

And of course to draw 2 triangles we need to have WebGL call our vertex shader 6 times
so we need to change the `count` to `6`.

    // draw
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

And here it is

Note: This example and all following examples use [`webgl-utils.js`](/webgl/resources/webgl-utils.js)
which contains functions to compile and link the shaders. No reason to clutter the examples
with that [boilerplate](webgl-boilerplate.html) code.

{{{example url="../webgl-2d-rectangle.html" }}}

Again you might notice the rectangle is near the bottom of that area. WebGL considers positive Y as
up and negative Y as down. In clip space the bottom left corner -1,-1. We haven't changed any signs
so with our current math 0, 0 becomes the bottom left corner.
To get it to be the more traditional top left corner used for 2d graphics APIs
we can just flip the clip space y coordinate.

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

And now our rectangle is where we expect it.

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

Let's make the code that defines a rectangle into a function so
we can call it for different sized rectangles. While we're at it
we'll make the color settable.

First we make the fragment shader take a color uniform input.

    <script id="2d-fragment-shader" type="notjs">
      precision mediump float;

    +  uniform vec4 u_color;

      void main() {
    *    gl_FragColor = u_color;
      }
    </script>

And here's the new code that draws 50 rectangles in random places and random colors.

      var colorUniformLocation = gl.getUniformLocation(program, "u_color");
      ...

      // draw 50 random rectangles in random colors
      for (var ii = 0; ii < 50; ++ii) {
        // Setup a random rectangle
        // This will write to positionBuffer because
        // its the last thing we bound on the ARRAY_BUFFER
        // bind point
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // Set a random color.
        gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

        // Draw the rectangle.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    // Returns a random integer from 0 to range - 1.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // Fills the buffer with the values that define a rectangle.

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;

      // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
      // whatever buffer is bound to the `ARRAY_BUFFER` bind point
      // but so far we only have one buffer. If we had more than one
      // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

And here's the rectangles.

{{{example url="../webgl-2d-rectangles.html" }}}

I hope you can see that WebGL is actually a pretty simple API.
Okay, simple might be the wrong word. What it does is simple. It just
executes 2 user supplied functions, a vertex shader and fragment shader and
draws triangles, lines, or points.
While it can get more complicated to do 3D that complication is
added by you, the programmer, in the form of more complex shaders.
The WebGL API itself is just a rasterizer and conceptually fairly simple.

We covered a small example that showed how to supply data in an attribute and 2 uniforms.
It's common to have multiple attributes and many uniforms. Near the top of this article
we also mentioned *varyings* and *textures*. Those will show up in subsequent lessons.

Before we move on I want to mention that for *most* applications updating
the data in a buffer like we did in `setRectangle` is not common. I used that
example because I thought it was easiest to explain since it shows pixel coordinates
as input and demonstrates doing a small amount of math in GLSL. It's not wrong, there
are plenty of cases where it's the right thing to do, but you should [keep reading to find out
the more common way to position, orient and scale things in WebGL](webgl-2d-translation.html).

If you're new to web development or even if you're not please check out [Setup and Installation](webgl-setup-and-installation)
for some tips on how to do WebGL development.

If you're 100% new to WebGL and have no idea what GLSL is or shaders or what the GPU does
then checkout [the basics of how WebGL really works](webgl-how-it-works.html).

You should also, at least briefly read about [the boilerplate code used here](webgl-boilerplate.html)
that is used in most of the examples. You should also at least skim
[how to draw mulitple things](webgl-drawing-multiple-things.html) to give you some idea
of how more typical WebGL apps are structured because unfortunately nearly all the examples
only draw one thing and so do not show that structure.

Otherwise from here you can go in 2 directions. If you are interested in image procesing
I'll show you [how to do some 2D image processing](webgl-image-processing.html).
If you are interested in learning about translation,
rotation and scale and eventually 3D then [start here](webgl-2d-translation.html).

<div class="webgl_bottombar">
    <h3>What does type="notjs" mean?</h3>
    <p>
<code>&lt;script&gt;</code> tags default to having JavaScript in them.
You can put no type or you can put <code>type="javascript"</code> or
<code>type="text/javascript"</code> and the browser will interpret the
contents as JavaScript. If you put anything for else for <code>type</code> the browser ignores the
contents of the script tag. In other words <code>type="notjs"</code>
or <code>type="foobar"</code> have no meaning as far as the browser
is concerned.
    </p>
    <p>This makes the shaders easy to edit.
Other alternatives include string concatenations like
    </p>
<pre class="prettyprint">
  var shaderSource =
    "void main() {\n" +
    "  gl_FragColor = vec4(1,0,0,1);\n" +
    "}";
</pre>
    <p>or we could load shaders with ajax requests but that is slow and asynchronous.</p>
    <p>A more modern alternative would be to use multiline template literals.</p>
<pre class="prettyprint">
  var shaderSource = `
    void main() {
      gl_FragColor = vec4(1,0,0,1);
    }
  `;
</pre>
    <p>Multiline template literals work in all browsers that support WebGL.
Unfortunately they don't work in really old browsers so if you care
about supporting a fallback for those browsers you might not want to
use multiline template literals or you might want to use <a href="https://babeljs.io/">a transpiler</a>.
    </p>
</div>
