Title: Are functions available in browser WebGL and node.js server's node-WebGL same?
Description:
TOC: qna

# Question:

Currently I am trying to convert browser based client side volume rendering code to server side pure javascript based rendering. I use node-webgl at server side. 

I use an open-source WebGL based browser implementation. My question is, are the functions of browser based WebGL same as node.js node-WebGL functions? Is there a need to change in the code if I am using at server (apart from the browser interactions). Functions like initiation of shaders, cube buffers, initialization of frame buffer objects etc. Will they change?

My whole project is based on this assumption that it works, and currently I am facing some errors, so I wanted to ask am I doing the right thing?

Regards,
Prajwal

# Answer

Reading the docs node-webgl is not really compatible with actual WebGL

> WebGL is based on OpenGL ES, a restriction of OpenGL found on desktops, for embedded systems. Because this module wraps OpenGL, it is possible to do things that may not work on web browsers

What it doesn't say and should is there are also things WebGL does that will not work on DesktopGL.

There are tons of work arounds in real WebGL implementations to work around those differences. Shaders on all WebGL implementations are re-written but looking at the implementation of node-webgl they aren't re-writing the shaders therefore they can't be working around the differences.

As one example there are words reserved in OpenGL GLSL that are not reserved in WebGL. WebGL implementations work around that. node-webgl will not.

On top of which there will be missing functions. For example WebGL has versions of `texImage2D` and `texSubImage2D` that take an `HTMLImageElement`, or a `HTMLCanvasElement` or an `HTMLVideoElement` but those elements do not exist in node.js

Another is [the whole interaction with depth and stencil buffer formats for renderbuffers](https://www.khronos.org/registry/webgl/specs/1.0/#6.6)

Another there's no support for [the various `pixelStorei` additions in WebGL](https://www.khronos.org/registry/webgl/specs/1.0/#6.8)

There are many many other similar issues.

##Security

The biggest issue is WebGL is designed to be secure whereas OpenGL is not. One of the major goals of WebGL is security because an arbitrary web page is allowed to run GPU code on your machine. WebGL takes security extremely seriously which is why it took a couple of years from initial concept (just call OpenGL) to actually shipping WebGL live in browsers. It's also why many drivers are blacklisted and yet another reason shaders are re-written.

For example shaders are re-written to make sure the shaders met certain requirements and don't pass certain limits before being passed on to the driver. Identifiers are checked that they are not too long. They are all replaced by temporary identifiers to make sure there's no strange interactions. Field and array expressions are checked they are not too complex. Array index clamping instructs are added. Unicode is stripped (OpenGL shaders only support ASCII). Shader features that need to be enabled/disabled are. And many other things.

Another example is checking that all buffers and textures point to valid memory and that all data that will be accessed by a shader is accounted for. Memory that is allocated is cleared. Otherwise you can possibly use the driver to spy on all of both CPU and GPU memory. 

WebGL guards against all these cases.

node-webgl on the other hand is just calling directly into the OpenGL driver leaving with no regards to security. If you pass user data through node-webgl you may be opening your server to severe security issues. Even if you don't pass user data you may accidentally allow reading uninitialized data from uncleared buffers and textures.

Arguably they should have named it `node-opengl` since it's not really WebGL in any way shape or form. To be WebGL, at a minimum, they would need to pass the [WebGL conformance tests](https://www.khronos.org/registry/webgl/sdk/tests/webgl-conformance-tests.html) to claim to be WebGL compatible.
