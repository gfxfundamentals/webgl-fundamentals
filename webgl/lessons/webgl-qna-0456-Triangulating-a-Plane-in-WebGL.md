Title: Triangulating a Plane in WebGL
Description:
TOC: qna

# Question:

I'm trying to construct a plane out of triangles in WebGL. My code for the constructor looks like this: 

    function plane( points_transform )
    {
    
     shape.call(this); // Inherit class shape’s array members by calling parent constructor
        if( !arguments.length) return; // Pass no arguments if you just want to make an empty dummy object that inherits everything, for populating other shapes
        this.populate( this, points_transform ); // Otherwise, a new triangle immediately populates its own arrays with triangle points,
        this.init_buffers(); // Then sends its arrays to the graphics card into new buffers
    }
    
    inherit(plane, shape); 
    plane.prototype.populate = function( recipient, points_transform) 
    {
     var offset = recipient.vertices.length;        
     var index_offset = recipient.indices.length;                // Recipient's previous size
    
     recipient.vertices.push( vec3(0,0,0), vec3(1,1,0), vec3(0,1,0), vec3(1,0,0), vec3(2,1,0), vec3(2,0,0) );
     recipient.normals.push( vec3(0,0,1), vec3(0,0,1), vec3(0,0,1), vec3(0,0,1), vec3(0,0,1), vec3(0,0,1) );
     // recipient.texture_coords.push( vec2(0,0), vec2(0,1), vec2(1,0), vec2(1,1), vec2(2,0), vec2(2,1) );
       recipient.indices.push( offset + 0, offset + 1, offset + 2, offset + 3, offset + 4, offset + 5 );
    
       gl.drawArrays(gl.TRIANGLE_STRIP, 0, recipient.vertices);
    }

However when I draw it, it looks disjointed like this:

[![enter image description here][1]][1]

I was wondering how to fix that issue and how to make a generalized function that could take an arbitrary amount of rows / columns and compute the necessary vertices to generate an MxN grid. 

I was looking at [this site][2] specifically but I can't figure out where the trianglestrip variable comes from. 


  [1]: http://i.stack.imgur.com/N3KY9.png
  [2]: http://www.corehtml5.com/trianglestripfundamentals.php

# Answer

This was asked just a few days ago. Here's one answer

https://stackoverflow.com/questions/35408593/generate-grid-mesh/35411856#35411856

In your particular case though a 1 unit rectangle has these points


    0,0      1,0
     +--------+
     |        |
     |        |
     |        |
     |        |
     +--------+
    0,1      1,1

So your vertices should be

    recipient.vertices.push( 
      vec3(0,0,0), vec3(1,1,0), vec3(0,1,0), 
      vec3(1,0,0), vec3(1,1,0), vec3(0,0,0) );
    
There's no `2`s

Of course there are many other combinations and orders of those 4 points that will make a rectangle.

I usually choose this order

    0         1 4 
     +--------+
     |        |
     |        |
     |        |
     |        |
     +--------+
    2 3       5


I don't think there is any particular reason for one order or another except to deal with [culling][1] (search for *culling* on that page)

In your particular case though you're also using `TRIANGLE_STRIP`. Let me first say AFAIK *no professional game developers use `TRIANGLE_STRIP`. They all use plain `TRIANGLES`. It just makes everything easier so you might want to switch to `TRIANGLES`. For a strip through you only need 4 points


    recipient.vertices.push( 
      vec3(0,0,0), vec3(0,1,0), vec3(0,1,0), vec3(1,1,0)); 
    recipient.indices.push( 
      offset + 0, offset + 1, offset + 2, offset + 3);

Just in case it's not clear. Given 6 points `TRIANGLES` will draw 2 triangles consisting of 

    triangle 0 = points 0,1,2 
    triangle 1 = points 3,4,5 

whereas `TRIANGLE_STRIP` will draw 4 triangles consisting of 

    triangle 0 = points 0,1,2 
    triangle 1 = points 1,2,3 
    triangle 2 = points 2,3,4 
    triangle 3 = points 3,4,5 

Also, It's not at all clear what your code is doing. Maybe `recipeient.xxx.push` is doing some really inefficient magic but there's no indication the vertices you're creating are actually being used by WebGL when you call `gl.drawArrays`. Normally there would need to be some calls to `gl.bufferData` or `gl.bufferSubData` to give the data to WebGL. Also you're recreating indices but `gl.drawArrays` does not use indices.

  [1]: http://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html
