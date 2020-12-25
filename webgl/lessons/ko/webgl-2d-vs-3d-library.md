Title: WebGL - Rasterization vs 3D 라이브러리
Description: 왜 WebGL은 3D 라이브러리가 아니며 그것이 중요한 이유
TOC: 2D vs 3D 라이브러리


이 포스트는 WebGL 관련 시리즈의 부수적인 주제입니다.
첫 번째는 [기초](webgl-fundamentals.html)부터 시작했는데

WebGL이 rasterization API이고 3D API가 아니라는 제 주장이 일부 사람들의 신경을 건드렸기 때문에 이걸 작성하고 있습니다.
저는 WebGL을 rasterization API라고 불렀고 왜 그들이 위협을 느끼는지 혹은 무엇이 그렇게 화나게 만드는지 모르겠습니다.

틀림없이 모든 건 관점의 문제일 겁니다.
나는 칼이 식기류라고 말할 수 있고, 다른 누군가는 칼이 도구라고 말할 수 있지만 또 다른 사람은 칼이 무기라고 말할 수 있습니다.

WebGL의 경우 rasterization API라고 부르는 게 중요하다고 생각한 이유가 있는데 구체적으로는 WebGL을 사용해 3D로 무언가를 그리기 위해 필요한 3D 수학 지식의 양 때문입니다.

저는 3D 라이브러리라고 부르는 모든 것이 당신을 위한 3D 영역을 수행해야 한다고 생각하는데요.
라이브러리에 3D 데이터, material 매개 변수, 조명을 제공할 수 있어야 하며 3D를 그릴 수 있어야 합니다.
WebGL(그리고 OpenGL ES 2.0+)은 모두 3D를 그리는데 사용되지만 이 설명에는 맞지 않습니다.

비유를 위해, C++은 기본적으로 "process word"를 하지 않습니다.
C++을 "word processor"라고 부르진 않지만 word processor가 C++로 작성될 수는 있습니다.
비슷하게 WebGL은 기본적으로 3D 그래픽을 그리지 않습니다.
WebGL로 3D 그래픽을 그리는 라이브러리를 작성할 수는 있지만 그 자체로 3D 그래픽을 수행하진 않습니다.

추가 예제 제공을 위해, 조명과 함께 3D로 큐브를 그려야한다고 가정해봅시다.

이를 표시하기 위한 three.js의 코드인데

<pre class="prettyprint showlinemods">
  // WebGL 설정
  var c = document.querySelector("#c");
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(c.clientWidth, c.clientHeight);
  c.appendChild(renderer.domElement);

  // camera 만들기 및 설정
  camera = new THREE.PerspectiveCamera(
      70, c.clientWidth / c.clientHeight, 1, 1000);
  camera.position.z = 400;
  camera.updateProjectionMatrix();

  // scene 만들기
  scene = new THREE.Scene();

  // 큐브 만들기
  var geometry = new THREE.BoxGeometry(200, 200, 200);

  // material 만들기
  var material = new THREE.MeshPhongMaterial({
    ambient: 0x555555,
    color: 0x555555,
    specular: 0xffffff,
    shininess: 50,
    shading: THREE.SmoothShading
  });

  // geometry와 material 기반의 mesh 생성
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // 조명 2개 추가
  light1 = new THREE.PointLight(0xff0040, 2, 0);
  light1.position.set(200, 100, 300);
  scene.add(light1);

  light2 = new THREE.PointLight(0x0040ff, 2, 0);
  light2.position.set(-200, 100, 300);
  scene.add(light2);
</pre>

그리고 표시되는 건 다음과 같습니다.

{{{example url="resources/three-js-cube-with-lights.html" }}}

다음은 조명 2개와 함께 큐브를 표시하는 OpenGL(ES 아님)의 유사한 코드입니다.

<pre class="prettyprint showlinemods">
  // 설정
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

  // 조명 2개 설정
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

  // 큐브 그리기
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
  ... 큐브의 다섯 면 더 반복
  ...
  */

  glEnd();
</pre>

