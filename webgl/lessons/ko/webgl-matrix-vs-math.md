Title: WebGL 행렬 vs 수학 행렬
Description: WebGL 규칙과 수학 규칙의 차이점
TOC: WebGL 행렬 vs 수학 행렬


이 글은 행렬을 이야기하는 다양한 글, 특히 [행렬을 소개하는 글](webgl-2d-matrices.html)뿐만 아니라 [3D를 소개하는 글](webgl-3d-orthographic.html), [perspective projection에 관한 글](webgl-3d-perspective.html), [카메라에 관한 글](webgl-3d-camera.html)과는 별개입니다.

프로그래밍에서는 일반적으로 행은 좌에서 우로 이동하고, 열은 위아래로 이동합니다.

> ## col·umn
> /ˈkäləm/
>
> *명사*
> 1. 일반적으로 원통형이고 돌이나 콘크리트로 만들어진 수직 기둥으로, 엔태블러처, 아치, 또는 기타 구조물을 지지하거나 기념비로써 홀로 서 있습니다.
>
>    *동의어*:	pillar, post, pole, upright, vertical, ...
>
> 2. 페이지나 텍스트의 수직 분할.

> ## row
> /rō/
>
> *명사*
> * 테이블에 있는 항목들의 수평선.

소프트웨어에서 예시를 볼 수 있습니다.
예를 들어 제 텍스트 에디터는 줄과 열을 표시하는데, 열은 이미 사용되었기 때문에 이 경우 줄은 행의 다른 단어입니다.

<div class="webgl_center"><img src="resources/editor-lines-and-columns.gif" class="gman-border-bshadow" style="width: 372px;"></div>

왼쪽 하단 영역에 있는 상태 바가 줄과 열을 표시합니다.

스프레드시트 소프트웨어에서는 행이 가로로 진행하고

<div class="webgl_center"><img src="resources/spreadsheet-row.png" style="width: 808px; filter: brightness(0.9);" class="nobg"></div>

열은 아래로 진행합니다.

<div class="webgl_center"><img src="resources/spreadsheet-column.png" style="width: 808px; filter: brightness(0.9);" class="nobg"></div>

따라서, javascript에서 WebGL용 3x3 혹은 4x4 행렬을 만들 때 이렇게 만들어야 하는데

```js
const m3x3 = [
  0, 1, 2,  // 행 0
  3, 4, 5,  // 행 1
  6, 7, 8,  // 행 2
];

const m4x4 = [
   0,  1,  2,  3,  // 행 0 
   4,  5,  6,  7,  // 행 1
   8,  9, 10, 11,  // 행 2
  12, 13, 14, 15,  // 행 3
];
```

위 규칙에 따라 `m3x3`의 첫 행은 `0, 1, 2`이고 `m4x4`의 마지막 행은 `12, 13, 14, 15`입니다.

아주 표준적인 WebGL 3x3 2D translation 행렬을 만드는 [행렬에 관한 첫 번째 글](webgl-2d-matrices.html)에서 볼 수 있듯이 translation 값 `tx`와 `ty`는 6과 7에 위치하고 있습니다.

```js
const some3x3TranslationMatrix = [
   1,  0,  0,
   0,  1,  0,
  tx, ty,  1,
];
```

[3D에 관한 첫 번째 글](webgl-3d-orthographic.html)에서 소개된 4x4 행렬의 경우 translation은 12, 13, 14에 위치합니다.

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  0,
   0,  1,  0,  0,
   0,  0,  1,  0,
  tx, ty, tz,  1,
];
```

하지만 한 가지 문제가 있습니다.
행렬 수학에 대한 수학 규칙은 일반적으로 열에서 작업을 수행합니다.
수학자는 다음과 같이 3x3 translation 행렬을 작성할 겁니다.

<div class="webgl_center"><img src="resources/3x3-math-translation-matrix.svg" style="width: 120px;"></div>

그리고 4x4 translation 행렬은 이렇게 되겠죠.

<div class="webgl_center"><img src="resources/4x4-math-translation-matrix.svg" style="width: 150px;"></div>

이건 우리에게 한 가지 문제를 남기는데요.
행렬을 수학 행렬처럼 보이게 하려면 4x4 행렬을 이렇게 작성하여 해결할 수 있습니다.

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  tx,
   0,  1,  0,  ty,
   0,  0,  1,  tx,
   0,  0,  0,  1,
];
```

불행히도 이렇게 하는 건 문제가 있습니다.
[카메라에 관한 글](webgl-3d-camera.html)에서 언급했듯이 4x4 행렬의 각 열은 의미를 가집니다.

