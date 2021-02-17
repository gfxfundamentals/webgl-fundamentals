Title: How to create a torus
Description: How to create a torus
TOC: How to create a torus

## Question:

I'm trying to render a torus using webgl. I'm using a third party library which makes this process easier: I only have to declare the various vertices, their normals and their indexes. Each tuple of 3 indexes draws a triangle and the vertices must follow the right hand rule.

So far this is what I have: 
```
 this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        let slices_angle = 0;
        let loops_angle = 0;
        let slices_delta = (2 * Math.PI) / this.slices;
        let loops_delta = (2 * Math.PI) / this.loops;
        let abc = 0;

        while (slices_angle < 2 * Math.PI + slices_delta) {
            let cos_slices = Math.cos(slices_angle);
            let sin_slices = Math.sin(slices_angle);
            let cos_loops = Math.cos(loops_angle);
            let sin_loops = Math.sin(loops_angle);

            while (loops_angle < 2 * Math.PI + loops_delta) {
                //   x=(R+r·cos(v))cos(w)
                //   y=(R+r·cos(v))sin(w)
                //             z=r.sin(v)

                let x = (this.outerRad + this.inner_rad * cos_slices) * cos_loops;
                let y = (this.outerRad + this.inner_rad * cos_slices) * sin_loops;
                let z = this.inner_rad * sin_slices;

                this.vertices.push(x, y, z);
                this.normals.push(x, y, z);

                // this.texCoords.push(j / this.slices);
                // this.texCoords.push(i / this.stacks);

                loops_angle += loops_delta;
            }

            slices_angle += slices_delta;
        }

        for (var i = 0; i < this.loops; i++) {
            let v1 = i * (this.slices + 1);
            let v2 = v1 + this.slices + 1;

            for (var j = 0; j < this.slices; j++) {

                this.indices.push(v1);
                this.indices.push(v2);
                this.indices.push(v1 + 1);

                this.indices.push(v1 + 1);
                this.indices.push(v2);
                this.indices.push(v2 + 1);

                v1++;
                v2++;
            }
        }
   ```
I had the help of this website in order to declare the coordinates of the vertices but I'm having problems with the indexes. 

[![example][1]][1]


  [1]: https://i.stack.imgur.com/9X3xP.png

## Answer:

The code doesn't make a lot of sense at a glance. You've got an inner and outer loop

In the inner loop this code computes a vertex

               let x = (this.outerRad + this.inner_rad * cos_slices) * cos_loops;
               let y = (this.outerRad + this.inner_rad * cos_slices) * sin_loops;
               let z = this.inner_rad * sin_slices;

               this.vertices.push(x, y, z);
               this.normals.push(x, y, z);

But nothing about those calculations change inside the inner loop

The normals can't be x, y, z (the same as the positions).

Also you need to make loops + 1 and slices + 1 vertices. The vertices start vertex of each loop, slice will have the same position but it will not have the same texture coordinate.

Then as far as your indices go each slice as (loops + 1) vertices so I think the loops in the code are backward.
 
If it was me, rather than loop based on the angles I'd loop based on the loops and slices

    for (slice = 0; slice < this.slices; ++slice) {
      for (loop = 0; loop < this.loops; ++loop) {
        ...

So here's another version

{{{example url="../webgl-qna-how-to-create-a-torus-example-1.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/11173594">136</a>
    from
    <a data-href="https://stackoverflow.com/questions/58101753">here</a>
  </div>
</div>
