Title: WebGL 光栅化 vs 三维库
Description: 为什么WebGL不是一个三维库，为什么这一点很重要。
TOC: WebGL 2D vs 3D 库


此文是WebGL系列文章的一个侧面话题，第一篇是[基础概念](webgl-fundamentals.html)。

我之所以写这个是因为之前说的WebGL只是一个光栅化API不是三维API，触动了一些人的神经，
我不知道我说WebGL是光栅化API时为什么会使他们感到受到威胁或者沮丧。

理论上只是视角不同，我可能会说刀是一个进食器具，有的人可能会说刀是一个工具，
但也可能有人会说刀是武器。

对于WebGL来说，我认为说它是光栅化API是很有必要的，因为你想绘制一些三维物体时，
需要大量三维数学知识。

我认为称作时三维库的东西应该帮你完成三维部分，你应该可以给它提供一些三维数据，
一些材质参数，一些光源它就会帮你画出三维场景。WebGL (和 OpenGL ES 2.0+)
都被用来绘制三维但都不符合这个描述。

举一个例子，C++ 本身不会提供“处理文字”的功能，即使文字处理器可以用C++写出来但是并不会将
C++ 称为一个“文字处理器”。同样的WebGL本身并不能绘制出三维图形，你可以写一个库帮你用WebGL
绘制三维图形，但WebGL本身并不绘制三维图形。

提供一个例子以便进一步说明，假设我们想要绘制一个三维的立方体并且要有灯光。

这是用 three.js 实现的代码

<pre class="prettyprint showlinemods">
  // 设置 WebGL.
  var c = document.querySelector("#c");
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(c.clientWidth, c.clientHeight);
  c.appendChild(renderer.domElement);

  // 创建并设置一个相机
  camera = new THREE.PerspectiveCamera(
      70, c.clientWidth / c.clientHeight, 1, 1000);
  camera.position.z = 400;
  camera.updateProjectionMatrix();

  // 创建一个场景
  scene = new THREE.Scene();

  // 创建一个立方体
  var geometry = new THREE.BoxGeometry(200, 200, 200);

  // 创建一个材质
  var material = new THREE.MeshPhongMaterial({
    ambient: 0x555555,
    color: 0x555555,
    specular: 0xffffff,
    shininess: 50,
    shading: THREE.SmoothShading
  });

  // 创建一个基于材质和几何体的格网
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // 添加两个光源
  light1 = new THREE.PointLight(0xff0040, 2, 0);
  light1.position.set(200, 100, 300);
  scene.add(light1);

  light2 = new THREE.PointLight(0x0040ff, 2, 0);
  light2.position.set(-200, 100, 300);
  scene.add(light2);
</pre>

这是显示的结果。

{{{example url="resources/three-js-cube-with-lights.html" }}}

这是使用 OpenGL (不是 ES) 实现的代码。

<pre class="prettyprint showlinemods">
  // 设置
  glViewport(0, 0, width, height);
  glMatrixMode(GL_PROJECTION);
  glLoadIdentity();
  gluPerspective(70.0, width / height, 1, 1000);
  glMatrixMode(GL_MODELVIEW);
  glLoadIdentity();

  glClearColor(0.0, 0.0, 0.0, 0.0);
  glEnable(GL_DEPTH_TEST);
  glShadeModel(GL_SMOOTH);
  glEnable(GL_LIGHTING);

  // 设置两个光源
  glEnable(GL_LIGHT0);
  glEnable(GL_LIGHT1);
  float light0_position[] = {  200, 100, 300, };
  float light1_position[] = { -200, 100, 300, };
  float light0_color[] = { 1, 0, 0.25, 1, };
  float light1_color[] = { 0, 0.25, 1, 1, };
  glLightfv(GL_LIGHT0, GL_DIFFUSE, light0_color);
  glLightfv(GL_LIGHT1, GL_DIFFUSE, light1_color);
  glLightfv(GL_LIGHT0, GL_POSITION, light0_position);
  glLightfv(GL_LIGHT1, GL_POSITION, light1_position);
...

  // 绘制一个立方体
  static int count = 0;
  ++count;

  glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
  glLoadIdentity();
  double angle = count * 0.1;
  glTranslatef(0, 0, -400);
  glRotatef(angle, 0, 1, 0);

  glBegin(GL_TRIANGLES);
  glNormal3f(0, 0, 1);
  glVertex3f(-100, -100, 100);
  glVertex3f( 100, -100, 100);
  glVertex3f(-100,  100, 100);
  glVertex3f(-100,  100, 100);
  glVertex3f( 100, -100, 100);
  glVertex3f( 100,  100, 100);

  /*
  ...
  ... 重复立方体的剩下 5 个面
  ...
  */

  glEnd();
</pre>

会发现这两个例子几乎不需要三维数学知识。相比于WebGL，我不会去写WebGL实现的代码，
代码量也不是那么多，重点也不是需要更多的代码行数，是需要大量的**知识**。
在两个三维库中它们只关心三维，你给它们相机位置和视场角，一对光源，和一个立方体，
它们就会帮你完成其他的部分，换句话说：它们是三维库。

而WebGL就需要矩阵运算，单位化坐标，视锥，叉乘，点乘，可变量插值，
高光计算和其他需要几个月甚至几年去完全理解的东西。

一个三维库关键就是内置这些知识，你不要自己去理解，你只需要依靠库帮你处理，
OpenGL就是这样的。但对于 OpenGL ES 2.0+ 或 WebGL 就不是这样的。

误将WebGL称作三维库，一个新用户用户会想“嗯，它是三维库。它可以帮我实现三维”，
然后仔细查找后发现根本不是这样。

我们甚至可以更进一步，在画布中绘制三维立方体线框。

{{{example url="resources/3d-in-canvas.html" }}}

这是使用WebGL绘制的线框。

{{{example url="resources/3d-in-webgl.html" }}}

如果你查看代码就会发现它们都需要大量的知识甚至代码去实现，
最终画布版本循环顶点，做我们提供的数学运算绘制一些二维线段。
WebGL版本除了提供的是GLSL，运行在GPU上，其它是一样的。

最后一个例子有效的说明了WebGL只是一个光栅化引擎，和 Canvas 2D 相似。
当然WebGL也有一些特性帮助你实现三维，WebGL有深度缓冲，可以让深度排序更容易。
WebGL也有多种数学方法用于三维数学运算，尽管这些本质上没有创建三维，
但它是一个数学库，可以用在一维，二维或三维上。无论如何，最终WebGL只进行光栅化。
你需要提供想要绘制内容的裁剪空间坐标，当然提供的 x,y,z,w 在渲染前会除以 w，
这也很难说明WebGL就是一个三维库。在三维库中你提供三维数据，库会计算出裁剪空间坐标。

希望这些能够让你理解，当初说WebGL时说它不是一个三维库的原因。我也希望你能知道三维库会帮你处理三维问题，
OpenGL 会，Three.js 会，OpenGL ES 2.0 和 WebGL 不会。因此理论上它们并不属于“三维库”的类别。

这些的重点是让WebGL新手理解WebGL的核心是什么。知道WebGL不是一个三维库，
并且需要自己提供所有的知识，让他们知道接下来是学三维数学知识还是选择一个三维库帮助实现，
并且还揭秘了它的工作原理。

