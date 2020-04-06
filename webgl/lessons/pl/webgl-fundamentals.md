Title: Podstawy WebGL
Description: Twoja pierwsza lekcja WebGL - podstawy
TOC: Podstawy WebGL


WebGL umożliwia wyświetlanie w czasie rzeczywistym grafiki 3D w Twojej
przeglądarce, chociaż wiele osób nie zdaje sobie sprawy, że
[WebGL aktulanie udostępnia API rasteryzacyjne, a nie API 3D](webgl-2d-vs-3d-library.html).

Pozwól mi wyjaśnić.

WebGL troszczy się tylko o dwie rzeczy: współrzędne przestrzeni obcinania (ang. _clipspace_) i kolory.
Twoim zadaniem, jako programisty korzystającego z WebGL, jest dostarczenie ich obu.
W tym celu powinieneś zadbać o dwa "cieniowania" (ang. _shaders_). Cieniowanie wierzchołkowe (ang. _vertex shader_)
zapewniające przekształcenie współrzędnych przestrzeni obcinania i cieniowanie fragmentów
(ang. _fragment / pixel shader_) pozwalające określać kolor pikseli.

Współrzędne przestrzeni obcinania zawsze przebiegają przedział od -1 do 1 bez względu na to jakiego rozmiaru
jest Twoje płótno. Poniżej jest prosty przykład pokazujący WebGL w jego najprostszej formie.

    // Pobierz kontekst WebGL
    var canvas = document.querySelector("#canvas");
    var gl = canvas.getContext("experimental-webgl");

    // skonfiguruj program GLSL
    var program = createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);
    gl.useProgram(program);

    // sprawdź pozycję wierzchołków.
    var positionLocation = gl.getAttribLocation(program, "a_position");

    // Stwórz bufor i umieść w nim pojedynczy prostokąt przestrzeni obcinania
    // (2 trójkąty)
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0]),
        gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // rysuj
    gl.drawArrays(gl.TRIANGLES, 0, 6);

Poniżej są oba cieniowania

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    void main() {
      gl_Position = vec4(a_position, 0, 1);
    }
    </script>

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    void main() {
      gl_FragColor = vec4(0, 1, 0, 1);  // zielony
    }
    </script>

To narysuje zielony prostokąt o rozmiarach cełego płótna.  Wynik jest tutaj

{{{example url="../webgl-fundamentals.html" }}}

Nic specjalnego :-p

Jeszcze raz: współrzędne przestrzeni obcinania zawsze są z zakresu od -1 do +1 niezależnie od
wymiarów płótna. Na powyższym przykładzie możesz zobaczyć, że nie zrobiliśmy nic
poza bezpośrednim wskazaniem pozycji. Ponieważ parametry pozycji są
już w przestrzeni obcinania to nie już nic do zrobienia. *Jeśli oczekujesz 3D to przygotowanie cieniowań,
które skonwertują przestrzeń 3D do przestrzeni obcinania, należy do Ciebie poniważ WebGL udostępnia API tylko
dla rasteryzacji*.

W zakresie 2D prawdopodobnie wolałbyś pracować raczej z pikselami niż przestrzenią obcinania więc
zmieńmy cieniowanie tak, żebyśmy mogli pracować z prostokątami w pikselach i mieli
zapewnioną ich konwersję do przestrzeni obcinania.  Poniżej jest nowe cieniowanie wierzchołków

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;

    void main() {
       // przeskaluj prostokąt z pikseli na odcinek od 0.0 do 1.0
       vec2 zeroToOne = a_position / u_resolution;

       // przeskaluj z odcinka 0->1 do odcinka 0->2
       vec2 zeroToTwo = zeroToOne * 2.0;

       // przesuń z odcinka 0->2 do -1->+1 (przestrzeń obcinania)
       vec2 clipSpace = zeroToTwo - 1.0;

       gl_Position = vec4(clipSpace, 0, 1);
    }
    </script>

Teraz możemy zmienić nasze dane z przestrzeni obcinania na piksele

    // ustaw rozdzielczość
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    // stwórz prostokąt o przekątnej od 10,20 do 80,30 w pikselach
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        10, 20,
        80, 20,
        10, 30,
        10, 30,
        80, 20,
        80, 30]), gl.STATIC_DRAW);

I mamy go

