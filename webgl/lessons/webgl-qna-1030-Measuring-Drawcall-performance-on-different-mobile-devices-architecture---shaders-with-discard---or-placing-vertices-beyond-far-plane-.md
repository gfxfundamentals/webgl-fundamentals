Title: Measuring Drawcall performance on different mobile devices/architecture - shaders with discard() or placing vertices beyond far plane?
Description:
TOC: qna

# Question:

I am looking to measure shader performance in WebGL for mobile devices/architecture. 

I know that using 'discard()' in shaders is not very efficient but I want to carry out some experiments and get some number about how the shaders performs in terms of draw calls -- one of the main criteria is to measure the performance for different mobile devices and architecture  (iPhone, iPad, and tile rendering and deferred rendering) when using 'discard()' or just placing the object/vertices beyond the far plane of the frustum. 

I am pretty new to Javascript/WebGL, hence I want to ask for some sort of pointers or maybe someone has already some similar test, on which I can build upon to get some numbers. I haven't come across any such snippets on the Internet yet. Any thing using THREE.js or typescript or pure js samples would be good as a starter template. 

Thanks and any pointer would be appreciated. 

Thanks

# Answer

You can *maybe* measure which is faster by calling `gl.readPixels` like this

```
const startTime = performance.now();
drawLotsOfStuff();
gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
const endTime = performance.now();
const elaspedTimeInMilliseconds = endTime - startTime();
```

This will not tell you how fast something renders but it might tell you which method is faster.

WebGL, especially in Chrome, is multi-process. By default when you are just rendering constantly in a 60fps app it's possible for everything to run in parallel. JavaScript is calling `gl.drawXXX`, the previous draw commands are running in parallel.  When you call `gl.readPixels` though the entire parallel parts have to be stopped so that all the previous draw commands are executed before reading the data. 

This means using `gl.readPixels` doesn't tell you how fast something is running. It tells you how much time it took to

1. start 2 or 3 processes
2. coordinate them taking to each other
3. issue some commands
4. wait for those commands to execute
5. stop both processes
6. synchronice both processes
7. transfer data from one process to another

If you want to know how fast something draws you only really want to time step 4 above but based on the fact that things are parallelized you you have steps 1., 2., 3., 5., 6., and 7. included in your timing. 

Still, assuming all of those are constant you can maybe at least tell if step 3 is faster or slower than some other step 3.

I say *maybe* because lots is going on in a browser. There might be garbage collection hiccups or other things that add even more steps which makes the timing bad.

One more issue is browsers do or at least did intentionally return low-res results for timing. This is to mitigate [Spectre issues](https://en.wikipedia.org/wiki/Spectre_(security_vulnerability)). I think Chrome has turned the high-res results back on now that they have process isolation added though not sure.

Let's test and see if we get consistent results

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.createElement('canvas').getContext('webgl');

      const vs = `
      attribute vec4 position;
      void main() {
        gl_PointSize = 128.0;
        gl_Position = position;
      }
      `;

      const fastFS = `
      precision highp float;
      void main() {
        gl_FragColor = vec4(1);
      }
      `;

      const slowFS = `
      precision highp float;
      // these are here to try to make sure the loop
      // is not optimized. (though it could still easily
      // be as it's really just color = junk * moreJunk * 100
      uniform vec4 junk;
      uniform vec4 moreJunk;

      void main() {
        vec4 color = vec4(0);
        for (int i = 0; i < 100; ++i) {
          color += junk * moreJunk;
        }
        gl_FragColor = color;
      }
      `;

      const locations = ['position']; // make position location 0
      const fastPrg = twgl.createProgram(gl, [vs, fastFS], locations);
      const slowPrg = twgl.createProgram(gl, [vs, slowFS], locations);

      const fastTime = time(gl, 'fast', fastPrg);
      const slowTime = time(gl, 'slow', slowPrg);

      // Because Safari is the new IE we can't not have attirbutes
      // as Safari fails the WebGL conformance tests for no attribute
      // situations.
      {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, 1000000, gl.STATIC_DRAW);

        const posLoc = 0;  // assigned in createProgramInfo
        gl.enableVertexAttribArray(posLoc);
        // only taking X from buffer
        gl.vertexAttribPointer(posLoc, 1, gl.FLOAT, false, 0, 0);
      }

      const fastX = slowTime / fastTime;
      console.log(`fast is maybe ${fastX.toFixed(4)}x faster than slow`);
      console.log(gl.getError());

      function time(gl, label, prg) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(prg);
        // use program once so any initialization behind the scenes
        // happens (voodoo)
        gl.drawArrays(gl.POINTS, 0, 1);
        sync(gl);
        const startTime = performance.now();
        for (let i = 0; i < 100; ++i) {
          gl.drawArrays(gl.POINTS, 0, 1000);
        }
        sync(gl);
        const endTime = performance.now();
        const elapsedTime = endTime - startTime;
        console.log(label, 'elapsedTime:', elapsedTime.toFixed(4));
        return elapsedTime;
      }
      
      function sync(gl) {
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
      }  
    }
    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

