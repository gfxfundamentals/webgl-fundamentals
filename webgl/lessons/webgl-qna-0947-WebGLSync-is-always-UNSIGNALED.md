Title: WebGLSync is always UNSIGNALED
Description:
TOC: qna

# Question:

I'm trying to play around with [WebGLSyncs](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSync) and I'm having a hard time getting a WebGLSync to be signaled.

The following is unsignaled on all browsers supporting WebGL2 (Chrome, Opera, Firefox):

    function test() {
        let canvas = document.createElement('canvas');
        let gl = canvas.getContext('webgl2');
        let sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        gl.finish();
    
        let status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        console.log(sync, status, status === gl.UNSIGNALED);  // logs "true"
        gl.deleteSync(sync);
    }

I'm expecting this to work, since gl.finish() should wait until all GPU commands have been processed - but it looks like the sync fence was not.

I would very much appreciate a minimal, working `WebGLSync` example that actually gets signaled. I searched GitHub for such but I found nothing.

-----

**EDIT**

Based on the [answer from pleup](https://stackoverflow.com/a/53647609/2946480), I put together this code sample which works fine in my environment (Windows + Chrome).

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async function test() {
        let canvas = document.createElement('canvas');
        let gl = canvas.getContext('webgl2');
        let sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
    
        while (gl.getSyncParameter(sync, gl.SYNC_STATUS) === gl.UNSIGNALED) {
            await sleep(100);
        }
    
        let status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        console.log(sync, status, status === gl.SIGNALED);
        gl.deleteSync(sync);
    }
    
    test()


# Answer

from [the WebGL2 spec](https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.39)

> 5.39 Sync objects' results must not be made available in the current frame
In OpenGL ES 3.0, if the appropriate primitives (e.g. glFinish() or another synchronous API) are called, a sync object may be signaled in the same frame it was issued. In WebGL, in order to improve application portability, a sync object must never transition to the signaled state in the same frame the sync was issued. See the specification of [getSyncParameter](https://www.khronos.org/registry/webgl/specs/latest/2.0/#GET_SYNC_PARAMETER) and [clientWaitSync](https://www.khronos.org/registry/webgl/specs/latest/2.0/#CLIENT_WAIT_SYNC) for discussion and rationale.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    async function test() {
        let canvas = document.createElement('canvas');
        let gl = canvas.getContext('webgl2');
        let sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        gl.finish();

        await waitFrame();

        let status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        console.log(sync, glEnumToString(gl, status));
        gl.deleteSync(sync);
    }

    function waitFrame() {
      return new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    }

    function glEnumToString(gl, v) {
      for (const k in gl) {
        if (gl[k] === v) {
          return k;
        }
      }
      return `0x${v.toString(16)}`;
    }

    test();

<!-- end snippet -->


