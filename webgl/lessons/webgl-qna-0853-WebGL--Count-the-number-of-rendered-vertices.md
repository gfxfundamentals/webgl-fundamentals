Title: WebGL: Count the number of rendered vertices
Description:
TOC: qna

# Question:

Using the WebGL API, is there a way to count the number of vertices rendered within a given canvas? I've seen some tools that attempt to accomplish this task but some are giving strange results (e.g. Three.js' `renderer.info.render` is reporting my scene has 10,134.3 triangles).

Any help with using the raw WebGL API to count the number of rendered vertices (and, ideally, points and lines) would be greatly appreciated.

# Answer

WebGL can't do this for you but you could can add your own augmentation. 

The most obvious way is just to track your own usage. Instead of calling `gl.drawXXX` call `functionThatTracksDrawingCountsXXX` and track the values yourself.

You can also augment the WebGL context itself. Example


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // copy this part into a file like `augmented-webgl.js`
    // and include it in your page

    (function() {
      // NOTE: since WebGL constants are um, constant
      // we could statically init this.
      let primMap;

      function addCount(ctx, type, count) {
        const ctxInfo = ctx.info;
        const primInfo = primMap[type];
        ctxInfo.vertCount += count;
        ctxInfo.primCount[primInfo.ndx] += primInfo.fn(count);
      } 
     
      WebGLRenderingContext.prototype.drawArrays = (function(oldFn) {
        return function(type, offset, count) {
          addCount(this, type, count);
          oldFn.call(this, type, offset, count);
        };
      }(WebGLRenderingContext.prototype.drawArrays));
      
      WebGLRenderingContext.prototype.drawElements = (function(oldFn) {
        return function(type, count, indexType, offset) {
          addCount(this, type, count);
          oldFn.call(this, type, count, indexType, offset);
        };
      }(WebGLRenderingContext.prototype.drawElements));
      
      HTMLCanvasElement.prototype.getContext = (function(oldFn) {
        return function(type, ...args) {
          const ctx = oldFn.call(this, type, args);
          if (ctx && type === "webgl") {
            if (!primMap) {
              primMap = {};
              primMap[ctx.POINTS] = { ndx: 0, fn: count => count, };
              primMap[ctx.LINE_LOOP] = { ndx: 1, fn: count => count, };
              primMap[ctx.LINE_STRIP]= { ndx: 1, fn: count => count - 1, };
              primMap[ctx.LINES] = { ndx: 1, fn: count => count / 2 | 0, };
              primMap[ctx.TRIANGLE_STRIP] = { ndx: 2, fn: count => count - 2, };
              primMap[ctx.TRIANGLE_FAN] = { ndx: 2, fn: count => count - 2, };
              primMap[ctx.TRIANGLES] = { ndx: 2, fn: count => count / 3 | 0, }; 
            };
            ctx.info = {
              vertCount: 0,
              primCount: [0, 0, 0],
            };
          }
          return ctx;
        }
      }(HTMLCanvasElement.prototype.getContext));
    }());

    // ---- cut above ----

    const $ = document.querySelector.bind(document);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({canvas: $('canvas')});

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const items = [];
    for (let i = 0; i < 50; ++i) {
      let item;
      switch(rand(0, 3) | 0) {
        case 0:
        case 1:
         const material = new THREE.MeshBasicMaterial({
            color: rand(0xFFFFFF) | 0,
            wireframe: rand(0, 3) > 2,
          });
          item = new THREE.Mesh(geometry, material);
          break;
        case 2:
          const pmat = new THREE.PointsMaterial({
            color: rand(0xFFFFFF) | 0,
          });
          item = new THREE.Points(geometry, pmat);
          break;
        default:
          throw "oops";
      }
      item.position.x = rand(-10, 10);
      item.position.y = rand(-10, 10);
      item.position.z = rand(  0, -50);
      scene.add(item);
      items.push(item);
    }

    camera.position.z = 5;

    const countElem = $('#count');

    function render(time) {
      time *= 0.001;
      
      resize();

      // animate the items
      items.forEach((items, ndx) => {
        items.rotation.x = time * 1.2 + ndx * 0.01;
        items.rotation.y = time * 1.1;
      });
      
      // turn on/off a random items
      items[rand(items.length) | 0].visible = Math.random() > .5;

      renderer.render(scene, camera);
      
      // get the current counts
      const info = renderer.context.info;
      countElem.textContent = `    VERTS: ${info.vertCount}
       POINTS: ${info.primCount[0]}
        LINES: ${info.primCount[1]}
    TRIANGLES: ${info.primCount[2]}`;
      
      // zero out the count
      renderer.context.info.vertCount = 0;
      renderer.context.info.primCount = [0, 0, 0];
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function rand(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return Math.random() * (max - min) + min;
    }

    function resize() {
      const canvas = renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
        camera.aspectRatio = width / height;
        camera.updateProjectionMatrix();
      }
    }

<!-- language: lang-css -->

    body { border: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }
    #ui { position: absolute; left: 1em; top: 1em; background: rgba(0,0,0,.5); color: white; padding: .5em; width: 10em; }

<!-- language: lang-html -->

    <canvas></canvas>
    <div id="ui">
      <pre id="count"></pre>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/92/three.min.js"></script>

<!-- end snippet -->

Of course you might want to add support for drawArraysInstanced etc... and support for WebGL2.


