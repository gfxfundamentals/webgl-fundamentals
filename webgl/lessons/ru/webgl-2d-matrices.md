Title: 2D-матрицы WebGL
Description: Математика матриц на простых и подробных примерах.
TOC: 2D-матрицы в WebGL


Эта статья из серии, которая начинается с [Основ WebGL](webgl-fundamentals.html),
является продолжением предыдущей [статьи о масштабировании геометрии](webgl-2d-scale.html).

В последних 3 статьях мы разобрались, как
[переносить](webgl-2d-translation.html),
[поворачивать](webgl-2d-rotation.html),
и [масштабировать](webgl-2d-scale.html) геометрию. Перенос, поворот и
масштабирование являются 'трансформациями'. Каждая из этих трансформаций
требовала внесения изменений в шейдер и шла в строго определённом порядке.
В [нашем предыдущем примере](webgl-2d-scale.html) мы сначала масштабировали,
затем поворачивали, а затем переносили. Если изменить порядок, мы получим
другой результат.

Например, вот результат масштабирования на 2, 1, поворота на 30 градусов
и переноса на 100, 0.

<img src="../resources/f-scale-rotation-translation.svg" class="webgl_center" width="400" />

А вот результат переноса на 100, 0, поворота на 30 градусов и масштабирования на 2, 1.

<img src="../resources/f-translation-rotation-scale.svg" class="webgl_center" width="400" />

Результаты абсолютно разные. Хуже того, если нам нужно достичь результата
из второго примера, нам нужен другой шейдер, в котором перенос, поворот и
масштабирование будут идти в новом порядке.

И вот одни умные люди выяснили, что можно сделать всю математику
с помощью матриц. Для 2D мы используем матрицу 3х3. Матрицу 3х3
можно представить в виде таблицы с 9 ячейками.

<link href="resources/webgl-2d-matrices.css" rel="stylesheet">
<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>2.0</td><td>3.0</td></tr><tr><td>4.0</td><td>5.0</td><td>6.0</td></tr><tr><td>7.0</td><td>8.0</td><td>9.0</td></tr></table></div>

Для вычисления нам нужно умножить положение на колонку матрицы и сложить
результаты. Наше положение имеет 2 значения - x и y, но для вычисления
нам нужно 3 значения, поэтому возьмём 1 для третьего значения.

В этом случае результатом будет

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/>
<tr><td class="glocal-right">newX&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">2.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">3.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">4.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">5.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">6.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1&nbsp;*&nbsp;</td><td>7.0</td><td>&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>8.0</td><td>&nbsp;&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>9.0</td><td>&nbsp;</td></tr></table></div>

Возможно, вы смотрите на это всё и думаете "В ЧЁМ СМЫСЛ?". Предположим,
у нас есть перенос. Назовём tx и ty значения, на которые мы хотим выполнить
перенос. Зададим соответствующую матрицу.

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>1.0</td><td>0.0</td></tr><tr><td>tx</td><td>ty</td><td>1.0</td></tr></table></div>

А теперь взгляните

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr><tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

Из курса математики вы помните, что можно игнорировать всё, что умножается
на ноль. Умножение на 1 не меняет значение, поэтому просто посмотрим на
результат.

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td></td><td>y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

Или более лаконично

<div class="webgl_center"><pre class="webgl_math">
newX = x + tx;
newY = y + ty;
</pre></div>

На extra можно не обращать внимания. Результат удивительно похож на код,
который [мы использовали в статье про 2D-перенос](webgl-2d-translation.html).

Аналогичным образом сделаем поворот. Как мы выяснили в статье про 2D-поворот, нам
нужны значения синуса и косинуса угла, на который мы хотим выполнить поворот, поэтому

<div class="webgl_center"><pre class="webgl_math">
s = Math.sin(angleToRotateInRadians);
c = Math.cos(angleToRotateInRadians);
</pre></div>