When I run above I get results from 3.5x to 4.5x for the fast shader over the slow shader so you can see the results are inconsistent but at least we know the fast shader is actually faster than slow shader which is enough for us to choose one method over another.

Of course the results might be different on a different GPU. This is especially true on iOS as iOS devices use a [*tiled renderer*](https://en.wikipedia.org/wiki/Tiled_rendering). It's possible that even though we are asking the system to draw 100 quads per draw call and 100 draw calls, in otherwords, 10000 quads, that a tiled renderer will realize it only needs to draw the last quad. One way around that might be to turn on blending with 

    gl.enable(gl.BLEND);

That way I believe the tiled renderer can't only render the last quad. 

Unfortunately when I run the example above on iOS I get that fast is slower than slow which shows one of (1) how bad timing resolution is in browsers or (2) how different tiled architectures work or (3) that the iOS driver actually did optimize the loop out.

Let's make the slow shaders slower by using a texture in our inner loop in such a way that we actually have to look up different results each iteration of the loop.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.createElement('canvas').getContext('webgl');

      const vs = `
      attribute vec4 position;
      void main() {
        gl_PointSize = 128.0;
        gl_Position = position;
      }
      `;

      const fastFS = `
      precision highp float;
      void main() {
        gl_FragColor = vec4(1);
      }
      `;

      const slowFS = `
      precision highp float;
      uniform vec4 junk;
      uniform vec4 moreJunk;
      uniform sampler2D tex;

      void main() {
        vec4 color = vec4(0);
        for (int i = 0; i < 100; ++i) {
          // AFAIK this can not be optimized too much as the inputs
          // change over the loop looking up different parts of the texture.
          color += texture2D(tex, fract(junk * moreJunk * float(i)).xy * gl_PointCoord.xy);
        }
        gl_FragColor = color;
      }
      `;

      const fastPrg = twgl.createProgram(gl, [vs, fastFS]);
      const slowPrg = twgl.createProgram(gl, [vs, slowFS]);

      // Because Safari is the new IE we can't not have attirbutes
      // as Safari fails the WebGL conformance tests for no attribute
      // situations.
      {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, 1000000, gl.STATIC_DRAW);

        const posLoc = 0;  // assigned in createProgramInfo
        gl.enableVertexAttribArray(posLoc);
        // only taking X from buffer
        gl.vertexAttribPointer(posLoc, 1, gl.FLOAT, false, 0, 0);
      }

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const data = new Uint8Array(1024 * 1024 * 4);
      for (let i = 0; i < data.length; ++i) {
        data[i] = Math.random() * 256;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.generateMipmap(gl.TEXTURE_2D);

      const fastTime = time(gl, 'fast', fastPrg);
      const slowTime = time(gl, 'slow', slowPrg);

      const fastX = slowTime / fastTime;
      console.log(`fast is maybe ${fastX.toFixed(4)}x faster than slow`);

      function time(gl, label, prg) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(prg);
        // use program once so any initialization behind the scenes
        // happens (voodoo)
        gl.drawArrays(gl.POINTS, 0, 1);
        sync(gl);
        const startTime = performance.now();
        for (let i = 0; i < 100; ++i) {
          gl.drawArrays(gl.POINTS, 0, 1000);
        }
        sync(gl);
        const endTime = performance.now();
        const elapsedTime = endTime - startTime;
        console.log(label, 'elapsedTime:', elapsedTime.toFixed(4));
        return elapsedTime;
      }

      function sync(gl) {
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
      }

    }
    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

Now on my iPhoneX I get that fast is much faster than slow. 

So, what did we learn? We probably learned that if your shaders are of a similar performance level it's going to be hard to tell which one is faster reliably.
