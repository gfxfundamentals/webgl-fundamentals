Title: Is there any maps per page limitation in mapbox-gl?
Description:
TOC: qna

# Question:

I'm trying to have 17 small maps on the same page using mapbox-gl and facing:

`WARNING: Too many active WebGL contexts. Oldest context will be lost.`


    Uncaught TypeError: Failed to execute 'shaderSource' on 'WebGLRenderingContext': parameter 1 is not of type 'WebGLShader'.
        at new Program (mapbox-gl.js:182)
        at Painter._createProgramCached (mapbox-gl.js:178)
        at Painter.useProgram (mapbox-gl.js:178)
        at setFillProgram (mapbox-gl.js:154)
        at drawFillTile (mapbox-gl.js:154)
        at drawFillTiles (mapbox-gl.js:154)
        at Object.drawFill [as fill] (mapbox-gl.js:154)
        at Painter.renderLayer (mapbox-gl.js:178)
        at Painter.render (mapbox-gl.js:178)
        at e._render (mapbox-gl.js:497)

I had the same issue when i tried to have many google streetview galleries on the same page, but as my streetview shouldn't be visible at the same moment i ended using the same streetview changing address dynamically.

But for maps list requirement is to show that many maps to user. Can't show them one by one. Not sure how i could work out that issue.

i'm using mapbox-gl@0.45.0, and testing it in chrome Version 66.0.3359.181 (Official Build) (64-bit) on Mac OS Sierra 10.12.6 (16G1036)

# Answer

I'm going to guess you are out of luck. Browsers limit the number of WebGL instances. [There are workarounds](https://stackoverflow.com/questions/33165068/how-can-we-have-display-of-same-objects-in-two-canvas-in-webgl) but to use them would probably require changes to the way mapbox-gl is implemented. I suggest [you ask them](https://github.com/mapbox/mapbox-gl-js/issues) if they'd consider implementing one of the workarounds assuming they haven't already. 

There is one other possibility that comes to mind and that would be to do your own virtualization of WebGL in JavaScript. That's probably not a good solution though because it wouldn't share resources across maps and it might be too heavy.

Off the top of my head you'd have to create an offscreen canvas and override `HTMLCanvasElement.prototype.getContext` so that when someone makes a `webgl` context you return a virtual context. You'd wrap every function and if that virtual context doesn't match the last used virtual context you'd save all the webgl state and restore the state for the new context. You'd also have to keep framebuffers to match the drawingbuffer for each canvas, bind them when the current framebuffer binding is `null` and resize them if the canvas sized changed, and then render to the offscreen canvas and then `canvas2d.drawImage` to their respective canvases anytime the current event exits. It's that last part that would be heaviest.