И у нас получится такая матрица

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>c</td><td>-s</td><td>0.0</td></tr><tr><td>s</td><td>c</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

Применяя матрицу, мы получим

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

Закрасим всё, что умножается на 0 или 1, и получим

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

После упрощения останется

<pre class="webgl_center">
newX = x *  c + y * s;
newY = x * -s + y * c;
</pre>

Что является точной копией формулы, которую
[мы использовали в статье про 2D-поворот](webgl-2d-rotation.html).

И, наконец, масштаб. Назовём коэффициента масштаба sx и sy.

У нас получится матрица следующего вида.

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>sx</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>sy</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

Применяя матрицу, мы получим

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

что на самом деле

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

и после упрощения

<pre class="webgl_center">
newX = x * sx;
newY = y * sy;
</pre>

Что опять-таки повторяет [формулу масштабирования из прежней статьи](webgl-2d-scale.html).

Уверен, что вы по-прежнему думаете "И что? В чём все-таки смысл?". Похоже,
что проделано много работы для того, чтобы просто повторить то, что мы
уже сделали ранее.

И именно здесь появляется магия. Так получается, что мы можем умножить
все матрицы и применить все трансформации сразу. Предположим, у нас есть
функция `m3.multiply`, которая принимает две матрицы, умножает их и
возвращает результат.

Чтобы внести ясность, напишем функции для создания матриц переноса,
поворота и масштабирования.

    var m3 = {
      translation: function(tx, ty) {
        return [
          1, 0, 0,
          0, 1, 0,
          tx, ty, 1,
        ];
      },

      rotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
          c,-s, 0,
          s, c, 0,
          0, 0, 1,
        ];
      },

      scaling: function(sx, sy) {
        return [
          sx, 0, 0,
          0, sy, 0,
          0, 0, 1,
        ];
      },
    };

