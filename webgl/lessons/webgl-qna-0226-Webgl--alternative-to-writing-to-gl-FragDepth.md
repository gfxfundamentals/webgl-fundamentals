Title: Webgl: alternative to writing to gl_FragDepth
Description:
TOC: qna

# Question:

In WebGL, is it possible to write to the fragment's depth value or control the fragment's depth value in some other way?

As far as I could find, gl_FragDepth is not present in webgl 1.x, but I am wondering if there is any other way (extensions, browser specific support, etc) to do it.

What I want to archive is to have a ray traced object play along with other elements drawn using the usual model, view, projection.

# Answer

There is the extension [`EXT_frag_depth`](http://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/) 

Because it's an extension it might not be available everywhere so you need to check it exists.

    var isFragDepthAvailable = gl.getExtension("EXT_frag_depth");

If `isFragDepthAvailable` is not falsey then you can enable it in your shaders with

    #extension GL_EXT_frag_depth : enable

Otherwise you can manipulate `gl_Position.z` in your vertex shader though I suspect that's not really a viable solution for most needs.

