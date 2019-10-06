Title: Three.js( R71 ) not working on IE11 windows 8.1
Description:
TOC: qna

# Question:

I am running R71 of three.js and it's not working on windows 8.1 ie 11 
version : 11.096
Update versions 11.0.7
I get these warnings:

    THREE.WebGLRenderer: OES_texture_half_float extension not supported.
    THREE.WebGLRenderer: OES_texture_half_float_linear extension not supported.
    THREE.WebGLRenderer: OES_element_index_uint extension not supported.

Then shader compiler errors.

Then a lot of :

    WEBGL11057: INVALID_ENUM: drawElements: Only UNSIGNED_SHORT type is supported

It's working fine on IE11 on windows 7.

Any help would be greatly appreciated.





# Answer

Looks like an IE issue not a Three.js issue. Three.js is just reporting that IE11 on Windows 8.1 with whatever drivers and GPU you have on that system doesn't support those extensions. 

The `INVALID_ENUM` error is a direct consequence of IE11 on WIndows 8.1 not supporting `OES_element_index_unit`. With that extension any sample that needs it will fail. The one you're running needs it.

Not all samples will need it. `OES_element_index_uint` just means you can have 32bit indices instead of only the default 16bit indies. 

[Have you tried other samples](http://threejs.org/examples/)? For example I'd expect [this one to work](http://threejs.org/examples/#webgl_geometry_colors) without those extensions.


