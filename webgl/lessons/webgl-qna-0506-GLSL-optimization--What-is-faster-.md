Title: GLSL optimization. What is faster?
Description:
TOC: qna

# Question:

I'm using OpenGL ES.
And have two types of calculation "dir" vector, which code is fastest?

    attribute vec2 order;

code1:

      if( abs(sinA) < 0.2 ) {
        if(order.x == 1.0){
            dir = sNormalPrev;   
        } else {
            dir = sNormalNext;   
        }
      } else {
        dir *= order.x / sinA;
      }

code 2:

    float k = step(0.2, abs(sinA));
    dir = k * dir * order.x / sinA - (k-1.0) * (step(1.0, order.x + 1.0) * sNormalPrev + step(1.0, -order.x + 1.0) * sNormalNext);



# Answer

Writing a test I don't see much of a difference

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var iterationsPerTiming = 40;

    var gl = document.createElement("canvas").getContext("webgl");
    gl.canvas.width = 1;
    gl.canvas.height = 1;
    var programInfo1 = twgl.createProgramInfo(gl, ["vs1", "fs"])
    var programInfo2 = twgl.createProgramInfo(gl, ["vs2", "fs"]);

    var count = new Float32Array(1000000);
    for (var i = 0; i < count.length; ++i) {
      count[i] = i % 3 / 2;
    }

    var arrays = {
      vertexId: {
        data: count, numComponents: 1,
      },
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    iterateTest(programInfo1, 10)  // prime this path
      .then(function() { return iterateTest(programInfo2, 10)})  // prime this path
      .then(function() { return iterateTest(programInfo1, 20)})
      .then(log)
      .then(function() { return iterateTest(programInfo2, 20)})
      .then(log);

    function iterateTest(programInfo, times) {
      return new Promise(function(resolve, reject) {
        var timings = [];
        var totalTime = 0;

        function runNextIteration() {
          if (times) {
             --times;
             timings.push(test(programInfo, iterationsPerTiming));
             setTimeout(runNextIteration, 1);
          } else {
            var totalTime = 0;
            var msgs = timings.map(function(timing, ndx) {
              totalTime += timing;
              return "" + ndx + ": " + timing.toFixed(3);
            });
            msgs.push("average timing: " + (totalTime / timings.length).toFixed(3));
            resolve(msgs.join("\n"));
          }
        }
        runNextIteration();
      });
    }

    function test(programInfo, iterations) {
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      var startTime = performance.now();
      for (var i = 0; i < iterations; ++i) {
        twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo, count.length);
      }
      
      // this effectively does a gl.finish. It's not useful for real timing
      // beacuse it stalls the pipeline but it should be useful for 
      // comparing times since the stalling would be included in both
      var temp = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, temp);
      return performance.now() - startTime;
    }

    function log(msg) {
      var div = document.createElement("pre");
      div.appendChild(document.createTextNode(msg));
      document.body.appendChild(div);
      return Promise.resolve();
    }

<!-- language: lang-css -->

    html, body { font-family: monospace; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>

      <script id="vs1" type="notjs">
    attribute float vertexId;
    void main() {
      vec2 order = vec2(vertexId, 0);
      float sinA = vertexId;
      vec3 dir = vec3(0);
      vec3 sNormalPrev = vec3(1);
      vec3 sNormalNext = vec3(-1);
      if( abs(sinA) < 0.2 ) {
        if(order.x == 1.0){
            dir = sNormalPrev;   
        } else {
            dir = sNormalNext;   
        }
      } else {
        dir *= order.x / sinA;
      }
      gl_Position = vec4(dir, 1.0); // have to use dir
      gl_PointSize = 1.0;
    }
      </script>
      <script id="vs2" type="notjs">
    attribute float vertexId;

    void main() {
      vec2 order = vec2(vertexId, 0);
      float sinA = vertexId;
      vec3 dir = vec3(0);
      vec3 sNormalPrev = vec3(1);
      vec3 sNormalNext = vec3(-1);
      
      float k = step(0.2, abs(sinA));
      dir = k * dir * order.x / sinA - (k-1.0) * (step(1.0, order.x + 1.0) * sNormalPrev + step(1.0,   -order.x + 1.0) * sNormalNext);
      
      gl_Position = vec4(dir, 1.0); // have to use dir
      gl_PointSize = 1.0;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1);
    }
      </script>


<!-- end snippet -->

Maybe my test is bad. Tested on an early 2015 macbook pro and an iPhone6s+
