Title: 'glDrawArrays: attempt to access out of range vertices in attribute 1' on Emscripten/OpenGL code (works in native C++)
Description:
TOC: qna

# Question:

I have narrowed down the issue to this.  I have two attributes pointed at the exact same data.  This works fine when build in native C++.  However, when built with emscripten, the javascript console shows the following error on each frame:

    'glDrawArrays: attempt to access out of range vertices in attribute 1'

When I comment out the 'glEnableVertexAttribArray' line to enable the second attribute, I don't get this error.

Below is my code.  I'll start with the data buffer creation:

    GLfloat rectangleData[] =
    {
     -.5f, -.5f,  0,1,
     -.5f, .5f,  0,0,
     .5f, .5f,  1,0,
     .5f, -.5f,  1,1,
     -.5f, -.5f,  0,1
    };
    glGenBuffers(1, &rectangleBuffer);
    glBindBuffer(GL_ARRAY_BUFFER, rectangleBuffer);
    glBufferData(
      GL_ARRAY_BUFFER, sizeof(rectangleData),
      rectangleData, GL_STATIC_DRAW);
    glBindBuffer(GL_ARRAY_BUFFER, 0);

Here is a relevant excerpt from my textured quad drawing code:

    glBindBuffer(GL_ARRAY_BUFFER, rectangleBuffer);
    
    int vertexPosition = Shader::getParameterInfo("vertexPosition")->id;
    glVertexAttribPointer(
      vertexPosition, 2, GL_FLOAT,
      GL_FALSE, 16, BUFFER_OFFSET(0));
    glEnableVertexAttribArray(vertexPosition);
    
    int vertexTexCoord = Shader::getParameterInfo("vertexTexCoord")->id;
    glVertexAttribPointer(
      vertexTexCoord, 2, GL_FLOAT,
      GL_FALSE, 16, BUFFER_OFFSET(0));
    glEnableVertexAttribArray(vertexTexCoord);

    glDrawArrays(GL_TRIANGLE_FAN, 0, 5);

Notice that I've adjusted the second attribute to point to the same data as the first (to reduce complexity while debugging).  I'm pretty stumped here and could really use a fresh/experienced perspective.

EDIT: Here's what `BUFFER_OFFSET` looks like:

    #define BUFFER_OFFSET(i) ((char *)NULL + (i))

Source: https://stackoverflow.com/questions/23177229/how-to-cast-int-to-const-glvoid

EDIT: For what it's worth, here is the equivalent Emscripten generated JS code.  I'll post any JS code this references if requested.

    dest=$rectangleData; src=2328; stop=dest+80|0; do {
    HEAP32[dest>>2]=HEAP32[src>>2]|0; dest=dest+4|0; src=src+4|0; } while
    ((dest|0) < (stop|0));
     _glGenBuffers(1,(2300|0));
     $30 = HEAP32[2300>>2]|0;
     _glBindBuffer(34962,($30|0));
     _glBufferData(34962,80,($rectangleData|0),35044);
     _glBindBuffer(34962,0);

    $11 = HEAP32[2300>>2]|0;
     _glBindBuffer(34962,($11|0));
     $12 = (__ZN8platform6Shader16getParameterInfoEPKc(17356)|0);
     $13 = HEAP32[$12>>2]|0;
     $vertexPosition = $13;
     $14 = $vertexPosition;
     _glVertexAttribPointer(($14|0),2,5126,0,16,(0|0));
     $15 = $vertexPosition;
     _glEnableVertexAttribArray(($15|0));
     $16 = (__ZN8platform6Shader16getParameterInfoEPKc(17379)|0);
     $17 = HEAP32[$16>>2]|0;
     $vertexTexCoord = $17;
     $18 = $vertexTexCoord;
     _glVertexAttribPointer(($18|0),2,5126,0,16,(0|0));
     $19 = $vertexTexCoord;
     _glEnableVertexAttribArray(($19|0));
     _glDrawArrays(6,0,5);

Edit:  Better yet, I'll provide a link to the JS code running on github, and the C++ code too (it's near the bottom in "drawImage()"):

https://rawgit.com/jon-heard/Native-WebGL-framework/c134e35ac94fdf3243a9662353ad2227f8c84b43/Native-WebGL-framework/web/index.html

https://github.com/jon-heard/Native-WebGL-framework/blob/c134e35ac94fdf3243a9662353ad2227f8c84b43/Native-WebGL-framework/src/platform/draw.cpp

# Answer

The issue is you have a single vertex shader that **ALWAYS USES 2 ATTRIBUTES**

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.createElement("canvas").getContext("webgl");
    var program = twgl.createProgramFromScripts(gl, ["vs", "fs"]);

    log("list of used attributes");
    log("-----------------------");

    var numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var ii = 0; ii < numAttribs; ++ii) {
      var attribInfo = gl.getActiveAttrib(program, ii);
      if (!attribInfo) {
        break;
      }
      log(gl.getAttribLocation(program, attribInfo.name), attribInfo.name);
    }

    function log(...args) {
       var div = document.createElement("div");
       div.textContent = [...args].join(" ");
       document.body.appendChild(div);
    }


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl.min.js"></script>
    <script type="foo" id="vs">
    uniform mat4 sceneTransform;
    uniform mat4 rotationTransform;
    uniform vec2 objectPosition;
    uniform vec2 objectScale;
    attribute vec2 vertexPosition;
    attribute vec2 vertexTexCoord;
    varying vec2 UVs;
    void main()
    {
      UVs = vertexTexCoord;
      gl_Position = 
        sceneTransform *
        vec4( vertexPosition * objectScale + objectPosition, 0, 1);
    }
    </script>
    <script type="foo" id="fs">
    precision mediump float;

    uniform vec3 objectColor;
    uniform float objectOpacity;

    void main()
    {
     gl_FragColor = vec4(objectColor, objectOpacity);
    }
    </script>


<!-- end snippet -->


When you call drawCircle you assign both of those attributes to buffers, then in your code above if you don't do something about the second attribute it's still pointing the previous buffer. That buffer is too small for your draw call and you get an error.

WebGL won't complain about unused attributes but it will complain about used attributes. You should always supply attributes your shader needs.

In your case you've got at least 2 options

1.  Change your code so your shader only uses one attribute

    You've got just one vertex shader if I read the code correctly. For those cases where your fragment shader isn't going to use the texture coordinates use a different vertex shader that doesn't supply them. 

2.  Disable the attribute so that it uses a constant value

        gl.disableVertexAttribArray(...)

    means that that attribute will use a constant value supplied by

        gl.vertexAttribXXX

1 is arguably better than 2 because your vertex shader will not be wasting time reading from an attribute and copying it to a varying only not to use it in the fragment shader.
