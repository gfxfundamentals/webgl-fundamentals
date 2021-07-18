Title: WebGL 점, 선, 삼각형
Description: 점, 선, 삼각형 그리기에 대한 세부 사항
TOC: 점, 선, 삼각형


이 사이트의 대부분은 삼각형으로 모든 걸 그립니다.
이건 WebGL program의 99%가 하는 일반적인 일인데요.
하지만 완벽을 기하기 위해 몇 가지 다른 경우를 살펴 봅시다.

[첫 번째 글](webgl-fundamentals.html)에서 언급했듯이 WebGL은 점, 선, 그리고 삼각형을 그립니다.
`gl.drawArrays`나 `gl.drawElements`를 호출할 때 이를 수행하는데요.
Clip space 좌표를 출력하는 vertex shader를 제공한 다음, `gl.drawArrays`나 `gl.drawElements`의 첫 번째 전달인자를 기반으로 WebGL은 점, 선, 또는 삼각형을 그립니다.

`gl.drawArrays`와 `gl.drawElements`의 첫 번째 전달인자로 유효한 값들은

* `POINTS`

   Vertex shader가 출력하는 각 clip space 정점에 대해 해당 점의 중앙에 정사각형을 그립니다.
   정사각형의 크기는 vertex shader 내부의 특별 변수 `gl_PointSize`에 픽셀 단위로 원하는 크기를 설정하여 지정합니다.

   참고: 정사각형이 될 수 있는 최대 및 최소 크기는 쿼리할 수 있는 구현에 따라 다릅니다.

        const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);

   [여기](webgl-drawing-without-data.html#pointsissues)에서 다른 문제도 확인하세요.

* `LINES`

   Vertex shader가 출력하는 2개의 clip space 정점에 대해 두 점을 연결하는 선을 그립니다.
   점 A,B,C,D,E,F가 있다면 3개의 선이 표시됩니다.

   <div class="webgl_center"><img src="resources/gl-lines.svg" style="width: 400px;"></div>
   
   명세서에 따르면 `gl.lineWidth`를 호출하고 픽셀 단위로 너비를 지정하여 선의 두께를 설정할 수 있습니다.
   실제 최대 너비는 구현에 따라 다르지만 대부분의 구현에서 최대 너비는 1입니다.

        const [minSize, maxSize] = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);

   이는 주요 데스크탑 OpenGL에서 1보다 큰 값이 더 이상 사용되지 않기 때문입니다.

* `LINE_STRIP`

   Vertex shader가 출력하는 각 clip space 정점에 대해 vertex shader가 출력한 이전 포인트에서 선을 그립니다.

   따라서 clip space 정점 A,B,C,D,E,F를 출력하면 5개의 선이 표시됩니다.

   <div class="webgl_center"><img src="resources/gl-line-strip.svg" style="width: 400px;"></div>

* `LINE_LOOP`

   이건 `LINE_STRIP` 예제와 같지만 마지막 점에서 첫 번째 점으로 한 줄 더 그려집니다.

   <div class="webgl_center"><img src="resources/gl-line-loop.svg" style="width: 400px;"></div>

* `TRIANGLES`

   Vertex shader가 출력하는 3개의 clip space 정점마다 점 3개로 삼각형을 그립니다.
   이게 가장 많이 사용되는 모드입니다.

   <div class="webgl_center"><img src="resources/gl-triangles.svg" style="width: 400px;"></div>

* `TRIANGLE_STRIP`

   Vertex shader가 출력하는 각 clip space 정점에 대해 마지막 정점 3개로 삼각형을 그립니다.
   즉 6개의 점 A,B,C,D,E,F를 출력하면 삼각형 4개가 그려집니다.
   A,B,C 다음 B,C,D 다음 C,D,E 다음 D,E,F

   <div class="webgl_center"><img src="resources/gl-triangle-strip.svg" style="width: 400px;"></div>

* `TRIANGLE_FAN`

   Vertex shader가 출력하는 각 clip space 정점에 대해 첫 번째 정점과 마지막 정점 2개로 삼각형을 그립니다.
   즉 6개의 점 A,B,C,D,E,F를 출력하면 삼각형 4개가 그려집니다.
   A,B,C 다음 A,C,D 다음 A,D,E 다음 마지막으로 A,E,F

   <div class="webgl_center"><img src="resources/gl-triangle-fan.svg" style="width: 400px;"></div>

다른 사람들은 동의하지 않겠지만 저의 경험상 `TRIANGLE_FAN`과 `TRIANGLE_STRIP`은 피하는 게 가장 좋습니다.
몇 가지 예외적인 경우에만 적합하고 이런 경우를 처리하기 위한 추가 코드는 애당초 삼각형만으로 모든 걸 처리할 가치가 없는데요.
특히 법선을 만들거나 텍스처 좌표를 생성하거나 이외에도 정점 데이터로 많은 작업을 수행하는 도구가 있을 수 있습니다.
`TRIANGLES`만을 고수하면 함수는 작동할 겁니다.
`TRIANGLE_FAN`과 `TRIANGLE_STRIP`을 추가하기 시작하면 더 많은 경우를 처리하기 위한 함수들이 더 필요해집니다.
여러분은 이에 동의하지 않고 원하는 방식을 하실 수도 있습니다.
그저 제 경험과 제가 물어본 일부 AAA 게임 개발자들의 경험을 말씀드리는 겁니다.

마찬가지로 `LINE_LOOP`와 `LINE_STRIP`은 유용하지 않고 비슷한 문제를 가지고 있습니다.
`TRIANGLE_FAN`과 `TRIANGLE_STRIP`처럼 이것들을 사용하는 상황은 드문데요.
예를 들어 각각 4개의 점으로 만들어진 연결된 선 4개를 그리고 싶다고 생각할 수 있습니다.

<div class="webgl_center"><img src="resources/4-lines-4-points.svg" style="width: 400px;"></div>

`LINE_STRIP`을 쓴다면 `gl.drawArrays` 호출 4번과 각 라인에 대한 attribute를 설정하기 위해 더 많은 호출을 해야 하지만, `LINES`만 사용하면 `gl.drawArrays` 단일 호출로 선 4개를 모두 그리기 위해 필요한 모든 점을 삽입할 수 있습니다.
그게 훨씬 빠를 겁니다.

추가로 `LINES`는 디버깅이나 간단한 효과에 사용하기는 좋지만, 대부분의 플랫폼에서 너비 제한이 1px임을 고려해 볼 때 잘못된 해결책인 경우가 많습니다.
그래프의 grid를 그리거나 3D 모델링 프로그램에서 폴리곤의 윤곽선을 표시하려면 `LINES`를 사용하는 것이 좋지만, SVG나 Adobe Illustrator처럼 구조화된 그래픽을 그리려면 이 방식은 작동하지 않으며, 보통은 삼각형에서 [다른 방식](https://mattdesl.svbtle.com/drawing-lines-is-hard)으로 선을 렌더링해야 합니다.

