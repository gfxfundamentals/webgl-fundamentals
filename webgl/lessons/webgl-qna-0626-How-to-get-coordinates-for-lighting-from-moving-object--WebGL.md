Title: How to get coordinates for lighting from moving object? WebGL
Description:
TOC: qna

# Question:

I have an object. It moves around:

    mat4.translate(mvMatrix, [ 0.0, 0.0, -68.0]); // far
    mat4.rotate(mvMatrix, degToRad(sunBlueAngle), [0.0, 1.0, 0.0]); // angle
    mat4.translate(mvMatrix, [25, 0, 0]); // offset center
And now I want to use it as source of light. I need to pass to vertex shader location of my light. 

    uniform vec3 uPointLightingLocation;
But I don't know this coordinates, since my object always moves.
How to get this coordinates?


# Answer

You can generally get the world position of an object by getting elements 12, 13, 14 of your matrix

    var worldPosition = [
      mvMatrix[12],
      mvMatrix[13],
      mvMatrix[14],
    ];

or this should also work in most modern browsers

    var worldPostion = mvMatrix.slice(12, 15);

If you're using glMatrix then you can also do

    var worldPosition = vec3.create();
    mat4.getTranslation(worldPosition, mvMatrix);


