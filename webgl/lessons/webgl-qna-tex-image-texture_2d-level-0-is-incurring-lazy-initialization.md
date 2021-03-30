Title: Tex image TEXTURE_2D level 0 is incurring lazy initialization
Description: Tex image TEXTURE_2D level 0 is incurring lazy initialization
TOC: Tex image TEXTURE_2D level 0 is incurring lazy initialization

## Question:

I got the error message: `Error: WebGL warning: drawElements: Tex image TEXTURE_2D level 0 is incurring lazy initialization.` on WebGL and I want to know what is actually means.

How is lazy initialization even a problem in a single-thread application anyway? I understand it as when you initialize a variable inside a getter?

I tried looking for my error message didn't really find any good info on it.


This is my code for handling textures:

````
            const images = await Promise.all(model.maps.map(map => new Promise((resolve, reject) => {
                const image = new Image();

                image.src = map;
                image.onload = event => {
                    const texture = gl.createTexture();

                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.FLOAT, null);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    gl.bindTexture(gl.TEXTURE_2D, null);

                    resolve(texture);
                };

                image.onerror = error => {
                    console.log(error);
                    resolve(null);
                };
            })));
````

The relevant part of my draw function is basically:

````
gl.bindTexture(gl.TEXTURE_2D, textures[material.textureIndex]);
gl.activeTexture(gl.TEXTURE0);
gl.drawElements(gl.TRIANGLES, material.faceCount * 3, gl.UNSIGNED_SHORT, drawnCount);
````

With that said, if I use the 6 argument syntax: ` gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.FLOAT, image);` then this error message no longer shows and I manage to render correctly.

## Answer:

It's not an error. It's a warning.

> Error: WebGL **warning** ...

It's super confusing it says "Error" in front but even if it only said "warning" I've argued for a long time it's bad warning.

The warning is that WebGL needed to do some non-trivial work. 

When you make a texture and you don't pass it any data, you passed `null` as the last parameter to `texImage2D`, it means at some point WebGL has to clear the texture. Let's say that texture is 2048x2048 RGBA/UNSIGNED_BYTE. Effectively WebGL has to allocate 16meg of ram (2048x2048x4), clear that 16meg of ram to 0, and call `gl.texSubImage2D` to put zeros in the texture just before the texture is actually used. If they didn't do this the texture would have random data in it, data that might be secrets, passwords, previous graphics memory like photos, or whatever.

So, the warning is telling you some non-trivial work happened.

The problem with this warning is the workaround to stop the warning is worse than the warning itself. The workaround is for you to clear the texture yourself. To do that you'd need to allocate 16meg in JavaScript as in `new Uint8Array(2048 * 2048 * 4)`. That means JavaScript is allocating 16meg, it also clears that 16 meg. It also allocates a `Uint8Array` object to track that 16meg. That `Uint8Array` object is a complex JavaScript object, likely a collection of multiple objects composited together, for example an `ArrayBuffer` object is also allocated. The objects both have prototype chains and the ability to have properties and methods and getters and setters added to them. That `Uint8Array` and `ArrayBuffer` also have to be tracked so they can be garbage collected later meaning there is overhead in them even existing. Worse, if the browser is multi-process which Chrome is and I believe Firefox is working toward, then that 16meg allocated in JavaScript has to copied to the GPU process which means first the GPU process needs to allocate 16meg of ram as well, the data has to copied from the process running the webpage to the GPU process so it can be passed to the graphics driver. Even way more work.

So in other words, getting Firefox to shut up about its warning actually makes your code much slower and use much more memory then if firefox just silently cleared the texture on its own. Hence why I say that warning should not exist

Firefox's developers have the POV that anytime WebGL does something heavy they want to give you a warning. Given the cure makes your code more heavy I disagree with their POV. Chrome does not give this warning. It also confuses developers as they think they're doing something wrong. They're not doing anything wrong.

https://bugzilla.mozilla.org/show_bug.cgi?id=1478216

As for things not rendering, in the code you posted you've put nothing in the texture so of course the texture is 0,0,0,0. 

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/12001647">caka</a>
    from
    <a data-href="https://stackoverflow.com/questions/57734645">here</a>
  </div>
</div>
