Title: Obrót dwuwymiarowy w WebGL
Description: Jak obracać w dwóch wymiarach
TOC: Obrót dwuwymiarowy w WebGL


Tekst jest kontynuacją serii poświęconej WebGL.  Pierwszy artykuł <a href="webgl-fundamentals.html">rozpoczynał od podstaw</a>, a poprzedni <a href="webgl-2d-translation.html">opisywał przesunięcia geometryczne</a>.

Przyznaję się szczerze, że nie mam pomysłu jak dobrze wyjaśnić kwestię obrotów, ale spróbuję.
<!--more-->
Na wstępie chciałbym wyjaśnić Ci, czym jest tzw. "okrąg jednostkowy". Jeśli pamiętasz jeszcze cokolwiek ze szkolnej matematyki ("Nie śpij na mnie!") to okrąg ma promień.  Promień okręgu jest odległością ze środka okręgu do krawędzi. Okrąg jednostkowy to taki, którego promień wynosi dokładnie 1.

To jest okrąg jednostkowy:

{{{diagram url="../unit-circle.html" width="300" height="300" }}}

Zauważ, że gdy ciągniesz za niebieski "uchwyt" na okręgu, to jego pozycja X i Y zmienia się.  Współrzędne reprezentują położenie punktu na okręgu.  Na górze Y wynosi 1, a X jest 0.  Po prawej stronie X wynosi 1, a Y jest 0.

Jeśli pamiętasz podstawy matematyki to mnożenie czegoś przez 1 pozostawia to coś niezmienione.  Zatem 123 * 1 = 123.  Proste, prawda?  A więc dobrze.  Okrąg jednostkowy o promieniu 1 jest także pewną formą jedynki.  On jest taką "obracającą jedynką".   Tzn. możesz pomnożyć coś przez okrąg jednostkowy i to zachowa się w sposób podobny do mnożenia przez 1 z dokładnością do tego, że rzeczy się obracają.

Będziemy mnożyć przez współrzędne X i Y punktu na okręgu jednostkowym geometrię z <a href="webgl-2d-translation.html">naszego poprzedniego przykładu</a>.

Poniżej są aktualizacje wymagane dla naszego cieniowania.

<pre class="prettyprint showlinemods">
&lt;script id="vertex-shader-2d" type="x-shader/x-vertex"&gt;
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;

