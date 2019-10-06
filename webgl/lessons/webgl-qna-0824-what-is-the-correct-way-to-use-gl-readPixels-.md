Title: what is the correct way to use gl.readPixels?
Description:
TOC: qna

# Question:

I want to get the pixel-data from a Three.js demo. 
As far as I know, there are 2 way to proceed : 

1) draw the webGl-canvas inside a 2D-canvas and use Context2D.getImageData like that :

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    ctx.drawImage(renderer.domElement,0,0);
    var data = ctx.getImageData(0,0,w,h).data;


2) use directly the context3D with readPixels, like that : 

    var ctx = renderer.domElement.getContext("webgl");
    var data = new UInt8Array(w*h*4);
    ctx.readPixels(0, 0, w,h, ctx.RGBA, ctx.UNSIGNED_BYTE, data);

These 2 way to proceed works and give the same results but the second one is almost 2 times slower than the one using context2d.getImageData. 

Sounds very weird to me. How the fact to draw the 3D-stuff into a 2D-canvas could be faster than using the context3D directly ? I don't understand and I'm almost sure I don't use gl.readPixels correctly. 

Then my question is : how to use gl.readPixels in order to be faster than context2d.drawImage + context2d.getImageData ? 

I tryed to used a Float32Array like that

    var ctx = renderer.domElement.getContext("webgl");
    var data = new Float32Array(w*h*4);
    ctx.readPixels(0, 0, w,h, ctx.RGBA, ctx.FLOAT, data);
    
I thought it should be faster since there is no conversion from Float to UInt8 but it looks like it doesn't work like that because my 'data' array stay empty after the call of ctx.readPixels 

Thank you for your help ! 

(please excuse me if my english is not perfect, it's not my native language)

# Answer

On my machine I get readPixels as 2x to 20x faster than drawImage/getImageData. Tested on MacOS Chrome, Firefox, well as Windows 10 Chrome, and Firefox. Safari came out readPixels as slower. Sounds like a bug in Safari and in fact checking Safari Technology Preview Release 46, as expected, readPixels is 3x to 1.2x faster than drawImage/getImageData

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl");
    const ctx = document.createElement("canvas").getContext("2d");

    const w = 512;
    const h = 512;

    gl.canvas.width = w;
    gl.canvas.height = h;
    ctx.canvas.width = w;
    ctx.canvas.height = h;

    const readPixelBuffer = new Uint8Array(w * h * 4);

    const tests = [
     { fn: withReadPixelsPreAlloc, msg: "readPixelsPreAlloc", },
     { fn: withReadPixels, msg: "readPixels", },
     { fn: withDrawImageGetImageData, msg: "drawImageGetPixels", },
    ];

    let ndx = 0;
    runNextTest();

    function runNextTest() {
      if (ndx >= tests.length) {
        return;
      }
      const test = tests[ndx++];
      
      // use setTimeout to give the browser a change to 
      // do something between tests
      setTimeout(function() {
        log(test.msg, "iterations in 5 seconds:", runTest(test.fn));
        runNextTest();
      }, 0);
    }

    function runTest(fn) {
      const start = performance.now();
      let count = 0;
      for (;;) {
        const elapsed = performance.now() - start;
        if (elapsed > 5000) {
          break;
        }
        fn();
        ++count;
      }
      return count;
    }

    function withReadPixelsPreAlloc() {
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, readPixelBuffer);
    }

    function withReadPixels() {
      const readPixelBuffer = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, readPixelBuffer);
    }

    function withDrawImageGetImageData() {
      ctx.drawImage(gl.canvas, 0, 0);
      ctx.getImageData(0, 0, w, h);
    }

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- end snippet -->

As for converting to float the canvas itself is stored in bytes. There is no conversion to float and you likely got a GL error

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl");
    const buf = new Float32Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, buf);
    log("ERROR:", glEnumToString(gl, gl.getError()));

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

    function glEnumToString(gl, val) {
      if (val === 0) { return 'NONE'; }
      for (key in gl) {
        if (gl[key] === val) { 
          return key;
        }
      }
      return `0x${val.toString(16)}`;
    }

<!-- end snippet -->

Checking the console I see the error is 

    WebGL: INVALID_ENUM: readPixels: invalid type
