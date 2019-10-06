Title: How do I get syntax highlighting in Sublime for webgl/glsl inline script tags
Description:
TOC: qna

# Question:

I'm trying to get syntax highlighting/coloring for a glsl fragment shader in a script tag in an html file.

Even though I installed all related [Shader Syntax packages][1] in Sublime Text I still don't get syntax highlighting. I believe those only fix it for external files or for non-html files. But I'm using an internal script tag. 

Has anyone ran into this?

[![uncolored syntax for glsl in sublime][2]][2]


  [1]: https://packagecontrol.io/packages/Shader%20Syntax%20(GLSL%20HLSL%20Cg)
  [2]: https://i.stack.imgur.com/gFZb3.png

# Answer

not a direct answer but an alternative solution.

Using ES6 `import` you can store your shaders in separate files

```
// some-vertex-shader.glsl
export default `
void main() {
  gl_Position = vec4(0, 0, 0, 1);
}
`;
```

Then in your JavaScript you can include it like this

```
import someVertexShaderSource from 'path/to/some-shader-source.glsl';
...
```

With that you can probably setup Sublime to highlight code in .glsl files


You can then use something like [rollup](https://rollupjs.org/guide/en) to merge all your files into one if you want to support older browsers.

This is what [three.js](https://threejs.org) does.

Also in VSCode (sorry, not sublimetext) I believe you can tag template literals with a language to get it to highlight

```
const shaderSource = /* glsl */`
void main() {
  gl_Position = vec4(0, 0, 0, 1);
}
```