{{{example url="../webgl-2d-rectangle.html" }}}

Możesz zauważyć, że prostokąt jest bliżej podstawy obszaru. WebGL przyjmuje że lewy dolny
wierzchołem ma współrzędne 0,0 (uwaga tłum.: liczby zmiennopozycyjne zapisujemy w tym artykule z kropką dziesiętną,
a przecinkiem oddzielamy elementy wektora, co jest zgodne z zapisem tych wartości w kodzie programu).
Aby móc stosować zapis bardziej tradycyjny dla API grafiki 2d
poprostu odwracamy współrzędną y.

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

I teraz nasz prostokąt jest tam, gdzie go oczekujemy.

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

Stwórzmy kod definiujący prostokąt wewnątrz funkcji a
będziemy mogli wywołać funkcję dla prostokątów o różnych rozmairach.  Przy tej okazji
uczynimy kolor modyfikowalnym.

Po pierwsze zmodyfikujemy cieniowanie fragmentów by uwzględniało kolor podany na wejściu.

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    +uniform vec4 u_color;

    void main() {
    *   gl_FragColor = u_color;
    }
    </script>

A poniżej jest nowy kod rysujący 50 prostokątów w losowych miejscach i losowych kolorach.

      var colorLocation = gl.getUniformLocation(program, "u_color");
      ...
      // Stwórz bufor
      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // narysuj 50 losowych prostokątów w losowych kolorach
      for (var ii = 0; ii < 50; ++ii) {
        // Konfiguruj losowy prostokąt
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // Ustaw losowy kolor.
        gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

        // Narysuj prostokąt.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    // Zwraca losową liczbę całkowitą z przedziału od 0 do range -1.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // Wypełnia bufor wartościami definiującymi prostokąt.
    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

I poniżej mamy nasze prostokąty.

{{{example url="../webgl-2d-rectangles.html" }}}

Mam nadzieję, że zauważasz jak prostym API jest obecnie WebGL.
I chociaż może ono zostać skomplikowane dla potrzeb 3D to ta komplikacja jest
dodawana przez Ciebie, jako programistę, w formie bardziej skomplikowanego cieniowania.
Natomiast API WebGL samo w sobie jest dwuwymiarowe i całkiem proste.

Jeśli jesteś kompletnym nowicjuszem w tematch WebGL i zastanawiasz się czym jest GLSL lub cieniowania
lub co robi procesor graficzny GPU
to zapoznaj się z [podstawami tego jak WebGL naprawdę działa](webgl-how-it-works.html).

W przeciwnym razie możesz się udać w 2 kierunkach. Jeśli interesujesz się przetwarzaniem obrazów
pokażę Ci [jak zrealizować przykładowe przetwarzanie obrazów 2D](webgl-image-processing.html).
Jeśli chcesz dowiedzieć się o przesunięciach,
obrotach i skalowaniu wtedy [przejdź tu](webgl-2d-translation.html).

<div class="webgl_bottombar">
<h3>Co oznacza type="x-shader/x-vertex" i type="x-shader/x-fragment" ?</h3>
<p>
Znacznik <code>&lt;script&gt;</code> domyślnie przechowuje w swoim wnętrzu JavaScript.
Możesz nie podawać typu lub możesz go podać jako <code>type="javascript"</code> lub
<code>type="text/javascript"</code> i przeglądarka będzie interpretować
zawartość jako JavaScript. Jeśli włożysz tam coś innego przeglądarka zignoruje
zawartość znacznika script.
</p>
<p>
Możemy wykorzystać tą funkcjonalność do przechowywania cieniowania w znacznikach script. Nawet więcej,
możemy stworzyć nasz własny typ i w naszym kodzie JavaScript odwoływać się do niego i decydować
kiedy skompilować dane cieniowanie jako cieniowanie wierzchołków lub cieniowanie fragmentów.
</p>
<p>
W tym przypadku funkcja <code>createProgramFromScripts</code> szuka
skryptu o określonycj identyfikatorach i sprawdza ich atrybut <code>type</code>, żeby
zadecydoać o typie tworzonego cieniowania.
</p>
<p>
Funkcja <code>createProgramFromScripts</code> jest częścią <a href="webgl-boilerplate.html">szablonu</a>,
którego prawie każdy program WebGL potrzebuje.
</p>
</div>
