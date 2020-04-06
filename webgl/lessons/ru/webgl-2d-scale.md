Title: 2D-масштабирование в WebGL
Description: Как выполнить масштабирование в 2D
TOC: 2D-масштабирование в WebGL


Эта статья из серии, которая начинается с [Основ WebGL](webgl-fundamentals.html),
является продолжением предыдущей [статьи о повороте геометрии](webgl-2d-rotation.html).

Масштабирование не сложнее [переноса](webgl-2d-translation.html).

Мы умножаем координату на заданный масштаб. Взглянем на изменения по
сравнению с [предыдущей статьёй](webgl-2d-rotation.html).

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
+uniform vec2 u_scale;

void main() {
+  // Масштабирование
+  vec2 scaledPosition = a_position * u_scale;

  // Поворот
  vec2 rotatedPosition = vec2(
*     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
*     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // Перенос
  vec2 position = rotatedPosition + u_translation;
```

Ещё нам нужно добавить код JavaScript для установки масштаба при отрисовке.

```
  ...

+  var scaleLocation = gl.getUniformLocation(program, "u_scale");

  ...

+  var scale = [1, 1];

  ...

  // Отрисовка сцены
  function drawScene() {

    ...

    // Задаём перенос
    gl.uniform2fv(translationLocation, translation);

    // Задаём вращение
    gl.uniform2fv(rotationLocation, rotation);

+    // Задаём масштаб
+    gl.uniform2fv(scaleLocation, scale);

    // Отрисовываем геометрию
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;  // буква 'F' из 6 треугольников, 3 точки на треугольник
    gl.drawArrays(primitiveType, offset, count);
  }
```

Теперь у нас есть масштабирование. Потяните за слайдеры.

{{{example url="../webgl-2d-geometry-scale.html" }}}

Обратите внимание, что масштабирование на отрицательное значение
переворачивает геометрию.

Надеюсь, что последние 3 статьи помогли в понимании магии
[переноса](webgl-2d-translation.html),
[поворота](webgl-2d-rotation.html) и масштабирования. Далее мы рассмотрим,
как [выполнить всю эту магию с помощью матриц](webgl-2d-matrices.html),
где объединим все три трансформации в более практичную и распространённую форму.

<div class="webgl_bottombar">
<h3>Почему мы используем букву 'F'?</h3>
<p>
Первый раз я увидел применение 'F' на текстуре. Сама по себе 'F' не является
чем-то особенным. Особенным является то, что вы всегда можете увидеть, куда
она направлена. При использовании сердец ❤ или треугольников △ для наших
примеров мы бы не смогли понять, перевёрнуты они по горизонтали или нет.
С окружностью всё ещё хуже. Цветной прямоугольник с разными цветами для разных
вершин отображал бы все модификации, но пришлось бы запоминать, какой цвет за
какой угол отвечает. В случае с буквой F всё сразу же понятно.
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
Подойдёт любой объект, по которому легко можно сказать его ориентацию. Просто
'F' - первое, что пришло мне в голову, когда я задумался о фигуре для трансформаций.
</p>
</div>
