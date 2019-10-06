Title: Add roll to exists webgl camera
Description:
TOC: qna

# Question:

Is there a way to add camera roll to third party webgl application?

Lets say, I have a webgl application, lets take [ESRI Manhattan Skyscrappers Explorer](https://esri.github.io/Manhattan-skyscraper-explorer/) as example.

ESRI [camera api](https://developers.arcgis.com/javascript/latest/api-reference/esri-Camera.html) doesn't have `Roll` angle for camera, but still it's webgl application. 

First part of the question: can I get the same context as a running application with the following code:

    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");

Saying *same context* I mean, If I add a shader via `gl.useProgram(shaderProgram);` is that possible to get access to the results of previously run shaders? Or are all of the shader programs isolated?

Next step: if I can submit a shader which will be able to modify vertex coordinates, how should I control the order of shader programs execution?

And finnaly if all that is possible maybe there is already something what I can use to calculate a right transform to get roll?

Is that even possible to "hijack" webgl camera or did I get the webgl pipline working principles wrong and it's impossible? Also I know that I can rotate the whole canvas element, but I'm looking for better approach, (canvas rotation is slow, and image quality is quite poor).

# Answer

> is that possible to get access to the results of previously run shaders? Or are all of the shader programs isolated?

That depends on what you mean by "results". You can read the contents of the canvas with `gl.readPixels`. You can copy the contents of the canvas to a texture for use in more rendering with either `gl.texImage2D` or `gl.copyTexImage2D`

> Next step: if I can submit a shader which will be able to modify vertex coordinates, how should I control the order of shader programs execution?

Probably not

> And finnaly if all that is possible maybe there is already something what I can use to calculate a right transform to get roll?

It is possible to roll 

> Is that even possible to "hijack" webgl camera or did I get the webgl pipline working principles wrong and it's impossible? Also I know that I can rotate the whole canvas element, but I'm looking for better approach, (canvas rotation is slow, and image quality is quite poor).

There's really nothing WebGL about adding roll to an existing program. You'd have to modify the program and modify where it calculates its view matrix or model view matrix in JavaScript.

Might I suggest you read some [tutorials on WebGL](https://webglfundamentals.org) and maybe it will be clearer that the changes you'd need to make would be in JavaScript, not in the shaders.
