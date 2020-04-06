Title: 2D-перенос в WebGL
Description: Как выполнить перенос в 2D
TOC: 2D-перенос в WebGL


Прежде, чем мы перейдём к 3D, давайте ещё немного поживём в 2D-пространстве.
Прошу немного потерпеть. Возможно, некоторым эта статья покажется чрезвычайно
очевидной, но в следующих статьях я разовью идею до конечной точки.

Эта статья продолжает серию, которая начинается с [Основ WebGL](webgl-fundamentals.html).
Если вы ещё не читали предыдущие статьи, предлагаю прочесть по крайней мере первую
из них, а потом вернуться сюда.

Перенос - это причудливая математика, которая "перекладывает" что-либо.
Полагаю, что переложить текст на японский язык тоже подходит под этот
термин, но в данном случае мы говорим о перекладывании геометрии на новое
местоположение. Используя код из [первого поста](webgl-fundamentals.html)
вы можете с лёгкостью перенести прямоугольник, просто изменив значения,
переданные в setRectangle. Вот пример, основанный на
[предыдущем примере](webgl-fundamentals.html).

Для начала заведём переменные для значений переноса, ширины, высоты и
цвета прямоугольника

```
  var translation = [0, 0];
  var width = 100;
  var height = 30;
  var color = [Math.random(), Math.random(), Math.random(), 1];
```

Далее нам понадобится функция, чтобы всё перерисовывать. Мы сможем
вызывать эту функцию после изменения значения переноса.

```
  // Отрисовка сцены.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Говорим WebGL, как преобразовать координаты
    // из пространства отсечения в пиксели
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Очищаем canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Говорим использовать нашу программу (пару шейдеров)
    gl.useProgram(program);

    // Активируем атрибут
    gl.enableVertexAttribArray(positionLocation);

    // Устанавливаем буфер положений
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Задаём прямоугольник
    setRectangle(gl, translation[0], translation[1], width, height);

    // Указываем атрибуту, как получать данные от positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 компоненты на итерацию
    var type = gl.FLOAT;   // данные - 32-битные числа с плавающей точкой
    var normalize = false; // не нормализовать данные
    var stride = 0;        // 0 = перемещаться на size * sizeof(type) каждую итерацию для получения следующего положения
    var offset = 0;        // начинать с начала буфера
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset)

    // Установка разрешения
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    // Установка цвета
    gl.uniform4fv(colorLocation, color);

    // Отрисовка прямоугольника
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

В примере ниже я прикрепил пару слайдеров, которые устанавливают
`translation[0]` и `translation[1]` и вызывают `drawScene` каждый раз
при их изменении. Потяните за слайдер для переноса прямоугольника.

{{{example url="../webgl-2d-rectangle-translate.html" }}}

Отлично. Но теперь представьте, что мы хотим сделать то же самое с
объектом более сложной формы.

Скажем, мы хотим отобразить букву 'F', которая состоит из 6 треугольников:

<img src="../resources/polygon-f.svg" width="200" height="270" class="webgl_center">

Исходя из нашего текущего кода нам нужно изменить функцию `setRectangle`
примерно следующим образом:

```
// Заполняем буфер значениями, описывающими букву 'F'
function setGeometry(gl, x, y) {
  var width = 100;
  var height = 150;
  var thickness = 30;
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // вертикальный столб
          x, y,
          x + thickness, y,
          x, y + height,
          x, y + height,
          x + thickness, y,
          x + thickness, y + height,

          // верхняя перекладина
          x + thickness, y,
          x + width, y,
          x + thickness, y + thickness,
          x + thickness, y + thickness,
          x + width, y,
          x + width, y + thickness,

          // перекладина посередине
          x + thickness, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 2,
          x + thickness, y + thickness * 3,
          x + thickness, y + thickness * 3,
          x + width * 2 / 3, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 3,
      ]),
      gl.STATIC_DRAW);
}
```

Можно предугадать, что у нас возникнут большие сложности с расширяемостью.
Если мы захотим отрисовать очень сложную геометрию, состоящую из сотен тысяч
линий, нам придётся написать довольно сложный код. Кроме того, каждый раз при
отрисовке JavaScript'у придётся заново генерировать все точки.

Есть более простой способ. Нужно просто осуществлять перенос геометрии в шейдере.

Так будет выглядеть шейдер:

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform vec2 u_resolution;
+uniform vec2 u_translation;

void main() {
*   // добавляем перенос
*   vec2 position = a_position + u_translation;

   // преобразуем прямоугольник из пикселей в диапазон от 0.0 до 1.0
*   vec2 zeroToOne = position / u_resolution;
   ...
```

Код тоже немного изменится. Во-первых, нам нужно задать геометрию всего один раз.

```
// Заполняем буфер значениями, описывающими букву 'F'
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // вертикальный столб
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // верхняя перекладина
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // перекладина посередине
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90,
      ]),
      gl.STATIC_DRAW);
}
```

А затем перед отрисовкой нам нужно просто задавать необходимое значение
переноса для переменной `u_translation`.

```
  ...

+ var translationLocation = gl.getUniformLocation(
+            program, "u_translation");
  ...

  // Создаём буфер для хранения положений
  var positionBuffer = gl.createBuffer();
  // Связываем его с ARRAY_BUFFER (можно сказать, что ARRAY_BUFFER = positionBuffer).
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
+  // Помещаем в буфер нашу геометрию
+  setGeometry(gl);

  ...

  // Отрисовка сцены
  function drawScene() {

    ...

+    // Устанавливаем значение переноса
+    gl.uniform2fv(translationLocation, translation);

    // Рисуем прямоугольник
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
*    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
```

Заметьте, что `setGeometry` вызывается лишь один раз. Она более
не находится внутри `drawScene`.

И вот готовый пример. Для изменения значения переноса потяните
за слайдер.

{{{example url="../webgl-2d-geometry-translate-better.html" }}}

Теперь при отрисовке практически всё делает сам WebGL. Нам лишь необходимо
задать значение переноса и запросить отрисовку. Даже если наша геометрия
будет содержать десятки тысяч точек, основной код не изменится.

Если хотите, можете сравнить [версию, которая использует сложный JavaScript
выше для обновления всех точек](../webgl-2d-geometry-translate.html).

Надеюсь, этот пример получился не слишком очевидным. Продолжайте читать
и мы придём к намного лучшему способу для выполнения этих же действий.
В [следующей статье мы освоим поворот](webgl-2d-rotation.html).
