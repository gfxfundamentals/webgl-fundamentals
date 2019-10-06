Title: Passing WebAsembly memory to WebGL2
Description:
TOC: qna

# Question:

In WebGL2, there are additional versions of most existing functions that accept `ArrayBuffer`s that allow passing in offset and length inside these buffers. Supposedly, this should make it easier to pass in data from WebAssembly memory without creating temporary views, but there's a catch: those functions only accept `ArrayBufferView`.

1. What is the reason for such limitation? Why should a function that copies bytes to GPU care about their semantics, i.e. Uint8/Int32/Float32, etc?
2. How to get around it, without creating a `DataView` every time (which would completely defeat the purpose of using those functions in the first place)? Creating DataView once wouldn't work because WebAssembly memory can re-allocate its buffer, and there is no way to set a callback for memory resize.

# Answer

I don't know why `texImage2D` etc take an ArrayBufferView and not just an ArrayBuffer as well. I agree it seems pointless.

At worst you should be able to only create a new view when the buffer changes.

Example:

    ;; hello.wat
    (module
      ;; Import our trace function so that we can call it in main
      (import "env" "trace" (func $trace (param i32)))
      ;; Define our initial memory with a single page (64KiB).
      (memory $0 1)
      ;; Store a null terminated string at byte offset 0. 
      (data (i32.const 0) "Hello world!\00")
      ;; Export the memory so it can be read in the host environment.
      (export "memory" (memory $0))
      (func $alloc (param $0 i32) (result i32)
        get_local $0
        grow_memory
      )
      (export "alloc" (func $alloc))
      ;; Define the main function with no parameters.
      (func $main
        ;; Call the trace function with the constant value 0.
        (call $trace (i32.const 0))
      )
      ;; Export the main function so that the host can call it.
      (export "main" (func $main))
    )

and the js that calls it

    // hello.js
    async function doit() {
      const response = await fetch('../out/main.wasm');
      const buffer = await response.arrayBuffer();
      const module = await WebAssembly.compile(buffer);
      const instance = await WebAssembly.instantiate(module, {
        env: {
          trace
        }
      });
    
      let exports = instance.exports;
      
      let view = new Uint8Array(exports.memory.buffer);
      function getView() {
        if (view.buffer !== exports.memory.buffer) {
          console.log('new view');
          view = new Uint8Array(exports.memory.buffer);
        }
        return view;
      }
    
      function trace(byteOffset) {
        let s = '';
        const view = getView();
        for (let i = byteOffset; view[i]; i++) {
          s += String.fromCharCode(view[i]);
        }
        console.log(s);
      }
    
      exports.main();
      exports.main();
      exports.main();
      exports.alloc(10);
      exports.main();
      exports.main();
      exports.main();
    }
    
    doit().then(() => {
      console.log("done");
    });

The only time a new view is created is when WebAssembly reallocates the buffer

Since apparently you need a different type of view depending on the `type` parameter passed to WebGL2 you'll need a set of views instead of just one view and based on the type parameter you need to get the correct type of view.

Copied from the comments:

1. texImage2D and bufferData etc are not generally functions that are called in a tight loop so optimizing them past the point above doesn't seem like that big a deal? The check is simple and not likely to affect performance and GC is avoided

2. I did't find any way to get a callback when `grow_memory` is called. On the other hand if you're writing your own webassembly you can easily have all your `grow_memory` calls go through your own function and have that function call into JavaScript to update your views. I'm guessing this is what emscripten does. It has a runtime library. I assume that runtime library gets called when they want to grow memory and so they can update their views.
