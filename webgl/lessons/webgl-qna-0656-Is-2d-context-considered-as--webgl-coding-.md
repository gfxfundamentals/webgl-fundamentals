Title: Is 2d context considered as "webgl coding"
Description:
TOC: qna

# Question:

When i am writing code as below:

    var x = document.createElement("canvas");
    var ctx = x.getContext("2d");
    --------
    --------

and when i am writing coding as below:

    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('experimental-webgl');
    --------
    --------

a) Out of the above two - will both run in GPU ??

b) Is both considered as Webgl coding ??

# Answer

Whether either "2d" or "webgl" are GPU accelerated is up to the browser and the OS.

For example [you can run Chrome using osmesa](https://stackoverflow.com/questions/39040370/how-do-i-enable-webgl-in-headless-chrome-in-ubuntu) and it will be entirely software rendered.

In general WebGL contexts are almost always GPU accelerated, 2d contexts it depends. I know at one time 2d contexts under a certain size were not GPU accelerated in Chrome because for drawing small things software was generally faster than GPU accelerated. Whether that's still true I have no idea but that's kind of the point is that it's up to the browser and or the OS.

2d contexts are not "webgl" coding. [WebGL coding is writing GLSL shaders and calling all the necessary functions to supply those shaders with data](http://webglfundamentals.org).

