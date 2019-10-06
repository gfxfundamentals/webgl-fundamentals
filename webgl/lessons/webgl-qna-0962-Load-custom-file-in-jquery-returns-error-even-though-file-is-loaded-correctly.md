Title: Load custom file in jquery returns error even though file is loaded correctly
Description:
TOC: qna

# Question:

I have the following code in order to load a `.glsl` file

    $.getScript("path/to/file/vertexShader.glsl", function( vertexShader ) {
        console.log(vertexShader);
    });

The content of the `vertexShader.glsl` is:

    #version 300 es

    precision highp float;  
    precision highp int;

    out vec3 world_coords;
    void main()
    {
        world_coords = position + vec3(0.5);
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }

Even though everything seems to work properly I retrieve the following error:

    VM598:1 Uncaught SyntaxError: Invalid or unexpected token
    at m (jquery.min.js:2)
    at Function.globalEval (jquery.min.js:2)
    at text script (jquery.min.js:2)
    at Ut (jquery.min.js:2)
    at k (jquery.min.js:2)
    at XMLHttpRequest.<anonymous> (jquery.min.js:2)   

The code is working fine, but I still get the errors. Any ideas how to get rid of them?



# Answer

`$.getScript` loads JavaScript scripts. Unlike internal scripts, scripts where the content is inside HTML, You can not use an external script to load anything other than JavaScript.

To load a text file the modern easy way use fetch and async/await

```
async function main() {
  const vertexShader = await fetch("path/to/file/vertexShader.glsl").then(req => req.text());
  ...
}
main();
```

or of course turn it into a function

```
async function main() {
  const vertexShader = await loadText("path/to/file/vertexShader.glsl");
  ...
}

function loadText(url) {
  return fetch("path/to/file/vertexShader.glsl").then(req => req.text());
}

main();
```

or without async/await

```
fetch("path/to/file/vertexShader.glsl")
  .then(req => req.text())
  .then(function( vertexShader ) {
    console.log(vertexShader);
  });
```

or if you want it to look similar to `getScript`

```
getTextFile("path/to/file/vertexShader.glsl", function( vertexShader ) {
  console.log(vertexShader);
});

function getTextFile(url, callback) {
  fetch("path/to/file/vertexShader.glsl")
    .then(req => req.text())
    .then(callback);
}

```


that said, if it was me and I wanted my shaders to be external I'd use `import` / `export` as in

```
// myvertexshader.glsl
default export `
  attribute vec4 position
  void main() {
    gl_Position = position;
  }
`;
```

And then you can `import` that into another javascript module as in

```
// main.js
import vertexShader from './myvertexshader.glsl';
...
```

main.js needs to be included as a module

```
<script src="main.js" type="module"></script>
```

`import` only works on modern browsers (like the kind that run WebGL2) but you can use something like [rollup](https://www.google.com/search?q=rollup.js) to convert it back into an old style single file JavaScript file.

This has the advantage that during development all your files are separate but for production/deployment you can build your JavaScript into one large file which will load much faster than many small files

[three.js does this](https://github.com/mrdoob/three.js/tree/dev/src/renderers/shaders/ShaderChunk) if you'd like to see an example