Теперь внесём изменения в шейдер. Код прежнего шейдера выглядел так:

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    uniform vec2 u_rotation;
    uniform vec2 u_scale;

    void main() {
      // Масштабирование
      vec2 scaledPosition = a_position * u_scale;

      // Поворот
      vec2 rotatedPosition = vec2(
         scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
         scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

      // Перенос
      vec2 position = rotatedPosition + u_translation;
      ...

Код нового шейдера намного проще

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform mat3 u_matrix;

    void main() {
      // Умножаем координаты на матрицу
      vec2 position = (u_matrix * vec3(a_position, 1)).xy;
      ...

И вот как мы используем его в JavaScript:

      // Отрисовка сцены
      function drawScene() {

        ,,,

        // Создаём матрицы
        var translationMatrix = m3.translation(translation[0], translation[1]);
        var rotationMatrix = m3.rotation(angleInRadians);
        var scaleMatrix = m3.scaling(scale[0], scale[1]);

        // Умножаем матрицы
        var matrix = m3.multiply(translationMatrix, rotationMatrix);
        matrix = m3.multiply(matrix, scaleMatrix);

        // Передаём матрицу в шейдер
        gl.uniformMatrix3fv(matrixLocation, false, matrix);

        // Отрисовываем треугольник
        gl.drawArrays(gl.TRIANGLES, 0, 18);
      }

Вот пример использования нового кода. Слайдеры остались те же самые,
перенос, поворот и масштабирование. Но их использование в шейдере
гораздо проще.

{{{example url="../webgl-2d-geometry-matrix-transform.html" }}}

И по-прежнему вы можете недоумевать, что теперь? Не похоже на большое
преимущество. Дело ещё в том, что для изменения порядка трансформаций
нам не нужно менять код шейдера. Достаточно изменить порядок умножения
матриц.

        ...
        // Умножаем матрицы
        var matrix = m3.multiply(scaleMatrix, rotationMatrix);
        matrix = m3.multiply(matrix, translationMatrix);
        ...

И вот, что получится.

{{{example url="../webgl-2d-geometry-matrix-transform-trs.html" }}}

Такая способность матриц особенно важна в иерархической анимации, например
руки относительно тела, спутники относительно планеты вокруг солнца, или
ветви дерева. Для простого примера иерархической анимации нарисуем 'F' 5
раз, каждый раз начиная с матрицы предыдущей 'F'.

      // Отрисовка сцены
      function drawScene() {
        // Очищаем canvas
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Создаём матрицы
        var translationMatrix = m3.translation(translation[0], translation[1]);
        var rotationMatrix = m3.rotation(angleInRadians);
        var scaleMatrix = m3.scaling(scale[0], scale[1]);

        // Начальная матрица
        var matrix = m3.identity();

        for (var i = 0; i < 5; ++i) {
          // Умножаем матрицы
          matrix = m3.multiply(matrix, translationMatrix);
          matrix = m3.multiply(matrix, rotationMatrix);
          matrix = m3.multiply(matrix, scaleMatrix);

          // Передаём матрицу в шейдер
          gl.uniformMatrix3fv(matrixLocation, false, matrix);

          // Отрисовываем геометрию
          gl.drawArrays(gl.TRIANGLES, 0, 18);
        }
      }

У нас появилась новая функция `m3.identity`, которая создаёт единичную
матрицу. Единичная матрица - это матрица, которая фактически представляет
собой единицу, то есть при умножении матрицы на единичную матрицу ничего
не изменится. Прямо как

<div class="webgl_center">X * 1 = X</div>

так и

<div class="webgl_center">matrixX * identity = matrixX</div>

Вот код, создающий единичную матрицу

    var m3 = {
      identity: function() {
        return [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ];
      },

      ...

И вот наши 5 букв 'F'.

{{{example url="../webgl-2d-geometry-matrix-transform-hierarchical.html" }}}

Рассмотрим ещё один момент. В каждом рассмотренном примере 'F' поворачивалась
вокруг своего верхнего левого угла (ну за исключением примера, где мы меняли
порядок матриц). Так происходит по той причине, что вычисления всегда выполняются
относительно начала координат, а левый верхний угол буквы 'F' как раз в начале
координат (0, 0).

Но теперь, используя матрицы, мы можем задавать порядок применения
трансформаций и сместить таким образом начало координат.

        // создаём матрицу, которая переместит начало координат в центр буквы 'F'
        var moveOriginMatrix = m3.translation(-50, -75);
        ...

        // Умножаем матрицы
        var matrix = m3.multiply(translationMatrix, rotationMatrix);
        matrix = m3.multiply(matrix, scaleMatrix);
        matrix = m3.multiply(matrix, moveOriginMatrix);

Вот этот пример. Заметьте, что F вращается и масштабируется относительно своего центра.

{{{example url="../webgl-2d-geometry-matrix-transform-center-f.html" }}}

С помощью такого подхода можно указывать точку, относительно которой будет
происходить поворот и масштабирование. Теперь вы знаете, как Photoshop и Flash
задаёт точку вращения.

Теперь пойдём ещё дальше. Если вы вернётесь к первой статье про
[Основы WebGL](webgl-fundamentals.html), вы можете вспомнить код шейдера,
который конвертировал пиксели в координаты пространства отсечения:

      ...
      // преобразуем положение в пикселях к диапазону от 0.0 до 1.0
      vec2 zeroToOne = position / u_resolution;

      // преобразуем из 0->1 в 0->2
      vec2 zeroToTwo = zeroToOne * 2.0;

      // преобразуем из 0->2 в -1->+1 (пространство отсечения)
      vec2 clipSpace = zeroToTwo - 1.0;

      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

Если вы посмотрите на каждую строчку кода, первая из них, "преобразуем
положение в пикселях к диапазону от 0.0 до 1.0", - это на самом деле
масштабирование. Как и вторая. Далее идёт перенос и последняя является
тоже масштабированием Y на -1. Мы можем сделать всё то же самое через
матрицу. Мы могли бы сделать матрицу масштабирования на 1.0/resolution,
ещё одну матрицу масштабирования на 2.0, третью матрицу переноса на
-1.0,-1.0 и четвёртую матрицу масштабирования Y на -1. Затем можно было
умножить все эти матрицы, но так как вычисления здесь очень простые, мы
просто можем написать функцию, которая сразу создаёт 'проекционную'
матрицу для заданного разрешения.

    var m3 = {
      projection: function(width, height) {
        // Эта матрица переворачивает Y, чтобы 0 был наверху
        return [
          2 / width, 0, 0,
          0, -2 / height, 0,
          -1, 1, 1
        ];
      },

      ...

Теперь шейдер можно сделать ещё проще. Так будет выглядеть полностью
новый вершинный шейдер.

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform mat3 u_matrix;

    void main() {
      // Умножаем координаты на матрицу
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
    }
    </script>

В JavaScript нам нужно умножить на проекционную матрицу.

      // Отрисовка сцены
      function drawScene() {
        ...

        // Создаём матрицы
        var projectionMatrix = m3.projection(
            gl.canvas.clientWidth, gl.canvas.clientHeight);

        ...

        // Умножаем матрицы
        var matrix = m3.multiply(projectionMatrix, translationMatrix);
        matrix = m3.multiply(matrix, rotationMatrix);
        matrix = m3.multiply(matrix, scaleMatrix);

        ...
      }

Мы также удалили код установки разрешения. С этим последним изменением
мы упростили шейдер с 6-7 шагов до очень простого шейдера в 1 шаг и всё
это из-за магии матриц.

{{{example url="../webgl-2d-geometry-matrix-transform-with-projection.html" }}}

Прежде, чем мы продолжим, давайте немного упростим код. Мы можем не просто умножать
отдельно созданные матрицы, а создать соответствующие операции трансформации. Например,
мы могли бы написать следующие функции:

```
var m3 = {

  ...

  translate: function(m, tx, ty) {
    return m3.multiply(m, m3.translation(tx, ty));
  },

  rotate: function(m, angleInRadians) {
    return m3.multiply(m, m3.rotation(angleInRadians));
  },

  scale: function(m, sx, sy) {
    return m3.multiply(m, m3.scaling(sx, sy));
  },

  ...

};
```

С помощью этих функций 7 строк кода, рассмотренных выше, превратятся в 4 строки:

```
// Вычисление матриц
var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
matrix = m3.translate(matrix, translation[0], translation[1]);
matrix = m3.rotate(matrix, angleInRadians);
matrix = m3.scale(matrix, scale[0], scale[1]);
```

И вот результат

{{{example url="../webgl-2d-geometry-matrix-transform-simpler-functions.html" }}}

И последнее, что касается порядка следования матриц. В первом примере у нас было

    translation * rotation * scale

а во втором

    scale * rotation * translation

И вы видели, как они отличаются.

Если отследить весь путь преобразования матрицами, то вы начинаете с координат
пространства отсечения, и каждая матрица вносит изменение в это пространство:

Шаг 1:  матрица отсутствует (или единичная матрица)

> Мы в пространстве отсечения, координаты должны передаваться тоже в нём.

Шаг 2:  `matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight)`;

> Мы в пиксельном пространстве. Координаты должны передаваться тоже в пикселях.

Шаг 3:  `matrix = m3.translate(matrix, tx, ty);`

> Начало координат теперь в tx, ty (пространство сдвинулось)

Шаг 4:  `matrix = m3.rotate(matrix, rotationInRadians);`

> Пространство повернулось вокруг tx, ty

Шаг 5:  `matrix = m3.scale(matrix, sx, sy);`

> Повёрнутое пространство с центром в tx, ty теперь масштабируется

Затем в шейдере мы выполняем `gl_Position = matrix * position;`
и значения `position` теперь находятся в этом конечном пространстве.

Надеюсь, статья помогла снять завесу тайны с математики матриц.
Если вы хотите продолжить тему 2D, советую ознакомиться с
[WebGL 2D - DrawImage](webgl-2d-drawimage.html) и следующий за ним
[WebGL 2D - Стек матриц](webgl-2d-matrix-stack.html).

В противном случае [следуйте за мной в 3D](webgl-3d-orthographic.html).
В 3D используются те же принципы использования матриц. Я начал с 2D в
надежде упростить материал.

Также, если вы хотите стать экспертом в области матриц, рекомендую
[ознакомиться с этими замечательными видео](https://www.youtube.com/watch?v=kjBOesZCoqc&list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab).

<div class="webgl_bottombar">
<h3>Что такое <code>clientWidth</code> и <code>clientHeight</code>?</h3>
<p>До этого момента для получения размеров canvas я использовал <code>canvas.width</code> и <code>canvas.height</code>,
но немного ранее при вызове <code>m3.projection</code> я использовал <code>canvas.clientWidth</code> и <code>canvas.clientHeight</code> вместо них. Почему же?</p>

<p>Проекционные матрицы отвечают за то, как конвертировать пространство отсечения (-1 до +1 во всех измерениях)
в пиксели. Но в браузере есть 2 типа пикселей, с которыми мы работаем. Один тип - количество пикселей в самом
canvas. Например, если canvas задан следующим образом</p>
<pre class="prettyprint">
  &lt;canvas width="400" height="300"&gt;&lt;/canvas&gt;
</pre>
<p>или так</p>
<pre class="prettyprint">
  var canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
</pre>
<p>то каждый из них соответствует картинке 400 пикселей по ширине и 300 по высоте. Но этот размер не
обязательно будет совпадать с тем, как браузер отобразит canvas 400x300. За размер отвечает CSS.
Например, создадим canvas следующим образом:</p>
<pre class="prettyprint"><!>
  &lt;style&gt;
  canvas {
    width: 100vw;
    height: 100vh;
  }
  &lt;/style&gt;
  ...
  &lt;canvas width="400" height="300">&lt;/canvas&gt;
</pre>
<p>Canvas займет весь отведённый ему контейнер, а это не 400x300.</p>
<p>Рассмотрим два примера, где canvas'у задан размер 100% черз CSS, чтобы растянуть canvas на всю
страницу. Первый использует <code>canvas.width</code> и <code>canvas.height</code>. Откройте его в
новом окне и измените размер окна. Как видите, 'F' не сохраняет пропорции и искажается.</p>
{{{example url="../webgl-canvas-width-height.html" width="500" height="150" }}}
<p>Во втором примере мы используем <code>canvas.clientWidth</code> и <code>canvas.clientHeight</code>.
<code>canvas.clientWidth</code> и <code>canvas.clientHeight</code> возвращают размер canvas, который
в итоге отобразится браузером на странице, поэтому несмотря на то, что в canvas по-прежнему содержится
400x300 пикселей, 'F' будет отображаться корректно, так как соотношение сторон будет рассчитываться из
конечного размера элемента браузера.</p>
{{{example url="../webgl-canvas-clientwidth-clientheight.html" width="500" height="150" }}}
<p>Большинство приложений, допускающих менять размеры canvas, пытаются поддерживать равенство
<code>canvas.width</code> и <code>canvas.height</code> с <code>canvas.clientWidth</code> и <code>canvas.clientHeight</code>,
чтобы один пиксель canvas соответствовал одному пикселю, отображённому в браузере. Но, как мы видели
выше, это не единственное решение. Практически в любом случае использование <code>canvas.clientHeight</code>
и <code>canvas.clientWidth</code> для вычисления соотношения сторон будет более корректным с технической
точки зрения.</p>
</div>
