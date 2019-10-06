Title: Webgl background to a transparent site
Description:
TOC: qna

# Question:

I would like to have a site with a webgl background to a transparent site.

What would be the safest way to achieve this given the various states of browsers?

# Answer

I think you just want to make a canvas and set it's CSS so fills the background

    <!DOCTYPE html>
    <html>
      <head>
      <style>
    /* make the canvas fill the page and not scroll */
    #c {
       position: fixed;
       left: 0px;
       top: 0px;
       z-index: -10;
       width: 100vw;
       height: 100vh;
    }
    /* remove the margin on the body so the canvas goes to the edge */
    body {
        margin: 0;
    }
    /* make a new body with standard margins */
    #body {
        margin: 8px;
    }
      </style>
      </head>
      <body>
        <canvas id="c"></canvas>
        <div id="body">
        <!-- insert rest of html here -->
        </div>
      </body>
    </html>

Then just make sure the canvas is the correct size

    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl");

    // make the canvas match the size it's displayed.    
    var resize = function() {
        var width = gl.canvas.clientWidth;
        var height = gl.canvas.clientHeight;
        if (gl.canvas.width != width || gl.canvas.height != height) {
            gl.canvas.width = width;
            gl.canvas.height = height;
        }
    };
    
    var render = function() {
        resize();
        gl.clearColor(1, Math.random() * 0.2 + 0.8, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // insert rendering code here

        requestAnimationFrame(render);
    };
    render();

This example just clears the canvas (simplest example). Here's a snippet

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl");

    var resize = function() {
        var width = gl.canvas.clientWidth;
        var height = gl.canvas.clientHeight;
        if (gl.canvas.width != width || gl.canvas.height != height) {
            gl.canvas.width = width;
            gl.canvas.height = height;
        }
    };

    var render = function() {
        resize();
        gl.clearColor(1, Math.random() * 0.2 + 0.8, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        requestAnimationFrame(render);
    };
    render();

<!-- language: lang-css -->

    #c {
       position: fixed;
       left: 0px;
       top: 0px;
       z-index: -10;
       width: 100vw;
       height: 100vh;
    }
    body {
        margin: 0;
    }
    #body {
        margin: 8px;
    }

<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <div id="body">
    <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean nec gravida est, nec fermentum metus. Suspendisse congue ante elit, vitae accumsan quam convallis nec. Integer sodales, nibh id ultricies hendrerit, risus lacus varius ligula, quis porta nulla massa sit amet quam. Praesent posuere vulputate nunc, ac convallis nulla consectetur eget. Vestibulum eu dapibus justo. Aenean ac venenatis sem. Nullam porta, augue at egestas pretium, diam metus suscipit eros, eu eleifend quam diam in lacus. Fusce accumsan sem in placerat blandit. Nulla eget hendrerit lorem, at semper leo. Duis non commodo tellus.
    </p><p>
    Sed feugiat velit vel ipsum fermentum, a scelerisque dolor tincidunt. Vestibulum id odio ultrices metus consectetur vehicula. Nulla vitae metus sagittis mauris commodo euismod. In erat dui, vehicula in consectetur ut, mollis at dui. Vestibulum vulputate est eu tellus egestas ullamcorper. Aenean ut ligula lacinia, cursus est vitae, placerat nulla. Sed suscipit rutrum dolor, vitae feugiat orci eleifend in. Proin sit amet nisl purus. Curabitur eget sem nunc. Suspendisse a mattis libero, in bibendum purus. Pellentesque semper eros tincidunt libero aliquam, eget placerat dui consequat. Suspendisse potenti. Sed sed imperdiet metus, non rutrum tellus. Nunc egestas nec libero sodales interdum.
    </p><p>

    Quisque ultricies, enim ornare euismod vestibulum, neque velit volutpat magna, eget interdum leo nisl in leo. Cras tempor odio ut magna iaculis, at fermentum nulla semper. Etiam laoreet hendrerit gravida. Sed sit amet luctus nibh, sed sodales neque. Nunc varius fringilla nisl, sodales adipiscing sem gravida sed. Etiam ac suscipit turpis. Sed luctus adipiscing ipsum, et facilisis diam pulvinar eu. Etiam blandit id ante viverra varius. Vestibulum tincidunt nisi at velit tempor facilisis. Aenean bibendum fringilla dolor ac tincidunt. Nam facilisis vestibulum augue ut ultricies. Nam suscipit odio non orci lobortis, vitae porttitor purus ultricies. Aliquam egestas neque at lorem aliquam, ut vestibulum libero viverra.
    </p><p>

    Donec sed feugiat sapien. Cras vitae porta lorem. Pellentesque in enim eu elit vulputate laoreet. Sed non placerat velit. Mauris luctus est auctor, vestibulum orci a, vulputate nunc. Nunc suscipit, ante sit amet porttitor lacinia, dolor augue consectetur augue, ac auctor dui eros non est. Duis scelerisque eget sapien ac scelerisque. Aliquam et tellus ornare, facilisis sem a, luctus est. Aliquam vitae facilisis est. Ut tempor justo urna. Nam commodo eros nisl, sit amet interdum nunc ultrices vestibulum. Integer ac imperdiet purus, eu sodales massa. Donec in sollicitudin purus. Aenean at cursus nulla.
    </p><p>

    Integer id eleifend tortor. Maecenas id turpis vel sapien consequat blandit. Pellentesque at facilisis tellus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nullam tortor purus, sagittis ut faucibus sed, facilisis quis tortor. Aliquam tincidunt mi at ipsum congue varius.
    </p>
    </div>

<!-- end snippet -->


