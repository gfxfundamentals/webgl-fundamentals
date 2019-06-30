Title: WebGL 2D - стек матриц
Description: Реализация функции canvas для переноса/поворота/масштабирования на WebGL
TOC: WebGL 2D - Стек матриц


Эта статья продолжает статью о [функции DrawImage в WebGL](webgl-2d-drawimage.html).
Если вы её ещё не читали, рекомендую [ознакомиться сначала с ней](webgl-2d-drawimage.html).

В предыдущей статье мы реализовали аналог 2D-фукнции canvas `drawImage`,
включая возможность указания обрезающего прямоугольника как исходного
изображения, так и конечного.

У нас впереди реализация функций поворота и/или масштабирования из любой
произвольной точки. Мы могли бы добавить больше аргументов в прошлую
функцию - как минимум, для указания центральной точки, величины вращения,
а также масштабирования по x и y. К счастью, есть более распространённый
и удобный способ. API-функции 2D-canvas используют для этих целей стек
матриц. Функциями стека матриц Canvas 2D API являются `save`, `restore`,
`translate`, `rotate` и `scale`.

Реализовать стек матриц довольно просто. Нам просто нужно сделать стек,
состоящий из матриц. Мы сделаем функции для умножения верхней матрицы из
стека на матрицу переноса, поворота или масштабирования, используя
[функции, которые мы создали ранее](webgl-2d-matrices.html).


Далее идёт реализация.

Сначала конструктор и функции `save` и `restore`.

```
function MatrixStack() {
  this.stack = [];

  // стек пуст, поэтому просто поместим в него начальную матрицу
  this.restore();
}

// выталкиваем верхний элемент стека и переключаемся на ранее сохранённую матрицу
MatrixStack.prototype.restore = function() {
  this.stack.pop();
  // не позволяем стеку быть абсолютно пустым
  if (this.stack.length < 1) {
    this.stack[0] = m4.identity();
  }
};

// помещаем копию текущей матрицы в стек
MatrixStack.prototype.save = function() {
  this.stack.push(this.getCurrentMatrix());
};
```

Также нам понадобятся функции для получения и установки верхней матрицы.

```
// получаем копию текущей матрицы (верхушки стека)
MatrixStack.prototype.getCurrentMatrix = function() {
  return this.stack[this.stack.length - 1].slice();
};

// делаем возможным задавать текущую матрицу
MatrixStack.prototype.setCurrentMatrix = function(m) {
  return this.stack[this.stack.length - 1] = m;
};

```

Наконец, нам нужно реализовать функции `translate`, `rotate` и `scale`,
используя наши предыдущие функции матриц.

```
// перенос текущей матрицы
MatrixStack.prototype.translate = function(x, y, z) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.translate(m, x, y, z));
};

// поворот текущей матрицы вокруг Z
MatrixStack.prototype.rotateZ = function(angleInRadians) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.zRotate(m, angleInRadians));
};

// масштабирование текущей матрицы
MatrixStack.prototype.scale = function(x, y, z) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.scale(m, x, y, z));
};
```

Обратите внимание, что мы используем математику функций для 3D. Мы могли
бы использовать `0` для `z` при переносе и `1` для `z` при масштабировании,
но я привык к 2d-функциям canvas и часто забывал указывать `z`, что приводило
к ошибкам в коде. Поэтому давайте сделаем `z` опциональным параметром.

```
// перенос текущей матрицы
MatrixStack.prototype.translate = function(x, y, z) {
+  if (z === undefined) {
+    z = 0;
+  }
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.translate(m, x, y, z));
};

...

// масштабирование текущей матрицы
MatrixStack.prototype.scale = function(x, y, z) {
+  if (z === undefined) {
+    z = 1;
+  }
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.scale(m, x, y, z));
};
```

Теперь, используя функцию [`drawImage` из предыдущей статьи](webgl-2d-drawimage.html),
мы получим следующий код

```
// матрица для конвертации из пикселей в пространство отсечения
var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

// матрица переноса квадранта в координаты dstX, dstY
matrix = m4.translate(matrix, dstX, dstY, 0);

// эта матрица растянет наш единичный квадрант
// до размеров texWidth, texHeight
matrix = m4.scale(matrix, dstWidth, dstHeight, 1);
```

Нам нужно просто создать стек матриц

```
var matrixStack = new MatrixStack();
```

и умножить матрицу на текущую матрицу стека

```
// матрица для конвертации из пикселей в пространство отсечения
var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

+// эта матрица сместит начало координат в положение,
+// заданное в текущей матрице стека
+matrix = m4.multiply(matrix, matrixStack.getCurrentMatrix());

// матрица переноса квадранта в координаты dstX, dstY
matrix = m4.translate(matrix, dstX, dstY, 0);

// эта матрица растянет наш единичный квадрант
// до размеров texWidth, texHeight
matrix = m4.scale(matrix, dstWidth, dstHeight, 1);
```

И теперь мы можем использовать функцию так же, как мы бы использовали
её с помощью функций из Canvas 2D API.

Если вам неизвестно, как использовать стек матриц, вы можете представить,
что это способ смещения направленности и начала координат. Например, в canvas 2D
начало координат (0,0) находится в левом верхнем углу.

