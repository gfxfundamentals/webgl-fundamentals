Title: How can I get Chrome GPU information through scripts or any other means?
Description:
TOC: qna

# Question:

I want to run diagnostics of Chrome GPU, before loading a new tab which can view 3D data. I want to run a diagnostics to check if some GPU options are turned on, before loading the new tab. 

How can I get Chrome GPU information through scripts or any other means?

# Answer

Not sure what you're asking.

You can get the GPU info by using the [`WEBGL_debug_renderer_info`](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info) extension.


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function getGPUInfo() {
      const gl = document.createElement("canvas").getContext("webgl");
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? {
        vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
      } : { 
        vendor: "unknown",
        renderer: "unknown",
      };
    }

    console.log(getGPUInfo());


<!-- end snippet -->


