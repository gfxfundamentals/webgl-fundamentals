Title: Detect Compositing Backend in Firefox
Description:
TOC: qna

# Question:

Is there a way to detect the compositing backend in Firefox (whether it's OpenGL, Basic/Cairo, or D3D) on the client via the WebGL API? I'm specifically interested in distinguishing between OpenGL/D3D and Basic compositing. If not possible using the WebGL API, is there any other way to determine the compositing backend (other than `about:support`)?

# Answer

the short answer is **NO**, you can't detect the compositing backend in Firefox, at least not from JavaScript

In Chrome you can use the [`WEBGL_debug_renderer_info` extension](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info).

As for why it's not available in Firefox and is available in Chrome is there is a difference of opinion on which is more important, privacy or usefulness.

The privacy issue is easily described with the following example. If you know the GPU then you know one more thing about the user. Example, Check GPU, see it's an AMD FirePro D500. If yes you now know the person has a $4000 Mac Pro. Serve expensive ads to them. 

The usefulness side is that there are many older GPUs that can run many webgl demos just fine but can't run complex webgl like Google Maps. By can't run they either run way too slow or possibly even crash "WebGL hit a snag, rats!". Without being able to tell which GPU is which there's no way to provide a good user experience to people with those GPUs.

There have been other proposals, for example for WebGL to have some kind of performance metric that sites can use to decide how complex to make their graphics. Unfortunately there are no metrics that would really work. Every type of GPU has its strengths and weaknesses. One GPU might be fast at vertex transformation but slow at rasterization. Another might be fast rendering opaque things but slow at rendering semi-transparent things. Others might only show their slowness past certain limits. On top of which it would put a big burden on the browser vendors to somehow write the benchmarks to run somewhere (remotely, on the user's machine, ...) to provide such metrics. In other words this solution was considered but abandoned.

One more thing though, `WEBGL_debug_renderer_info`returns the GPU and driver info for the user's machine but that doesn't really directly tell you what the browser's compositing backend is. It's just telling you what the browser is using for WebGL. Though the 2 are likely the same.