Если мы, к примеру, переместим начало координат в центр canvas, а затем
отрисуем изображение в 0,0, то изображение отрисуется в центре canvas.

Возьмём [наш предыдущий пример](webgl-2d-drawimage.html) и нарисуем
одно изображение.

```
var textureInfo = loadImageAndCreateTextureInfo('resources/star.jpg');

function draw(time) {
  gl.clear(gl.COLOR_BUFFER_BIT);

  matrixStack.save();
  matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
  matrixStack.rotateZ(time);

  drawImage(
    textureInfo.texture,
    textureInfo.width,
    textureInfo.height,
    0, 0);

  matrixStack.restore();
}
```

Вот, что у нас получится.

{{{example url="../webgl-2d-matrixstack-01.html" }}}

Как вы видите, несмотря на передачу `0, 0` в функцию `drawImage`,
изображение отрисовывается и вращается вокруг центра canvas, так как
мы использовали `matrixStack.translate` для смещения начала координат.

Сместим центр вращения в центр изображения.

```
matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
matrixStack.rotateZ(time);
+matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
```

И теперь вращение происходит вокруг центра изображения в центре canvas.

{{{example url="../webgl-2d-matrixstack-02.html" }}}

Добавим ещё таких же изображений в углах, каждое со своим вращением.

```
matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
matrixStack.rotateZ(time);

+matrixStack.save();
+{
+  matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // мы в центре изображения посередине, переместимся в верхний левый угол
+  matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
+  matrixStack.rotateZ(Math.sin(time * 2.2));
+  matrixStack.scale(0.2, 0.2);
+  // теперь нам нужно в нижний правый угол изображения, которое будем рисовать
+  matrixStack.translate(-textureInfo.width, -textureInfo.height);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // мы в центре изображения посередине, переместимся в верхний правый угол
+  matrixStack.translate(textureInfo.width / 2, textureInfo.height / -2);
+  matrixStack.rotateZ(Math.sin(time * 2.3));
+  matrixStack.scale(0.2, 0.2);
+  // теперь нам нужно в нижний левый угол изображения, которое будем рисовать
+  matrixStack.translate(0, -textureInfo.height);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // мы в центре изображения посередине, переместимся в нижний левый угол
+  matrixStack.translate(textureInfo.width / -2, textureInfo.height / 2);
+  matrixStack.rotateZ(Math.sin(time * 2.4));
+  matrixStack.scale(0.2, 0.2);
+  // теперь нам нужно в верхний правый угол изображения, которое будем рисовать
+  matrixStack.translate(-textureInfo.width, 0);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // мы в центре изображения посередине, переместимся в нижний правый угол
+  matrixStack.translate(textureInfo.width / 2, textureInfo.height / 2);
+  matrixStack.rotateZ(Math.sin(time * 2.5));
+  matrixStack.scale(0.2, 0.2);
+  // теперь нам нужно в верхний левый угол изображения, которое будем рисовать
+  matrixStack.translate(0, 0);  // 0,0 означает, что эта строчка фактически ни на что не влияет
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
```

И вот результат

{{{example url="../webgl-2d-matrixstack-03.html" }}}

Можно сказать, различные функции стека матриц, такие как `translate`,
`rotateZ` и `scale`, смещают начало координат, в то время как установка
центра поворота - это *место, куда нужно сместить начало координат,
чтобы при вызове drawImage определённая часть изображения была бы
**в** предыдущем центре координат*.

Другими словами, если canvas имеет размер 400x300, то мы вызываем
`matrixStack.translate(220, 150)`. В этом случае начало координат
будет находиться в точке 220,150, и вся отрисовка будет происходить
относительно этой точки. Если мы вызовем `drawImage` в координатах
`0, 0`, то изображение отрисуется со смещением.

<img class="webgl_center" width="400" src="resources/matrixstack-before.svg" />

Скажем, нам нужно, чтобы центр поворота был в нижнем правом углу. В этом
случае куда нам нужно сместить начало координат, чтобы при вызове `drawImage`
нужная нам точка центра поворота оказалась в текущем начале координат? Для
нижнего правого угла текстуры это будет `-textureWidth, -textureHeight`,
поэтому сейчас при вызове `drawImage` с параметром `0,0` нижний правый угол
текстуры окажется в предыдущем начале координат.

<img class="webgl_center" width="400" src="resources/matrixstack-after.svg" />

Что бы ни происходило до этого со стеком матриц, это не важно. Мы выполняли
перемещение, масштабирование и поворот начала координат, но прямо перед
вызовом `drawImage` не имеет значения, где находится центр координат. Это
уже новый центр координат, поэтому нам просто нужно определить, куда сместить
центр относительно места отрисовки текстуры, как-будто до этого со стеком
ничего не было.

Вы могли заметить, что стек матриц очень похож на [граф сцены, который
мы рассмотрели ранее](webgl-scene-graph.html). Граф сцены содержит дерево,
при обходе которого мы умножали каждый узел на родительский узел. Стек
матриц - фактически иная версия того же самого процесса.
