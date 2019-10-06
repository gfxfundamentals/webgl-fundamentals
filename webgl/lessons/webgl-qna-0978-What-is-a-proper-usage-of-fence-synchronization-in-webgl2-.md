Title: What is a proper usage of fence synchronization in webgl2?
Description:
TOC: qna

# Question:

Looking for some patterns/code examples/best practices of appropriate usage of fences in webgl2 (gl.fenceSync) - best if it would be non blocking of JS thread.

        var fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);

        setTimeout(() => {
          gl.clientWaitSync(fence, gl.SYNC_FLUSH_COMMANDS_BIT, 1000000);
          gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, dataOut);
        }, 0);







# Answer

I'm just guessing to be honest, I'm not actually sure how useful syncs are in WebGL2 but I'd think you don't want to block then the pattern would be like this

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      
      callbackOnSync(gl, () => {
        console.log("done");
      });
      
      function callbackOnSync(gl, callback) {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();  // make sure the sync command is read

        setTimeout(checkSync);  

        function checkSync() {
          const timeout = 0;   // 0 = just check the status
          const bitflags = 0;
          const status = gl.clientWaitSync(sync, bitflags, timeout);
          switch (status) {
            case gl.TIMEOUT_EXPIRED:
              // it's not done, check again next time
              return setTimeout(checkSync);
            case gl.WAIT_FAILED:
              throw new Error('should never get here');
            default:
              // it's done!
              gl.deleteSync(sync);

              callback();
          }
        }
      }
    }

    main();

<!-- end snippet -->


