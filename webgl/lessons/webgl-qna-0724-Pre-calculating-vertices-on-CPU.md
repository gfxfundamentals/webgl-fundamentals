Title: Pre calculating vertices on CPU
Description:
TOC: qna

# Question:

For rendering many sprites with WebGL, I thought I will ask about performance.

Let's consider this:

    for(let i = 0; i < 50000; i++){
        let t = new Sprite();
        t.scale(Math.random())
        t.rotate(Math.random())
        t.transform(Math.random(),Math.random())

With the following functions for `scale`, `rotate` and `transform`

 

     translate(x, y) {
        for (let i = 0; i < this.vertexData.length; i += 3) {
          this.vertexData[i] += x;
          this.vertexData[i + 1] += y;
        }
      }
    
    
      rotate(alpha) {
        this.translate(-this.position[0], -this.position[1]);
        for (let i = 0; i < this.vertexData.length; i += 3) {
          let new_x = this.vertexData[i] * Math.cos(alpha) - this.vertexData[i + 1] * Math.sin(alpha);
          let new_y = this.vertexData[i + 1] * Math.cos(alpha) + this.vertexData[i] * Math.sin(alpha);
          this.vertexData[i] = new_x;
          this.vertexData[i + 1] = new_y;
        }
        this.translate(this.position[0], this.position[1]);
      }
    
    
      scale(factor) {
        this.translate(-this.position[0], -this.position[1]);
        for (let i = 0; i < this.vertexData.length; i += 3) {
          this.vertexData[i] *= factor;
          this.vertexData[i + 1] *= factor;
        }
        this.translate(this.position[0], this.position[1])
      }

And `this.vertexData=[-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0];`

What are my possibilities to make the functions `scale`, `rotate` and `transform` faster? Either depending on language or mathematically.

# Answer

1. Put all the sprite data for all sprites in one array. AFAICT you're using one array per sprite. That means you have to call `gl.bufferData` for each sprite's vertexData separately. That's slower than just one call that uploads all sprite data for all sprites with one upload.

   If you still want to keep one object per sprite you could have each sprite use an offset into a larger global array


        const maxSprites = 50000;
        const globalVertData = new Float32Array(maxSprites * 12);
        const quad = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
        const numSprites = 0;
        
        class Sprite {
          constructor() {
            const offset = numSprites++ * 12 * 4;
            // make vertexData a view into the larger array
            this.vertexData = new Float32Array(
                globalVertData.buffer, offset, 12);
            this.vertexData.set(quad); 
          }
          ... your functions from above ...
        }

   or this

        const maxSprites = 50000;
        const globalVertData = new Float32Array(maxSprites * 12);
        const quad = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
        const numSprites = 0;

        class Sprite {
          constructor() {
            this.offset = numSprites++ * 12;
            globalVertData.set(quad, this.offset);
          }
          translate(x, y) {
            let i = this.offset;
            const end = i + 12;
            for (; i < end; i += 2) {
              globalVertData[i] += x;
              globalVertData[i + 1] += y;
            }
          } 
          ... functions for rotate and scale that use this.offset ...
        }

    Then you just upload `globalVertData` with `gl.bufferData` instead of each individual sprite's `vertexData`. 

    I have an intuition the second is faster than the first. It also takes
less memory because there's one array object instead of one array view per spite. That said I didn't test it so I could be wrong.

2. Get rid of `Z`. Assuming you don't need `Z` for sprites get rid of it (and it appears you don't since neither rotate nor translate manipulate z). Then you're uploading less data and, at least `scale` would get faster. I did this above.

3. Pull out length from your loop

        for (let i = 0; i < someArray.length; ++i) {
          ...

   Is slower than

        const len = someArray.length;
        for (let i = 0; i < len; ++i) {
          ...

   Which is also slower than

        const spriteLen = 12;  // GLOBAL OR CLOSED VARIABLE

        const len = spriteLen;
        for (let i = 0; i < len; ++i) {
          ...

   Basically the `.` operator takes time as in `array.length` or `foo.bar`.
   In the first example the `.` operator happens every iteration. In the
   second it happens once per loop. In the 3rd it doesn't happen at all.

4. `let` is slower than `var`

   [let creates a new object every iteration of the loop. Var does not](https://stackoverflow.com/questions/37792934/why-is-let-slower-than-var-in-a-for-loop-in-nodejs) although if you pull it out of the loop that problem would go away. It's possible browsers will fix this in the future in that
they can analyze the code and see they don't need to create a new object each iteration (Spidermonkey seems to do this and Chrome 60 seems to fix this as well. Safari it's still slower)

5. Other things that generally help with sprites. Use a [texture atlas](https://en.wikipedia.org/wiki/Texture_atlas). That way you can draw all sprites in with one draw call.

You might find [this answer](https://stackoverflow.com/questions/42473044/how-to-reduce-draw-calls-in-opengl-webgl/42478207#42478207) useful as well
