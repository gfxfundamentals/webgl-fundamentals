Title: How to detect slow GPU on mobile device with three.js?
Description:
TOC: qna

# Question:

I've define that my games is extremely slow with enabled shadows on old mobile devices (Samsung galaxy S4, IPhone 5). When I turn off shadows it's improving performance greatly.
<br/>
<br/>
Does any one know how to detect slow GPU to turn off shadows completely on slow devices or how to improve shadow performance?
<br/>

I've try to use diferrent `shadow.mapSize` on lights and `shadowMap.type` on renderer and it dosen't improve performance.


Some details:

I use `PerspectiveCamera` and `WebGLRenderer` with render size 1700x667.
<br>
Used lights: `new THREE.AmbientLight(0xffffff, 0.7)` and `new THREE.SpotLight(0xffffff, 0.4, 4000, 100)`<br>
Used materials: `MeshPhongMaterial`
<br/>


# Answer

Options

1.  As Andrey pointed out do a benchmark

2.  Try using [`failIfMajorPerformanceCaveat: true`](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.2.1) when creating the WebGL context.

3.  [Make a fingerprint](https://browserleaks.com/webgl). Query all the various `gl.getParameter` stats related to GPU limits and create a fingerprint. See if there are certain fingerprints that = slow.

4.  Try getting and using the [WEBGL_debug_renderer_info](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info) extension unmasked renderer/vendor strings (this is really just more data for #3).

5.  Like most PC games, have an options screen that let's users choose which graphics features to use.
