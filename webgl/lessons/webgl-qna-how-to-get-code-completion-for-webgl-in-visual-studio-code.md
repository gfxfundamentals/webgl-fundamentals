Title: How to get code completion for WebGL in Visual Studio Code
Description: How to get code completion for WebGL in Visual Studio Code
TOC: How to get code completion for WebGL in Visual Studio Code

## Question:

I have a school project and i need to use WEBGL. But its pretty difficult to write all the code without autocompletion. I didn't find proper extension. Do you have ideas?

## Answer:

In order for visual studio code to give you auto completion it needs to know the types of variables.

So for example if you have this

```
const gl = init();
```

VSCode has no idea what type the variable `gl` is so it can't auto complete. But you can tell it the type by adding a JSDOC style comment above it like this

```
/** @type {WebGLRenderingContext} */
const gl = init();
```

Now it will auto complete

[![enter image description here][1]][1]


The same is true for HTML elements. If you do this

```
const canvas = document.querySelector('#mycanvas');
```

VSCode has no idea what type of element that is but you can tell it

```
/** @type {HTMLCanvasElement} */
const canvas = document.querySelector('#mycanvas');
```

Now it will know it's an `HTMLCanvasElement`

[![enter image description here][2]][2]

And, because it knows it's an `HTMLCanvasElement` it knows that `.getContext('webgl')` returns a `WebGLRenderingContext` so it will automatically offer auto completion for the context as well

[![enter image description here][3]][3]

Note that if you're pass the canvas into some function then again, VSCode has no idea what that function returns. In otherwords

```
/** @type {HTMLCanvasElement} */
const canvas = document.querySelector('#mycanvas');
const gl = someLibraryInitWebGL(canvas);
```

You won't get completion anymore since VSCode as no idea what `someLibraryInitWebGL` returns so follow the rule at the top and tell it.

```
/** @type {HTMLCanvasElement} */
const canvas = document.querySelector('#mycanvas');

/** @type {WebGLRenderingContext} */
const gl = someLibraryInitWebGL(canvas);
```

You can see other JSDOC annotations [here](https://jsdoc.app/) if you want to document your own functions, for example their argument and return types.

  [1]: https://i.stack.imgur.com/8mvFM.png
  [2]: https://i.stack.imgur.com/oArWf.png
  [3]: https://i.stack.imgur.com/7zR4q.png

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/11662503">Nikola Kovač</a>
    from
    <a data-href="https://stackoverflow.com/questions/61387725">here</a>
  </div>
</div>
