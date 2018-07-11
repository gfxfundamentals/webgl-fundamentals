Title: WebGL Screenshot
Description: How to take a screenshot in WebGL

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("canvas").getContext("webgl");
    const doitElem = document.querySelector('#doit');
    const formElem = document.querySelector('#form');
    const openElem = document.querySelector('#form .open');
    const saveElem = document.querySelector('#form .save');
    const cancelElem = document.querySelector('#form .cancel');
    const screenshotElem = document.querySelector("#form .screenshot>img");

    let lastTime = 0;
    let screenshotBlob;
    let screenshotURL;

    doitElem.addEventListener('click', () => {
      formElem.style.display = "";
      render(lastTime);
      gl.canvas.toBlob((blob) => {
        screenshotBlob = blob;
        screenshotURL = URL.createObjectURL(blob);
        screenshotElem.src = screenshotURL;
      });
    });

    openElem.addEventListener('click', () => {
      formElem.style.display = "none";

      const features = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";
      window.open(screenshotURL, "Screenshot", features);

      URL.revokeObjectURL(screenshotURL);
    });

    saveElem.addEventListener('click', () => {
      formElem.style.display = "none";

    	const link = document.createElement('a');
    	link.setAttribute('href', screenshotURL);
    	link.setAttribute('download', 'rectangle-image.png');
    	const event = document.createEvent('MouseEvents');
    	event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    	link.dispatchEvent(event);
      URL.revokeObjectURL(screenshotURL);
    });

    cancelElem.addEventListener('click', () => {
      formElem.style.display = "none";
      URL.revokeObjectURL(screenshotURL);
    });

    // just a simple GL rect
    function render(time) {
      time *= 0.001;

      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, (time * 1.1) % 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(100, 25, 100, 100);
      gl.clearColor(time % 1, 0, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function renderLoop(time) {
      lastTime = time;
      render(time);
      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);

<!-- language: lang-css -->

    body { margin: 0; color: white; }
    canvas { width: 100vw; height: 100vh; }
    #doit {
      z-index 2;
      left: 1em;
      top: 1em;
      position: absolute;
      text-align: center;
      padding: .5em;
      background: rgba(0, 0, 0, 0.8);
    }
    #form {
      position: absolute;
      left: 0; top: 0;
      width: 100vw; height: 100vh;
      justify-content: center;
      align-items: center;
      display: flex;
      background: rgba(0, 0, 0, 0.5);
    }
    #form>div {
      z-index: 3;
      background: black;
      padding: 1em;
    }
    #form img {
      width: 60px;
    }
    #form .screenshot {
      text-align: center;
      padding: .5em;
    }
    #form .ui span {
      margin: .5em;
      padding: .5em;
      background: red;
    }

<!-- language: lang-html -->

    <canvas></canvas>
    <div id="doit">click for screenshot</div>
    <div id="form" style="display: none;">
      <div>
         <div class="screenshot"><img></div>
         <div class="ui"><span class="open">Open</span><span class="save">Save</span><span class="cancel">Cancel</span></div>
      </div>
    </div>

<!-- end snippet -->


