Title: WebGL - Rasteryzacja vs biblioteki 3D
Description: Dlaczego WebGL nie jest biblioteką 3D i jakie to ma znaczenie.
TOC: WebGL - biblioteki 2D vs 3D


Ten artykuł dotyczy nieco pobocznego wątku w stosunku do całej serii poświęconej WebGL.
Pierwszy felieton <a href="webgl-fundamentals.html">zaczynał od podstaw</a>.

Niniejszy napisałem ponieważ moim twierdzeniem, że WebGL jest API rasteryzacyjnym, a nie API 3D
wywołuję u niektórych ludzi lekkie drżenie.  Nie jestem pewien dlaczego oni czują się zagrożeni
lub poirytowani, gdy nazywam WebGL API rasteryzacyjnym.

Prawdopodobnie wszystko zależy od punktu widzenia.  Mogę powiedzieć, że nóż jest
sztućcem, ktoś inny nazwie go narzędziem, a jeszcze ktoś
orzeknie, że to broń.

Aczkolwiek myślę, że w wypadku WebGL istnieje ważny powód by
nazywać je API rasteryzacyjnym - mianowicie jest tak, w szczególności, z powodu ilości
wiedzy na temat grafiki trójwymiarowej, którą musisz posiąść, by użyć WebGL do narysowania czegokolwiek w 3D.

Uważam, że cokolwiek nazywając siebie biblioteką 3D powinno wykonywać
całość obliczeń 3D za Ciebie.  Powinieneś móc przekazać do biblioteki pewne dane 3D,
parametry materiałów, światła, a ona powinna rysować dla Ciebie w trzech wymiarach.
Zarówno WebGL jaki i OpenGL ES 2.0+ są używane do rysowania w 3D, ale żadna nie spełnia powyższego
warunku.

By posłużyć się analogią, C++ nie zapewnia funkcji "edycji tekstu" samo z siebie.
Nie nazywamy C++ "edytorem tekstu" nawet jeśli edytory tekstu mogą być
pisane w C++.  Podobnie WebGL nie rysuje grafiki 3D "prosto po wyjęciu z pudełka".
Możesz napisać bibliotekę, która będzie rysować w 3D z użyciem WebGL, ale WebGL samo z siebie
nie wspiera grafiki 3D w jakiś szczególny sposób.

Aby posłużyć się kolejnym przykładem załóżmy, że chcemy narysować kostkę 3D
uwzględniając oświetlenie.

Poniżej jest kod realizujący opisane zadanie z użyciem three.js.

<pre class="prettyprint showlinemods">
  // Skonfiguruj WebGL.
  var c = document.querySelector("#c");
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(c.clientWidth, c.clientHeight);
  c.appendChild(renderer.domElement);

  // Utwórz i skonfiguruj kamerę
  camera = new THREE.PerspectiveCamera(
      70, c.clientWidth / c.clientHeight, 1, 1000);
  camera.position.z = 400;
  camera.updateProjectionMatrix();

  // Utwórz scenę
  scene = new THREE.Scene();

  // Utwórz kostkę.
  var geometry = new THREE.BoxGeometry(200, 200, 200);

  // Utwórz materiał
  var material = new THREE.MeshPhongMaterial({
    ambient: 0x555555,
    color: 0x555555,
    specular: 0xffffff,
    shininess: 50,
    shading: THREE.SmoothShading
  });

  // Utwórz siatkę opartą o geometrię i materiał
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Dodaj 2 światła.
  light1 = new THREE.PointLight(0xff0040, 2, 0);
  light1.position.set(200, 100, 300);
  scene.add(light1);

  light2 = new THREE.PointLight(0x0040ff, 2, 0);
  light2.position.set(-200, 100, 300);
  scene.add(light2);
</pre>

i wyświetlane jest to co trzeba.

{{{example url="resources/three-js-cube-with-lights.html" }}}

Poniżej jest odpowiedni kod oparty o OpenGL (nie ES) wyświetlający kostkę i dwa źródła światła.

<pre class="prettyprint showlinemods">
  // Konfiguracja
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

  // Konfiguracja 2 świateł
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

  // Rysuj kostkę.
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
  ... powtórz dla pozostałych 5 ścian kostki
  ...
  */

  glEnd();
</pre>

Zauważ jak bardzo nie potrzebujemy większości wiedzy o matematyce trójwymiarowej w każdym z tych
przykładów. Porównaj to do WebGL.  Nie zamierzam pisać kodu
wymaganego przez WebGL.  Nie chodzi nawet o to, że byłby on wiele większy.  Nie chodzi
o ilość wymaganych linii. Chodzi o ilość wymaganej **wiedzy**.
Obie powyższe biblioteki 3D troszczyły się o kwestie trójwymiaru. Podajesz im
pozycję kamery i pola widzenia, kilka świateł i kostkę. One
zajmują się całą resztą. Innymi słowy są to właśnie biblioteki 3D.

