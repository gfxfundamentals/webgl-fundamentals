Title: Shaders: How to draw 3D point verts without generating geometry?
Description:
TOC: qna

# Question:

I have a 3D Webgl scene. I am using Regl http://regl.party/ . Which is WebGL. So I am essentially writing straight GLSL.

This is a game project. I have an array of 3D positions [[x,y,z] ...] which are bullets, or projectiles. I want to draw these bullets as a simple cube, sphere, or particle. No requirement on the appearance.

How can I make shaders and a draw call for this without having to create a repeated duplicate set of geometry for the bullets?

Preferring an answer with a vert and frag shader example that demonstrates the expected data input and can be reverse engineered to handle the CPU binding layer



# Answer

You create an regl command which encapsulates a bunch of data. You can then call it with an object.

Each uniform can take an optional function to supply its value. That function is passed a regl context as the first argument and then the object you passed as the second argument so you can call it multiple times with a different object to draw the same thing (same vertices, same shader) somewhere else.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var regl = createREGL()

    const objects = [];
    const numObjects = 100;
    for (let i = 0; i < numObjects; ++i) {
      objects.push({
        x: rand(-1, 1),
        y: rand(-1, 1),
        speed: rand(.5, 1.5),
        direction: rand(0, Math.PI * 2),
        color: [rand(0, 1), rand(0, 1), rand(0, 1), 1],
      });
    }

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    const starPositions = [[0, 0, 0]];
    const starElements = [];
    const numPoints = 5;
    for (let i = 0; i < numPoints; ++i) {
      for (let j = 0; j < 2; ++j) {
        const a = (i * 2 + j) / (numPoints * 2) * Math.PI * 2;
        const r = 0.5 + j * 0.5;
        starPositions.push([
          Math.sin(a) * r,
          Math.cos(a) * r,
          0,
        ]);
      }
      starElements.push([
        0, 1 + i * 2, 1 + i * 2 + 1,
      ]);
    }

    const drawStar = regl({
      frag: `
      precision mediump float;
      uniform vec4 color;
      void main () {
        gl_FragColor = color;
      }`,
      vert: `
      precision mediump float;
      attribute vec3 position;
      uniform mat4 mat;
      void main() {
        gl_Position = mat * vec4(position, 1);
      }`,
      attributes: {
        position: starPositions,
      },
      elements: starElements,
      uniforms: {
        mat: (ctx, props) => {
          const {viewportWidth, viewportHeight} = ctx;
          const {x, y} = props;
          const aspect = viewportWidth / viewportHeight;
          return [.1 / aspect, 0, 0, 0,
                  0, .1, 0, 0,
                  0, 0, 0, 0,
                  x, y, 0, 1];
        },
        color: (ctx, props) => props.color,
      }
    })

    regl.frame(function () {
      regl.clear({
        color: [0, 0, 0, 1]
      });
      objects.forEach((o) => {
        o.direction += rand(-0.1, 0.1);
        o.x += Math.cos(o.direction) * o.speed * 0.01;
        o.y += Math.sin(o.direction) * o.speed * 0.01;
        o.x  = (o.x + 3) % 2 - 1;
        o.y  = (o.y + 3) % 2 - 1;
        drawStar(o);
      });
    })

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/regl/1.3.11/regl.min.js"></script>

<!-- end snippet -->


