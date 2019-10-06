Title: how to avoid webGL shader loading putting too much load on cpu
Description:
TOC: qna

# Question:

When loading up several hefty shader programs, webGl puts a lot of strain on the cpu, stalls the UI, and will sometimes even trigger chrome's cpu watchdog which kills the page. 

What can I do to show a "loading" screen while this is going on and limit my processor usage so that I don't get ganked by chrome?

[relevant section of code](https://github.com/EmergentOrganization/webgl-game-of-life/blob/master/js/gol.js#L229-L247), which ultimately leads to [these actual webGL calls](https://github.com/skeeto/igloojs/blob/master/igloo.js#L171-L181):

    var p = this.program = gl.createProgram();
    gl.attachShader(p, this.makeShader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(p, this.makeShader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(p);



# Answer

A couple of ideas

1.  You can try to wait a few frames to check for results

        var vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vSource);
        gl.compileShader(vs);
        var fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, vSource);
        gl.compileShader(fs);
        var p = gl.createProgram();
        gl.attachShader(p, vs);
        gl.attachshader(p, fs);
        gl.linkProgram(p);
        gl.flush(); // Important!
        setTimeout(checkResults, 2000);  // check results 2 seconds later

        function checkResults() {
           var status = gl.getProgramParameter(p, gl.LINK_STATUS);
           ...
        }

    At least in Chrome this might mean the GPU process will compile the program while the Render process (The one running your JavaScript) will continue to run so at least JavaScript will not block unless of course if it's not finished by the time you check for results.

2.  Break stuff up into multiple steps

        var tasks = [];

        addTask(compileVertexShader);
        addTask(compileFragmentShader);
        addTask(linkProgram);
        addTask(render);

        function addTask(fn) {
          tasks.push(fn);
          runNextTask();
        }

        var taskRunning = false;
        function runNextTask() {
          if (taskRunning) {
            return;
          }
          var taskFn = tasks.shift();
          if (taskFn) {
            taskRunning = true;
            setTimeout(function() {
              taskRunning = false;
              taskFn();
              runNextTask();
            }, 1);
          }
        }

        function compileVertexShader() {
          ...
        }

        function compileFragmentShader() {
          ...
        }

        function linkProgram() {
          ...
        }

        function render() {
          ...
        }    

    As long as one function doesn't take too long there won't be any issues. 

    There are some common libraries for helping with this kind of stuff. For example [the async library](https://github.com/caolan/async).