W WebGL jest inaczej - musisz znać algebrę macierzy, normalizację
współrzędnych, obcinanie, iloczyny wektorowe i skalarne, interpolację, obliczanie lustrzanych
odbić i wiele innych zagadnień, których pełne zrozumienie często wymaga miesięcy
lub lat.

Kluczową cechą, jaką musi posiadać biblioteka 3D, jest właśnie wbudowanie w nią tej wiedzy dzięki czemu Ty sam
nie będziesz jej już bezpośrednio potrzebował, mogąc zamiast tego po prostu polegać, że biblioteka
załatwi te sprawy dla Ciebie.  Było to prawdą na temat pierwotnego OpenGL jak pokazano powyżej.
Jest to prawdą o innych bibliotekach 3D podobnych to three.js.  Jednak NIE jest to prawdą ani o OpenGL
ES 2.0+ ani o WebGL.

Nazywanie WebGL biblioteką 3D wydaje się mylące.  Użytkownik słysząc tą błędną opinię
pomyśli "O, biblioteka 3D.  Świetnie.  Załatwi dla mnie kwestie 3D" i wtedy odkryje
twardą prawdę, że to nie jest to czego szukał.

Możemy nawet wykonać jeden krok dalej.  Poniżej jest program rysujący szkielet kostki 3D
w oparciu o Canvas (Płótno z HTML 5 - przyp. tłum.).

{{{example url="resources/3d-in-canvas.html" }}}

A tu jest analogiczna aplikacja kreśląca szkielet kostki w oparciu o WebGL.

{{{example url="resources/3d-in-webgl.html" }}}

Jeśli zajrzysz do kodu to zobaczysz, że nie ma tam jakiegoś nawału różnic mierzonych ilością
wiedzy potrzebnej do jego napisania.  Ostatecznie
sposób przetwarzania wierzchołków w przypadku wykorzystania Płótna HTML5, opiera się o obliczenia, które SAMI IMPLEMENTUJEMY,
by narysować linie w 2D. W przypadku wykorzystania WebGL robimy prawie to samo, z dokładnością to tego, że obliczenia
SAMI IMPLEMENTUJEMY tym razem w GLSL i wykonujemy na GPU.

Kluczowe w tym ostatnim przykładzie jest pokazanie, że efektywnie WebGL jest
po prostu silnikiem rasteryzacyjnym podobnym do dwuwymiarowego Płótna HTML5. Oczywiście
WebGL ma cechy, które pomogą Ci w implementacji grafiki 3D.  WebGL posiada bufor głębokości,
który dalece ułatwia sortowanie wg głębokości, zwłaszcza w porównaniu do systemu pozbawionego takiej funkcjonalności.  WebGL
dostarcza również różnych, wbudowanych weń funkcji matematycznych bardzo użytecznych podczas obliczeń 3D
jakkolwiek prawdopodobnie nie ma wśród nich niczego co uzasadniałoby nazwanie WebGL biblioteką 3D.
Funkcje te są biblioteką matematyczną, z której możesz korzystać do obliczeń w jednym, dwóch i trzech wymiarach.
Ostatecznie WebGL tylko rasteryzuje. Ty musisz dostarczyć jej reprezentacji tego co chcesz narysować
we współrzędnych przestrzeni wycinania.

W bibliotekach 3D
dostarczasz dane 3D i te biblioteki same troszczą się o wyliczenie punktów w przestrzeni wycinania na podstawie 3D.

Mam nadzieję, że przynajmniej rozumiesz mój punkt widzenia, gdy mówię, że WebGL nie jest
biblioteką 3D. Mam również nadzieję, że masz wyobrażenie, że biblioteka 3D powinna
wyręczać Cię w obsłudze 3D. Robi to OpenGL i robi to Three.js.  Ale nie OpenGL ES 2.0 ani nie WebGL.
Dlatego zasadnym jest nie zaliczanie ich do tej samej, szerokiej kategorii
"bibliotek 3D".

Kluczowym celem tego wszystkiego jest danie początkującemu w zakresie WebGL programiście
wyobrażenia, czym jest WebGL w jego istocie. Zrozumienia, że WebGL nie jest
biblioteką 3D i, że trzeba samodzielnie dostarczyć jej całej wiedzy
o obliczeniach 3D zamiast wybrać bibliotekę 3D i powierzyć jej tą odpowiedzialność.
To pozbawia WebGL większości tajemniczości i pokazuje jak ono działa.