void main() {
  // Obróć pozycję:
  vec2 rotatedPosition = vec2(
     a_position.x * u_rotation.y + a_position.y * u_rotation.x,
     a_position.y * u_rotation.y - a_position.x * u_rotation.x);

  // Dodaj przesunięcie:
  vec2 position = rotatedPosition + u_translation;
</pre>

Aktualizujemy również JavaScript, żebyśmy mogli przekazać te dwie wartości.

<pre class="prettyprint showlinemods">
  ...
  var rotationLocation = gl.getUniformLocation(program, "u_rotation");
  ...
  var rotation = [0, 1];
  ..
  // Narysuj scenę.
  function drawScene() {
    // Wyczyść płótno.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Ustaw przesunięcie.
    gl.uniform2fv(translationLocation, translation);

    // Ustaw obrót.
    gl.uniform2fv(rotationLocation, rotation);

    // Narysuj prostokąt.
    gl.drawArrays(gl.TRIANGLES, 0, 18);
  }
</pre>

Oto rezultat.  Przeciągaj uchwyt po okręgu w celu obrotu lub suwaki w celu przesunięcia.

{{{example url="../webgl-2d-geometry-rotation.html" }}}

Dlaczego to działa? Spójrz na te wzory.

<pre class="prettyprint showlinemods">
rotatedX = a_position.x * u_rotation.y + a_position.y * u_rotation.x;
rotatedY = a_position.y * u_rotation.y - a_position.x * u_rotation.x;
</pre>

Załóżmy, że masz prostokąt i chcesz go obracać. Zanim zaczniesz nim kręcić jego górny, prawy wierzchołek jest na pozycji 3.0, 9.0. Wybierzmy punkt na okręgu jednostkowym - 30 stopni zgodnie z ruchem wskazówek zegara od godziny 12.

<img src="../resources/rotate-30.png" class="webgl_center" />

Pozycja na okręgu wynosi wtedy 0.50 i 0.87:

<pre class="webgl_center">
   3.0 * 0.87 + 9.0 * 0.50 = 7.1
   9.0 * 0.87 - 3.0 * 0.50 = 6.3
</pre>

To jest dokładnie tam gdzie chcemy, żeby był:

<img src="../resources/rotation-drawing.svg" width="500" class="webgl_center"/>

Tak samo dla 60 stopni w kierunku ruchu wskazówek zegara:

<img src="../resources/rotate-60.png" class="webgl_center" />

Pozycja na okręgu wynosi wtedy 0.87 i 0.50:

<pre class="webgl_center">
   3.0 * 0.50 + 9.0 * 0.87 = 9.3
   9.0 * 0.50 - 3.0 * 0.87 = 1.9
</pre>

Przesuwając punkt po okręgu zgodnie z ruchem wskazówek zegara, możesz zobaczyć, że wartości X stają się większe, a wartości Y mniejsze,  Gdy przekraczasz 90 stopni wartości X zaczynają się zmniejszać, a wartości Y stają się ujemne... Tak wyłania się wzorzec objawiający się jako obrót.

Istnieje specjalna nazwa dla współrzędnych punktów z okręgu jednostkowego - sinus i cosinus. Tak więc dla dowolnego zadanego kąta możemy odszukać sinus i cosinus, jak poniżej:

<pre class="prettyprint showlinemods">
function printSineAndCosineForAnAngle(angleInDegrees) {
  var angleInRadians = angleInDegrees * Math.PI / 180;
  var s = Math.sin(angleInRadians);
  var c = Math.cos(angleInRadians);
  console.log("s = " + s + " c = " + c);
}
</pre>

Jeśli skopiujesz powyższy kod i wkleisz do konsoli JavaScript, a następnie wywołasz funkcję <code>printSineAndCosignForAngle(30)</code> zobaczysz, że to wypisze <code>s = 0.49 c= 0.87</code> (zauważ, że zaokrągliłem liczby.)

Łącząc to wszystko w całość możesz obracać swoją geometrię o dowolny kąt jakiego potrzebujesz. Po prostu podajesz jako argument funkcji sinus i cosinus kąt o jaki chcesz obrócić.

<pre class="prettyprint showlinemods">
  ...
  var angleInRadians = angleInDegrees * Math.PI / 180;
  rotation[0] = Math.sin(angleInRadians);
  rotation[1] = Math.cos(angleInRadians);
</pre>

Oto wersja, która ustawia kąt - przeciągaj suwaki, aby przesuwać i obracać.

{{{example url="../webgl-2d-geometry-rotation-angle.html" }}}

Mam nadzieję, że to ma sens. <a href="webgl-2d-scale.html">Następny temat jest prostszy. Skalowanie</a>.

<div class="webgl_bottombar"><h3>Co to są radiany?</h3>
<p>
Radiany są jednostkami miary często używanymi w dyskusjach o okręgach, obrotach i kątach. Podobnie jak możemy mierzyć odległość w metrach lub jardach, czy calach, możemy mierzyć kąty w stopniach lub radianach.
</p>
<p>
Prawdopodobnie jesteś świadom, że jednostki miar zgodne z systemem SI są prostsze niż jednostki wykorzystywane w czasach minionych.  By przeliczyć z cali na stopy dzielilibyśmy przez 12.  By przeliczyć z cali na jardy dzielilibyśmy przez 36. Nie wiem jak ty, ale ja nie potrafię dzielić przez 36 w pamięci. Jednostki układu SI są prostsze. By przejść z milimetrów na centymetry dzielimy przez 10. By przejść z milimetrów na metry dzielimy przez 1000. **Potrafię** dzielić przez 1000 w pamięci.
</p>
<p>
W przypadku radianów i stopni jest podobnie. Stopnie czynią matematykę trudną. Radiany czynią ją prostą. Istnieje 360 stopni w kącie pełnym, a tylko 2π radianów.  Pełny obrót to 2π radianów. A półobrót to 1π radianów. A ćwierćobrót to 90 stopni lub 1/2π radianów. Zatem: jeśli chcesz obrócić coś o 90 stopni po prostu użyj <code>Math.PI * 0.5</code>. Jeśli chcesz obrócić to o 45 stopni użyj <code>Math.PI * 0.25</code> etc.
</p>
<p>
Najczęściej spotykane w matematycznych dyskusjach kąty, okręgi i obroty zachowują się bardzo prosto, gdy myślisz o nich w radianach. Daj im szansę. Używaj radianów, a nie stopni; z wyjątkiem prezentacji w interfejsie użytkownika.
</p>
</div>