이런 예제들 중 어느 하나 3D 수학의 지식이 거의 필요하지 않음에 주목하세요.
이걸 WebGL과 비교해봅시다.
WebGL이 필요한 코드를 작성하진 않을 겁니다.
코드는 그다지 크지 않은데요.
필요한 줄 수에 관한 게 아닙니다.
필요한 **지식**의 양에 관한 것입니다.
두 3D 라이브러리에서 3D를 처리해주는데요.
당신은 camera 위치 그리고 시야, 조명 두 개, 그리고 큐브를 제공합니다.
나머지는 그들이 모두 처리하죠.
다시 말해: 그들은 3D 라이브러리입니다.

반면에 WebGL은 행렬 수학, 정규화된 좌표, 절두체, 벡터 곱, 스칼라 곱, varying 보간, 조명 반사 계산 그리고 수개월 또는 수년이 걸리는 다른 모든 것들을 이해해야 합니다.

3D 라이브러리의 핵심은 해당 지식들이 내장되어 있어서 지식을 필요로 하지 않고, 라이브러리에 의존하여 처리할 수 있다는 점입니다.
이건 위에서 본 OpenGL 원본에 해당되는데요.
three.js와 같은 다른 3D 라이브러리도 마찬가지입니다.
OpenGL ES 2.0+ 또는 WebGL에는 해당되지 않습니다.

WebGL을 3D 라이브러리라고 부르는 건 잘못된 것 같습니다.
WebGL에 유입되는 사용자들은 "오, 3D 라이브러리다. 멋지다. 이걸로 3D를 할 수 있을 거야"라고 생각하고 아니오라는 힘든 방법을 알아내는데, 전혀 그렇지 않습니다.

우리는 한 걸음 더 나아갈 수도 있는데요.
다음은 canvas로 wireframe 큐브를 그립니다.

{{{example url="resources/3d-in-canvas.html" }}}

그리고 여기는 WebGL로 wireframe 큐브를 그립니다.

{{{example url="resources/3d-in-webgl.html" }}}

코드를 살펴보면 지식량의 측면이나 코드조차도 큰 차이가 없음을 볼 수 있습니다.
최종적으로 canvas 버전은 vertex를 반복하고, 우리가 제공한 수식을 수행하며 2D로 일부 선을 그립니다.
WebGL 버전은 우리가 제공한 수식이 GLSL에 있고 GPU에 의해 실행된다는 걸 제외하면 동일한 작업을 수행합니다.

마지막 데모의 요점은 WebGL이 Canvas 2D와 유사한, rasterization 엔진일 뿐이라는 걸 효과적으로 보여주는 겁니다.
물론 WebGL은 3D를 구현하는데 도움이 되는 기능들을 가지고 있는데요.
WebGL은 depth sorting을 훨씬 더 쉽게 만드는 depth buffer를 가지고 있습니다.
또한 3D 수학을 처리하는데 유용한 수학 함수들이 내장되어 있지만 3D로 만드는 건 없습니다.
수학 라이브러리인거죠.
수학이 1D, 2D, 3D인 것에 상관없이 수식에 사용하는데요.
하지만 궁극적으로, WebGL은 rasterization만 합니다.
그리려는 걸 나타내는 clip space 좌표를 제공해야 하죠.
물론 x,y,z,w를 제공하고 렌더링하기 전에 W로 나누지만 그건 WebGL을 3D 라이브러리로 한정하기엔 충분하지 않습니다.
3D 라이브러리에서 3D 데이터를 제공하면, 라이브러리는 3D에서 clip space point를 계산합니다.

I hope you at least understand where I'm coming from when I say WebGL is not a 3D library. => 🤔
제가 WebGL이 3D 라이브러리가 아니라고 말할 때 적어도 제가 어디서 왔는지 이해하기를 바랍니다.
<!-- TODO: 위쪽 물어보고 추가 커밋 -->
또한 3D 라이브러리는 3D를 처리해야 한다는 걸 깨달으셨길 바랍니다.
OpenGL이 그렇습니다.
Three.js가 그렇습니다.
OpenGL ES 2.0과 WebGL은 아닙니다.
Therefore they arguably don't belong in the same broad category of "3D libraries".

The point of all of this is to give a developer that is new to WebGL an understanding of WebGL at its core.
Knowing that WebGL is not a 3D library and that they have to provide all the knowledge themselves lets them know what's next for them and whether they want to pursue that 3D math knowledge or instead choose a 3D library to handle it for them.
It also removes much of the mystery of how it works.
