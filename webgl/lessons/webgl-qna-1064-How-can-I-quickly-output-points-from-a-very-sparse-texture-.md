Title: How can I quickly output points from a very sparse texture?
Description:
TOC: qna

# Question:

I have, essentially, a 512x512x512 WebGLTexture object that's 0. everywhere except for about 3 voxels, where it is 1..  I need to get the xyz coordinates of those 3 voxels printed out as fast as possible for a scientific computing application related to my research, but the best I can do is using a [parallel] 'for' loop after passing the object through a clunky chain of WebGL2 methods.  Does anyone know a faster way to get those coordinates?  Is there a way to push vec3 primitives to an array from a fragmentShader?

I've looked for helpful extensions unsuccessfully.

I am pushing tbl.compressedTable to an array every timestep via:


                    var tbl = new Abubu.RgbaCompressedDataFromTexture({ 
                        target    : env.stipt,
                        threshold : env.fthrsh,
                        compressionThresholdChannel : 'r',
                    });
                    this.timeSeries.push(time) ;
                    this.lastRecordedTime = time ;
                    this.samples.push([tbl.compressedTable]) ;

Where the last line is the killer. I'm using the class prototype:

    class RgbaCompressedDataFromTexture extends RgbaCompressedData{
        constructor( options={} ){
            if ( options.target == undefined && 
                 options.texture == undefined ) return null ;
    
            var texture ;
            texture = readOption(options.target, null ) ;
            texture = readOption(options.texture, options.target ) ;
    
            var ttbond = new Float32TextureTableBond({ target : texture } ) ;
            ttbond.tex2tab() ;
            var table       = ttbond.table ;
            var width       = ttbond.width ;
            var height      = ttbond.height ;
            var op          = options ;
            op.width        = width ;
            op.height       = height ;
    
            super( table, op ) ;
            this.ttbond     = ttbond ;
            this.texture    = texture ;
        }
    /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     *  CONSTRUCTOR ENDS
     *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */

Extending the class:

    class RgbaCompressedData{
        constructor( data, options={}){
    
            if (data == undefined){
                log( 'You need to provide data source for compression!') ;
                return null ;
            }
    
            this.data       = new Float32Array(data) ;
            this.width      = readOption( options.width,    data.length/4   ) ;
            this.height     = readOption( options.height,   1               ) ;
            if ( (this.width == (data.length/4)) && height != 1 ){
                this.width = (data.length/this.height)/4 ;
            }
    
            this.threshold  = readOption(   options.threshold, 0            ) ;
            this.threshold  = readOption(   options.compressionThreshold,
                                            this.threshold                  ) ;
            
            this.compressionThresholdChannel
                            = readOption(   options.channel,    'r'         ) ;
    
            switch (this.compressionThresholdChannel){
                case 'r' :
                    this.channel = 0 ;
                    break ;
                case 'g' :
                    this.channel = 1 ;
                    break ;
                case 'b' :
                    this.channel = 2 ;
                    break ;
                case 'a' :
                    this.channel = 3 ;
                    break ;
                default :
                    this.channel = 0 ;
                    break ;
            }
    
            this.compThresholdData = new Float32Array(this.width*this.height) ;
    
    /*------------------------------------------------------------------------
     * count number of pixels above the compression threshold
     *------------------------------------------------------------------------
     */
            this.noAboveThreshold = 0 ;
            for(var j=0 ; j<this.height ; j++){
                for (var i=0 ; i <this.width; i++){
                    var indx    = i + j*this.width ;
                    this.compThresholdData[indx]
                            = this.data[indx*4 + this.channel] ;
                    if (this.compThresholdData[indx]>this.threshold){
                            this.noAboveThreshold++ ;
                    }
                }
            }
    
    /*------------------------------------------------------------------------
     * allocating memory to data
     *------------------------------------------------------------------------
     */
            this.compressedSize    =
                Math.ceil( Math.sqrt( this.noAboveThreshold )) ;
    
            this.compressedTable =
                new Float32Array(this.compressedSize*this.compressedSize*4  ) ;
            this.decompressionMapTable =
                new Float32Array(this.compressedSize*this.compressedSize*4  ) ;
            this.compressionMapTable =
                new Float32Array(this.width*this.height * 4 ) ;
    
    /*------------------------------------------------------------------------
     * compress data
     *------------------------------------------------------------------------
     */
            var num = 0 ;
            for(var j=0 ; j<this.height ; j++){
                for (var i=0 ; i <this.width; i++){
                    var indx    = i + j*this.width ;
                    if (this.compThresholdData[indx]>this.threshold){
                        var jj  = Math.floor( num/this.compressedSize) ;
                        var ii  = num - jj*this.compressedSize ;
    
                        var x   = ii/this.compressedSize
                                + 0.5/this.compressedSize ;
                        var y   = jj/this.compressedSize
                                + 0.5/this.compressedSize ;
    
                        var nindx = ii + jj*this.compressedSize ;
    
                        this.compressionMapTable[indx*4     ]   = x ;
                        this.compressionMapTable[indx*4 + 1 ]   = y ;
                        this.decompressionMapTable[nindx*4  ]   =
                            i/this.width + 0.5/this.width ;
                        this.decompressionMapTable[nindx*4+1]   =
                            j/this.height+ 0.5/this.height ;
    
                        for (var k = 0 ; k<4 ; k++){
                            this.compressedTable[nindx*4+k]
                                = this.data[indx*4+k] ;
                        }
                        num++ ;
                    }else{
                        this.compressionMapTable[indx*4     ]
                            = 1.-0.5/this.compressedSize ;
                        this.compressionMapTable[indx*4 + 1 ]
                            = 1.-0.5/this.compressedSize ;
                    }
    
                }
            }
            var ii = this.compressedSize -1 ;
            var jj = this.compressedSize -1 ;
            var nindx = ii + jj*this.compressedSize ;
            for (var k = 0 ; k<4 ; k++){
                this.compressedTable[nindx*4+k] = 0. ;
            }
    
    /*------------------------------------------------------------------------
     * setting compressedData, compressionMap, decompressionMap textures
     *------------------------------------------------------------------------
     */
            this.full   = new TableTexture(
                this.data,
                this.width,
                this.height,
                {
                    minFilter : 'nearest' ,
                    magFilter : 'nearest'
                }
            ) ;
    
            this.sparse = new TableTexture(
                this.compressedTable,
                this.compressedSize ,
                this.compressedSize ,
                {
                    minFilter : 'nearest' ,
                    magFilter : 'nearest'
                }
            ) ;
    
            this.compressionMap     = new TableTexture(
                this.compressionMapTable,
                this.width,
                this.height ,
                {
                    minFilter : 'nearest' ,
                    magFilter : 'nearest'
                }
            ) ;
    
            this.decompressionMap   = new TableTexture(
                this.decompressionMapTable ,
                this.compressedSize ,
                this.compressedSize ,
                {
                    minFilter : 'nearest' ,
                    magFilter : 'nearest'
                }
            ) ;
        }   
    /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     *  CONSTRUCTOR ENDS
     *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */

And making use of the following class:

    class Float32TextureTableBond{
        
    /*------------------------------------------------------------------------
     * constructor
     *------------------------------------------------------------------------
     */
        constructor( options={}){
            if ( options.target == undefined && options.texture == undefined ){
                return null ;
            } ;
    
            this.texture = readOptions( options.target , null ) ;
            this.texture = readOptions( options.texture, this.target ) ;
        
            this.framebuffer = gl.createFramebuffer() ;
            gl.bindFramebuffer( gl.READ_FRAMEBUFFER, this.framebuffer) ;
            gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                                    gl.TEXTURE_2D,
                                    this.target.texture, 0 ) ;
            gl.readBuffer( gl.COLOR_ATTACHMENT0 ) ;
            this.canRead    = (
                gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER)
                == gl.FRAMEBUFFER_COMPLETE
            ) ;
            gl.bindFramebuffer( gl.READ_FRAMEBUFFER, null) ;
    
            this.width  = this.target.width ;
            this.height = this.target.height ;
            this.table   = readOption(options.table, 
                    new Float32Array(this.width*this.height*4 ) ) ;
        }
    /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     *  CONSTRUCTOR ENDS
     *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */

No error messages, correct output. When I start recording data, my simulation slows down to the speed of a lethargic turtle.




# Answer

I haven't really thought it through but here's some code that may give you ideas.

The problem is there is no way to conditionally output data in WebGL2 AFAIK. You can discard in the fragment shader but that does not seem helpful here.

So, in any case, the first thing to think about is that shaders parallelize base on output. If there are 32k pixels to draw the GPU has 32k things it can parallelize. If there is 1 pixel that inspects 32k things the GPU has nothing to parallelize.

So, here's one idea, divide the 3D texture into cells NxNxN big, search through each cell for on voxels. If a cell is 32x32x32 then for a 512x512x512 input there are 4096 things to parallelize. For each cell, walk the cell and sum the positions of matches 

```
sum = vec4(0)
for each voxel in cell
   if voxel === 1
     sum += vec4(positionOfVoxel, 1);

outColor = sum;
```

The result is that if there is just 1 match in that cell then sum.xyz will contain the position and sum.w will be 1. If there is more than one match sum.w will be > 1

The code below makes a 4096x1 texture and renders a quad to it. It uses `gl_FragCoord.x` to compute which cell each pixel being rendered corresponds to and sums the results for the corresponding cell.

It then uses readPixels to read the result and goes through and prints them out. Ideally I'd like the GPU itself to figure out the results but given you can't conditionally discard I didn't have any ideas.

For a cell with only one result the result is printed. For a cell with multiple result another shader that scans a cell. We know how many results are in a particular cell so we can render numResults by 1 pixels. The shader would then go over the cell and only look at the N'th result it finds

     int idOfResultWeWant = int(gl_FragCoord.x)
     int resultId = 0
     for (z...) {
       for (y...) {
         for (x...) {
           if (voxel) {
             if (resultId === idOfResultWeWant) {
               outColor = position
             }
             ++resultId
           }
        }
     }


The code below is lazy and uses 1D result textures which means the most cells it can handle is `gl.getParameter(gl.MAX_TEXTURE_SIZE)`. It would have to change a little for larger sizes.

No idea if this is the fastest way or even a fast way but the concepts of parallel based on what's being rendered is important as well as dividing the problem into smaller parts. 

Like maybe using 16x16x16 cells is better and maybe instead of the second shader we should just use the first shader again by subdivide a cell itself into smaller cells.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      const ext = gl.getExtension('EXT_color_buffer_float');
      if (!ext) {
        return alert('need EXT_color_buffer_float');
      }
      const size = 512;
      const cellSize = 32;
      const cellsPer = size / cellSize;
      const numCells = (size * size * size) / (cellSize * cellSize * cellSize);
      
      const dataTexture = twgl.createTexture(gl, {
        target: gl.TEXTURE_3D,
        width: size,
        height: size,
        depth: size,
        minMag: gl.NEAREST,
        internalFormat: gl.R8,
        auto: false,
      });
      
      function setData(x, y, z) {
        log('set voxel:', x, y, z);
        gl.texSubImage3D(
           gl.TEXTURE_3D, 0, x, y, z, 1, 1, 1, 
           gl.RED, gl.UNSIGNED_BYTE, new Uint8Array([255]));
      }
      
      for (let i = 0; i < 3; ++i) {
        const x = randInt(size);
        const y = randInt(size);
        const z = randInt(size);
        setData(x, y, z);
      }
      setData(128, 267, 234);
      setData(128 + 4, 267, 234);
      setData(128 + 9, 267, 234);
      
      const cellVS = `#version 300 es
      in vec4 position;
      void main() {
        gl_Position = position;
      }
      `;
      
      const cellFS = `#version 300 es
      precision highp float;
      uniform highp sampler3D data;
      uniform int cellSize;
      out vec4 outColor;
      void main() {
        // really should use 2D but I'm lazy
        int ndx = int(gl_FragCoord.x);
        // assumes equal sides
        int size = textureSize(data, 0).x;
        int cellsPer = size / cellSize;
        int cellZ = ndx / cellsPer / cellsPer;
        int cellY = ndx / cellsPer % cellsPer;
        int cellX = ndx % cellsPer;
        
        ivec3 cell = ivec3(cellX, cellY, cellZ) * cellSize;
        vec4 sum = vec4(0);
        for (int z = 0; z < cellSize; ++z) {
          for (int y = 0; y < cellSize; ++y) {
            for (int x = 0; x < cellSize; ++x) {
              ivec3 pos = cell + ivec3(x, y, z);
              // assumes data is 0 or 1
              float occupied = texelFetch(
                  data, 
                  pos,
                  0).r;
              sum += vec4(pos, 1) * occupied;
            }
          }
        }
        outColor = sum; 
      }
      `;
      
      const cellScanFS = `#version 300 es
      precision highp float;
      uniform highp sampler3D data;
      uniform int cellSize;
      uniform ivec3 cell;  // offset into cell
      out vec4 outColor;
      void main() {
        // really should use 2D but I'm lazy
        int idWeWant = int(gl_FragCoord.x);
        // assumes equal sides
        int size = textureSize(data, 0).x;
        int cellsPer = size / cellSize;
        
        vec4 result = vec4(0);
        int id = 0;
        for (int z = 0; z < cellSize; ++z) {
          for (int y = 0; y < cellSize; ++y) {
            for (int x = 0; x < cellSize; ++x) {
              ivec3 pos = cell + ivec3(x, y, z);
              float occupied = texelFetch(
                  data, 
                  pos,
                  0).r;
              if (occupied > 0.0) {
                if (id == idWeWant) {
                  result = vec4(pos, 1);
                }
                ++id;
              }
            }
          }
        }
        outColor = result; 
      }
      `;
      
      const cellProgramInfo = twgl.createProgramInfo(gl, [cellVS, cellFS]);
      const cellScanProgramInfo = twgl.createProgramInfo(gl, [cellVS, cellScanFS]);
      
      const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl, 2);
      
      // as long as numCells is less than the max
      // texture dimensions we can use a 
      // numCells by 1 result texture.
      // If numCells is > max texture dimension
      // we'd need to adjust the code to use
      // a 2d result texture.

      const cellResultWidth = numCells;
      const cellResultHeight = 1;
      const cellResultFBI = twgl.createFramebufferInfo(gl, [
        { internalFormat: gl.RGBA32F, minMag: gl.NEAREST }
      ], cellResultWidth, cellResultHeight);
      
      twgl.bindFramebufferInfo(gl, cellResultFBI);

      twgl.setBuffersAndAttributes(gl, cellProgramInfo, quadBufferInfo);
      
      gl.useProgram(cellProgramInfo.program);
      twgl.setUniforms(cellProgramInfo, {
        cellSize,
        data: dataTexture,
      });
      
      // draw the quad
      twgl.drawBufferInfo(gl, quadBufferInfo);
      
      const data = new Float32Array(numCells * 4);
      gl.readPixels(0, 0, numCells, 1, gl.RGBA, gl.FLOAT, data);
      
      gl.useProgram(cellScanProgramInfo.program);
      
      {
        for (let i = 0; i < numCells; ++i) {
          const off = i * 4;
          const numResultsInCell = data[off + 3];
          if (numResultsInCell) {
            if (numResultsInCell === 1) {
              log('result at: ', ...data.slice(off, off + 3));
            } else {
              getResultsForCell(i, numResultsInCell);
            }
          }
        }
      }
      
      function getResultsForCell(i, numResultsInCell) {
        const cellZ = (i / cellsPer | 0) / cellsPer | 0;
        const cellY = (i / cellsPer | 0) % cellsPer;
        const cellX = i % cellsPer;

        twgl.setUniforms(cellScanProgramInfo, {
          cellSize,
          data: dataTexture,
          cell: [cellX * cellSize, cellY * cellSize, cellZ * cellSize],
        });
        twgl.drawBufferInfo(gl, quadBufferInfo);

        // note: cellResultsFBI is still bound. It's 4096x1
        // so we can only get up to 4096 results without switching to
        // a 2D texture
        gl.viewport(0, 0, numResultsInCell, 1);

        const result = new Float32Array(numResultsInCell * 4);
        gl.readPixels(0, 0, numResultsInCell, 1, gl.RGBA, gl.FLOAT, result);
        for (let j = 0; j < numResultsInCell; ++j) {
          const off = j * 4;
          log('result at:', ...result.slice(off, off + 3));
        }
      }  
      
      function randInt(min, max) {
        return Math.floor(rand(min, max));
      }
      
      function rand(min, max) {
        if (max === undefined) {
          max = min;
          min = 0;
        }
        return Math.random() * (max - min) + min;
      }

      function log(...args) {
        const elem = document.createElement('pre');
        elem.textContent = [...args].join(' ');
        document.body.appendChild(elem);
      }

    }
    main();

<!-- language: lang-css -->

    pre { margin: 0; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->


