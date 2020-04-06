Title: Przesunięcie dwuwymiarowe w WebGL
Description: Jak przesuwać w dwóch wymiarach
TOC: PrzesuniÄcie dwuwymiarowe w WebGL


Zanim przejdziemy do trzech wymiarów zatrzymajmy się na chwilę przy dwóch wymiarach.  Pozwól mi, proszę.  Ten artykuł może wydawać się komuś nader oczywisty, ale będzie fundamentem dla kilku innych publikacji.

Tekst jest kontynuacją serii rozpoczynającej się od <a href="webgl-fundamentals.html">Podstawy WebGL</a>. Jeśli nie czytałeś go sugeruję Ci zapoznać się przynajmniej z tym pierwszym, a potem wrócić tutaj.

Dla porządku zauważmy upodobanie matematyków do nazywania przesunięcia translacją.  Nie mają oni bynajmniej wtedy na myśli przekładu zdań z języka angielskiego na japoński tylko właśnie geometryczną operację przesunięcia. Używając przykładowego kodu, którym zakończyliśmy <a href="webgl-fundamentals.html">poprzedni tekst</a>, mógłbyś łatwo przesunąć nasz prostokąt zmieniając po prostu wartości przekazywane do funkcji setRectangle, prawda?  Poniższy przykład jest oparty na <a href="webgl-fundamentals.html">poprzednim</a>.
<!--more-->
<pre class="prettyprint showlinemods">
  // Najpierw stwórzmy trochę zmiennych
  // przechowujących przesunięcie, wysokość i szerokość prostokąta
  var translation = [0, 0];
  var width = 100;
  var height = 30;

  // następnie napiszmy funkcję
  // rysującą wszystko. Możemy ją wywoływać
  // po każdej aktualizacji przesunięcia.

  // Narysuj scenę.
  function drawScene() {
    // Wyczyść płótno.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Konfiguruj prostokąt
    setRectangle(gl, translation[0], translation[1], width, height);

    // Narysuj prostokąt.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
</pre>

W poniższym przykładzie dodałem parę suwaków odpowiedzialnych za modyfikację wartości translation[0] i translation[1] oraz wywołanie funkcji drawScene za każdym razem, gdy suwaki się zmienią.  Przeciągaj suwaki, by przesuwać prostokąt.

{{{example url="../webgl-2d-rectangle-translate.html" }}}

Jak na razie wszystko idzie dobrze.  Ale wyobraźmy sobie teraz, że chcielibyśmy robić to samo z bardziej skomplikowanym kształtem.

Powiedzmy, że chcielibyśmy rysować literę 'F' składającą się z 6 trójkątów jak poniżej.

<img src="../resources/polygon-f.svg" width="200" height="270" class="webgl_center" />

Oto kod jakim musielibyśmy zastąpić dotychczasową funkcję setRectangle, by uzyskać kształt zbliżony do powyższego.

<pre class="prettyprint showlinemods">
// Wypełnia bufor wartościami definiującymi literę 'F'.
function setGeometry(gl, x, y) {
  var width = 100;
  var height = 150;
  var thickness = 30;
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // lewa kolumna
          x, y,
          x + thickness, y,
          x, y + height,
          x, y + height,
          x + thickness, y,
          x + thickness, y + height,

          // górna poprzeczka
          x + thickness, y,
          x + width, y,
          x + thickness, y + thickness,
          x + thickness, y + thickness,
          x + width, y,
          x + width, y + thickness,

          // środkowa poprzeczka
          x + thickness, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 2,
          x + thickness, y + thickness * 3,
          x + thickness, y + thickness * 3,
          x + width * 2 / 3, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 3]),
      gl.STATIC_DRAW);
}
</pre>

Mam nadzieję, że dało się zauważyć nieskalowalność obecnego podejścia.  Jeśli zechcemy narysować bardzo złożoną geometrię z setkami lub tysiącami linii będziemy musieli napisać porcję całkiem skomplikowanego kodu.  Ponadto przy każdym rysowaniu JavaScript musi przeliczyć wszystkie punkty.

Istnieje prostsza droga. Zwyczajnie wgrać tą geometrię i wykonać przesunięcie w ramach cieniowania (ang. shader).

Oto nowe cieniowanie:

<pre class="prettyprint showlinemods">
&lt;script id="vertex-shader-2d" type="x-shader/x-vertex"&gt;
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;

void main() {
   // Dodaj przesunięcie.
   vec2 position = a_position + u_translation;

   // przeskaluj prostokąt z pikseli na odcinek od 0.0 do 1.0
   vec2 zeroToOne = position / u_resolution;
   ...
</pre>

zmodyfikujemy nieco kod - np. geometrię potrzebujemy ustawić tylko raz.

<pre class="prettyprint showlinemods">
// Wypełnia bufor wartościami definiującymi literę 'F'.
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // lewa kolumna
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // górna poprzeczka
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // środkowa poprzeczka
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90,
      ]),
      gl.STATIC_DRAW);
}
</pre>

Musimy jeszcze uaktualnić wartość <code>u_translation</code> zanim narysujemy prostokąt z wymaganym przesunięciem.

<pre class="prettyprint showlinemods">
  ...
  var translationLocation = gl.getUniformLocation(
             program, "u_translation");
  ...
  // Ustaw geometrię.
  setGeometry(gl);
  ..
  // Narysuj scenę.
  function drawScene() {
    // Wyczyść płótno
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Ustaw przesunięcie
    gl.uniform2fv(translationLocation, translation);

    // Narysuj prostokąt.
    gl.drawArrays(gl.TRIANGLES, 0, 18);
  }
</pre>

Zauważ, że funkcja <code>setGeometry</code> jest wywoływana tylko raz. Nie ma już jej wywołania z wnętrza funkcji drawScene.

Poniżej jest kompletny przykład.  Poprzestawiaj suwaki jeszcze raz, by zmienić wartość przesunięcia.

{{{example url="../webgl-2d-geometry-translate-better.html" }}}

Teraz praktycznie rysujemy całość w WebGL. Wszystko co robimy to ustawienie wartości przesunięcia i żądanie odrysowania.  Nawet jeśli nasza geometria zawiera dziesiątki tysięcy punktów główny kod pozostaje bez zmian.

Jeśli chcesz możesz porównać powyższy kod z <a href="../webgl-2d-geometry-translate.html" target="_blank">wersją używającą skomplikowanego JavaScript by aktualizować wszystkie punkty</a>.

Mam nadzieję, że ten przykład nie był zbyt trywialny.  W <a href="webgl-2d-rotation.html">następnym artykule przejdziemy do obrotów</a>.