In semi-pseudo code

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // This is just off the top of my head and is just pseudo code
    // but hopefully gives an idea of how to virtualize WebGL.

    const canvasToVirtualContextMap = new Map();
    let currentVirtualContext = null;
    let sharedWebGLContext;
    const baseState = makeDefaultState();

    HTMLCanvasElement.prototype.getContext = (function(origFn) {

      return function(type, contextAttributes) {
        if (type === 'webgl') {
          return createOrGetVirtualWebGLContext(this, type, contextAttributes);
        }
        return origFn.call(this, contextAttributes);
      };

    }(HTMLCanvasElement.prototype.getContext));

    class VirutalWebGLContext {
      constructor(cavnas, contextAttributes) {
        this.canvas = canvas;
        // based on context attributes and canvas.width, canvas.height 
        // create a texture and framebuffer
        this._drawingbufferTexture = ...;
        this._drawingbufferFramebuffer = ...;
        
        // remember all WebGL state (default bindings, default texture units,
        // default attributes and/or vertex shade object, default program,
        // default blend, stencil, zbuffer, culling, viewport etc... state
        this._state = makeDefaultState();
      }
    }

    function makeDefaultState() {
      const state ={};
      state[WebGLRenderingContext.ARRAY_BUFFER] = null;
      ... tons more ...
    }

    // copy all WebGL constants and functions to the prototype of
    // VirtualWebGLContext

    for (let key in WebGLRenderingContext.protoype) {
      const value = WebGLRenderingContext.prototype[key];
      let newValue = value;
      switch (key) {
        case 'bindFramebuffer': 
          newValue = virutalBindFramebuffer;
          break;
        case 'clear':
        case 'drawArrays':
        case 'drawElements':
          newValue = createDrawWrapper(value);
          break;
        default:
          if (typeof value === 'function') {
            newValue = createWrapper(value); 
          }
          break;
       }
       VirtualWebGLContext.prototype[key] = newValue;
    }

    function virutalBindFramebuffer(bindpoint, framebuffer) {
      if (bindpoint === WebGLRenderingContext.FRAMEBUFFER) {
        if (target === null) {
          // bind our drawingBuffer
          sharedWebGLContext.bindFramebuffer(bindpoint, this._drawingbufferFramebuffer);
        }
      }

      sharedWebGLContext.bindFramebuffer(bindpoint, framebuffer);
    }  

    function createWrapper(origFn) {
      // lots of optimization could happen here depending on specific functions
      return function(...args) {
        makeCurrentContext(this);
        resizeCanvasIfChanged(this);
        return origFn.call(sharedWebGLContext, ...args);
      };
    }

    function createDrawWrapper(origFn) {
      const newFn = createWrapper(origFn);
      return function(...args) {
        // a rendering function was called so we need to copy are drawingBuffer
        // to the canvas for this context after the current event.
        this._needComposite = true;
        return newFn.call(this, ...args);
      };
    }

    function makeCurrentContext(vctx) {
      if (currentVirtualContext === vctx) {
        return;
      }
      
      // save all current WebGL state on the previous current virtual context
      saveAllState(currentVirutalContext._state);
      
      // restore all state for the 
      restoreAllState(vctx._state);
      
      // check if the current state is supposed to be rendering to the canvas.
      // if so bind vctx._drawingbuffer
      
      currentVirtualContext = vctx;
    }

    function resizeCanvasIfChanged(vctx) {
      if (canvas.width !== vtx._width || canvas.height !== vctx._height) {
        // resize this._drawingBuffer to match the new canvas size
      }  
    }

    function createOrGetVirtualWebGLContext(canvas, type, contextAttributes) {
      // check if this canvas already has a context
      const existingVirtualCtx = canvasToVirtualContextMap.get(canvas);
      if (existingVirtualCtx) {
        return existingVirtualCtx;
      }
      
      if (!sharedWebGLContext) {
        sharedWebGLContext = document.createElement("canvas").getContext("webgl");
      }
      
      const newVirtualCtx = new VirtualWebGLContext(canvas, contextAttributes);
      canvasToVirtualContextMap.set(canvas, newVirtualCtx);
      
      return newVirtualCtx;   
    }

    function saveAllState(state) {
      // save all WebGL state (current bindings, current texture units,
      // current attributes and/or vertex shade object, current program,
      // current blend, stencil, zbuffer, culling, viewport etc... state
      state[WebGLRenderingContext.ARRAY_BUFFER] = sharedGLState.getParameter(gl.ARRAY_BUFFER_BINDING);
      state[WebGLRenderingContext.TEXTURE_2D] = sharedGLState.getParameter(gl.TEXTURE_BINDING_2D);
      ... tons more ...
    }

    function restoreAllState(state) {
      // resture all WebGL state (current bindings, current texture units,
      // current attributes and/or vertex shade object, current program,
      // current blend, stencil, zbuffer, culling, viewport etc... state
      gl.bindArray(gl.ARRAY_BUFFER, state[WebGLRenderingContext.ARRAY_BUFFER]);
      gl.bindTexture(gl.TEXTURE_2D, state[WebGLRenderingContext.TEXTURE_2D]);
      ... tons more ...
    }

    function renderAllDirtyVirtualCanvas() {
      let setup = false;
      for (const vctx of canvasToVirtualContextMap.values()) {
        if (!vctx._needComposite) {
          continue;
        }
        
        vctx._needComposite = false;
         
        if (!setup) {
          setup = true;
          // save all current WebGL state on the previous current virtual context
          saveAllState(currentVirutalContext._state);
          currentVirutalContext = null;
          
          // set the state back to the default
          restoreAllState(sharedGlContext, baseState);
            
          // setup whatever state we need to render vctx._drawinbufferTexture
          // to the canvas.
          sharedWebGLContext.useProgram(programToRenderCanvas);
          ...
        }
        
        // draw the drawingbuffer's texture to the canvas
        sharedWebGLContext.bindTexture(gl.TEXTURE_2D, vctx._drawingbufferTexture);
        sharedWebGLContext.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }



<!-- end snippet -->

you'd also need to trap events that cause rendering which would be unique to each app. If the app uses requetsAnimationFrame to render then maybe something like

    window.requestAnimationFrame = (function(origFn) {
    
      return function(callback) {
        return origFn.call(window, (time) {
          const result = callback(time);
          renderAllDirtyVirtualCanvases();
          return result;
        };
      };
    
    }(window.requestAnimationFrame));

If the app renders on other events, like say mousemove then maybe 
something like this

    let someContextNeedsRendering;

    function createDrawWrapper(origFn) {
      const newFn = createWrapper(origFn);
      return function(...args) {
        // a rendering function was called so we need to copy are drawingBuffer
        // to the canvas for this context after the current event.
        this._needComposite = true;

        if (!someContextsNeedRendering) {
          someContextsNeedRendering = true;
          setTimeout(dealWithDirtyContexts, 0);
        }

        return newFn.call(this, ...args);
      };
    }

    function dealWithDirtyContexts() {
      someContextsNeedRendering = false;
      renderAllDirtyVirtualCanvas();
    });


Makes me wonder [if someone else has already done this](https://github.com/greggman/virtual-webgl).
