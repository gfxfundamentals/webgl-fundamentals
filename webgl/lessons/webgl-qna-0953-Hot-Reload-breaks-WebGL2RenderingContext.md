Title: Hot Reload breaks WebGL2RenderingContext
Description:
TOC: qna

# Question:

I have a `webpack/typescript/webgl2`-setup. I have a class that represents the `WebGL2RenderingContext`, which is shown below:

    import { isNullOrUndefined } from "util";
    
    export class GraphixContext implements Context<WebGL2RenderingContext> {
      private gl: WebGL2RenderingContext;
      private canvas: HTMLCanvasElement;
      private constructor(
        context: WebGL2RenderingContext,
        canvas: HTMLCanvasElement
      ) {
        this.gl = context;
        this.canvas = canvas;
      }
    
      public getContext(): WebGL2RenderingContext {
        return this.gl;
      }
      public appendCanvas(id: string) {
        document.body.appendChild(this.canvas);
        this.canvas.id = id;
      }
    
      public static build(): GraphixContext {
        let canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2");
    
        if (isNullOrUndefined(gl)) {
          throw new Error("WebGL could not be initialized");
        }
        return new GraphixContext(gl, canvas);
      }
    }

I start the `webpack-dev-server` with the command 

    `"scripts": {
        "build": "webpack ",
        "watch": "webpack --watch",
        "start": "webpack-dev-server --open"
      },`

When I start typing in `GraphixContext.ts` hot reload gets activated and `webpack` creates a `bundle.js`. However ONLY if I edit the code in `GraphixContext` the following error is shown.

  

      TS2345: Argument of type 'WebGLRenderingContext | CanvasRenderingContext2D' is not assignable to parameter of type 'WebGL2RenderingContext'.
      Type 'WebGLRenderingContext' is missing the following properties from type 'WebGL2RenderingContext': READ_BUFFER, UNPACK_ROW_LENGTH, UNPACK_SKIP_ROWS, UNPACK_SKIP_PIXELS, and 347 more.

Every other edit in my project works just fine. Has someone an explanation for this error?

# Answer

This is type error. 

The problem is whatever type system you're using it thinks `canvas.getContext` can only return either a `WebGLRenderingContext` or `CanvasRenderContext2D` but not a `WebGL2RenderingContext` so when you call the `GraphixContext` constructor it believe `gl` is the wrong type.

Change this

     const gl = canvas.getContext("webgl2");

to this?

     const gl = <WebGL2RenderingContext>canvas.getContext("webgl2");

Or fix your definition of `canvas.getContext` so it can return a `WebGL2RenderingContext`

The issue is probably in this area

https://github.com/Microsoft/TypeScript/blob/b7d7d5f7b39a5b9619c77590e5fe7f434ed68f1e/src/lib/dom.generated.d.ts#L5998

There's no entry for `"webgl2"`


