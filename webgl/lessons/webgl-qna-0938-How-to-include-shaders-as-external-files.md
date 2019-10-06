Title: How to include shaders as external files
Description:
TOC: qna

# Question:

Is there a way to include this shader code as an external *vertexShader.js* without quotes and include between "script" tags?

    var vertCode =
    'attribute vec3 coordinates;' +

    'void main(void) {' +
    ' gl_Position = vec4(coordinates, 1.0);' +
    'gl_PointSize = 10.0;'+
    '}';

# Answer

You asked how to include shaders as **external files**

There are several ways but first off it's important to note that using backticks for strings which are called [*multiline template literals*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) let you have multiline strings

      const str = `
      this
      string
      is
      on
      multiple lines
      `;

So there's no need to use 'this' + 'that' as you were doing.

If you really want to put them in separate files though then here's at least 3 of the many ways you could do it

* put them in separate script files, assign to some global. Example

  vertexShader.js

        window.shaders = window.shaders || {};
        window.shaders.someVertexShader = `
        attribute vec3 coordinates;

        void main(void) {
            gl_Position = vec4(coordinates, 1.0);
            gl_PointSize = 10.0;'
        }
        `;
        
   in your html

        <script src="vertexShader.js"></script>
        <script>
         // use shader as window.shaders.someVertexShader
         ...
        </script>

   Note that your final JavaScript script could also be in a separate file just as long as it comes after the shader files.

* Put them in a separate JavaScript module

  Modern browsers support [ES6 modules](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)

  vertexShader.js

        export default `
        attribute vec3 coordinates;

        void main(void) {
            gl_Position = vec4(coordinates, 1.0);
            gl_PointSize = 10.0;'
        }
        `;

   In this case your JavaScript script **must** be in an external file so your
   HTML might look something like this

        <script src="main.js" type="module"></script>

   and main.js would look something like this

        import someVertexShader from './vertexShader.js';

        // use someVertexShader

   There's an example [here](https://glitch.com/edit/#!/nice-swift)

* Load them with [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

   In this case there's no JavaScript in the shader file

   vertexShader.shader

        attribute vec3 coordinates;

        void main(void) {
            gl_Position = vec4(coordinates, 1.0);
            gl_PointSize = 10.0;'
        }

   Then in your script

        fetch('./vertexShader.shader')
        .then(response => response.text())
        .then((shaderSource) => {
           // use shadeSource
        });

   The biggest problem with this method is the scripts are downloaded asynchronously so you have to manually wait for them to download. Using async/await that's pretty easy though.

   Imagine you wanted to download 6 shaders files and then use them. This code would wait for all 6 files to download before starting

        function loadTextFile(url) {
          return fetch(url).then(response => response.text());
        }

        const urls = [
          './someShader1.shader',
          './someShader2.shader',
          './someShader3.shader',
          './someShader4.shader',
          './someShader5.shader',
          './someShader6.shader',
        });   

        async function main() {
          const files = await Promise.all(urls.map(loadTextFile));
          // use files[0] thru files[5]
        }
        main();
    
If it was me and I really wanted to put my shaders in external files I'd probably use `import` and then either only target modern browsers or else use some program like [webpack](https://webpack.js.org/) or [rollup](https://github.com/rollup/rollup) to package them into a single file for shipping. This is what [THREE.js](https://github.com/mrdoom/three.js) currently does.
