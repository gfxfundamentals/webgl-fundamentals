Title: WebGL code produces same matrices as pre-made library but does not display the same
Description:
TOC: qna

# Question:

I am working on a 3D function library (for fun) and am unable to find the error in my code. From what I can see, the matrices produced by my code and a pre-made library are exactly the same. I am using the same vertex positions but nothing is showing and it's driving me crazy.

My Version:<br>
http://robjte.de/webgl/notworking.html<br>
http://jsfiddle.net/uh9574z0/

The pre-made working version (target output):<br>
http://robjte.de/webgl/working.html<br>
http://jsfiddle.net/5daae976/

I have console logged the matrices on each version.

Main segment (my version):

    var translate = [0.5, 0, 0];
    var modelMatrix = identity(4);
    modelMatrix.setXY(3, 0, translate[0]);
    modelMatrix.setXY(3, 1, translate[1]);
    modelMatrix.setXY(3, 2, translate[2]);

    var eye = createVector([0, 0, 2.25]);
    var focus = createVector([0, 0, 0]);
    var up = createVector([0, 1, 0]);

    modelMatrix = modelMatrix;
    var viewMatrix = lookAt(eye, focus, up);
    var projectionMatrix = perspective(canvas, 50 * Math.PI / 180, 1, 10);

<br>
Main segment (working version):

    // local coords -> world space
    var modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(0.5, 0.0, 0.0));

    // world space -> camera space
    var eye = vec3.fromValues(0, 0, 2.25);
    var lookAt = vec3.fromValues(0, 0, 0);
    var up = vec3.fromValues(0, 1, 0);
    var viewMatrix = mat4.create();

    mat4.lookAt(viewMatrix, eye, lookAt, up);

    var projMatrix = mat4.create();
    mat4.perspective(projMatrix, 50 * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, 1, 10);

# Answer

I don't think your math lib is actually generating the same results. I used the [WebGL Inspector](http://benvanik.github.io/WebGL-Inspector/) to look at the state of the program in each of your links. There's a few very significant differences.


![not the same][1]


  [1]: http://i.stack.imgur.com/mWQ3v.gif