첫 번째, 두 번째, 세 번째 열들은 각각 x, y, z 축으로 간주되며 마지막 열은 position이나 translation입니다.

한 가지 문제는 코드에서 이런 부분을 개별적으로 가져오는 게 재미없다는 겁니다.
Z축을 원한다면?
이렇게 하셔야 합니다.

```js
const zAxis = [
  some4x4Matrix[2],
  some4x4Matrix[6],
  some4x4Matrix[10],
];
```

으악!

따라서, WebGL과 WebGL의 기반이 된 OpenGL ES에서 이를 해결 하는 방법은 행을 "열"이라고 부르는 겁니다.

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  0,   // 이건 열 0
   0,  1,  0,  0,   // 이건 열 1
   0,  0,  1,  0,   // 이건 열 2
  tx, ty, tz,  1,   // 이건 열 3
];
```

이제 수학 정의와 일치합니다.
위의 예제와 비교하여, Z축을 원한다면 해야할 일은

```js
const zAxis = some4x4Matrix.slice(8, 11);
```

C++에 익숙한 사용자들을 위해, OpenGL 자체는 4x4 행렬의 16개의 값이 메모리에서 연속되어야 하므로, C++에서는 `Vec4` 구조체나 클래스를 만들 수 있고

```c++
// C++
struct Vec4 {
  float x;
  float y;
  float z;
  float w;
};
```

`Vec4` 4개로 4x4 행렬을 만들 수 있으며

```c++
// C++
struct Mat4x4 {
  Vec4 x_axis;
  Vec4 y_axis;
  Vec4 z_axis;
  Vec4 translation;
}
```

혹은 그냥

```c++
// C++
struct Mat4x4 {
  Vec4 column[4];
}
```

그리고 이건 작동하는 것처럼 보일 겁니다.

안타깝지만 실제로 코드에서 정적으로 선언하면 수학 버전과는 달라 보입니다.

```C++
// C++
Mat4x4 someTranslationMatrix = {
  {  1,  0,  0,  0, },
  {  0,  1,  0,  0, },
  {  0,  0,  1,  0, },
  { tx, ty, tz,  1, },
};
```

혹은 일반적으로 C++ 구조체같은 것이 없는 JavaScript로 돌아갑니다.

```js
const someTranslationMatrix = [
   1,  0,  0,  0,
   0,  1,  0,  0,
   0,  0,  1,  0,
  tx, ty, tz,  1,
];
```

따라서, 행을 "열"이라고 부르는 규칙으로 인해 어떤 것은 더 간단해지지만 수학 전문가라면 더 혼란스러워질 수 있습니다.

이 글은 수학 전문가가 아닌 프로그래머의 관점으로 작성되었기 때문에 모든 방법을 가져왔습니다.
즉 2차원 배열로 취급되는 다른 모든 1차원 배열처럼 행이 교차합니다.

```js
const someTranslationMatrix = [
   1,  0,  0,  0,  // 행 0
   0,  1,  0,  0,  // 행 1
   0,  0,  1,  0,  // 행 2
  tx, ty, tz,  1,  // 행 3
];
```

이런 식으로

```js
// 행복한 얼굴 이미지
const dataFor7x8OneChannelImage = [
    0, 255, 255, 255, 255, 255,   0,  // 행 0
  255,   0,   0,   0,   0,   0, 255,  // 행 1
  255,   0, 255,   0, 255,   0, 255,  // 행 2
  255,   0,   0,   0,   0,   0, 255,  // 행 3
  255,   0, 255,   0, 255,   0, 255,  // 행 4
  255,   0, 255, 255, 255,   0, 255,  // 행 5
  255,   0,   0,   0,   0,   0, 255,  // 행 6
    0, 255, 255, 255, 255, 255,   0,  // 행 7
]
```

따라서 이 글들에서는 행으로 부를 겁니다.

수학 전문가라면 혼란스러울 수 있습니다.
해결법이 없어서 죄송합니다.
행 3을 열이라고 부를 수도 있지만 일치하는 다른 프로그래밍이 없기 때문에 혼란스러울 겁니다.

어찌됐든, 왜 수학 책처럼 보이는 설명이 없는지를 명확히 하는데 도움이 되셨기를 바랍니다.
대신에 이들은 코드처럼 보이고 코드의 규칙을 사용합니다.
무슨 일이 일어나는지 설명하는데 도움이 되고 수학 규칙에 익숙한 분들에게는 너무 혼랍스럽지 않기를 바랍니다.

