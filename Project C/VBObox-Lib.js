//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Tabs set to 2

/*=====================
  VBObox-Lib.js library: 
  ===================== 
Note that you don't really need 'VBObox' objects for any simple, 
    beginner-level WebGL/OpenGL programs: if all vertices contain exactly 
		the same attributes (e.g. position, color, surface normal), and use 
		the same shader program (e.g. same Vertex Shader and Fragment Shader), 
		then our textbook's simple 'example code' will suffice.
		  
***BUT*** that's rare -- most genuinely useful WebGL/OpenGL programs need 
		different sets of vertices with  different sets of attributes rendered 
		by different shader programs.  THUS a customized VBObox object for each 
		VBO/shader-program pair will help you remember and correctly implement ALL 
		the WebGL/GLSL steps required for a working multi-shader, multi-VBO program.
		
One 'VBObox' object contains all we need for WebGL/OpenGL to render on-screen a 
		set of shapes made from vertices stored in one Vertex Buffer Object (VBO), 
		as drawn by calls to one 'shader program' that runs on your computer's 
		Graphical Processing Unit(GPU), along with changes to values of that shader 
		program's one set of 'uniform' varibles.  
The 'shader program' consists of a Vertex Shader and a Fragment Shader written 
		in GLSL, compiled and linked and ready to execute as a Single-Instruction, 
		Multiple-Data (SIMD) parallel program executed simultaneously by multiple 
		'shader units' on the GPU.  The GPU runs one 'instance' of the Vertex 
		Shader for each vertex in every shape, and one 'instance' of the Fragment 
		Shader for every on-screen pixel covered by any part of any drawing 
		primitive defined by those vertices.
The 'VBO' consists of a 'buffer object' (a memory block reserved in the GPU),
		accessed by the shader program through its 'attribute' variables. Shader's
		'uniform' variable values also get retrieved from GPU memory, but their 
		values can't be changed while the shader program runs.  
		Each VBObox object stores its own 'uniform' values as vars in JavaScript; 
		its 'adjust()'	function computes newly-updated values for these uniform 
		vars and then transfers them to the GPU memory for use by shader program.
EVENTUALLY you should replace 'cuon-matrix-quat03.js' with the free, open-source
   'glmatrix.js' library for vectors, matrices & quaternions: Google it!
		This vector/matrix library is more complete, more widely-used, and runs
		faster than our textbook's 'cuon-matrix-quat03.js' library.  
		--------------------------------------------------------------
		I recommend you use glMatrix.js instead of cuon-matrix-quat03.js
		--------------------------------------------------------------
		for all future WebGL programs. 
You can CONVERT existing cuon-matrix-based programs to glmatrix.js in a very 
    gradual, sensible, testable way:
		--add the glmatrix.js library to an existing cuon-matrix-based program;
			(but don't call any of its functions yet).
		--comment out the glmatrix.js parts (if any) that cause conflicts or in	
			any way disrupt the operation of your program.
		--make just one small local change in your program; find a small, simple,
			easy-to-test portion of your program where you can replace a 
			cuon-matrix object or function call with a glmatrix function call.
			Test; make sure it works. Don't make too large a change: it's hard to fix!
		--Save a copy of this new program as your latest numbered version. Repeat
			the previous step: go on to the next small local change in your program
			and make another replacement of cuon-matrix use with glmatrix use. 
			Test it; make sure it works; save this as your next numbered version.
		--Continue this process until your program no longer uses any cuon-matrix
			library features at all, and no part of glmatrix is commented out.
			Remove cuon-matrix from your library, and now use only glmatrix.

	------------------------------------------------------------------
	VBObox -- A MESSY SET OF CUSTOMIZED OBJECTS--NOT REALLY A 'CLASS'
	------------------------------------------------------------------
As each 'VBObox' object can contain:
  -- a DIFFERENT GLSL shader program, 
  -- a DIFFERENT set of attributes that define a vertex for that shader program, 
  -- a DIFFERENT number of vertices to used to fill the VBOs in GPU memory, and 
  -- a DIFFERENT set of uniforms transferred to GPU memory for shader use.  
  THUS:
		I don't see any easy way to use the exact same object constructors and 
		prototypes for all VBObox objects.  Every additional VBObox objects may vary 
		substantially, so I recommend that you copy and re-name an existing VBObox 
		prototype object, and modify as needed, as shown here. 
		(e.g. to make the VBObox3 object, copy the VBObox2 constructor and 
		all its prototype functions, then modify their contents for VBObox3 
		activities.)

*/

// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
// 2017.02.20 J. Tumblin-- updated for EECS 351-1 use for Project C.
// 2018.04.11 J. Tumblin-- minor corrections/renaming for particle systems.
//    --11e: global 'gl' replaced redundant 'myGL' fcn args; 
//    --12: added 'SwitchToMe()' fcn to simplify 'init()' function and to fix 
//      weird subtle errors that sometimes appear when we alternate 'adjust()'
//      and 'draw()' functions of different VBObox objects. CAUSE: found that
//      only the 'draw()' function (and not the 'adjust()' function) made a full
//      changeover from one VBObox to another; thus calls to 'adjust()' for one
//      VBObox could corrupt GPU contents for another.
//      --Created vboStride, vboOffset members to centralize VBO layout in the 
//      constructor function.
//    -- 13 (abandoned) tried to make a 'core' or 'resuable' VBObox object to
//      which we would add on new properties for shaders, uniforms, etc., but
//      I decided there was too little 'common' code that wasn't customized.
//=============================================================================

var lineStart = 0
var gridStart = 0
var savesize = 0
//=============================================================================
//=============================================================================
function VBObox0() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal: 
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them 
// easily WITHOUT disrupting any other code, ever!
  
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform mat4 u_ModelMat0;\n' +
  'attribute vec4 a_Pos0;\n' +
  'attribute vec3 a_Colr0;\n'+
  'varying vec3 v_Colr0;\n' +
  //
  'void main() {\n' +
  '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
  '	 v_Colr0 = a_Colr0;\n' +
  ' }\n';

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'varying vec3 v_Colr0;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr0, 1.0);\n' + 
  '}\n';

	this.vboContents = //---------------------------------------------------------
	new Float32Array ([						// Array of vertex attribute values we will
  															// transfer to GPU's vertex buffer object (VBO)
	// 1st triangle:
  	 0.0,	 0.0,	0.0, 1.0,		1.0, 1.0, 1.0, //1 vertex:pos x,y,z,w; color: r,g,b  X AXIS
     1.0,  0.0, 0.0, 1.0,		1.0, 0.0, 0.0,
     
  	 0.0,	 0.0,	0.0, 1.0,		1.0, 1.0, 1.0, // Y AXIS
     0.0,  1.0, 0.0, 1.0,		0.0, 1.0, 0.0,
     
  	 0.0,	 0.0,	0.0, 1.0,		1.0, 1.0, 1.0, // Z AXIS
     0.0,  0.0, 1.0, 1.0,		0.0, 0.2, 1.0,
     
     // 2 long lines of the ground grid:
  	 -100.0,   0.2,	0.0, 1.0,		1.0, 0.2, 0.0, // horiz line
      100.0,   0.2, 0.0, 1.0,		0.0, 0.2, 1.0,
  	  0.2,	-100.0,	0.0, 1.0,		0.0, 1.0, 0.0, // vert line
      0.2,   100.0, 0.0, 1.0,		1.0, 0.0, 1.0,
		 ]);
     var floatsPerVertex = 7;
     function makeGroundGrid() {
      //==============================================================================
      // Create a list of vertices that create a large grid of lines in the x,y plane
      // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.
      
        var xcount = 100;     // # of lines to draw in x,y to make the grid.
        var ycount = 100;   
        var xymax = 50.0;     // grid size; extends to cover +/-xymax in x and y.
        var xColr = new Float32Array([1.0, 1.0, 0.3]);  // bright yellow
        var yColr = new Float32Array([0.5, 1.0, 0.5]);  // bright green.
        
        // Create an (global) array to hold this ground-plane's vertices:
        gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
                  // draw a grid made of xcount+ycount lines; 2 vertices per line.
                  
        var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
        var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
        
        // First, step thru x values as we make vertical lines of constant-x:
        for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
          if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
            gndVerts[j  ] = -xymax + (v  )*xgap;  // x
            gndVerts[j+1] = -xymax;               // y
            gndVerts[j+2] = 0.0;                  // z
            gndVerts[j+3] = 1.0;                  // w.
          }
          else {        // put odd-numbered vertices at (xnow, +xymax, 0).
            gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
            gndVerts[j+1] = xymax;                // y
            gndVerts[j+2] = 0.0;                  // z
            gndVerts[j+3] = 1.0;                  // w.
          }
          gndVerts[j+4] = xColr[0];     // red
          gndVerts[j+5] = xColr[1];     // grn
          gndVerts[j+6] = xColr[2];     // blu
        }
        // Second, step thru y values as wqe make horizontal lines of constant-y:
        // (don't re-initialize j--we're adding more vertices to the array)
        for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
          if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
            gndVerts[j  ] = -xymax;               // x
            gndVerts[j+1] = -xymax + (v  )*ygap;  // y
            gndVerts[j+2] = 0.0;                  // z
            gndVerts[j+3] = 1.0;                  // w.
          }
          else {          // put odd-numbered vertices at (+xymax, ynow, 0).
            gndVerts[j  ] = xymax;                // x
            gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
            gndVerts[j+2] = 0.0;                  // z
            gndVerts[j+3] = 1.0;                  // w.
          }
          gndVerts[j+4] = yColr[0];     // red
          gndVerts[j+5] = yColr[1];     // grn
          gndVerts[j+6] = yColr[2];     // blu
        }
      }
      makeGroundGrid();
      savesize = this.vboContents.length;
      var mySiz = (gndVerts.length + this.vboContents.length);
      var mypoints = new Float32Array(mySiz);
          //lineStart = 0;           // next, we'll store the sphere;
        for(i=0, j=0; j< this.vboContents.length; i++, j++) {// don't initialize i -- reuse it!
          mypoints[i] = this.vboContents[j];
          }
          gridStart = i;             // we stored the cylinder first.
        for(j=0; j< gndVerts.length; i++,j++) {
          mypoints[i] = gndVerts[j];
          }
      this.vboContents = mypoints;
        // Indices of the vertices
       // var indices = new Uint8Array([
        //  0, 1, 2,   0, 2, 3,    // front
       //   0, 3, 4,   0, 4, 5,    // right
       //   0, 5, 6,   0, 6, 1,    // up
        //  1, 6, 7,   1, 7, 2,    // left
         // 7, 4, 3,   7, 3, 2,    // down
        //  4, 7, 6,   4, 6, 5     // back
       //]);
      
        // Create a VBO and vertex-index array: get their locations in GPU:
        

	this.vboVerts = (this.vboContents.length /7);						// # of vertices held in 'vboContents' array
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
	                              // bytes req'd by 1 vboContents array element;
																// (why? used to compute stride and offset 
																// in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;               
                                // total number of bytes stored in vboContents
                                // (#  of floats in vboContents array) * 
                                // (# of bytes/float).
	this.vboStride = this.vboBytes / this.vboVerts; 
	                              // (== # of bytes to store one complete vertex).
	                              // From any attrib in a given vertex in the VBO, 
	                              // move forward by 'vboStride' bytes to arrive 
	                              // at the same attrib for the next vertex. 

	            //----------------------Attribute sizes
  this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                // attribute named a_Pos0. (4: x,y,z,w values)
  this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
  console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                  this.vboFcount_a_Colr0) *   // every attribute in our VBO
                  this.FSIZE == this.vboStride, // for agreeement with'stride'
                  "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

              //----------------------Attribute offsets  
	this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
	                              // of 1st a_Pos0 attrib value in vboContents[]
  this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                // (4 floats * bytes/float) 
                                // # of bytes from START of vbo to the START
                                // of 1st a_Colr0 attrib value in vboContents[]
	            //-----------------------GPU memory locations:
	this.vboLoc;									// GPU Location for Vertex Buffer Object, 
	                              // returned by gl.createBuffer() function call
	this.shaderLoc;								// GPU Location for compiled Shader-program  
	                            	// set by compile/link of VERT_SRC and FRAG_SRC.
								          //------Attribute locations in our shaders:
	this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
	this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute

	            //---------------------- Uniform locations &values in our shaders
	this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
	this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
}

VBObox0.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
//  executable 'program' stored and ready to use inside the GPU.  
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'. 
// c) Find & save the GPU location of all our shaders' attribute-variables and 
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
// -------------------
// CAREFUL!  before you can draw pictures using this VBObox contents, 
//  you must call this VBObox object's switchToMe() function too!
//--------------------
// a) Compile,link,upload shaders-----------------------------------------------
	this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
// CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

	gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

// b) Create VBO on GPU, fill it------------------------------------------------
	this.vboLoc = gl.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
  								this.vboLoc);				  // the ID# the GPU uses for this buffer.

  // Fill the GPU's newly-created VBO object with the vertex data we stored in
  //  our 'vboContents' member (JavaScript Float32Array object).
  //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
  //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.
  //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
  //	(see OpenGL ES specification for more info).  Your choices are:
  //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents rarely or never change.
  //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents may change often as our program runs.
  //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
  // 			times and then discarded; for rapidly supplied & consumed VBOs.

  // c1) Find All Attributes:---------------------------------------------------
  //  Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Pos0');
    return -1;	// error exit.
  }
 	this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() failed to get the GPU location of attribute a_Colr0');
    return -1;	// error exit.
  }
  
  // c2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs: 
	this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }  
}

VBObox0.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
  gl.useProgram(this.shaderLoc);	
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's 
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.  
  
// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can 
//    supply values to use as attributes in our newly-selected shader program:
	gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
										this.vboLoc);			    // the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
		this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
		              // stored attrib for this vertex to the same stored attrib
		              //  for the next vertex in our VBO.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		this.vboOffset_a_Pos0);						
		              // Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                        gl.FLOAT, false, 
                        this.vboStride, this.vboOffset_a_Colr0);
  							
// --Enable this assignment of each of these attributes to its' VBO source:
  gl.enableVertexAttribArray(this.a_PosLoc);
  gl.enableVertexAttribArray(this.a_ColrLoc);
}

VBObox0.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name + 
    						'.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name + 
  						'.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox0.prototype.adjust = function() {
//==============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.adjust() call you needed to call this.switchToMe()!!');
  }  
	// Adjust values for our uniforms,

		this.ModelMat.setIdentity();
// THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
  this.ModelMat.set(g_worldMat);	// use our global, shared camera.
// READY to draw in 'world' coord axes.
	
//  this.ModelMat.rotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
//  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.ModelMat.elements);	// send data from Javascript.
  // Adjust the attributes' stride and offset (if necessary)
  // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
}

VBObox0.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.draw() call you needed to call this.switchToMe()!!');
  }  
  // ----------------------------Draw the contents of the currently-bound VBO:
  //gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  //								lineStart, 								// location of 1st vertex to draw;
  //								10);
  gl.drawArrays(gl.LINES, (gridStart/7), ((this.vboContents.length/7)-10));		// number of vertices to draw on-screen.
}

VBObox0.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU inside our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.

 gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
 					 				this.vboContents);   // the JS source-data array used to fill VBO

}
/*
VBObox0.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox0.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
var savesize1 = 0;
var spherestart1 = 0; ///// G SHADED SPHERE
function VBObox1() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal: 
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them 
// easily WITHOUT disrupting any other code, ever!
  
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  'precision highp int;\n' +
  'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
	'		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
	'		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
	'		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
	'		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
	'		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '		};\n' +
  'struct LampT {\n' +		// Describes one point-like Phong light source
  '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                          //		   w==0.0 for distant light from x,y,z direction 
  ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
  ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
  '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
  '}; \n' +
  //
  'attribute vec4 a_Pos1;\n' +
  'attribute vec4 a_Normal;\n' +    //added
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_MvpMatrix;\n' +   //added
  'uniform mat4 u_NormalMatrix;\n' +   // added Transformation matrix of the normal
  'uniform vec3 u_eyePos; \n' +
  'uniform MatlT u_MatlSet[1];\n' +
  'uniform LampT u_LampSet[1];\n' +
  'uniform bool u_lightOn;\n' +
  'uniform bool v_lightType;\n' +
	//-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
	'varying vec3 v_Kd; \n' +
  'varying vec4 v_Position; \n' +				
  'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0
  'varying vec4 v_Color;\n' +
  //
  
  //'attribute vec3 a_Colr1;\n'+
  //'varying vec4 v_Colr1;\n' +  
  //'uniform vec3 u_LightColor;\n' +     // added Light color (((Diffuse Color))))
  //'uniform vec3 u_LightPosition;\n' +  // added  Position of the light source
  //'uniform vec3 u_AmbientLight;\n' +   // added  Ambient light color
  
  //
  'void main() {\n' +
  //'  gl_PointSize = a_PtSiz1;\n' +
  '  gl_Position = u_MvpMatrix * a_Pos1;\n' +
  '  v_Position = u_ModelMatrix * a_Pos1;\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '	 v_Kd = u_MatlSet[0].diff; \n' +
  '  vec3 normal = normalize(v_Normal);\n' +
  '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
  '  vec3 eyeDirection = normalize(u_eyePos - v_Position.xyz); \n' +
  '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  '  float e64; \n' +
  'if(v_lightType){\n' +
    '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
    '  float nDotH = max(dot(H, normal), 0.0); \n' +
    ' e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
  '}\n' +
  'else{\n' +
    '  vec3 H = normalize(reflect((-lightDirection), normal));\n' +
    '   float nDotH = max(dot(H, eyeDirection), 0.0); \n' +
    ' float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
  '}\n' +
  '	 vec3 emissive = 	u_MatlSet[0].emit;' +
  '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
  '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
  '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
  ' if(u_lightOn) {\n' +
  '	 v_Color = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
    '}\n' +
  ' else {\n' +
  ' v_Color = vec4(0, 0, 0, 1.0);}\n' +

  //'	 vec4 color = vec4(a_Colr1.x, a_Colr1.y, a_Colr1.z, 1.0);\n' + 
  //added
     // Calculate a normal to be fit with a model matrix, and make it 1.0 in length
     // Calculate world coordinate of vertex
  //'  vec4 vertexPosition = u_ModelMatrix * a_Pos1;\n' +
     // Calculate the light direction and make it 1.0 in length
  //'  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
     // The dot product of the light direction and the normal
  //'  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
  
     // Calculate the color due to diffuse reflection
  //'  vec3 diffuse = u_LightColor * nDotL;\n' + // * color.rgb
     // Calculate the color due to ambient reflection
  //'  vec3 ambient = u_AmbientLight;\n' + // * color.rgb
     // Add the surface colors due to diffuse reflection and ambient reflection
  //'  v_Colr1 = vec4(diffuse + ambient, color.a);\n' + 
  ' }\n';
/*
 // SQUARE dots:
	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'varying vec3 v_Colr1;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr1, 1.0);\n' +  
  '}\n';
*/
/*
 // ROUND FLAT dots:
	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'varying vec3 v_Colr1;\n' +
  'void main() {\n' +
  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' + 
  '  if(dist < 0.5) {\n' +
  '    gl_FragColor = vec4(v_Colr1, 1.0);\n' +  
  '    } else {discard;};' +
  '}\n';
*/
/*
 // SHADED, sphere-like dots:
	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'varying vec3 v_Colr1;\n' +
  'void main() {\n' +
  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' + 
  '  if(dist < 0.5) {\n' + 
 	'  	gl_FragColor = vec4((1.0-2.0*dist)*v_Colr1.rgb, 1.0);\n' +
  '    } else {discard;};' +
  '}\n';
  */

  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' + 
  '}\n';

	this.vboContents = //---------------------------------------------------------
		new Float32Array ([					// Array of vertex attribute values we will
  															// transfer to GPU's vertex buffer object (VBO)
			// 1 vertex per line: pos1 x,y,z,w;   colr1; r,g,b;   ptSiz1; 
  	-0.3,  0.7,	0.0, 1.0,		0.0, 1.0, 1.0,  //17.0,
    -0.3, -0.3, 0.0, 1.0,		1.0, 0.0, 1.0,  //20.0,
     0.3, -0.3, 0.0, 1.0,		1.0, 1.0, 0.0,  //33.0,
  ]);	

  var floatsPerVertex = 7;
  
  makesphere();
  savesize1 = this.vboContents.length;
      var mySiz = (spherepoints.length + this.vboContents.length);
      var mypoints = new Float32Array(mySiz);
          //lineStart = 0;           // next, we'll store the sphere;
        for(i=0, j=0; j< this.vboContents.length; i++, j++) {// don't initialize i -- reuse it!
          mypoints[i] = this.vboContents[j];
          }
          spherestart1 = i;             // we stored the cylinder first.
        for(j=0; j< spherepoints.length; i++,j++) {
          mypoints[i] = spherepoints[j];
          }
      this.vboContents = mypoints;
  
	this.vboVerts = (this.vboContents.length /floatsPerVertex);							// # of vertices held in 'vboContents' array;
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
	                              // bytes req'd by 1 vboContents array element;
																// (why? used to compute stride and offset 
																// in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;               
                                // (#  of floats in vboContents array) * 
                                // (# of bytes/float).
	this.vboStride = this.vboBytes / this.vboVerts;     
	                              // (== # of bytes to store one complete vertex).
	                              // From any attrib in a given vertex in the VBO, 
	                              // move forward by 'vboStride' bytes to arrive 
	                              // at the same attrib for the next vertex.
	                               
	            //----------------------Attribute sizes
  this.vboFcount_a_Pos1 =  4;    // # of floats in the VBO needed to store the
                                // attribute named a_Pos1. (4: x,y,z,w values)
  this.vboFcount_a_Colr1 = 3;   // # of floats for this attrib (r,g,b values)
  //this.vboFcount_a_PtSiz1 = 0;  // # of floats for this attrib (just one!)   
  console.assert((this.vboFcount_a_Pos1 +     // check the size of each and
                  this.vboFcount_a_Colr1 ) * //+
                 // this.vboFcount_a_PtSiz1) *   // every attribute in our VBO
                  this.FSIZE == this.vboStride, // for agreeement with'stride'
                  "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
                  
              //----------------------Attribute offsets
	this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
	                              // of 1st a_Pos1 attrib value in vboContents[]
  this.vboOffset_a_Colr1 = (this.vboFcount_a_Pos1) * this.FSIZE;  
                                // == 4 floats * bytes/float
                                //# of bytes from START of vbo to the START
                                // of 1st a_Colr1 attrib value in vboContents[]
  this.vboOffset_a_PtSiz1 =(this.vboFcount_a_Pos1 +
                            this.vboFcount_a_Colr1) * this.FSIZE; 
                                // == 7 floats * bytes/float
                                // # of bytes from START of vbo to the START
                                // of 1st a_PtSize attrib value in vboContents[]

	            //-----------------------GPU memory locations:                                
	this.vboLoc;									// GPU Location for Vertex Buffer Object, 
	                              // returned by gl.createBuffer() function call
	this.shaderLoc;								// GPU Location for compiled Shader-program  
	                            	// set by compile/link of VERT_SRC and FRAG_SRC.
								          //------Attribute locations in our shaders:
	this.a_Pos1Loc;							  // GPU location: shader 'a_Pos1' attribute
	this.a_Colr1Loc;							// GPU location: shader 'a_Colr1' attribute
	this.a_PtSiz1Loc;							// GPU location: shader 'a_PtSiz1' attribute
	
	            //---------------------- Uniform locations &values in our shaders
	this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
	this.u_ModelMatrixLoc;						// GPU location for u_ModelMat uniform

  this.MvpMatrix = new Matrix4();
  this.u_MvpMatrixLoc; 
  
  
  this.NormalMatrix = new Matrix4();
  this.u_NormalMatrixLoc; 

  this.eyePos = new Float32Array(3);
  this.u_eyeposloc;

  this.lamp0 = new LightsT();
  this.matlSel= MATL_BRASS;	
  this.matl0 = new Material(this.matlSel);
    
  this.u_lightOnLoc;

  this.u_lightTypeLoc;
  
  //this.u_LightColorLoc;
  //this.u_LightPositionLoc;
  //this.u_AmbientLightLoc;
};


VBObox1.prototype.init = function() {
//==============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
//  executable 'program' stored and ready to use inside the GPU.  
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'. 
// c) Find & save the GPU location of all our shaders' attribute-variables and 
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
// -------------------
// CAREFUL!  before you can draw pictures using this VBObox contents, 
//  you must call this VBObox object's switchToMe() function too!
//--------------------
// a) Compile,link,upload shaders-----------------------------------------------
	this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
// CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

	gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

// b) Create VBO on GPU, fill it------------------------------------------------
	this.vboLoc = gl.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  
  // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
  								this.vboLoc);				  // the ID# the GPU uses for this buffer.
  											
  // Fill the GPU's newly-created VBO object with the vertex data we stored in
  //  our 'vboContents' member (JavaScript Float32Array object).
  //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
  //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.  
  //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
  //	(see OpenGL ES specification for more info).  Your choices are:
  //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents rarely or never change.
  //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents may change often as our program runs.
  //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
  // 			times and then discarded; for rapidly supplied & consumed VBOs.

// c1) Find All Attributes:-----------------------------------------------------
//  Find & save the GPU location of all our shaders' attribute-variables and 
//  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
  this.a_Pos1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
  if(this.a_Pos1Loc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Pos1');
    return -1;	// error exit.
  }
 	//this.a_Colr1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Colr1');
  //if(this.a_Colr1Loc < 0) {
   // console.log(this.constructor.name + 
  //  						'.init() failed to get the GPU location of attribute a_Colr1');
   // return -1;	// error exit.
  //}
  //this.a_PtSiz1Loc = gl.getAttribLocation(this.shaderLoc, 'a_PtSiz1');
  //if(this.a_PtSiz1Loc < 0) {
    //console.log(this.constructor.name + 
	   // 					'.init() failed to get the GPU location of attribute a_PtSiz1');
	  //return -1;	// error exit.
  //}
  // c2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs: 
 this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
  if (!this.u_ModelMatrixLoc) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ModelMatrix uniform');
    return;
  }

  this.u_eyeposloc = gl.getUniformLocation(this.shaderLoc, 'u_eyePos');
      if (!this.u_eyeposloc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_eyePos uniform');
      return;
      }

  this.a_normalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
  this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
  this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
  //this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
  //this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
  if (!this.u_MvpMatrixLoc || !this.u_NormalMatrixLoc || !this.a_normalLoc) { 
    console.log('Failed to get the storage location');
    return;
  }

  this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
  this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
  this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
  this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
  this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');

  this.lamp0.u_pos  = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos');	
  this.lamp0.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].ambi');
  this.lamp0.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].diff');
  this.lamp0.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].spec');
    
  if( !this.lamp0.u_pos || !this.lamp0.u_ambi	|| !this.lamp0.u_diff || !this.lamp0.u_spec	|| !this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny) {
    console.log('.init() Failed to get GPU location of uniforms of matl0 or lamp0');
    return;
  }
    
  this.u_lightOnLoc = gl.getUniformLocation(this.shaderLoc, 'u_lightOn');
  if(!this.u_lightOnLoc) {
    console.log('.init() Failed to get GPU location of unifrom u_lightOn');
    return;
  }


  this.u_lightTypeLoc = gl.getUniformLocation(this.shaderLoc, 'v_lightType');
  if(!this.u_lightTypeLoc) {
    console.log('.init() Failed to get GPU location of varying LightType');
    return;
  } 

}

VBObox1.prototype.switchToMe = function () {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
  gl.useProgram(this.shaderLoc);	
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's 
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.  
  
// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can 
//    supply values to use as attributes in our newly-selected shader program:
	gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
										this.vboLoc);			// the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
		this.vboFcount_a_Pos1, // # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,		  // type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
		              // stored attrib for this vertex to the same stored attrib
		              //  for the next vertex in our VBO.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		this.vboOffset_a_Pos1);						
		              // Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (we start with position).
  gl.vertexAttribPointer(this.a_Colr1Loc, this.vboFcount_a_Colr1,
                         gl.FLOAT, false, 
  						           this.vboStride,  this.vboOffset_a_Colr1);
  gl.vertexAttribPointer(this.a_normalLoc, 3, gl.FLOAT, false, this.vboStride, 0);
  //gl.vertexAttribPointer(this.a_PtSiz1Loc,this.vboFcount_a_PtSiz1, 
                         //gl.FLOAT, false, 
							           //this.vboStride,	this.vboOffset_a_PtSiz1);	
  //-- Enable this assignment of the attribute to its' VBO source:
  gl.enableVertexAttribArray(this.a_Pos1Loc);
  //gl.enableVertexAttribArray(this.a_Colr1Loc);
  gl.enableVertexAttribArray(this.a_normalLoc);
  //gl.enableVertexAttribArray(this.a_PtSiz1Loc);

  // Set the light color (white)
  //gl.uniform3f(this.u_LightColorLoc, 0.8, 0.4, 0.0);
  // Set the light direction (in the world coordinate)
  //gl.uniform3f(this.u_LightPositionLoc, 5.0, 8.0, 7.0);
  // Set the ambient light
  //gl.uniform3f(this.u_AmbientLightLoc, 0.4, 0.4, 0.4);

  this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
  this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
  this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
  this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
  this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
            
  this.eyePos.set([eyex, eyey, eyez]);
  this.lamp0.I_pos.elements.set( [lampx, lampy, lampz]);
  this.lamp0.I_ambi.elements.set([ambr, ambg, ambb]);
  this.lamp0.I_diff.elements.set([difr, difg, difb]);
  this.lamp0.I_spec.elements.set([specr, specg, specb]);
  gl.uniform3fv(this.lamp0.u_pos, this.lamp0.I_pos.elements.slice(0, 3));
  gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);        // ambient
  gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);        // diffuse
  gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);        // Specular
  gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0, 3));                // Ke emissive
  gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0, 3));                // Ka ambient
  gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0, 3));                // Kd    diffuse
  gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0, 3));                // Ks specular
  gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny
              
  gl.uniform1i(this.u_lightTypeLoc, lightType);
  gl.uniform1i(this.u_lightOnLoc, lightOn);

}

VBObox1.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name + 
    						'.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name + 
  						'.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox1.prototype.adjust = function() {
//==============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.adjust() call you needed to call this.switchToMe()!!');
  }
	
  
  
  
  
  // Adjust values for our uniforms,
	this.ModelMatrix.setIdentity();
// THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
  //this.ModelMatrix.set(g_worldMat);
  //this.ModelMatrix.rotate(g_angleNow0, 0, 0);
//  this.ModelMatrix.rotate(g_angleNow1, 0, 0, 1);	// -spin drawing axes,
  this.ModelMatrix.translate(0.0, 1.5, 0);
  this.ModelMatrix.rotate(g_angleNow0, 0, 0);						// then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
  										false, 										// use matrix transpose instead?
  										this.ModelMatrix.elements);	// send data from Javascript.
  
  this.MvpMatrix.set(g_worldMat);
  this.MvpMatrix.multiply(this.ModelMatrix);
  
  gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);


  this.NormalMatrix.setInverseOf(this.ModelMatrix);
  this.NormalMatrix.transpose();

  gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);


}

VBObox1.prototype.draw = function() {
//=============================================================================
// Send commands to GPU to select and render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.draw() call you needed to call this.switchToMe()!!');
  }
  
  // ----------------------------Draw the contents of the currently-bound VBO:
  gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
  							spherestart1/7, 								// location of 1st vertex to draw;
  							(this.vboContents.length/7)-3);		// number of vertices to draw on-screen.
}


VBObox1.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.

 gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
 					 				this.vboContents);   // the JS source-data array used to fill VBO
}

/*
VBObox1.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/







//NEW ONE//








var savesize2 = 0

function VBObox2() {  ////Phong shaded sphere
  //=============================================================================
  //=============================================================================
  // CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
  // needed to render vertices from one Vertex Buffer Object (VBO) using one 
  // separate shader program (a vertex-shader & fragment-shader pair) and one
  // set of 'uniform' variables.
  
  // Constructor goal: 
  // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
  // written into code) in all other VBObox functions. Keeping all these (initial)
  // values here, in this one coonstrutor function, ensures we can change them 
  // easily WITHOUT disrupting any other code, ever!
    
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    'precision highp int;\n' +
    //
    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '		};\n' +
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                            //		   w==0.0 for distant light from x,y,z direction 
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +
    'uniform MatlT u_MatlSet[1];\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'attribute vec4 a_Pos1;\n' +
    //'attribute vec3 a_Colr1;\n'+
    //'attribute float a_PtSiz1; \n' +
    'varying vec4 v_Colr1;\n' +  
    'attribute vec4 a_Normal;\n' +    //added
    'uniform mat4 u_MvpMatrix;\n' +   //added
    'uniform mat4 u_NormalMatrix;\n' +   // added Transformation matrix of the normal
    'uniform LampT u_LampSet[1];\n' +
    'uniform bool u_lightOn;\n' +
    'uniform bool v_lightType;\n' +
    'uniform vec3 u_eyePosWorld; \n' + 
    'varying vec3 v_Kd; \n' +
    'varying vec3 v_Normal;\n' +       //NEW added
    'varying vec4 v_Position;\n' +     // NEW addded
    //'uniform vec3 u_LightColor;\n' +     // added Light color (((Diffuse Color))))
    //'uniform vec3 u_LightPosition;\n' +  // added  Position of the light source
    //'uniform vec3 u_AmbientLight;\n' +   // added  Ambient light color
    //
    'void main() {\n' +
    //'  gl_PointSize = a_PtSiz1;\n' +
    '  gl_Position = u_MvpMatrix * a_Pos1;\n' +
    '  v_Position = u_ModelMatrix * a_Pos1;\n' + 
    '	 v_Kd = u_MatlSet[0].diff; \n' +
    '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '  vec3 normal = normalize(v_Normal); \n' +
    '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
    '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
    '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
    '  float e64; \n' +
    'if(v_lightType){\n' +
      '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
      '  float nDotH = max(dot(H, normal), 0.0); \n' +
       ' e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
    '}\n' +
    'else{\n' +
      '  vec3 H = normalize(reflect((-lightDirection), normal));\n' +
      '   float nDotH = max(dot(H, eyeDirection), 0.0); \n' +
      ' float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
    '}\n' +
    '	 vec3 emissive = u_MatlSet[0].emit;' +
    '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
    '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
    '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
    ' if(u_lightOn) {\n' +
    '	 vec4 color = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
    '  v_Colr1 = color;\n' +
      '}\n' +
    ' else {\n' +
    '	 vec4 color = vec4(0, 0, 0, 1.0);\n' +
    '  v_Colr1 = color;}\n' +
    
    ' }\n';
  
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    //'#ifdef GL_ES\n' +
    'precision highp float;\n' +
    'precision highp int;\n' +
    //'#endif\n' +
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                        //		   w==0.0 for distant light from x,y,z direction 
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +
    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '		};\n' +
    //-------------UNIFORMS: values set from JavaScript before a drawing command.
    // first light source: (YOU write a second one...)
    'uniform LampT u_LampSet[1];\n' +		// Array of all light sources.
    'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
    'uniform bool v_lightType;\n' +
    'uniform bool u_lightOn;\n' +
    //
    'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.

    'varying vec4 v_Colr1;\n' +
    'varying vec3 v_Kd;	\n' +	
    //'uniform vec3 u_LightColor;\n' +     // Light color
    //'uniform vec3 u_LightPosition;\n' +  // Position of the light source
    //'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
    'varying vec3 v_Normal;\n' +
    'varying vec4 v_Position;\n' +
    'void main() {\n' +
       // Normalize the normal because it is interpolated and not 1.0 in length any more
    '  vec3 normal = normalize(v_Normal);\n' +
       // Calculate the light direction and make it 1.0 in length
    '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
       // Find the unit-length eye-direction vector 'V' (surface pt --> camera)
    '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
       // The dot product of the light direction and the normal
    '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +

    '  float e64; \n' +
    'if(v_lightType==true){\n' +
      '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
      '  float nDotH = max(dot(H, normal), 0.0); \n' +
      ' e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
    '}\n' +
    'else{\n' +
      '  vec3 H = normalize(reflect((-lightDirection), normal));\n' +
      '   float nDotH = max(dot(H, eyeDirection), 0.0); \n' +
      ' float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
    '}\n' +
    
    //'  vec3 H = normalize(lightDirection + eyeDirection); \n' +
    //'  float nDotH = max(dot(H, normal), 0.0); \n' +
    //'  float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
    '	 vec3 emissive = 										u_MatlSet[0].emit;' +
    '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
    '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
    '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +

    ' if(u_lightOn) {\n' +
      '	 gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
    '}\n' +
    ' else {\n' +
      ' gl_FragColor = vec4(0, 0, 0, 1.0);}\n' +
    //'  gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
       // Calculate the final color from diffuse reflection and ambient reflection
    //'  vec3 diffuse = u_LightColor * nDotL;\n' +
    //'  vec3 ambient = u_AmbientLight;\n' +
    //'  gl_FragColor = vec4(diffuse + ambient, v_Colr1.a);\n' +
    '}\n';
  
    this.vboContents = //---------------------------------------------------------
      new Float32Array ([					// Array of vertex attribute values we will
                                  // transfer to GPU's vertex buffer object (VBO)
        // 1 vertex per line: pos1 x,y,z,w;   colr1; r,g,b;   ptSiz1; 
      -0.3,  0.7,	0.0, 1.0,		0.0, 1.0, 1.0,  //17.0,
      -0.3, -0.3, 0.0, 1.0,		1.0, 0.0, 1.0,  //20.0,
       0.3, -0.3, 0.0, 1.0,		1.0, 1.0, 0.0,  //33.0,
    ]);	
  
    var floatsPerVertex = 7;
    
    makesphere();
    savesize1 = this.vboContents.length;
        var mySiz = (spherepoints.length + this.vboContents.length);
        var mypoints = new Float32Array(mySiz);
            //lineStart = 0;           // next, we'll store the sphere;
          for(i=0, j=0; j< this.vboContents.length; i++, j++) {// don't initialize i -- reuse it!
            mypoints[i] = this.vboContents[j];
            }
            spherestart1 = i;             // we stored the cylinder first.
          for(j=0; j< spherepoints.length; i++,j++) {
            mypoints[i] = spherepoints[j];
            }
        this.vboContents = mypoints;
    
    this.vboVerts = (this.vboContents.length /floatsPerVertex);							// # of vertices held in 'vboContents' array;
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
                                  // bytes req'd by 1 vboContents array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                                  // (#  of floats in vboContents array) * 
                                  // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;     
                                  // (== # of bytes to store one complete vertex).
                                  // From any attrib in a given vertex in the VBO, 
                                  // move forward by 'vboStride' bytes to arrive 
                                  // at the same attrib for the next vertex.
                                   
                //----------------------Attribute sizes
    this.vboFcount_a_Pos1 =  4;    // # of floats in the VBO needed to store the
                                  // attribute named a_Pos1. (4: x,y,z,w values)
    this.vboFcount_a_Colr1 = 3;   // # of floats for this attrib (r,g,b values)
    //this.vboFcount_a_PtSiz1 = 0;  // # of floats for this attrib (just one!)   
    console.assert((this.vboFcount_a_Pos1 +     // check the size of each and
                    this.vboFcount_a_Colr1 ) * //+
                   // this.vboFcount_a_PtSiz1) *   // every attribute in our VBO
                    this.FSIZE == this.vboStride, // for agreeement with'stride'
                    "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
                    
                //----------------------Attribute offsets
    this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
                                  // of 1st a_Pos1 attrib value in vboContents[]
    this.vboOffset_a_Colr1 = (this.vboFcount_a_Pos1) * this.FSIZE;  
                                  // == 4 floats * bytes/float
                                  //# of bytes from START of vbo to the START
                                  // of 1st a_Colr1 attrib value in vboContents[]
    this.vboOffset_a_PtSiz1 =(this.vboFcount_a_Pos1 +
                              this.vboFcount_a_Colr1) * this.FSIZE; 
                                  // == 7 floats * bytes/float
                                  // # of bytes from START of vbo to the START
                                  // of 1st a_PtSize attrib value in vboContents[]
  
                //-----------------------GPU memory locations:                                
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                  // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                                  // set by compile/link of VERT_SRC and FRAG_SRC.
                            //------Attribute locations in our shaders:
    this.a_Pos1Loc;							  // GPU location: shader 'a_Pos1' attribute
    this.a_Colr1Loc;							// GPU location: shader 'a_Colr1' attribute
    this.a_PtSiz1Loc;							// GPU location: shader 'a_PtSiz1' attribute
    
                //---------------------- Uniform locations &values in our shaders
    this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMatrixLoc;						// GPU location for u_ModelMat uniform
  
    this.MvpMatrix = new Matrix4();
    this.u_MvpMatrixLoc; 
    
    
    this.NormalMatrix = new Matrix4();
    this.u_NormalMatrixLoc; 

    this.eyepos = new Float32Array(3);
    this.u_eyePosWorldLoc;

    this.uLoc_ModelMatrix 	= false;
    this.uLoc_MvpMatrix 		= false;
    this.uLoc_NormalMatrix = false;

    this.eyePosWorld = new Float32Array(3);
    
    this.lamp0 = new LightsT();

    this.matlSel = MATL_EMERALD;				// see keypress(): 'm' key changes matlSel
    this.matl0 = new Material(this.matlSel);

    this.u_lightOnLoc;
  
    this.u_lightTypeLoc;
    
    //this.u_LightColorLoc;
    //this.u_LightPositionLoc;
    //this.u_AmbientLightLoc;
  };
  
  
  VBObox2.prototype.init = function() {
  //==============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create executable Shaders on the GPU. Bye!');
      return;
    }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  
  // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }
    
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                    this.vboLoc);				  // the ID# the GPU uses for this buffer.
                          
    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                      this.vboContents, 		// JavaScript Float32Array
                     gl.STATIC_DRAW);			// Usage hint.  
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.
  
  // c1) Find All Attributes:-----------------------------------------------------
  //  Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
    this.a_Pos1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
    if(this.a_Pos1Loc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Pos1');
      return -1;	// error exit.
    }
     //this.a_Colr1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Colr1');
    //if(this.a_Colr1Loc < 0) {
     // console.log(this.constructor.name + 
     //             '.init() failed to get the GPU location of attribute a_Colr1');
      //return -1;	// error exit.
    //}
    //this.a_PtSiz1Loc = gl.getAttribLocation(this.shaderLoc, 'a_PtSiz1');
    //if(this.a_PtSiz1Loc < 0) {
      //console.log(this.constructor.name + 
       // 					'.init() failed to get the GPU location of attribute a_PtSiz1');
      //return -1;	// error exit.
    //}
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
   this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
    if (!this.u_ModelMatrixLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ModelMatrix uniform');
      return;
    }

    this.eyePosWorldLoc  = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');


    this.a_normalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
    this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    //this.u_LightColorLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightColor');
    //this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
    //this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');

    //if (!this.u_MvpMatrixLoc || !this.u_NormalMatrixLoc || !this.u_LightColorLoc || !this.u_LightPositionLoc　|| !this.u_AmbientLightLoc || !this.eyePosWorldLoc) { 
    //  console.log('Failed to get the storage location');
    //  return;
    //}

    if (!this.u_MvpMatrixLoc || !this.u_NormalMatrixLoc || !this.eyePosWorldLoc) { 
      console.log('Failed to get the storage location');
      return;
    }

    this.lamp0.u_pos  = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos');	
    this.lamp0.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].ambi');
    this.lamp0.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].diff');
    this.lamp0.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].spec');
    if( !this.lamp0.u_pos || !this.lamp0.u_ambi	|| !this.lamp0.u_diff || !this.lamp0.u_spec	) {
      console.log('Failed to get GPUs Lamp0 storage locations');
      return;
    }
      this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
      this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
      this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
      this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
      this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
    if( !this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny) {
      console.log('.init() Failed to get GPU location of uniforms of matl0 or lamp0');
      return;
    }

    this.u_lightOnLoc = gl.getUniformLocation(this.shaderLoc, 'u_lightOn');
      if(!this.u_lightOnLoc) {
        console.log('.init() Failed to get GPU location of unifrom u_lightOn');
        return;
          }
  
  
      this.u_lightTypeLoc = gl.getUniformLocation(this.shaderLoc, 'v_lightType');
      if(!this.u_lightTypeLoc) {
        console.log('.init() Failed to get GPU location of varying LightType');
        return;
      } 
    /*this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
    this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
    this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
    this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
    this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
    if(!this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd 
                      || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny
       ) {
      console.log('Failed to get GPUs Reflectance storage locations');
      return;
}*/
  
  }
  
  VBObox2.prototype.switchToMe = function () {
  //==============================================================================
  // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
  //
  // We only do this AFTER we called the init() function, which does the one-time-
  // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
  // even then, you are STILL not ready to draw our VBObox's contents onscreen!
  // We must also first complete these steps:
  //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
  //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
  //  c) tell the GPU to connect the shader program's attributes to that VBO.
  
  // a) select our shader program:
    gl.useProgram(this.shaderLoc);	
  //		Each call to useProgram() selects a shader program from the GPU memory,
  // but that's all -- it does nothing else!  Any previously used shader program's 
  // connections to attributes and uniforms are now invalid, and thus we must now
  // establish new connections between our shader program's attributes and the VBO
  // we wish to use.  
    
  // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
  //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
  //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
                      this.vboLoc);			// the ID# the GPU uses for our VBO.
  
  // c) connect our newly-bound VBO to supply attribute variable values for each
  // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
  // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
      this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
      this.vboFcount_a_Pos1, // # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,		  // type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.vboOffset_a_Pos1);						
                    // Offset == how many bytes from START of buffer to the first
                    // value we will actually use?  (we start with position).
    gl.vertexAttribPointer(this.a_Colr1Loc, this.vboFcount_a_Colr1,
                           gl.FLOAT, false, 
                           this.vboStride,  this.vboOffset_a_Colr1);
    gl.vertexAttribPointer(this.a_normalLoc, 3, gl.FLOAT, false, this.vboStride, 0);
    //gl.vertexAttribPointer(this.a_PtSiz1Loc,this.vboFcount_a_PtSiz1, 
                           //gl.FLOAT, false, 
                           //this.vboStride,	this.vboOffset_a_PtSiz1);	
    //-- Enable this assignment of the attribute to its' VBO source:
    gl.enableVertexAttribArray(this.a_Pos1Loc);
    //gl.enableVertexAttribArray(this.a_Colr1Loc);
    gl.enableVertexAttribArray(this.a_normalLoc);
    //gl.enableVertexAttribArray(this.a_PtSiz1Loc);
  
    this.eyePosWorld.set([eyex, eyey, eyez]);
    this.lamp0.I_pos.elements.set( [lampx, lampy, lampz]);
    this.lamp0.I_ambi.elements.set([ambr, ambg, ambb]);
    this.lamp0.I_diff.elements.set([difr, difg, difb]);
    this.lamp0.I_spec.elements.set([specr, specg, specb]);
    gl.uniform3fv(this.lamp0.u_pos, this.lamp0.I_pos.elements.slice(0, 3));
    gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);        // ambient
    gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);        // diffuse
    gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);        // Specular
    gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0, 3));                // Ke emissive
    gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0, 3));                // Ka ambient
    gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0, 3));                // Kd    diffuse
    gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0, 3));                // Ks specular
    gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny
      
    gl.uniform1i(this.u_lightTypeLoc, lightType);
    gl.uniform1i(this.u_lightOnLoc, lightOn);

    // Set the light color (white)
    //gl.uniform3f(this.u_LightColorLoc, 0.8, 0.4, 0.0);
    // Set the light direction (in the world coordinate)
    //gl.uniform3f(this.u_LightPositionLoc, 5.0, 8.0, 7.0);
    // Set the ambient light
    //gl.uniform3f(this.u_AmbientLightLoc, 0.4, 0.4, 0.4);
  }
  
  VBObox2.prototype.isReady = function() {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
  
  var isOK = true;
  
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
      console.log(this.constructor.name + 
                  '.isReady() false: shader program at this.shaderLoc not in use!');
      isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                '.isReady() false: vbo at this.vboLoc not in use!');
      isOK = false;
    }
    return isOK;
  }
  
  VBObox2.prototype.adjust = function() {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                  '.adjust() call you needed to call this.switchToMe()!!');
      }
      
      
      
      
      
      // Adjust values for our uniforms,
      this.ModelMatrix.setIdentity();
    // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
      //this.ModelMatrix.set(g_worldMat);
      
    //  this.ModelMatrix.rotate(g_angleNow1, 0, 0, 1);	// -spin drawing axes,
      this.ModelMatrix.translate(0.0, 8.0, 0);
      this.ModelMatrix.rotate(g_angleNow0, 0, 0);
      //this.ModelMatrix.rotate(g_angleNow0, 0, 0);						// then translate them.
      //  Transfer new uniforms' values to the GPU:-------------
      // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
      gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
                          false, 										// use matrix transpose instead?
                          this.ModelMatrix.elements);	// send data from Javascript.
      
      this.MvpMatrix.set(g_worldMat);
      this.MvpMatrix.multiply(this.ModelMatrix);
      gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
      this.NormalMatrix.setInverseOf(this.ModelMatrix);
      this.NormalMatrix.transpose();
      gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
    
    
    }
    
    VBObox2.prototype.draw = function() {
    //=============================================================================
    // Send commands to GPU to select and render current VBObox contents.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                  '.draw() call you needed to call this.switchToMe()!!');
      }
      
      // ----------------------------Draw the contents of the currently-bound VBO:
      //gl.uniform3fv(this.u_eyePosLoc, this.eyePos);// use it to set our uniform
      //gl.uniform1i(this.u_lightType, lightType);
      gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
                      // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                      //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
                      spherestart1/7, 								// location of 1st vertex to draw;
                      (this.vboContents.length/7)-3);//(this.vboContents.length/7)-3);		// number of vertices to draw on-screen.
      this.ModelMatrix.rotate(g_angleNow1, 1, 0, 0);
      this.ModelMatrix.translate(0.0 ,0.0, 1.5);
                this.ModelMatrix.scale(0.6, 0.6, 0.6);
                //this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
      gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
      this.MvpMatrix.set(g_worldMat);
      this.MvpMatrix.multiply(this.ModelMatrix);
      gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
      this.NormalMatrix.setInverseOf(this.ModelMatrix);
      this.NormalMatrix.transpose();
      gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);

      gl.drawArrays(gl.TRIANGLES,	spherestart1/7, (this.vboContents.length/7)-3);

      this.ModelMatrix.rotate(g_angleNow1, 1, 0, 0);
      this.ModelMatrix.translate(0.0 ,0.0, 1.5);
                this.ModelMatrix.scale(0.6, 0.6, 0.6);
                //this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
      gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
      this.MvpMatrix.set(g_worldMat);
      this.MvpMatrix.multiply(this.ModelMatrix);
      gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
      this.NormalMatrix.setInverseOf(this.ModelMatrix);
      this.NormalMatrix.transpose();
      gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);

      gl.drawArrays(gl.TRIANGLES,	spherestart1/7, (this.vboContents.length/7)-3);
                      
    }
  
  
  VBObox2.prototype.reload = function() {
  //=============================================================================
  // Over-write current values in the GPU for our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.
  
   gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                    0,                  // byte offset to where data replacement
                                        // begins in the VBO.
                      this.vboContents);   // the JS source-data array used to fill VBO
  }
  /*
  VBObox2.prototype.empty = function() {
  //=============================================================================
  // Remove/release all GPU resources used by this VBObox object, including any 
  // shader programs, attributes, uniforms, textures, samplers or other claims on 
  // GPU memory.  However, make sure this step is reversible by a call to 
  // 'restoreMe()': be sure to retain all our Float32Array data, all values for 
  // uniforms, all stride and offset values, etc.
  //
  //
  // 		********   YOU WRITE THIS! ********
  //
  //
  //
  }
  
  VBObox2.prototype.restore = function() {
  //=============================================================================
  // Replace/restore all GPU resources used by this VBObox object, including any 
  // shader programs, attributes, uniforms, textures, samplers or other claims on 
  // GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
  // all stride and offset values, etc.
  //
  //
  // 		********   YOU WRITE THIS! ********
  //
  //
  //
  }
  */



  function VBObox3() {  ////Phong shaded sphere
    //=============================================================================
    //=============================================================================
    // CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
    // needed to render vertices from one Vertex Buffer Object (VBO) using one 
    // separate shader program (a vertex-shader & fragment-shader pair) and one
    // set of 'uniform' variables.
    
    // Constructor goal: 
    // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
    // written into code) in all other VBObox functions. Keeping all these (initial)
    // values here, in this one coonstrutor function, ensures we can change them 
    // easily WITHOUT disrupting any other code, ever!
      
      this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
      'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
      'precision highp int;\n' +
      //
      'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
	    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
	    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
	    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
	    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
	    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
      '		};\n' +
      'struct LampT {\n' +		// Describes one point-like Phong light source
      '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                              //		   w==0.0 for distant light from x,y,z direction 
      ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
      ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
      '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
      '}; \n' +
      'uniform MatlT u_MatlSet[1];\n' +
      'uniform mat4 u_ModelMatrix;\n' +
      'attribute vec4 a_Pos1;\n' +
      //'attribute vec3 a_Colr1;\n'+
      //'attribute float a_PtSiz1; \n' +
      'varying vec4 v_Colr1;\n' +  
      'attribute vec4 a_Normal;\n' +    //added
      'uniform mat4 u_MvpMatrix;\n' +   //added
      'uniform mat4 u_NormalMatrix;\n' +   // added Transformation matrix of the normal
      'uniform LampT u_LampSet[1];\n' +
      'uniform bool u_lightOn;\n' +
      'uniform bool v_lightType;\n' +
      'uniform vec3 u_eyePosWorld; \n' + 
      'varying vec3 v_Kd; \n' +
      'varying vec3 v_Normal;\n' +       //NEW added
      'varying vec4 v_Position;\n' +     // NEW addded
      //'uniform vec3 u_LightColor;\n' +     // added Light color (((Diffuse Color))))
      //'uniform vec3 u_LightPosition;\n' +  // added  Position of the light source
      //'uniform vec3 u_AmbientLight;\n' +   // added  Ambient light color
      //
      'void main() {\n' +
      //'  gl_PointSize = a_PtSiz1;\n' +
      '  gl_Position = u_MvpMatrix * a_Pos1;\n' +
      '  v_Position = u_ModelMatrix * a_Pos1;\n' + 
      '	 v_Kd = u_MatlSet[0].diff; \n' +
      '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
      '  vec3 normal = normalize(v_Normal); \n' +
      '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
      '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
      '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
      '  float e64; \n' +
      'if(v_lightType){\n' +
        '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
        '  float nDotH = max(dot(H, normal), 0.0); \n' +
         ' e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
      '}\n' +
      'else{\n' +
        '  vec3 H = normalize(reflect((-lightDirection), normal));\n' +
        '   float nDotH = max(dot(H, eyeDirection), 0.0); \n' +
        ' float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
      '}\n' +
      '	 vec3 emissive = u_MatlSet[0].emit;' +
      '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
      '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
      '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
      ' if(u_lightOn) {\n' +
      '	 vec4 color = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
      '  v_Colr1 = color;\n' +
        '}\n' +
      ' else {\n' +
      '	 vec4 color = vec4(0, 0, 0, 1.0);\n' +
      '  v_Colr1 = color;}\n' +
      //added
         // Calculate a normal to be fit with a model matrix, and make it 1.0 in length
      //'  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
         // Calculate world coordinate of vertex
      //'  vec4 vertexPosition = u_ModelMatrix * a_Pos1;\n' +
         // Calculate the light direction and make it 1.0 in length
      //'  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
         // The dot product of the light direction and the normal
      //'  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
         // Calculate the color due to diffuse reflection
      //'  vec3 diffuse = u_LightColor * nDotL;\n' + // * color.rgb
         // Calculate the color due to ambient reflection
      //'  vec3 ambient = u_AmbientLight;\n' + // * color.rgb
         // Add the surface colors due to diffuse reflection and ambient reflection
      //'  v_Colr1 = vec4(diffuse + ambient, color.a);\n' + 
      ' }\n';
    /*
     // SQUARE dots:
      this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
      'precision mediump float;\n' +
      'varying vec3 v_Colr1;\n' +
      'void main() {\n' +
      '  gl_FragColor = vec4(v_Colr1, 1.0);\n' +  
      '}\n';
    */
    /*
     // ROUND FLAT dots:
      this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
      'precision mediump float;\n' +
      'varying vec3 v_Colr1;\n' +
      'void main() {\n' +
      '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' + 
      '  if(dist < 0.5) {\n' +
      '    gl_FragColor = vec4(v_Colr1, 1.0);\n' +  
      '    } else {discard;};' +
      '}\n';
    */
    /*
     // SHADED, sphere-like dots:
      this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
      'precision mediump float;\n' +
      'varying vec3 v_Colr1;\n' +
      'void main() {\n' +
      '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' + 
      '  if(dist < 0.5) {\n' + 
       '  	gl_FragColor = vec4((1.0-2.0*dist)*v_Colr1.rgb, 1.0);\n' +
      '    } else {discard;};' +
      '}\n';
      */
    
      this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
      //'#ifdef GL_ES\n' +
      'precision highp float;\n' +
      'precision highp int;\n' +
      //'#endif\n' +
      'struct LampT {\n' +		// Describes one point-like Phong light source
	    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
													//		   w==0.0 for distant light from x,y,z direction 
	    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
	    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
	    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
	    '}; \n' +
      'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
	    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
	    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
	    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
	    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
	    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
      '		};\n' +
      //-------------UNIFORMS: values set from JavaScript before a drawing command.
      // first light source: (YOU write a second one...)
	    'uniform LampT u_LampSet[1];\n' +		// Array of all light sources.
	    'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
      'uniform bool v_lightType;\n' +
      'uniform bool u_lightOn;\n' +
	    //
      'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
  
      'varying vec4 v_Colr1;\n' +
      'varying vec3 v_Kd;	\n' +	
      //'uniform vec3 u_LightColor;\n' +     // Light color
      //'uniform vec3 u_LightPosition;\n' +  // Position of the light source
      //'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
      'varying vec3 v_Normal;\n' +
      'varying vec4 v_Position;\n' +
      'void main() {\n' +
         // Normalize the normal because it is interpolated and not 1.0 in length any more
      '  vec3 normal = normalize(v_Normal);\n' +
         // Calculate the light direction and make it 1.0 in length
      '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
         // Find the unit-length eye-direction vector 'V' (surface pt --> camera)
      '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
         // The dot product of the light direction and the normal
      '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +

      '  float e64; \n' +
      'if(v_lightType==true){\n' +
        '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
        '  float nDotH = max(dot(H, normal), 0.0); \n' +
        ' e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
      '}\n' +
      'else{\n' +
        '  vec3 H = normalize(reflect((-lightDirection), normal));\n' +
        '   float nDotH = max(dot(H, eyeDirection), 0.0); \n' +
        ' float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
      '}\n' +
      
      //'  vec3 H = normalize(lightDirection + eyeDirection); \n' +
      //'  float nDotH = max(dot(H, normal), 0.0); \n' +
      //'  float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
      '	 vec3 emissive = 										u_MatlSet[0].emit;' +
      '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
      '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
      '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +

      ' if(u_lightOn) {\n' +
        '	 gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
      '}\n' +
      ' else {\n' +
        ' gl_FragColor = vec4(0, 0, 0, 1.0);}\n' +
      //'  gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
         // Calculate the final color from diffuse reflection and ambient reflection
      //'  vec3 diffuse = u_LightColor * nDotL;\n' +
      //'  vec3 ambient = u_AmbientLight;\n' +
      //'  gl_FragColor = vec4(diffuse + ambient, v_Colr1.a);\n' +
      '}\n';
    
      this.vboContents = //---------------------------------------------------------
        new Float32Array ([					// Array of vertex attribute values we will
                                    // transfer to GPU's vertex buffer object (VBO)
          // 1 vertex per line: pos1 x,y,z,w;   colr1; r,g,b;   ptSiz1; 
        -0.3,  0.7,	0.0, 1.0,		0.0, 1.0, 1.0,  //17.0,
        -0.3, -0.3, 0.0, 1.0,		1.0, 0.0, 1.0,  //20.0,
         0.3, -0.3, 0.0, 1.0,		1.0, 1.0, 0.0,  //33.0,
      ]);	
    
      var floatsPerVertex = 7;
      
      makesphere();
      savesize1 = this.vboContents.length;
          var mySiz = (spherepoints.length + this.vboContents.length);
          var mypoints = new Float32Array(mySiz);
              //lineStart = 0;           // next, we'll store the sphere;
            for(i=0, j=0; j< this.vboContents.length; i++, j++) {// don't initialize i -- reuse it!
              mypoints[i] = this.vboContents[j];
              }
              spherestart1 = i;             // we stored the cylinder first.
            for(j=0; j< spherepoints.length; i++,j++) {
              mypoints[i] = spherepoints[j];
              }
          this.vboContents = mypoints;
      
      this.vboVerts = (this.vboContents.length /floatsPerVertex);							// # of vertices held in 'vboContents' array;
      this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
                                    // bytes req'd by 1 vboContents array element;
                                    // (why? used to compute stride and offset 
                                    // in bytes for vertexAttribPointer() calls)
      this.vboBytes = this.vboContents.length * this.FSIZE;               
                                    // (#  of floats in vboContents array) * 
                                    // (# of bytes/float).
      this.vboStride = this.vboBytes / this.vboVerts;     
                                    // (== # of bytes to store one complete vertex).
                                    // From any attrib in a given vertex in the VBO, 
                                    // move forward by 'vboStride' bytes to arrive 
                                    // at the same attrib for the next vertex.
                                     
                  //----------------------Attribute sizes
      this.vboFcount_a_Pos1 =  4;    // # of floats in the VBO needed to store the
                                    // attribute named a_Pos1. (4: x,y,z,w values)
      this.vboFcount_a_Colr1 = 3;   // # of floats for this attrib (r,g,b values)
      //this.vboFcount_a_PtSiz1 = 0;  // # of floats for this attrib (just one!)   
      console.assert((this.vboFcount_a_Pos1 +     // check the size of each and
                      this.vboFcount_a_Colr1 ) * //+
                     // this.vboFcount_a_PtSiz1) *   // every attribute in our VBO
                      this.FSIZE == this.vboStride, // for agreeement with'stride'
                      "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
                      
                  //----------------------Attribute offsets
      this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
                                    // of 1st a_Pos1 attrib value in vboContents[]
      this.vboOffset_a_Colr1 = (this.vboFcount_a_Pos1) * this.FSIZE;  
                                    // == 4 floats * bytes/float
                                    //# of bytes from START of vbo to the START
                                    // of 1st a_Colr1 attrib value in vboContents[]
      this.vboOffset_a_PtSiz1 =(this.vboFcount_a_Pos1 +
                                this.vboFcount_a_Colr1) * this.FSIZE; 
                                    // == 7 floats * bytes/float
                                    // # of bytes from START of vbo to the START
                                    // of 1st a_PtSize attrib value in vboContents[]
    
                  //-----------------------GPU memory locations:                                
      this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                    // returned by gl.createBuffer() function call
      this.shaderLoc;								// GPU Location for compiled Shader-program  
                                    // set by compile/link of VERT_SRC and FRAG_SRC.
                              //------Attribute locations in our shaders:
      this.a_Pos1Loc;							  // GPU location: shader 'a_Pos1' attribute
      this.a_Colr1Loc;							// GPU location: shader 'a_Colr1' attribute
      this.a_PtSiz1Loc;							// GPU location: shader 'a_PtSiz1' attribute
      
                  //---------------------- Uniform locations &values in our shaders
      this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
      this.u_ModelMatrixLoc;						// GPU location for u_ModelMat uniform
    
      this.MvpMatrix = new Matrix4();
      this.u_MvpMatrixLoc; 
      
      
      this.NormalMatrix = new Matrix4();
      this.u_NormalMatrixLoc; 

      this.eyepos = new Float32Array(3);
      this.u_eyePosWorldLoc;

      this.uLoc_ModelMatrix 	= false;
      this.uLoc_MvpMatrix 		= false;
      this.uLoc_NormalMatrix = false;

      this.eyePosWorld = new Float32Array(3);
      
      this.lamp0 = new LightsT();

      this.matlSel = MATL_BRASS;				// see keypress(): 'm' key changes matlSel
      this.matl0 = new Material(this.matlSel);

      this.u_lightOnLoc;
    
      this.u_lightTypeLoc;
      
      //this.u_LightColorLoc;
      //this.u_LightPositionLoc;
      //this.u_AmbientLightLoc;
    };
    
    
    VBObox3.prototype.init = function() {
    //==============================================================================
    // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
    // kept in this VBObox. (This function usually called only once, within main()).
    // Specifically:
    // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
    //  executable 'program' stored and ready to use inside the GPU.  
    // b) create a new VBO object in GPU memory and fill it by transferring in all
    //  the vertex data held in our Float32array member 'VBOcontents'. 
    // c) Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
    // -------------------
    // CAREFUL!  before you can draw pictures using this VBObox contents, 
    //  you must call this VBObox object's switchToMe() function too!
    //--------------------
    // a) Compile,link,upload shaders-----------------------------------------------
      this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
      if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                    '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
      }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
    
      gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
    
    // b) Create VBO on GPU, fill it------------------------------------------------
      this.vboLoc = gl.createBuffer();	
      if (!this.vboLoc) {
        console.log(this.constructor.name + 
                    '.init() failed to create VBO in GPU. Bye!'); 
        return;
      }
      
      // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
      //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
      // (positions, colors, normals, etc), or 
      //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
      // that each select one vertex from a vertex array stored in another VBO.
      gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                      this.vboLoc);				  // the ID# the GPU uses for this buffer.
                            
      // Fill the GPU's newly-created VBO object with the vertex data we stored in
      //  our 'vboContents' member (JavaScript Float32Array object).
      //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
      //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
      gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                        this.vboContents, 		// JavaScript Float32Array
                       gl.STATIC_DRAW);			// Usage hint.  
      //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
      //	(see OpenGL ES specification for more info).  Your choices are:
      //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
      //				contents rarely or never change.
      //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
      //				contents may change often as our program runs.
      //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
      // 			times and then discarded; for rapidly supplied & consumed VBOs.
    
    // c1) Find All Attributes:-----------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
      this.a_Pos1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
      if(this.a_Pos1Loc < 0) {
        console.log(this.constructor.name + 
                    '.init() Failed to get GPU location of attribute a_Pos1');
        return -1;	// error exit.
      }
       //this.a_Colr1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Colr1');
      //if(this.a_Colr1Loc < 0) {
       // console.log(this.constructor.name + 
       //             '.init() failed to get the GPU location of attribute a_Colr1');
        //return -1;	// error exit.
      //}
      //this.a_PtSiz1Loc = gl.getAttribLocation(this.shaderLoc, 'a_PtSiz1');
      //if(this.a_PtSiz1Loc < 0) {
        //console.log(this.constructor.name + 
         // 					'.init() failed to get the GPU location of attribute a_PtSiz1');
        //return -1;	// error exit.
      //}
      // c2) Find All Uniforms:-----------------------------------------------------
      //Get GPU storage location for each uniform var used in our shader programs: 
     this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
      if (!this.u_ModelMatrixLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
      }

      this.eyePosWorldLoc  = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');


      this.a_normalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
      this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
      this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
      //this.u_LightColorLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightColor');
      //this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
      //this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');

      //if (!this.u_MvpMatrixLoc || !this.u_NormalMatrixLoc || !this.u_LightColorLoc || !this.u_LightPositionLoc　|| !this.u_AmbientLightLoc || !this.eyePosWorldLoc) { 
      //  console.log('Failed to get the storage location');
      //  return;
      //}

      if (!this.u_MvpMatrixLoc || !this.u_NormalMatrixLoc || !this.eyePosWorldLoc) { 
        console.log('Failed to get the storage location');
        return;
      }

      this.lamp0.u_pos  = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos');	
      this.lamp0.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].ambi');
      this.lamp0.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].diff');
      this.lamp0.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].spec');
      if( !this.lamp0.u_pos || !this.lamp0.u_ambi	|| !this.lamp0.u_diff || !this.lamp0.u_spec	) {
        console.log('Failed to get GPUs Lamp0 storage locations');
        return;
      }
        this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
        this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
        this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
        this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
        this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
      if( !this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny) {
        console.log('.init() Failed to get GPU location of uniforms of matl0 or lamp0');
        return;
      }

      this.u_lightOnLoc = gl.getUniformLocation(this.shaderLoc, 'u_lightOn');
        if(!this.u_lightOnLoc) {
          console.log('.init() Failed to get GPU location of unifrom u_lightOn');
          return;
            }
    
    
        this.u_lightTypeLoc = gl.getUniformLocation(this.shaderLoc, 'v_lightType');
        if(!this.u_lightTypeLoc) {
          console.log('.init() Failed to get GPU location of varying LightType');
          return;
        } 
      /*this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
	    this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
	    this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
	    this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
	    this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
	    if(!this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd 
			  	  		        || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny
		     ) {
		    console.log('Failed to get GPUs Reflectance storage locations');
		    return;
	}*/
    
    }
    
    VBObox3.prototype.switchToMe = function () {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.
    
    // a) select our shader program:
      gl.useProgram(this.shaderLoc);	
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  
      
    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    //    supply values to use as attributes in our newly-selected shader program:
      gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
                        this.vboLoc);			// the ID# the GPU uses for our VBO.
    
    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
      // 	Here's how to use the almost-identical OpenGL version of this function:
      //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
      gl.vertexAttribPointer(
        this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
        this.vboFcount_a_Pos1, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
                      //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                      // stored attrib for this vertex to the same stored attrib
                      //  for the next vertex in our VBO.  This is usually the 
                      // number of bytes used to store one complete vertex.  If set 
                      // to zero, the GPU gets attribute values sequentially from 
                      // VBO, starting at 'Offset'.	
                      // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Pos1);						
                      // Offset == how many bytes from START of buffer to the first
                      // value we will actually use?  (we start with position).
      gl.vertexAttribPointer(this.a_Colr1Loc, this.vboFcount_a_Colr1,
                             gl.FLOAT, false, 
                             this.vboStride,  this.vboOffset_a_Colr1);
      gl.vertexAttribPointer(this.a_normalLoc, 3, gl.FLOAT, false, this.vboStride, 0);
      //gl.vertexAttribPointer(this.a_PtSiz1Loc,this.vboFcount_a_PtSiz1, 
                             //gl.FLOAT, false, 
                             //this.vboStride,	this.vboOffset_a_PtSiz1);	
      //-- Enable this assignment of the attribute to its' VBO source:
      gl.enableVertexAttribArray(this.a_Pos1Loc);
      //gl.enableVertexAttribArray(this.a_Colr1Loc);
      gl.enableVertexAttribArray(this.a_normalLoc);
      //gl.enableVertexAttribArray(this.a_PtSiz1Loc);
    
      this.eyePosWorld.set([eyex, eyey, eyez]);
      this.lamp0.I_pos.elements.set( [lampx, lampy, lampz]);
      this.lamp0.I_ambi.elements.set([ambr, ambg, ambb]);
      this.lamp0.I_diff.elements.set([difr, difg, difb]);
      this.lamp0.I_spec.elements.set([specr, specg, specb]);
      gl.uniform3fv(this.lamp0.u_pos, this.lamp0.I_pos.elements.slice(0, 3));
      gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);        // ambient
      gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);        // diffuse
      gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);        // Specular
      gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0, 3));                // Ke emissive
      gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0, 3));                // Ka ambient
      gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0, 3));                // Kd    diffuse
      gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0, 3));                // Ks specular
      gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny
        
      gl.uniform1i(this.u_lightTypeLoc, lightType);
      gl.uniform1i(this.u_lightOnLoc, lightOn);

      // Set the light color (white)
      //gl.uniform3f(this.u_LightColorLoc, 0.8, 0.4, 0.0);
      // Set the light direction (in the world coordinate)
      //gl.uniform3f(this.u_LightPositionLoc, 5.0, 8.0, 7.0);
      // Set the ambient light
      //gl.uniform3f(this.u_AmbientLightLoc, 0.4, 0.4, 0.4);
    }
    
    VBObox3.prototype.isReady = function() {
    //==============================================================================
    // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
    // this objects VBO and shader program; else return false.
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
    
    var isOK = true;
    
      if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                    '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
      }
      if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
          console.log(this.constructor.name + 
                  '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
      }
      return isOK;
    }
    
    VBObox3.prototype.adjust = function() {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                  '.adjust() call you needed to call this.switchToMe()!!');
      }
      
      
      
      
      
      // Adjust values for our uniforms,
      this.ModelMatrix.setIdentity();
    // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
      //this.ModelMatrix.set(g_worldMat);
      this.ModelMatrix.translate(0.0, 1.5, 0);
      this.ModelMatrix.rotate(g_angleNow0, 0, 0);
    //  this.ModelMatrix.rotate(g_angleNow1, 0, 0, 1);	// -spin drawing axes,
      						// then translate them.
      //  Transfer new uniforms' values to the GPU:-------------
      // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
      gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
                          false, 										// use matrix transpose instead?
                          this.ModelMatrix.elements);	// send data from Javascript.
      
      this.MvpMatrix.set(g_worldMat);
      this.MvpMatrix.multiply(this.ModelMatrix);
      
      gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
    
    
      this.NormalMatrix.setInverseOf(this.ModelMatrix);
      this.NormalMatrix.transpose();
    
      gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
    
    
    }
    
    VBObox3.prototype.draw = function() {
    //=============================================================================
    // Send commands to GPU to select and render current VBObox contents.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                  '.draw() call you needed to call this.switchToMe()!!');
      }
      
      // ----------------------------Draw the contents of the currently-bound VBO:
      gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
                      // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                      //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
                    spherestart1/7, 								// location of 1st vertex to draw;
                    (this.vboContents.length/7)-3);		// number of vertices to draw on-screen.
    }
    
    
    VBObox3.prototype.reload = function() {
    //=============================================================================
    // Over-write current values in the GPU for our already-created VBO: use 
    // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
    // contents to our VBO without changing any GPU memory allocations.
    
     gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                      0,                  // byte offset to where data replacement
                                          // begins in the VBO.
                        this.vboContents);   // the JS source-data array used to fill VBO
    }
    


    function VBObox4() {
      //=============================================================================
      //=============================================================================
      // CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
      // needed to render vertices from one Vertex Buffer Object (VBO) using one 
      // separate shader program (a vertex-shader & fragment-shader pair) and one
      // set of 'uniform' variables.
      
      // Constructor goal: 
      // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
      // written into code) in all other VBObox functions. Keeping all these (initial)
      // values here, in this one coonstrutor function, ensures we can change them 
      // easily WITHOUT disrupting any other code, ever!
        
        this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
        'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
        'precision highp int;\n' +
        'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
        '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
        '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
        '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
        '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
        '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
        '		};\n' +
        'struct LampT {\n' +		// Describes one point-like Phong light source
        '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                                //		   w==0.0 for distant light from x,y,z direction 
        ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
        ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
        '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
        '}; \n' +
        //
        'attribute vec4 a_Pos1;\n' +
        'attribute vec4 a_Normal;\n' +    //added
        'uniform mat4 u_ModelMatrix;\n' +
        'uniform mat4 u_MvpMatrix;\n' +   //added
        'uniform mat4 u_NormalMatrix;\n' +   // added Transformation matrix of the normal
        'uniform vec3 u_eyePos; \n' +
        'uniform MatlT u_MatlSet[1];\n' +
        'uniform LampT u_LampSet[1];\n' +
        'uniform bool u_lightOn;\n' +
        'uniform bool v_lightType;\n' +
        //-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
        'varying vec3 v_Kd; \n' +
        'varying vec4 v_Position; \n' +				
        'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0
        'varying vec4 v_Color;\n' +
        //
        
        //'attribute vec3 a_Colr1;\n'+
        //'varying vec4 v_Colr1;\n' +  
        //'uniform vec3 u_LightColor;\n' +     // added Light color (((Diffuse Color))))
        //'uniform vec3 u_LightPosition;\n' +  // added  Position of the light source
        //'uniform vec3 u_AmbientLight;\n' +   // added  Ambient light color
        
        //
        'void main() {\n' +
        //'  gl_PointSize = a_PtSiz1;\n' +
        '  gl_Position = u_MvpMatrix * a_Pos1;\n' +
        '  v_Position = u_ModelMatrix * a_Pos1;\n' +
        '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
        '	 v_Kd = u_MatlSet[0].diff; \n' +
        '  vec3 normal = normalize(v_Normal);\n' +
        '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
        '  vec3 eyeDirection = normalize(u_eyePos - v_Position.xyz); \n' +
        '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
        '  float e64; \n' +
        'if(v_lightType){\n' +
          '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
          '  float nDotH = max(dot(H, normal), 0.0); \n' +
          ' e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
        '}\n' +
        'else{\n' +
          '  vec3 H = normalize(reflect((-lightDirection), normal));\n' +
          '   float nDotH = max(dot(H, eyeDirection), 0.0); \n' +
          ' float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
        '}\n' +
        '	 vec3 emissive = 	u_MatlSet[0].emit;' +
        '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
        '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
        '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
        ' if(u_lightOn) {\n' +
        '	 v_Color = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
          '}\n' +
        ' else {\n' +
        ' v_Color = vec4(0, 0, 0, 1.0);}\n' +
      
        //'	 vec4 color = vec4(a_Colr1.x, a_Colr1.y, a_Colr1.z, 1.0);\n' + 
        //added
           // Calculate a normal to be fit with a model matrix, and make it 1.0 in length
           // Calculate world coordinate of vertex
        //'  vec4 vertexPosition = u_ModelMatrix * a_Pos1;\n' +
           // Calculate the light direction and make it 1.0 in length
        //'  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
           // The dot product of the light direction and the normal
        //'  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
        
           // Calculate the color due to diffuse reflection
        //'  vec3 diffuse = u_LightColor * nDotL;\n' + // * color.rgb
           // Calculate the color due to ambient reflection
        //'  vec3 ambient = u_AmbientLight;\n' + // * color.rgb
           // Add the surface colors due to diffuse reflection and ambient reflection
        //'  v_Colr1 = vec4(diffuse + ambient, color.a);\n' + 
        ' }\n';
      /*
       // SQUARE dots:
        this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        'precision mediump float;\n' +
        'varying vec3 v_Colr1;\n' +
        'void main() {\n' +
        '  gl_FragColor = vec4(v_Colr1, 1.0);\n' +  
        '}\n';
      */
      /*
       // ROUND FLAT dots:
        this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        'precision mediump float;\n' +
        'varying vec3 v_Colr1;\n' +
        'void main() {\n' +
        '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' + 
        '  if(dist < 0.5) {\n' +
        '    gl_FragColor = vec4(v_Colr1, 1.0);\n' +  
        '    } else {discard;};' +
        '}\n';
      */
      /*
       // SHADED, sphere-like dots:
        this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        'precision mediump float;\n' +
        'varying vec3 v_Colr1;\n' +
        'void main() {\n' +
        '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' + 
        '  if(dist < 0.5) {\n' + 
         '  	gl_FragColor = vec4((1.0-2.0*dist)*v_Colr1.rgb, 1.0);\n' +
        '    } else {discard;};' +
        '}\n';
        */
      
        this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        'precision mediump float;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Color;\n' + 
        '}\n';
        makesphere();
        c30 = Math.sqrt(0.75);          // == cos(30deg) == sqrt(3) / 2
        sq2 = Math.sqrt(2.0);
        this.vboContents = spherepoints//--------------------------------------------------------
          /*new Float32Array ([					// Array of vertex attribute values we will
                                      // transfer to GPU's vertex buffer object (VBO)
            // 1 vertex per line: pos1 x,y,z,w;   colr1; r,g,b;   ptSiz1; 
            0.0,  0.5, 1.4, 1.0,     0.8,  0.4,  0.3,  // Node 0
            0.8, 0.0, 0.0, 1.0,     0.8,  0.4,  0.3,  // Node 1
            0.0,  1.5, 0.0, 1.0,      0.8,  0.4,  0.3,  // Node 2
                 // Face 1: (right side)
              0.0,   0.5, 1.4, 1.0,     -0.8,  0.4,  0.3,  // Node 0
            0.0,  1.5, 0.0, 1.0,      -0.8,  0.4,  0.3,  // Node 2
             -0.8, 0.0, 0.0, 1.0,     -0.8, 0.4, 0.3,  // Node 3
               // Face 2: (lower side)
              0.0,   0.5, 1.4, 1.0,     0.0,  -0.9,  0.3,  // Node 0 
             -0.8, 0.0, 0.0, 1.0,     0.0,  -0.9,  0.3,  // Node 3
            0.8, 0.0, 0.0, 1.0,     0.0,  -0.9,  0.3,  // Node 1 
              // Face 3: (base side)  
             -0.8, 0.0,  0.0, 1.0,    0.0,  0.0,  -1.0,  // Node 3
            0.0,  1.5,  0.0, 1.0,   0.0,  0.0,  -1.0,  // Node 2
            0.8, 0.0,  0.0, 1.0,    0.0,  0.0,  -1.0,
            //axis
            0.0,  0.0,  0.0, 1.0,   0.3,  0.3,  0.3,  // X axis line (origin: gray)
               5.0,  0.0,  0.0, 1.0,    1.0,  0.3,  0.3,  //             (endpoint: red)
               
               0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,  // Y axis line (origin: white)
               0.0,  5.0,  0.0, 1.0,    0.3,  1.0,  0.3,  //             (endpoint: green)
          
               0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,  // Z axis line (origin:white)
               0.0,  0.0,  5.0, 1.0,    0.3,  0.3,  1.0  //33.0,
        ]);	*/
      
        var floatsPerVertex = 7;
        
        /*maketriangle();
        savesize1 = this.vboContents.length;
            var mySiz = (trianglepoints.length + this.vboContents.length);
            var mypoints = new Float32Array(mySiz);
                //lineStart = 0;           // next, we'll store the sphere;
              for(i=0, j=0; j< this.vboContents.length; i++, j++) {// don't initialize i -- reuse it!
                mypoints[i] = this.vboContents[j];
                }
                spherestart1 = i;             // we stored the cylinder first.
              for(j=0; j< trianglepoints.length; i++,j++) {
                mypoints[i] = trianglepoints[j];
                }
            this.vboContents = mypoints;
        */
        this.vboVerts = (this.vboContents.length /floatsPerVertex);							// # of vertices held in 'vboContents' array;
        this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
                                      // bytes req'd by 1 vboContents array element;
                                      // (why? used to compute stride and offset 
                                      // in bytes for vertexAttribPointer() calls)
        this.vboBytes = this.vboContents.length * this.FSIZE;               
                                      // (#  of floats in vboContents array) * 
                                      // (# of bytes/float).
        this.vboStride = this.vboBytes / this.vboVerts;     
                                      // (== # of bytes to store one complete vertex).
                                      // From any attrib in a given vertex in the VBO, 
                                      // move forward by 'vboStride' bytes to arrive 
                                      // at the same attrib for the next vertex.
                                       
                    //----------------------Attribute sizes
        this.vboFcount_a_Pos1 =  4;    // # of floats in the VBO needed to store the
                                      // attribute named a_Pos1. (4: x,y,z,w values)
        this.vboFcount_a_Colr1 = 3;   // # of floats for this attrib (r,g,b values)
        //this.vboFcount_a_PtSiz1 = 0;  // # of floats for this attrib (just one!)   
        console.assert((this.vboFcount_a_Pos1 +     // check the size of each and
                        this.vboFcount_a_Colr1 ) * //+
                       // this.vboFcount_a_PtSiz1) *   // every attribute in our VBO
                        this.FSIZE == this.vboStride, // for agreeement with'stride'
                        "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
                        
                    //----------------------Attribute offsets
        this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
                                      // of 1st a_Pos1 attrib value in vboContents[]
        this.vboOffset_a_Colr1 = (this.vboFcount_a_Pos1) * this.FSIZE;  
                                      // == 4 floats * bytes/float
                                      //# of bytes from START of vbo to the START
                                      // of 1st a_Colr1 attrib value in vboContents[]
        this.vboOffset_a_PtSiz1 =(this.vboFcount_a_Pos1 +
                                  this.vboFcount_a_Colr1) * this.FSIZE; 
                                      // == 7 floats * bytes/float
                                      // # of bytes from START of vbo to the START
                                      // of 1st a_PtSize attrib value in vboContents[]
      
                    //-----------------------GPU memory locations:                                
        this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                      // returned by gl.createBuffer() function call
        this.shaderLoc;								// GPU Location for compiled Shader-program  
                                      // set by compile/link of VERT_SRC and FRAG_SRC.
                                //------Attribute locations in our shaders:
        this.a_Pos1Loc;							  // GPU location: shader 'a_Pos1' attribute
        this.a_Colr1Loc;							// GPU location: shader 'a_Colr1' attribute
        this.a_PtSiz1Loc;							// GPU location: shader 'a_PtSiz1' attribute
        
                    //---------------------- Uniform locations &values in our shaders
        this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
        this.u_ModelMatrixLoc;						// GPU location for u_ModelMat uniform
      
        this.MvpMatrix = new Matrix4();
        this.u_MvpMatrixLoc; 
        
        
        this.NormalMatrix = new Matrix4();
        this.u_NormalMatrixLoc; 
      
        this.eyePos = new Float32Array(3);
        this.u_eyeposloc;
      
        this.lamp0 = new LightsT();
        this.matlSel= MATL_EMERALD;	
        this.matl0 = new Material(this.matlSel);
          
        this.u_lightOnLoc;
      
        this.u_lightTypeLoc;
        
        //this.u_LightColorLoc;
        //this.u_LightPositionLoc;
        //this.u_AmbientLightLoc;
      };
      
      
      VBObox4.prototype.init = function() {
      //==============================================================================
      // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
      // kept in this VBObox. (This function usually called only once, within main()).
      // Specifically:
      // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
      //  executable 'program' stored and ready to use inside the GPU.  
      // b) create a new VBO object in GPU memory and fill it by transferring in all
      //  the vertex data held in our Float32array member 'VBOcontents'. 
      // c) Find & save the GPU location of all our shaders' attribute-variables and 
      //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
      // -------------------
      // CAREFUL!  before you can draw pictures using this VBObox contents, 
      //  you must call this VBObox object's switchToMe() function too!
      //--------------------
      // a) Compile,link,upload shaders-----------------------------------------------
        this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
        if (!this.shaderLoc) {
          console.log(this.constructor.name + 
                      '.init() failed to create executable Shaders on the GPU. Bye!');
          return;
        }
      // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
      //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
      
        gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
      
      // b) Create VBO on GPU, fill it------------------------------------------------
        this.vboLoc = gl.createBuffer();	
        if (!this.vboLoc) {
          console.log(this.constructor.name + 
                      '.init() failed to create VBO in GPU. Bye!'); 
          return;
        }
        
        // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
        //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
        // (positions, colors, normals, etc), or 
        //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
        // that each select one vertex from a vertex array stored in another VBO.
        gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                        this.vboLoc);				  // the ID# the GPU uses for this buffer.
                              
        // Fill the GPU's newly-created VBO object with the vertex data we stored in
        //  our 'vboContents' member (JavaScript Float32Array object).
        //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
        //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
        gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                          this.vboContents, 		// JavaScript Float32Array
                         gl.STATIC_DRAW);			// Usage hint.  
        //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
        //	(see OpenGL ES specification for more info).  Your choices are:
        //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
        //				contents rarely or never change.
        //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
        //				contents may change often as our program runs.
        //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
        // 			times and then discarded; for rapidly supplied & consumed VBOs.
      
      // c1) Find All Attributes:-----------------------------------------------------
      //  Find & save the GPU location of all our shaders' attribute-variables and 
      //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
        this.a_Pos1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
        if(this.a_Pos1Loc < 0) {
          console.log(this.constructor.name + 
                      '.init() Failed to get GPU location of attribute a_Pos1');
          return -1;	// error exit.
        }
         //this.a_Colr1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Colr1');
        //if(this.a_Colr1Loc < 0) {
         // console.log(this.constructor.name + 
        //  						'.init() failed to get the GPU location of attribute a_Colr1');
         // return -1;	// error exit.
        //}
        //this.a_PtSiz1Loc = gl.getAttribLocation(this.shaderLoc, 'a_PtSiz1');
        //if(this.a_PtSiz1Loc < 0) {
          //console.log(this.constructor.name + 
           // 					'.init() failed to get the GPU location of attribute a_PtSiz1');
          //return -1;	// error exit.
        //}
        // c2) Find All Uniforms:-----------------------------------------------------
        //Get GPU storage location for each uniform var used in our shader programs: 
       this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
        if (!this.u_ModelMatrixLoc) { 
          console.log(this.constructor.name + 
                      '.init() failed to get GPU location for u_ModelMatrix uniform');
          return;
        }
      
        this.u_eyeposloc = gl.getUniformLocation(this.shaderLoc, 'u_eyePos');
            if (!this.u_eyeposloc) { 
            console.log(this.constructor.name + 
                        '.init() failed to get GPU location for u_eyePos uniform');
            return;
            }
      
        this.a_normalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
        this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
        this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
        //this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
        //this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
        if (!this.u_MvpMatrixLoc || !this.u_NormalMatrixLoc || !this.a_normalLoc) { 
          console.log('Failed to get the storage location');
          return;
        }
      
        this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
        this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
        this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
        this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
        this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
      
        this.lamp0.u_pos  = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos');	
        this.lamp0.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].ambi');
        this.lamp0.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].diff');
        this.lamp0.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].spec');
          
        if( !this.lamp0.u_pos || !this.lamp0.u_ambi	|| !this.lamp0.u_diff || !this.lamp0.u_spec	|| !this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny) {
          console.log('.init() Failed to get GPU location of uniforms of matl0 or lamp0');
          return;
        }
          
        this.u_lightOnLoc = gl.getUniformLocation(this.shaderLoc, 'u_lightOn');
        if(!this.u_lightOnLoc) {
          console.log('.init() Failed to get GPU location of unifrom u_lightOn');
          return;
        }
      
      
        this.u_lightTypeLoc = gl.getUniformLocation(this.shaderLoc, 'v_lightType');
        if(!this.u_lightTypeLoc) {
          console.log('.init() Failed to get GPU location of varying LightType');
          return;
        } 
      
      }
      
      VBObox4.prototype.switchToMe = function () {
      //==============================================================================
      // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
      //
      // We only do this AFTER we called the init() function, which does the one-time-
      // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
      // even then, you are STILL not ready to draw our VBObox's contents onscreen!
      // We must also first complete these steps:
      //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
      //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
      //  c) tell the GPU to connect the shader program's attributes to that VBO.
      
      // a) select our shader program:
        gl.useProgram(this.shaderLoc);	
      //		Each call to useProgram() selects a shader program from the GPU memory,
      // but that's all -- it does nothing else!  Any previously used shader program's 
      // connections to attributes and uniforms are now invalid, and thus we must now
      // establish new connections between our shader program's attributes and the VBO
      // we wish to use.  
        
      // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
      //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
      //    supply values to use as attributes in our newly-selected shader program:
        gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
                          this.vboLoc);			// the ID# the GPU uses for our VBO.
      
      // c) connect our newly-bound VBO to supply attribute variable values for each
      // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
      // this sets up data paths from VBO to our shader units:
        // 	Here's how to use the almost-identical OpenGL version of this function:
        //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
        gl.vertexAttribPointer(
          this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
          this.vboFcount_a_Pos1, // # of floats used by this attribute: 1,2,3 or 4?
          gl.FLOAT,		  // type == what data type did we use for those numbers?
          false,				// isNormalized == are these fixed-point values that we need
                        //									normalize before use? true or false
          this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                        // stored attrib for this vertex to the same stored attrib
                        //  for the next vertex in our VBO.  This is usually the 
                        // number of bytes used to store one complete vertex.  If set 
                        // to zero, the GPU gets attribute values sequentially from 
                        // VBO, starting at 'Offset'.	
                        // (Our vertex size in bytes: 4 floats for pos + 3 for color)
          this.vboOffset_a_Pos1);						
                        // Offset == how many bytes from START of buffer to the first
                        // value we will actually use?  (we start with position).
        gl.vertexAttribPointer(this.a_Colr1Loc, this.vboFcount_a_Colr1,
                               gl.FLOAT, false, 
                               this.vboStride,  this.vboOffset_a_Colr1);
        gl.vertexAttribPointer(this.a_normalLoc, 3, gl.FLOAT, false, this.vboStride, 0);
        //gl.vertexAttribPointer(this.a_PtSiz1Loc,this.vboFcount_a_PtSiz1, 
                               //gl.FLOAT, false, 
                               //this.vboStride,	this.vboOffset_a_PtSiz1);	
        //-- Enable this assignment of the attribute to its' VBO source:
        gl.enableVertexAttribArray(this.a_Pos1Loc);
        //gl.enableVertexAttribArray(this.a_Colr1Loc);
        gl.enableVertexAttribArray(this.a_normalLoc);
        //gl.enableVertexAttribArray(this.a_PtSiz1Loc);
      
        // Set the light color (white)
        //gl.uniform3f(this.u_LightColorLoc, 0.8, 0.4, 0.0);
        // Set the light direction (in the world coordinate)
        //gl.uniform3f(this.u_LightPositionLoc, 5.0, 8.0, 7.0);
        // Set the ambient light
        //gl.uniform3f(this.u_AmbientLightLoc, 0.4, 0.4, 0.4);
      
        this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
        this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
        this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
        this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
        this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
                  
        this.eyePos.set([eyex, eyey, eyez]);
        this.lamp0.I_pos.elements.set( [lampx, lampy, lampz]);
        this.lamp0.I_ambi.elements.set([ambr, ambg, ambb]);
        this.lamp0.I_diff.elements.set([difr, difg, difb]);
        this.lamp0.I_spec.elements.set([specr, specg, specb]);
        gl.uniform3fv(this.lamp0.u_pos, this.lamp0.I_pos.elements.slice(0, 3));
        gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);        // ambient
        gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);        // diffuse
        gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);        // Specular
        gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0, 3));                // Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0, 3));                // Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0, 3));                // Kd    diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0, 3));                // Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny
                    
        gl.uniform1i(this.u_lightTypeLoc, lightType);
        gl.uniform1i(this.u_lightOnLoc, lightOn);
      
      }
      
      VBObox4.prototype.isReady = function() {
      //==============================================================================
      // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
      // this objects VBO and shader program; else return false.
      // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
      
      var isOK = true;
      
        if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
          console.log(this.constructor.name + 
                      '.isReady() false: shader program at this.shaderLoc not in use!');
          isOK = false;
        }
        if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
            console.log(this.constructor.name + 
                    '.isReady() false: vbo at this.vboLoc not in use!');
          isOK = false;
        }
        return isOK;
      }
      
      VBObox4.prototype.adjust = function() {
      //==============================================================================
      // Update the GPU to newer, current values we now store for 'uniform' vars on 
      // the GPU; and (if needed) update each attribute's stride and offset in VBO.
      
        // check: was WebGL context set to use our VBO & shader program?
        if(this.isReady()==false) {
              console.log('ERROR! before' + this.constructor.name + 
                    '.adjust() call you needed to call this.switchToMe()!!');
        }
        
        
        
        
        
        // Adjust values for our uniforms,
        this.ModelMatrix.setIdentity();
      // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
        //this.ModelMatrix.set(g_worldMat);
        
      //  this.ModelMatrix.rotate(g_angleNow1, 0, 0, 1);	// -spin drawing axes,
        this.ModelMatrix.translate(0.0, 8.0, 0);
        this.ModelMatrix.rotate(g_angleNow0, 0, 0);
        //this.ModelMatrix.rotate(g_angleNow0, 0, 0);						// then translate them.
        //  Transfer new uniforms' values to the GPU:-------------
        // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
        gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
                            false, 										// use matrix transpose instead?
                            this.ModelMatrix.elements);	// send data from Javascript.
        
        this.MvpMatrix.set(g_worldMat);
        this.MvpMatrix.multiply(this.ModelMatrix);
        gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
        this.NormalMatrix.setInverseOf(this.ModelMatrix);
        this.NormalMatrix.transpose();
        gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
      
      
      }
      
      VBObox4.prototype.draw = function() {
      //=============================================================================
      // Send commands to GPU to select and render current VBObox contents.
      
        // check: was WebGL context set to use our VBO & shader program?
        if(this.isReady()==false) {
              console.log('ERROR! before' + this.constructor.name + 
                    '.draw() call you needed to call this.switchToMe()!!');
        }
        
        // ----------------------------Draw the contents of the currently-bound VBO:
        //gl.uniform3fv(this.u_eyePosLoc, this.eyePos);// use it to set our uniform
        //gl.uniform1i(this.u_lightType, lightType);
        gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
                        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                        //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
                        0, 								// location of 1st vertex to draw;
                        (this.vboContents.length/7));//(this.vboContents.length/7)-3);		// number of vertices to draw on-screen.
        this.ModelMatrix.rotate(g_angleNow1, 1, 0, 0);
        this.ModelMatrix.translate(0.0 ,0.0, 1.5);
                  this.ModelMatrix.scale(0.6, 0.6, 0.6);
                  //this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
        gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
        this.MvpMatrix.set(g_worldMat);
        this.MvpMatrix.multiply(this.ModelMatrix);
        gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
        this.NormalMatrix.setInverseOf(this.ModelMatrix);
        this.NormalMatrix.transpose();
        gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);

        gl.drawArrays(gl.TRIANGLES,	0, (this.vboContents.length/7));

        this.ModelMatrix.rotate(g_angleNow1, 1, 0, 0);
        this.ModelMatrix.translate(0.0 ,0.0, 1.5);
                  this.ModelMatrix.scale(0.6, 0.6, 0.6);
                  //this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
        gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
        this.MvpMatrix.set(g_worldMat);
        this.MvpMatrix.multiply(this.ModelMatrix);
        gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
        this.NormalMatrix.setInverseOf(this.ModelMatrix);
        this.NormalMatrix.transpose();
        gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);

        gl.drawArrays(gl.TRIANGLES,	0, (this.vboContents.length/7));
                        
      }
      
      
      VBObox4.prototype.reload = function() {
      //=============================================================================
      // Over-write current values in the GPU for our already-created VBO: use 
      // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
      // contents to our VBO without changing any GPU memory allocations.
      
       gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                        0,                  // byte offset to where data replacement
                                            // begins in the VBO.
                          this.vboContents);   // the JS source-data array used to fill VBO
      }
      

      function VBObox5() {  ////Phong shaded sphere
        //=============================================================================
        //=============================================================================
        // CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
        // needed to render vertices from one Vertex Buffer Object (VBO) using one 
        // separate shader program (a vertex-shader & fragment-shader pair) and one
        // set of 'uniform' variables.
        
        // Constructor goal: 
        // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
        // written into code) in all other VBObox functions. Keeping all these (initial)
        // values here, in this one coonstrutor function, ensures we can change them 
        // easily WITHOUT disrupting any other code, ever!
          
          this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
          'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
          'precision highp int;\n' +
          //
          'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
          '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
          '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
          '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
          '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
          '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
          '		};\n' +
          'struct LampT {\n' +		// Describes one point-like Phong light source
          '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                                  //		   w==0.0 for distant light from x,y,z direction 
          ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
          ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
          '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
          '}; \n' +
          'uniform MatlT u_MatlSet[1];\n' +
          'uniform mat4 u_ModelMatrix;\n' +
          'attribute vec4 a_Pos1;\n' +
          //'attribute vec3 a_Colr1;\n'+
          //'attribute float a_PtSiz1; \n' +
          'varying vec4 v_Colr1;\n' +  
          'attribute vec4 a_Normal;\n' +    //added
          'uniform mat4 u_MvpMatrix;\n' +   //added
          'uniform mat4 u_NormalMatrix;\n' +   // added Transformation matrix of the normal
          'uniform LampT u_LampSet[1];\n' +
          'uniform bool u_lightOn;\n' +
          'uniform bool v_lightType;\n' +
          'uniform vec3 u_eyePosWorld; \n' + 
          'varying vec3 v_Kd; \n' +
          'varying vec3 v_Normal;\n' +       //NEW added
          'varying vec4 v_Position;\n' +     // NEW addded
          //'uniform vec3 u_LightColor;\n' +     // added Light color (((Diffuse Color))))
          //'uniform vec3 u_LightPosition;\n' +  // added  Position of the light source
          //'uniform vec3 u_AmbientLight;\n' +   // added  Ambient light color
          //
          'void main() {\n' +
          //'  gl_PointSize = a_PtSiz1;\n' +
          '  gl_Position = u_MvpMatrix * a_Pos1;\n' +
          '  v_Position = u_ModelMatrix * a_Pos1;\n' + 
          '	 v_Kd = u_MatlSet[0].diff; \n' +
          '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
          '  vec3 normal = normalize(v_Normal); \n' +
          '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
          '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
          '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
          '  float e64; \n' +
          'if(v_lightType){\n' +
            '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
            '  float nDotH = max(dot(H, normal), 0.0); \n' +
             ' e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
          '}\n' +
          'else{\n' +
            '  vec3 H = normalize(reflect((-lightDirection), normal));\n' +
            '   float nDotH = max(dot(H, eyeDirection), 0.0); \n' +
            ' float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
          '}\n' +
          '	 vec3 emissive = u_MatlSet[0].emit;' +
          '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
          '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
          '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
          ' if(u_lightOn) {\n' +
          '	 vec4 color = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
          '  v_Colr1 = color;\n' +
            '}\n' +
          ' else {\n' +
          '	 vec4 color = vec4(0, 0, 0, 1.0);\n' +
          '  v_Colr1 = color;}\n' +
          
          ' }\n';
        
          this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
          //'#ifdef GL_ES\n' +
          'precision highp float;\n' +
          'precision highp int;\n' +
          //'#endif\n' +
          'struct LampT {\n' +		// Describes one point-like Phong light source
          '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                              //		   w==0.0 for distant light from x,y,z direction 
          ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
          ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
          '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
          '}; \n' +
          'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
          '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
          '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
          '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
          '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
          '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
          '		};\n' +
          //-------------UNIFORMS: values set from JavaScript before a drawing command.
          // first light source: (YOU write a second one...)
          'uniform LampT u_LampSet[1];\n' +		// Array of all light sources.
          'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
          'uniform bool v_lightType;\n' +
          'uniform bool u_lightOn;\n' +
          //
          'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
      
          'varying vec4 v_Colr1;\n' +
          'varying vec3 v_Kd;	\n' +	
          //'uniform vec3 u_LightColor;\n' +     // Light color
          //'uniform vec3 u_LightPosition;\n' +  // Position of the light source
          //'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
          'varying vec3 v_Normal;\n' +
          'varying vec4 v_Position;\n' +
          'void main() {\n' +
             // Normalize the normal because it is interpolated and not 1.0 in length any more
          '  vec3 normal = normalize(v_Normal);\n' +
             // Calculate the light direction and make it 1.0 in length
          '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
             // Find the unit-length eye-direction vector 'V' (surface pt --> camera)
          '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
             // The dot product of the light direction and the normal
          '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
      
          '  float e64; \n' +
          'if(v_lightType==true){\n' +
            '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
            '  float nDotH = max(dot(H, normal), 0.0); \n' +
            ' e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
          '}\n' +
          'else{\n' +
            '  vec3 H = normalize(reflect((-lightDirection), normal));\n' +
            '   float nDotH = max(dot(H, eyeDirection), 0.0); \n' +
            ' float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
          '}\n' +
          
          //'  vec3 H = normalize(lightDirection + eyeDirection); \n' +
          //'  float nDotH = max(dot(H, normal), 0.0); \n' +
          //'  float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
          '	 vec3 emissive = 										u_MatlSet[0].emit;' +
          '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
          '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
          '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
      
          ' if(u_lightOn) {\n' +
            '	 gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
          '}\n' +
          ' else {\n' +
            ' gl_FragColor = vec4(0, 0, 0, 1.0);}\n' +
          //'  gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
             // Calculate the final color from diffuse reflection and ambient reflection
          //'  vec3 diffuse = u_LightColor * nDotL;\n' +
          //'  vec3 ambient = u_AmbientLight;\n' +
          //'  gl_FragColor = vec4(diffuse + ambient, v_Colr1.a);\n' +
          '}\n';
        
          this.vboContents = //---------------------------------------------------------
            new Float32Array ([					// Array of vertex attribute values we will
                                        // transfer to GPU's vertex buffer object (VBO)
              // 1 vertex per line: pos1 x,y,z,w;   colr1; r,g,b;   ptSiz1; 
            -0.3,  0.7,	0.0, 1.0,		0.0, 1.0, 1.0,  //17.0,
            -0.3, -0.3, 0.0, 1.0,		1.0, 0.0, 1.0,  //20.0,
             0.3, -0.3, 0.0, 1.0,		1.0, 1.0, 0.0,  //33.0,
          ]);	
        
          var floatsPerVertex = 7;
          
          makesphere();
          savesize1 = this.vboContents.length;
              var mySiz = (spherepoints.length + this.vboContents.length);
              var mypoints = new Float32Array(mySiz);
                  //lineStart = 0;           // next, we'll store the sphere;
                for(i=0, j=0; j< this.vboContents.length; i++, j++) {// don't initialize i -- reuse it!
                  mypoints[i] = this.vboContents[j];
                  }
                  spherestart1 = i;             // we stored the cylinder first.
                for(j=0; j< spherepoints.length; i++,j++) {
                  mypoints[i] = spherepoints[j];
                  }
              this.vboContents = mypoints;
          
          this.vboVerts = (this.vboContents.length /floatsPerVertex);							// # of vertices held in 'vboContents' array;
          this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
                                        // bytes req'd by 1 vboContents array element;
                                        // (why? used to compute stride and offset 
                                        // in bytes for vertexAttribPointer() calls)
          this.vboBytes = this.vboContents.length * this.FSIZE;               
                                        // (#  of floats in vboContents array) * 
                                        // (# of bytes/float).
          this.vboStride = this.vboBytes / this.vboVerts;     
                                        // (== # of bytes to store one complete vertex).
                                        // From any attrib in a given vertex in the VBO, 
                                        // move forward by 'vboStride' bytes to arrive 
                                        // at the same attrib for the next vertex.
                                         
                      //----------------------Attribute sizes
          this.vboFcount_a_Pos1 =  4;    // # of floats in the VBO needed to store the
                                        // attribute named a_Pos1. (4: x,y,z,w values)
          this.vboFcount_a_Colr1 = 3;   // # of floats for this attrib (r,g,b values)
          //this.vboFcount_a_PtSiz1 = 0;  // # of floats for this attrib (just one!)   
          console.assert((this.vboFcount_a_Pos1 +     // check the size of each and
                          this.vboFcount_a_Colr1 ) * //+
                         // this.vboFcount_a_PtSiz1) *   // every attribute in our VBO
                          this.FSIZE == this.vboStride, // for agreeement with'stride'
                          "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
                          
                      //----------------------Attribute offsets
          this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
                                        // of 1st a_Pos1 attrib value in vboContents[]
          this.vboOffset_a_Colr1 = (this.vboFcount_a_Pos1) * this.FSIZE;  
                                        // == 4 floats * bytes/float
                                        //# of bytes from START of vbo to the START
                                        // of 1st a_Colr1 attrib value in vboContents[]
          this.vboOffset_a_PtSiz1 =(this.vboFcount_a_Pos1 +
                                    this.vboFcount_a_Colr1) * this.FSIZE; 
                                        // == 7 floats * bytes/float
                                        // # of bytes from START of vbo to the START
                                        // of 1st a_PtSize attrib value in vboContents[]
        
                      //-----------------------GPU memory locations:                                
          this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                        // returned by gl.createBuffer() function call
          this.shaderLoc;								// GPU Location for compiled Shader-program  
                                        // set by compile/link of VERT_SRC and FRAG_SRC.
                                  //------Attribute locations in our shaders:
          this.a_Pos1Loc;							  // GPU location: shader 'a_Pos1' attribute
          this.a_Colr1Loc;							// GPU location: shader 'a_Colr1' attribute
          this.a_PtSiz1Loc;							// GPU location: shader 'a_PtSiz1' attribute
          
                      //---------------------- Uniform locations &values in our shaders
          this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
          this.u_ModelMatrixLoc;						// GPU location for u_ModelMat uniform
        
          this.MvpMatrix = new Matrix4();
          this.u_MvpMatrixLoc; 
          
          
          this.NormalMatrix = new Matrix4();
          this.u_NormalMatrixLoc; 
      
          this.eyepos = new Float32Array(3);
          this.u_eyePosWorldLoc;
      
          this.uLoc_ModelMatrix 	= false;
          this.uLoc_MvpMatrix 		= false;
          this.uLoc_NormalMatrix = false;
      
          this.eyePosWorld = new Float32Array(3);
          
          this.lamp0 = new LightsT();
      
          this.matlSel = MATL_TURQUOISE;				// see keypress(): 'm' key changes matlSel
          this.matl0 = new Material(this.matlSel);
      
          this.u_lightOnLoc;
        
          this.u_lightTypeLoc;
          
          //this.u_LightColorLoc;
          //this.u_LightPositionLoc;
          //this.u_AmbientLightLoc;
        };
        
        
        VBObox5.prototype.init = function() {
        //==============================================================================
        // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
        // kept in this VBObox. (This function usually called only once, within main()).
        // Specifically:
        // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
        //  executable 'program' stored and ready to use inside the GPU.  
        // b) create a new VBO object in GPU memory and fill it by transferring in all
        //  the vertex data held in our Float32array member 'VBOcontents'. 
        // c) Find & save the GPU location of all our shaders' attribute-variables and 
        //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
        // -------------------
        // CAREFUL!  before you can draw pictures using this VBObox contents, 
        //  you must call this VBObox object's switchToMe() function too!
        //--------------------
        // a) Compile,link,upload shaders-----------------------------------------------
          this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
          if (!this.shaderLoc) {
            console.log(this.constructor.name + 
                        '.init() failed to create executable Shaders on the GPU. Bye!');
            return;
          }
        // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
        //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
        
          gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
        
        // b) Create VBO on GPU, fill it------------------------------------------------
          this.vboLoc = gl.createBuffer();	
          if (!this.vboLoc) {
            console.log(this.constructor.name + 
                        '.init() failed to create VBO in GPU. Bye!'); 
            return;
          }
          
          // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
          //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
          // (positions, colors, normals, etc), or 
          //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
          // that each select one vertex from a vertex array stored in another VBO.
          gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                          this.vboLoc);				  // the ID# the GPU uses for this buffer.
                                
          // Fill the GPU's newly-created VBO object with the vertex data we stored in
          //  our 'vboContents' member (JavaScript Float32Array object).
          //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
          //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
          gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                            this.vboContents, 		// JavaScript Float32Array
                           gl.STATIC_DRAW);			// Usage hint.  
          //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
          //	(see OpenGL ES specification for more info).  Your choices are:
          //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
          //				contents rarely or never change.
          //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
          //				contents may change often as our program runs.
          //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
          // 			times and then discarded; for rapidly supplied & consumed VBOs.
        
        // c1) Find All Attributes:-----------------------------------------------------
        //  Find & save the GPU location of all our shaders' attribute-variables and 
        //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
          this.a_Pos1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
          if(this.a_Pos1Loc < 0) {
            console.log(this.constructor.name + 
                        '.init() Failed to get GPU location of attribute a_Pos1');
            return -1;	// error exit.
          }
           //this.a_Colr1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Colr1');
          //if(this.a_Colr1Loc < 0) {
           // console.log(this.constructor.name + 
           //             '.init() failed to get the GPU location of attribute a_Colr1');
            //return -1;	// error exit.
          //}
          //this.a_PtSiz1Loc = gl.getAttribLocation(this.shaderLoc, 'a_PtSiz1');
          //if(this.a_PtSiz1Loc < 0) {
            //console.log(this.constructor.name + 
             // 					'.init() failed to get the GPU location of attribute a_PtSiz1');
            //return -1;	// error exit.
          //}
          // c2) Find All Uniforms:-----------------------------------------------------
          //Get GPU storage location for each uniform var used in our shader programs: 
         this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
          if (!this.u_ModelMatrixLoc) { 
            console.log(this.constructor.name + 
                        '.init() failed to get GPU location for u_ModelMatrix uniform');
            return;
          }
      
          this.eyePosWorldLoc  = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
      
      
          this.a_normalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
          this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
          this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
          //this.u_LightColorLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightColor');
          //this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
          //this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
      
          //if (!this.u_MvpMatrixLoc || !this.u_NormalMatrixLoc || !this.u_LightColorLoc || !this.u_LightPositionLoc　|| !this.u_AmbientLightLoc || !this.eyePosWorldLoc) { 
          //  console.log('Failed to get the storage location');
          //  return;
          //}
      
          if (!this.u_MvpMatrixLoc || !this.u_NormalMatrixLoc || !this.eyePosWorldLoc) { 
            console.log('Failed to get the storage location');
            return;
          }
      
          this.lamp0.u_pos  = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos');	
          this.lamp0.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].ambi');
          this.lamp0.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].diff');
          this.lamp0.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].spec');
          if( !this.lamp0.u_pos || !this.lamp0.u_ambi	|| !this.lamp0.u_diff || !this.lamp0.u_spec	) {
            console.log('Failed to get GPUs Lamp0 storage locations');
            return;
          }
            this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
            this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
            this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
            this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
            this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
          if( !this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny) {
            console.log('.init() Failed to get GPU location of uniforms of matl0 or lamp0');
            return;
          }
      
          this.u_lightOnLoc = gl.getUniformLocation(this.shaderLoc, 'u_lightOn');
            if(!this.u_lightOnLoc) {
              console.log('.init() Failed to get GPU location of unifrom u_lightOn');
              return;
                }
        
        
            this.u_lightTypeLoc = gl.getUniformLocation(this.shaderLoc, 'v_lightType');
            if(!this.u_lightTypeLoc) {
              console.log('.init() Failed to get GPU location of varying LightType');
              return;
            } 
          /*this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
          this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
          this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
          this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
          this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
          if(!this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd 
                            || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny
             ) {
            console.log('Failed to get GPUs Reflectance storage locations');
            return;
      }*/
        
        }
        
        VBObox5.prototype.switchToMe = function () {
        //==============================================================================
        // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
        //
        // We only do this AFTER we called the init() function, which does the one-time-
        // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
        // even then, you are STILL not ready to draw our VBObox's contents onscreen!
        // We must also first complete these steps:
        //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
        //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
        //  c) tell the GPU to connect the shader program's attributes to that VBO.
        
        // a) select our shader program:
          gl.useProgram(this.shaderLoc);	
        //		Each call to useProgram() selects a shader program from the GPU memory,
        // but that's all -- it does nothing else!  Any previously used shader program's 
        // connections to attributes and uniforms are now invalid, and thus we must now
        // establish new connections between our shader program's attributes and the VBO
        // we wish to use.  
          
        // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
        //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
        //    supply values to use as attributes in our newly-selected shader program:
          gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
                            this.vboLoc);			// the ID# the GPU uses for our VBO.
        
        // c) connect our newly-bound VBO to supply attribute variable values for each
        // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
        // this sets up data paths from VBO to our shader units:
          // 	Here's how to use the almost-identical OpenGL version of this function:
          //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
          gl.vertexAttribPointer(
            this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
            this.vboFcount_a_Pos1, // # of floats used by this attribute: 1,2,3 or 4?
            gl.FLOAT,		  // type == what data type did we use for those numbers?
            false,				// isNormalized == are these fixed-point values that we need
                          //									normalize before use? true or false
            this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                          // stored attrib for this vertex to the same stored attrib
                          //  for the next vertex in our VBO.  This is usually the 
                          // number of bytes used to store one complete vertex.  If set 
                          // to zero, the GPU gets attribute values sequentially from 
                          // VBO, starting at 'Offset'.	
                          // (Our vertex size in bytes: 4 floats for pos + 3 for color)
            this.vboOffset_a_Pos1);						
                          // Offset == how many bytes from START of buffer to the first
                          // value we will actually use?  (we start with position).
          gl.vertexAttribPointer(this.a_Colr1Loc, this.vboFcount_a_Colr1,
                                 gl.FLOAT, false, 
                                 this.vboStride,  this.vboOffset_a_Colr1);
          gl.vertexAttribPointer(this.a_normalLoc, 3, gl.FLOAT, false, this.vboStride, 0);
          //gl.vertexAttribPointer(this.a_PtSiz1Loc,this.vboFcount_a_PtSiz1, 
                                 //gl.FLOAT, false, 
                                 //this.vboStride,	this.vboOffset_a_PtSiz1);	
          //-- Enable this assignment of the attribute to its' VBO source:
          gl.enableVertexAttribArray(this.a_Pos1Loc);
          //gl.enableVertexAttribArray(this.a_Colr1Loc);
          gl.enableVertexAttribArray(this.a_normalLoc);
          //gl.enableVertexAttribArray(this.a_PtSiz1Loc);
        
          this.eyePosWorld.set([eyex, eyey, eyez]);
          this.lamp0.I_pos.elements.set( [lampx, lampy, lampz]);
          this.lamp0.I_ambi.elements.set([ambr, ambg, ambb]);
          this.lamp0.I_diff.elements.set([difr, difg, difb]);
          this.lamp0.I_spec.elements.set([specr, specg, specb]);
          gl.uniform3fv(this.lamp0.u_pos, this.lamp0.I_pos.elements.slice(0, 3));
          gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);        // ambient
          gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);        // diffuse
          gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);        // Specular
          gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0, 3));                // Ke emissive
          gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0, 3));                // Ka ambient
          gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0, 3));                // Kd    diffuse
          gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0, 3));                // Ks specular
          gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny
            
          gl.uniform1i(this.u_lightTypeLoc, lightType);
          gl.uniform1i(this.u_lightOnLoc, lightOn);
      
          // Set the light color (white)
          //gl.uniform3f(this.u_LightColorLoc, 0.8, 0.4, 0.0);
          // Set the light direction (in the world coordinate)
          //gl.uniform3f(this.u_LightPositionLoc, 5.0, 8.0, 7.0);
          // Set the ambient light
          //gl.uniform3f(this.u_AmbientLightLoc, 0.4, 0.4, 0.4);
        }
        
        VBObox5.prototype.isReady = function() {
        //==============================================================================
        // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
        // this objects VBO and shader program; else return false.
        // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
        
        var isOK = true;
        
          if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
            console.log(this.constructor.name + 
                        '.isReady() false: shader program at this.shaderLoc not in use!');
            isOK = false;
          }
          if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
              console.log(this.constructor.name + 
                      '.isReady() false: vbo at this.vboLoc not in use!');
            isOK = false;
          }
          return isOK;
        }
        
        VBObox5.prototype.adjust = function() {
          //==============================================================================
          // Update the GPU to newer, current values we now store for 'uniform' vars on 
          // the GPU; and (if needed) update each attribute's stride and offset in VBO.
          
            // check: was WebGL context set to use our VBO & shader program?
            if(this.isReady()==false) {
                  console.log('ERROR! before' + this.constructor.name + 
                        '.adjust() call you needed to call this.switchToMe()!!');
            }
            
            
            
            
            
            // Adjust values for our uniforms,
            this.ModelMatrix.setIdentity();
          // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
            //this.ModelMatrix.set(g_worldMat);
            
          //  this.ModelMatrix.rotate(g_angleNow1, 0, 0, 1);	// -spin drawing axes,
            this.ModelMatrix.translate(5.0, 0.0, 0);
            this.ModelMatrix.rotate(g_angleNow0, 0, 0);
            //this.ModelMatrix.rotate(g_angleNow0, 0, 0);						// then translate them.
            //  Transfer new uniforms' values to the GPU:-------------
            // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
            gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
                                false, 										// use matrix transpose instead?
                                this.ModelMatrix.elements);	// send data from Javascript.
            
            this.MvpMatrix.set(g_worldMat);
            this.MvpMatrix.multiply(this.ModelMatrix);
            gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
            this.NormalMatrix.setInverseOf(this.ModelMatrix);
            this.NormalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
          
          
          }
          
          VBObox5.prototype.draw = function() {
          //=============================================================================
          // Send commands to GPU to select and render current VBObox contents.
          
            // check: was WebGL context set to use our VBO & shader program?
            if(this.isReady()==false) {
                  console.log('ERROR! before' + this.constructor.name + 
                        '.draw() call you needed to call this.switchToMe()!!');
            }
            
            // ----------------------------Draw the contents of the currently-bound VBO:
            //gl.uniform3fv(this.u_eyePosLoc, this.eyePos);// use it to set our uniform
            //gl.uniform1i(this.u_lightType, lightType);
            gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
                            // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                            //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
                            spherestart1/7, 								// location of 1st vertex to draw;
                            (this.vboContents.length/7)-3);//(this.vboContents.length/7)-3);		// number of vertices to draw on-screen.
            this.ModelMatrix.rotate(g_angleNow1, 1, 0, 0);
            this.ModelMatrix.translate(0.0 ,0.0, 1.5);
                      this.ModelMatrix.scale(0.6, 0.6, 0.6);
                      //this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
            gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
            this.MvpMatrix.set(g_worldMat);
            this.MvpMatrix.multiply(this.ModelMatrix);
            gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
            this.NormalMatrix.setInverseOf(this.ModelMatrix);
            this.NormalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
      
            gl.drawArrays(gl.TRIANGLES,	spherestart1/7, (this.vboContents.length/7)-3);
      
            this.ModelMatrix.rotate(g_angleNow1, 1, 0, 0);
            this.ModelMatrix.translate(0.0 ,0.0, 1.5);
                      this.ModelMatrix.scale(0.6, 0.6, 0.6);
                      //this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
            gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
            this.MvpMatrix.set(g_worldMat);
            this.MvpMatrix.multiply(this.ModelMatrix);
            gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
            this.NormalMatrix.setInverseOf(this.ModelMatrix);
            this.NormalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
      
            gl.drawArrays(gl.TRIANGLES,	spherestart1/7, (this.vboContents.length/7)-3);
                            
          }
        
        
        VBObox5.prototype.reload = function() {
        //=============================================================================
        // Over-write current values in the GPU for our already-created VBO: use 
        // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
        // contents to our VBO without changing any GPU memory allocations.
        
         gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                          0,                  // byte offset to where data replacement
                                              // begins in the VBO.
                            this.vboContents);   // the JS source-data array used to fill VBO
   }




   function VBObox6() {
    //=============================================================================
    //=============================================================================
    // CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
    // needed to render vertices from one Vertex Buffer Object (VBO) using one 
    // separate shader program (a vertex-shader & fragment-shader pair) and one
    // set of 'uniform' variables.
    
    // Constructor goal: 
    // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
    // written into code) in all other VBObox functions. Keeping all these (initial)
    // values here, in this one coonstrutor function, ensures we can change them 
    // easily WITHOUT disrupting any other code, ever!
      
      this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
      'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
      'precision highp int;\n' +
      'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
      '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
      '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
      '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
      '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
      '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
      '		};\n' +
      'struct LampT {\n' +		// Describes one point-like Phong light source
      '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                              //		   w==0.0 for distant light from x,y,z direction 
      ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
      ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
      '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
      '}; \n' +
      //
      'attribute vec4 a_Pos1;\n' +
      'attribute vec4 a_Normal;\n' +    //added
      'uniform mat4 u_ModelMatrix;\n' +
      'uniform mat4 u_MvpMatrix;\n' +   //added
      'uniform mat4 u_NormalMatrix;\n' +   // added Transformation matrix of the normal
      'uniform vec3 u_eyePos; \n' +
      'uniform MatlT u_MatlSet[1];\n' +
      'uniform LampT u_LampSet[1];\n' +
      'uniform bool u_lightOn;\n' +
      'uniform bool v_lightType;\n' +
      //-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
      'varying vec3 v_Kd; \n' +
      'varying vec4 v_Position; \n' +				
      'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0
      'varying vec4 v_Color;\n' +
      //
      
      //'attribute vec3 a_Colr1;\n'+
      //'varying vec4 v_Colr1;\n' +  
      //'uniform vec3 u_LightColor;\n' +     // added Light color (((Diffuse Color))))
      //'uniform vec3 u_LightPosition;\n' +  // added  Position of the light source
      //'uniform vec3 u_AmbientLight;\n' +   // added  Ambient light color
      
      //
      'void main() {\n' +
      //'  gl_PointSize = a_PtSiz1;\n' +
      '  gl_Position = u_MvpMatrix * a_Pos1;\n' +
      '  v_Position = u_ModelMatrix * a_Pos1;\n' +
      '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
      '	 v_Kd = u_MatlSet[0].diff; \n' +
      '  vec3 normal = normalize(v_Normal);\n' +
      '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
      '  vec3 eyeDirection = normalize(u_eyePos - v_Position.xyz); \n' +
      '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
      '  float e64; \n' +
      'if(v_lightType){\n' +
        '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
        '  float nDotH = max(dot(H, normal), 0.0); \n' +
        ' e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
      '}\n' +
      'else{\n' +
        '  vec3 H = normalize(reflect((-lightDirection), normal));\n' +
        '   float nDotH = max(dot(H, eyeDirection), 0.0); \n' +
        ' float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
      '}\n' +
      '	 vec3 emissive = 	u_MatlSet[0].emit;' +
      '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
      '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
      '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
      ' if(u_lightOn) {\n' +
      '	 v_Color = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
        '}\n' +
      ' else {\n' +
      ' v_Color = vec4(0, 0, 0, 1.0);}\n' +
    
      //'	 vec4 color = vec4(a_Colr1.x, a_Colr1.y, a_Colr1.z, 1.0);\n' + 
      //added
         // Calculate a normal to be fit with a model matrix, and make it 1.0 in length
         // Calculate world coordinate of vertex
      //'  vec4 vertexPosition = u_ModelMatrix * a_Pos1;\n' +
         // Calculate the light direction and make it 1.0 in length
      //'  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
         // The dot product of the light direction and the normal
      //'  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
      
         // Calculate the color due to diffuse reflection
      //'  vec3 diffuse = u_LightColor * nDotL;\n' + // * color.rgb
         // Calculate the color due to ambient reflection
      //'  vec3 ambient = u_AmbientLight;\n' + // * color.rgb
         // Add the surface colors due to diffuse reflection and ambient reflection
      //'  v_Colr1 = vec4(diffuse + ambient, color.a);\n' + 
      ' }\n';
    /*
     // SQUARE dots:
      this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
      'precision mediump float;\n' +
      'varying vec3 v_Colr1;\n' +
      'void main() {\n' +
      '  gl_FragColor = vec4(v_Colr1, 1.0);\n' +  
      '}\n';
    */
    /*
     // ROUND FLAT dots:
      this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
      'precision mediump float;\n' +
      'varying vec3 v_Colr1;\n' +
      'void main() {\n' +
      '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' + 
      '  if(dist < 0.5) {\n' +
      '    gl_FragColor = vec4(v_Colr1, 1.0);\n' +  
      '    } else {discard;};' +
      '}\n';
    */
    /*
     // SHADED, sphere-like dots:
      this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
      'precision mediump float;\n' +
      'varying vec3 v_Colr1;\n' +
      'void main() {\n' +
      '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' + 
      '  if(dist < 0.5) {\n' + 
       '  	gl_FragColor = vec4((1.0-2.0*dist)*v_Colr1.rgb, 1.0);\n' +
      '    } else {discard;};' +
      '}\n';
      */
    
      this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
      'precision mediump float;\n' +
      'varying vec4 v_Color;\n' +
      'void main() {\n' +
      '  gl_FragColor = v_Color;\n' + 
      '}\n';
      makesphere();
      c30 = Math.sqrt(0.75);          // == cos(30deg) == sqrt(3) / 2
      sq2 = Math.sqrt(2.0);
      this.vboContents = spherepoints//--------------------------------------------------------
        /*new Float32Array ([					// Array of vertex attribute values we will
                                    // transfer to GPU's vertex buffer object (VBO)
          // 1 vertex per line: pos1 x,y,z,w;   colr1; r,g,b;   ptSiz1; 
          0.0,  0.5, 1.4, 1.0,     0.8,  0.4,  0.3,  // Node 0
          0.8, 0.0, 0.0, 1.0,     0.8,  0.4,  0.3,  // Node 1
          0.0,  1.5, 0.0, 1.0,      0.8,  0.4,  0.3,  // Node 2
               // Face 1: (right side)
            0.0,   0.5, 1.4, 1.0,     -0.8,  0.4,  0.3,  // Node 0
          0.0,  1.5, 0.0, 1.0,      -0.8,  0.4,  0.3,  // Node 2
           -0.8, 0.0, 0.0, 1.0,     -0.8, 0.4, 0.3,  // Node 3
             // Face 2: (lower side)
            0.0,   0.5, 1.4, 1.0,     0.0,  -0.9,  0.3,  // Node 0 
           -0.8, 0.0, 0.0, 1.0,     0.0,  -0.9,  0.3,  // Node 3
          0.8, 0.0, 0.0, 1.0,     0.0,  -0.9,  0.3,  // Node 1 
            // Face 3: (base side)  
           -0.8, 0.0,  0.0, 1.0,    0.0,  0.0,  -1.0,  // Node 3
          0.0,  1.5,  0.0, 1.0,   0.0,  0.0,  -1.0,  // Node 2
          0.8, 0.0,  0.0, 1.0,    0.0,  0.0,  -1.0,
          //axis
          0.0,  0.0,  0.0, 1.0,   0.3,  0.3,  0.3,  // X axis line (origin: gray)
             5.0,  0.0,  0.0, 1.0,    1.0,  0.3,  0.3,  //             (endpoint: red)
             
             0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,  // Y axis line (origin: white)
             0.0,  5.0,  0.0, 1.0,    0.3,  1.0,  0.3,  //             (endpoint: green)
        
             0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,  // Z axis line (origin:white)
             0.0,  0.0,  5.0, 1.0,    0.3,  0.3,  1.0  //33.0,
      ]);	*/
    
      var floatsPerVertex = 7;
      
      /*maketriangle();
      savesize1 = this.vboContents.length;
          var mySiz = (trianglepoints.length + this.vboContents.length);
          var mypoints = new Float32Array(mySiz);
              //lineStart = 0;           // next, we'll store the sphere;
            for(i=0, j=0; j< this.vboContents.length; i++, j++) {// don't initialize i -- reuse it!
              mypoints[i] = this.vboContents[j];
              }
              spherestart1 = i;             // we stored the cylinder first.
            for(j=0; j< trianglepoints.length; i++,j++) {
              mypoints[i] = trianglepoints[j];
              }
          this.vboContents = mypoints;
      */
      this.vboVerts = (this.vboContents.length /floatsPerVertex);							// # of vertices held in 'vboContents' array;
      this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
                                    // bytes req'd by 1 vboContents array element;
                                    // (why? used to compute stride and offset 
                                    // in bytes for vertexAttribPointer() calls)
      this.vboBytes = this.vboContents.length * this.FSIZE;               
                                    // (#  of floats in vboContents array) * 
                                    // (# of bytes/float).
      this.vboStride = this.vboBytes / this.vboVerts;     
                                    // (== # of bytes to store one complete vertex).
                                    // From any attrib in a given vertex in the VBO, 
                                    // move forward by 'vboStride' bytes to arrive 
                                    // at the same attrib for the next vertex.
                                     
                  //----------------------Attribute sizes
      this.vboFcount_a_Pos1 =  4;    // # of floats in the VBO needed to store the
                                    // attribute named a_Pos1. (4: x,y,z,w values)
      this.vboFcount_a_Colr1 = 3;   // # of floats for this attrib (r,g,b values)
      //this.vboFcount_a_PtSiz1 = 0;  // # of floats for this attrib (just one!)   
      console.assert((this.vboFcount_a_Pos1 +     // check the size of each and
                      this.vboFcount_a_Colr1 ) * //+
                     // this.vboFcount_a_PtSiz1) *   // every attribute in our VBO
                      this.FSIZE == this.vboStride, // for agreeement with'stride'
                      "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
                      
                  //----------------------Attribute offsets
      this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
                                    // of 1st a_Pos1 attrib value in vboContents[]
      this.vboOffset_a_Colr1 = (this.vboFcount_a_Pos1) * this.FSIZE;  
                                    // == 4 floats * bytes/float
                                    //# of bytes from START of vbo to the START
                                    // of 1st a_Colr1 attrib value in vboContents[]
      this.vboOffset_a_PtSiz1 =(this.vboFcount_a_Pos1 +
                                this.vboFcount_a_Colr1) * this.FSIZE; 
                                    // == 7 floats * bytes/float
                                    // # of bytes from START of vbo to the START
                                    // of 1st a_PtSize attrib value in vboContents[]
    
                  //-----------------------GPU memory locations:                                
      this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                    // returned by gl.createBuffer() function call
      this.shaderLoc;								// GPU Location for compiled Shader-program  
                                    // set by compile/link of VERT_SRC and FRAG_SRC.
                              //------Attribute locations in our shaders:
      this.a_Pos1Loc;							  // GPU location: shader 'a_Pos1' attribute
      this.a_Colr1Loc;							// GPU location: shader 'a_Colr1' attribute
      this.a_PtSiz1Loc;							// GPU location: shader 'a_PtSiz1' attribute
      
                  //---------------------- Uniform locations &values in our shaders
      this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
      this.u_ModelMatrixLoc;						// GPU location for u_ModelMat uniform
    
      this.MvpMatrix = new Matrix4();
      this.u_MvpMatrixLoc; 
      
      
      this.NormalMatrix = new Matrix4();
      this.u_NormalMatrixLoc; 
    
      this.eyePos = new Float32Array(3);
      this.u_eyeposloc;
    
      this.lamp0 = new LightsT();
      this.matlSel= MATL_TURQUOISE;	
      this.matl0 = new Material(this.matlSel);
        
      this.u_lightOnLoc;
    
      this.u_lightTypeLoc;
      
      //this.u_LightColorLoc;
      //this.u_LightPositionLoc;
      //this.u_AmbientLightLoc;
    };
    
    
    VBObox6.prototype.init = function() {
    //==============================================================================
    // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
    // kept in this VBObox. (This function usually called only once, within main()).
    // Specifically:
    // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
    //  executable 'program' stored and ready to use inside the GPU.  
    // b) create a new VBO object in GPU memory and fill it by transferring in all
    //  the vertex data held in our Float32array member 'VBOcontents'. 
    // c) Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
    // -------------------
    // CAREFUL!  before you can draw pictures using this VBObox contents, 
    //  you must call this VBObox object's switchToMe() function too!
    //--------------------
    // a) Compile,link,upload shaders-----------------------------------------------
      this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
      if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                    '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
      }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
    
      gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
    
    // b) Create VBO on GPU, fill it------------------------------------------------
      this.vboLoc = gl.createBuffer();	
      if (!this.vboLoc) {
        console.log(this.constructor.name + 
                    '.init() failed to create VBO in GPU. Bye!'); 
        return;
      }
      
      // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
      //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
      // (positions, colors, normals, etc), or 
      //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
      // that each select one vertex from a vertex array stored in another VBO.
      gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                      this.vboLoc);				  // the ID# the GPU uses for this buffer.
                            
      // Fill the GPU's newly-created VBO object with the vertex data we stored in
      //  our 'vboContents' member (JavaScript Float32Array object).
      //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
      //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
      gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                        this.vboContents, 		// JavaScript Float32Array
                       gl.STATIC_DRAW);			// Usage hint.  
      //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
      //	(see OpenGL ES specification for more info).  Your choices are:
      //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
      //				contents rarely or never change.
      //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
      //				contents may change often as our program runs.
      //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
      // 			times and then discarded; for rapidly supplied & consumed VBOs.
    
    // c1) Find All Attributes:-----------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
      this.a_Pos1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
      if(this.a_Pos1Loc < 0) {
        console.log(this.constructor.name + 
                    '.init() Failed to get GPU location of attribute a_Pos1');
        return -1;	// error exit.
      }
       //this.a_Colr1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Colr1');
      //if(this.a_Colr1Loc < 0) {
       // console.log(this.constructor.name + 
      //  						'.init() failed to get the GPU location of attribute a_Colr1');
       // return -1;	// error exit.
      //}
      //this.a_PtSiz1Loc = gl.getAttribLocation(this.shaderLoc, 'a_PtSiz1');
      //if(this.a_PtSiz1Loc < 0) {
        //console.log(this.constructor.name + 
         // 					'.init() failed to get the GPU location of attribute a_PtSiz1');
        //return -1;	// error exit.
      //}
      // c2) Find All Uniforms:-----------------------------------------------------
      //Get GPU storage location for each uniform var used in our shader programs: 
     this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
      if (!this.u_ModelMatrixLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
      }
    
      this.u_eyeposloc = gl.getUniformLocation(this.shaderLoc, 'u_eyePos');
          if (!this.u_eyeposloc) { 
          console.log(this.constructor.name + 
                      '.init() failed to get GPU location for u_eyePos uniform');
          return;
          }
    
      this.a_normalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
      this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
      this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
      //this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
      //this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
      if (!this.u_MvpMatrixLoc || !this.u_NormalMatrixLoc || !this.a_normalLoc) { 
        console.log('Failed to get the storage location');
        return;
      }
    
      this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
      this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
      this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
      this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
      this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
    
      this.lamp0.u_pos  = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos');	
      this.lamp0.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].ambi');
      this.lamp0.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].diff');
      this.lamp0.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].spec');
        
      if( !this.lamp0.u_pos || !this.lamp0.u_ambi	|| !this.lamp0.u_diff || !this.lamp0.u_spec	|| !this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny) {
        console.log('.init() Failed to get GPU location of uniforms of matl0 or lamp0');
        return;
      }
        
      this.u_lightOnLoc = gl.getUniformLocation(this.shaderLoc, 'u_lightOn');
      if(!this.u_lightOnLoc) {
        console.log('.init() Failed to get GPU location of unifrom u_lightOn');
        return;
      }
    
    
      this.u_lightTypeLoc = gl.getUniformLocation(this.shaderLoc, 'v_lightType');
      if(!this.u_lightTypeLoc) {
        console.log('.init() Failed to get GPU location of varying LightType');
        return;
      } 
    
    }
    
    VBObox6.prototype.switchToMe = function () {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.
    
    // a) select our shader program:
      gl.useProgram(this.shaderLoc);	
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  
      
    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    //    supply values to use as attributes in our newly-selected shader program:
      gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
                        this.vboLoc);			// the ID# the GPU uses for our VBO.
    
    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
      // 	Here's how to use the almost-identical OpenGL version of this function:
      //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
      gl.vertexAttribPointer(
        this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
        this.vboFcount_a_Pos1, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
                      //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                      // stored attrib for this vertex to the same stored attrib
                      //  for the next vertex in our VBO.  This is usually the 
                      // number of bytes used to store one complete vertex.  If set 
                      // to zero, the GPU gets attribute values sequentially from 
                      // VBO, starting at 'Offset'.	
                      // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Pos1);						
                      // Offset == how many bytes from START of buffer to the first
                      // value we will actually use?  (we start with position).
      gl.vertexAttribPointer(this.a_Colr1Loc, this.vboFcount_a_Colr1,
                             gl.FLOAT, false, 
                             this.vboStride,  this.vboOffset_a_Colr1);
      gl.vertexAttribPointer(this.a_normalLoc, 3, gl.FLOAT, false, this.vboStride, 0);
      //gl.vertexAttribPointer(this.a_PtSiz1Loc,this.vboFcount_a_PtSiz1, 
                             //gl.FLOAT, false, 
                             //this.vboStride,	this.vboOffset_a_PtSiz1);	
      //-- Enable this assignment of the attribute to its' VBO source:
      gl.enableVertexAttribArray(this.a_Pos1Loc);
      //gl.enableVertexAttribArray(this.a_Colr1Loc);
      gl.enableVertexAttribArray(this.a_normalLoc);
      //gl.enableVertexAttribArray(this.a_PtSiz1Loc);
    
      // Set the light color (white)
      //gl.uniform3f(this.u_LightColorLoc, 0.8, 0.4, 0.0);
      // Set the light direction (in the world coordinate)
      //gl.uniform3f(this.u_LightPositionLoc, 5.0, 8.0, 7.0);
      // Set the ambient light
      //gl.uniform3f(this.u_AmbientLightLoc, 0.4, 0.4, 0.4);
    
      this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
      this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
      this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
      this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
      this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
                
      this.eyePos.set([eyex, eyey, eyez]);
      this.lamp0.I_pos.elements.set( [lampx, lampy, lampz]);
      this.lamp0.I_ambi.elements.set([ambr, ambg, ambb]);
      this.lamp0.I_diff.elements.set([difr, difg, difb]);
      this.lamp0.I_spec.elements.set([specr, specg, specb]);
      gl.uniform3fv(this.lamp0.u_pos, this.lamp0.I_pos.elements.slice(0, 3));
      gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);        // ambient
      gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);        // diffuse
      gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);        // Specular
      gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0, 3));                // Ke emissive
      gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0, 3));                // Ka ambient
      gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0, 3));                // Kd    diffuse
      gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0, 3));                // Ks specular
      gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny
                  
      gl.uniform1i(this.u_lightTypeLoc, lightType);
      gl.uniform1i(this.u_lightOnLoc, lightOn);
    
    }
    
    VBObox6.prototype.isReady = function() {
    //==============================================================================
    // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
    // this objects VBO and shader program; else return false.
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
    
    var isOK = true;
    
      if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                    '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
      }
      if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
          console.log(this.constructor.name + 
                  '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
      }
      return isOK;
    }
    
    VBObox6.prototype.adjust = function() {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                  '.adjust() call you needed to call this.switchToMe()!!');
      }
      
      
      
      
      
      // Adjust values for our uniforms,
      this.ModelMatrix.setIdentity();
    // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
      //this.ModelMatrix.set(g_worldMat);
      
    //  this.ModelMatrix.rotate(g_angleNow1, 0, 0, 1);	// -spin drawing axes,
      this.ModelMatrix.translate(5.0, 0.0, 0);
      this.ModelMatrix.rotate(g_angleNow0, 0, 0);
      //this.ModelMatrix.rotate(g_angleNow0, 0, 0);						// then translate them.
      //  Transfer new uniforms' values to the GPU:-------------
      // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
      gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
                          false, 										// use matrix transpose instead?
                          this.ModelMatrix.elements);	// send data from Javascript.
      
      this.MvpMatrix.set(g_worldMat);
      this.MvpMatrix.multiply(this.ModelMatrix);
      gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
      this.NormalMatrix.setInverseOf(this.ModelMatrix);
      this.NormalMatrix.transpose();
      gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
    
    
    }
    
    VBObox6.prototype.draw = function() {
    //=============================================================================
    // Send commands to GPU to select and render current VBObox contents.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                  '.draw() call you needed to call this.switchToMe()!!');
      }
      
      // ----------------------------Draw the contents of the currently-bound VBO:
      //gl.uniform3fv(this.u_eyePosLoc, this.eyePos);// use it to set our uniform
      //gl.uniform1i(this.u_lightType, lightType);
      gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
                      // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                      //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
                      0, 								// location of 1st vertex to draw;
                      (this.vboContents.length/7));//(this.vboContents.length/7)-3);		// number of vertices to draw on-screen.
      this.ModelMatrix.rotate(g_angleNow1, 1, 0, 0);
      this.ModelMatrix.translate(0.0 ,0.0, 1.5);
                this.ModelMatrix.scale(0.6, 0.6, 0.6);
                //this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
      gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
      this.MvpMatrix.set(g_worldMat);
      this.MvpMatrix.multiply(this.ModelMatrix);
      gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
      this.NormalMatrix.setInverseOf(this.ModelMatrix);
      this.NormalMatrix.transpose();
      gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);

      gl.drawArrays(gl.TRIANGLES,	0, (this.vboContents.length/7));

      this.ModelMatrix.rotate(g_angleNow1, 1, 0, 0);
      this.ModelMatrix.translate(0.0 ,0.0, 1.5);
                this.ModelMatrix.scale(0.6, 0.6, 0.6);
                //this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
      gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
      this.MvpMatrix.set(g_worldMat);
      this.MvpMatrix.multiply(this.ModelMatrix);
      gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
      this.NormalMatrix.setInverseOf(this.ModelMatrix);
      this.NormalMatrix.transpose();
      gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);

      gl.drawArrays(gl.TRIANGLES,	0, (this.vboContents.length/7));
                      
    }
    
    
    VBObox6.prototype.reload = function() {
    //=============================================================================
    // Over-write current values in the GPU for our already-created VBO: use 
    // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
    // contents to our VBO without changing any GPU memory allocations.
    
     gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                      0,                  // byte offset to where data replacement
                                          // begins in the VBO.
                        this.vboContents);   // the JS source-data array used to fill VBO
    }



    function VBObox7() {  ////Phong shaded sphere
      //=============================================================================
      //=============================================================================
      // CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
      // needed to render vertices from one Vertex Buffer Object (VBO) using one 
      // separate shader program (a vertex-shader & fragment-shader pair) and one
      // set of 'uniform' variables.
      
      // Constructor goal: 
      // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
      // written into code) in all other VBObox functions. Keeping all these (initial)
      // values here, in this one coonstrutor function, ensures we can change them 
      // easily WITHOUT disrupting any other code, ever!
        
        this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
        'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
        'precision highp int;\n' +
        //
        'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
        '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
        '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
        '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
        '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
        '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
        '		};\n' +
        'struct LampT {\n' +		// Describes one point-like Phong light source
        '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                                //		   w==0.0 for distant light from x,y,z direction 
        ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
        ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
        '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
        '}; \n' +
        'uniform MatlT u_MatlSet[1];\n' +
        'uniform mat4 u_ModelMatrix;\n' +
        'attribute vec4 a_Pos1;\n' +
        //'attribute vec3 a_Colr1;\n'+
        //'attribute float a_PtSiz1; \n' +
        'varying vec4 v_Colr1;\n' +  
        'attribute vec4 a_Normal;\n' +    //added
        'uniform mat4 u_MvpMatrix;\n' +   //added
        'uniform mat4 u_NormalMatrix;\n' +   // added Transformation matrix of the normal
        'uniform LampT u_LampSet[1];\n' +
        'uniform bool u_lightOn;\n' +
        'uniform bool v_lightType;\n' +
        'uniform vec3 u_eyePosWorld; \n' + 
        'varying vec3 v_Kd; \n' +
        'varying vec3 v_Normal;\n' +       //NEW added
        'varying vec4 v_Position;\n' +     // NEW addded
        //'uniform vec3 u_LightColor;\n' +     // added Light color (((Diffuse Color))))
        //'uniform vec3 u_LightPosition;\n' +  // added  Position of the light source
        //'uniform vec3 u_AmbientLight;\n' +   // added  Ambient light color
        //
        'void main() {\n' +
        //'  gl_PointSize = a_PtSiz1;\n' +
        '  gl_Position = u_MvpMatrix * a_Pos1;\n' +
        '  v_Position = u_ModelMatrix * a_Pos1;\n' + 
        '	 v_Kd = u_MatlSet[0].diff; \n' +
        '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
        '  vec3 normal = normalize(v_Normal); \n' +
        '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
        '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
        '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
        '  float e64; \n' +
        'if(v_lightType){\n' +
          '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
          '  float nDotH = max(dot(H, normal), 0.0); \n' +
           ' e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
        '}\n' +
        'else{\n' +
          '  vec3 H = normalize(reflect((-lightDirection), normal));\n' +
          '   float nDotH = max(dot(H, eyeDirection), 0.0); \n' +
          ' float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
        '}\n' +
        '	 vec3 emissive = u_MatlSet[0].emit;' +
        '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
        '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
        '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
        ' if(u_lightOn) {\n' +
        '	 vec4 color = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
        '  v_Colr1 = color;\n' +
          '}\n' +
        ' else {\n' +
        '	 vec4 color = vec4(0, 0, 0, 1.0);\n' +
        '  v_Colr1 = color;}\n' +
        
        ' }\n';
      
        this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        //'#ifdef GL_ES\n' +
        'precision highp float;\n' +
        'precision highp int;\n' +
        //'#endif\n' +
        'struct LampT {\n' +		// Describes one point-like Phong light source
        '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                            //		   w==0.0 for distant light from x,y,z direction 
        ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
        ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
        '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
        '}; \n' +
        'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
        '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
        '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
        '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
        '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
        '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
        '		};\n' +
        //-------------UNIFORMS: values set from JavaScript before a drawing command.
        // first light source: (YOU write a second one...)
        'uniform LampT u_LampSet[1];\n' +		// Array of all light sources.
        'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
        'uniform bool v_lightType;\n' +
        'uniform bool u_lightOn;\n' +
        //
        'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
    
        'varying vec4 v_Colr1;\n' +
        'varying vec3 v_Kd;	\n' +	
        //'uniform vec3 u_LightColor;\n' +     // Light color
        //'uniform vec3 u_LightPosition;\n' +  // Position of the light source
        //'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
        'varying vec3 v_Normal;\n' +
        'varying vec4 v_Position;\n' +
        'void main() {\n' +
           // Normalize the normal because it is interpolated and not 1.0 in length any more
        '  vec3 normal = normalize(v_Normal);\n' +
           // Calculate the light direction and make it 1.0 in length
        '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
           // Find the unit-length eye-direction vector 'V' (surface pt --> camera)
        '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
           // The dot product of the light direction and the normal
        '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    
        '  float e64; \n' +
        'if(v_lightType==true){\n' +
          '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
          '  float nDotH = max(dot(H, normal), 0.0); \n' +
          ' e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
        '}\n' +
        'else{\n' +
          '  vec3 H = normalize(reflect((-lightDirection), normal));\n' +
          '   float nDotH = max(dot(H, eyeDirection), 0.0); \n' +
          ' float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
        '}\n' +
        
        //'  vec3 H = normalize(lightDirection + eyeDirection); \n' +
        //'  float nDotH = max(dot(H, normal), 0.0); \n' +
        //'  float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
        '	 vec3 emissive = 										u_MatlSet[0].emit;' +
        '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
        '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
        '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
    
        ' if(u_lightOn) {\n' +
          '	 gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
        '}\n' +
        ' else {\n' +
          ' gl_FragColor = vec4(0, 0, 0, 1.0);}\n' +
        //'  gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
           // Calculate the final color from diffuse reflection and ambient reflection
        //'  vec3 diffuse = u_LightColor * nDotL;\n' +
        //'  vec3 ambient = u_AmbientLight;\n' +
        //'  gl_FragColor = vec4(diffuse + ambient, v_Colr1.a);\n' +
        '}\n';
      
        this.vboContents = //---------------------------------------------------------
          new Float32Array ([					// Array of vertex attribute values we will
                                      // transfer to GPU's vertex buffer object (VBO)
            // 1 vertex per line: pos1 x,y,z,w;   colr1; r,g,b;   ptSiz1; 
          -0.3,  0.7,	0.0, 1.0,		0.0, 1.0, 1.0,  //17.0,
          -0.3, -0.3, 0.0, 1.0,		1.0, 0.0, 1.0,  //20.0,
           0.3, -0.3, 0.0, 1.0,		1.0, 1.0, 0.0,  //33.0,
        ]);	
      
        var floatsPerVertex = 7;
        
        makesphere();
        savesize1 = this.vboContents.length;
            var mySiz = (spherepoints.length + this.vboContents.length);
            var mypoints = new Float32Array(mySiz);
                //lineStart = 0;           // next, we'll store the sphere;
              for(i=0, j=0; j< this.vboContents.length; i++, j++) {// don't initialize i -- reuse it!
                mypoints[i] = this.vboContents[j];
                }
                spherestart1 = i;             // we stored the cylinder first.
              for(j=0; j< spherepoints.length; i++,j++) {
                mypoints[i] = spherepoints[j];
                }
            this.vboContents = mypoints;
        
        this.vboVerts = (this.vboContents.length /floatsPerVertex);							// # of vertices held in 'vboContents' array;
        this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
                                      // bytes req'd by 1 vboContents array element;
                                      // (why? used to compute stride and offset 
                                      // in bytes for vertexAttribPointer() calls)
        this.vboBytes = this.vboContents.length * this.FSIZE;               
                                      // (#  of floats in vboContents array) * 
                                      // (# of bytes/float).
        this.vboStride = this.vboBytes / this.vboVerts;     
                                      // (== # of bytes to store one complete vertex).
                                      // From any attrib in a given vertex in the VBO, 
                                      // move forward by 'vboStride' bytes to arrive 
                                      // at the same attrib for the next vertex.
                                       
                    //----------------------Attribute sizes
        this.vboFcount_a_Pos1 =  4;    // # of floats in the VBO needed to store the
                                      // attribute named a_Pos1. (4: x,y,z,w values)
        this.vboFcount_a_Colr1 = 3;   // # of floats for this attrib (r,g,b values)
        //this.vboFcount_a_PtSiz1 = 0;  // # of floats for this attrib (just one!)   
        console.assert((this.vboFcount_a_Pos1 +     // check the size of each and
                        this.vboFcount_a_Colr1 ) * //+
                       // this.vboFcount_a_PtSiz1) *   // every attribute in our VBO
                        this.FSIZE == this.vboStride, // for agreeement with'stride'
                        "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
                        
                    //----------------------Attribute offsets
        this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
                                      // of 1st a_Pos1 attrib value in vboContents[]
        this.vboOffset_a_Colr1 = (this.vboFcount_a_Pos1) * this.FSIZE;  
                                      // == 4 floats * bytes/float
                                      //# of bytes from START of vbo to the START
                                      // of 1st a_Colr1 attrib value in vboContents[]
        this.vboOffset_a_PtSiz1 =(this.vboFcount_a_Pos1 +
                                  this.vboFcount_a_Colr1) * this.FSIZE; 
                                      // == 7 floats * bytes/float
                                      // # of bytes from START of vbo to the START
                                      // of 1st a_PtSize attrib value in vboContents[]
      
                    //-----------------------GPU memory locations:                                
        this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                      // returned by gl.createBuffer() function call
        this.shaderLoc;								// GPU Location for compiled Shader-program  
                                      // set by compile/link of VERT_SRC and FRAG_SRC.
                                //------Attribute locations in our shaders:
        this.a_Pos1Loc;							  // GPU location: shader 'a_Pos1' attribute
        this.a_Colr1Loc;							// GPU location: shader 'a_Colr1' attribute
        this.a_PtSiz1Loc;							// GPU location: shader 'a_PtSiz1' attribute
        
                    //---------------------- Uniform locations &values in our shaders
        this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
        this.u_ModelMatrixLoc;						// GPU location for u_ModelMat uniform
      
        this.MvpMatrix = new Matrix4();
        this.u_MvpMatrixLoc; 
        
        
        this.NormalMatrix = new Matrix4();
        this.u_NormalMatrixLoc; 
    
        this.eyepos = new Float32Array(3);
        this.u_eyePosWorldLoc;
    
        this.uLoc_ModelMatrix 	= false;
        this.uLoc_MvpMatrix 		= false;
        this.uLoc_NormalMatrix = false;
    
        this.eyePosWorld = new Float32Array(3);
        
        this.lamp0 = new LightsT();
    
        this.matlSel = MATL_RUBY;				// see keypress(): 'm' key changes matlSel
        this.matl0 = new Material(this.matlSel);
    
        this.u_lightOnLoc;
      
        this.u_lightTypeLoc;
        
        //this.u_LightColorLoc;
        //this.u_LightPositionLoc;
        //this.u_AmbientLightLoc;
      };
      
      
      VBObox7.prototype.init = function() {
      //==============================================================================
      // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
      // kept in this VBObox. (This function usually called only once, within main()).
      // Specifically:
      // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
      //  executable 'program' stored and ready to use inside the GPU.  
      // b) create a new VBO object in GPU memory and fill it by transferring in all
      //  the vertex data held in our Float32array member 'VBOcontents'. 
      // c) Find & save the GPU location of all our shaders' attribute-variables and 
      //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
      // -------------------
      // CAREFUL!  before you can draw pictures using this VBObox contents, 
      //  you must call this VBObox object's switchToMe() function too!
      //--------------------
      // a) Compile,link,upload shaders-----------------------------------------------
        this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
        if (!this.shaderLoc) {
          console.log(this.constructor.name + 
                      '.init() failed to create executable Shaders on the GPU. Bye!');
          return;
        }
      // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
      //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
      
        gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
      
      // b) Create VBO on GPU, fill it------------------------------------------------
        this.vboLoc = gl.createBuffer();	
        if (!this.vboLoc) {
          console.log(this.constructor.name + 
                      '.init() failed to create VBO in GPU. Bye!'); 
          return;
        }
        
        // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
        //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
        // (positions, colors, normals, etc), or 
        //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
        // that each select one vertex from a vertex array stored in another VBO.
        gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                        this.vboLoc);				  // the ID# the GPU uses for this buffer.
                              
        // Fill the GPU's newly-created VBO object with the vertex data we stored in
        //  our 'vboContents' member (JavaScript Float32Array object).
        //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
        //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
        gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                          this.vboContents, 		// JavaScript Float32Array
                         gl.STATIC_DRAW);			// Usage hint.  
        //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
        //	(see OpenGL ES specification for more info).  Your choices are:
        //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
        //				contents rarely or never change.
        //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
        //				contents may change often as our program runs.
        //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
        // 			times and then discarded; for rapidly supplied & consumed VBOs.
      
      // c1) Find All Attributes:-----------------------------------------------------
      //  Find & save the GPU location of all our shaders' attribute-variables and 
      //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
        this.a_Pos1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
        if(this.a_Pos1Loc < 0) {
          console.log(this.constructor.name + 
                      '.init() Failed to get GPU location of attribute a_Pos1');
          return -1;	// error exit.
        }
         //this.a_Colr1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Colr1');
        //if(this.a_Colr1Loc < 0) {
         // console.log(this.constructor.name + 
         //             '.init() failed to get the GPU location of attribute a_Colr1');
          //return -1;	// error exit.
        //}
        //this.a_PtSiz1Loc = gl.getAttribLocation(this.shaderLoc, 'a_PtSiz1');
        //if(this.a_PtSiz1Loc < 0) {
          //console.log(this.constructor.name + 
           // 					'.init() failed to get the GPU location of attribute a_PtSiz1');
          //return -1;	// error exit.
        //}
        // c2) Find All Uniforms:-----------------------------------------------------
        //Get GPU storage location for each uniform var used in our shader programs: 
       this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
        if (!this.u_ModelMatrixLoc) { 
          console.log(this.constructor.name + 
                      '.init() failed to get GPU location for u_ModelMatrix uniform');
          return;
        }
    
        this.eyePosWorldLoc  = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
    
    
        this.a_normalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
        this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
        this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
        //this.u_LightColorLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightColor');
        //this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
        //this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
    
        //if (!this.u_MvpMatrixLoc || !this.u_NormalMatrixLoc || !this.u_LightColorLoc || !this.u_LightPositionLoc　|| !this.u_AmbientLightLoc || !this.eyePosWorldLoc) { 
        //  console.log('Failed to get the storage location');
        //  return;
        //}
    
        if (!this.u_MvpMatrixLoc || !this.u_NormalMatrixLoc || !this.eyePosWorldLoc) { 
          console.log('Failed to get the storage location');
          return;
        }
    
        this.lamp0.u_pos  = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos');	
        this.lamp0.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].ambi');
        this.lamp0.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].diff');
        this.lamp0.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].spec');
        if( !this.lamp0.u_pos || !this.lamp0.u_ambi	|| !this.lamp0.u_diff || !this.lamp0.u_spec	) {
          console.log('Failed to get GPUs Lamp0 storage locations');
          return;
        }
          this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
          this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
          this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
          this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
          this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
        if( !this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny) {
          console.log('.init() Failed to get GPU location of uniforms of matl0 or lamp0');
          return;
        }
    
        this.u_lightOnLoc = gl.getUniformLocation(this.shaderLoc, 'u_lightOn');
          if(!this.u_lightOnLoc) {
            console.log('.init() Failed to get GPU location of unifrom u_lightOn');
            return;
              }
      
      
          this.u_lightTypeLoc = gl.getUniformLocation(this.shaderLoc, 'v_lightType');
          if(!this.u_lightTypeLoc) {
            console.log('.init() Failed to get GPU location of varying LightType');
            return;
          } 
        /*this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
        this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
        this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
        this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
        this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
        if(!this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd 
                          || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny
           ) {
          console.log('Failed to get GPUs Reflectance storage locations');
          return;
    }*/
      
      }
      
      VBObox7.prototype.switchToMe = function () {
      //==============================================================================
      // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
      //
      // We only do this AFTER we called the init() function, which does the one-time-
      // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
      // even then, you are STILL not ready to draw our VBObox's contents onscreen!
      // We must also first complete these steps:
      //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
      //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
      //  c) tell the GPU to connect the shader program's attributes to that VBO.
      
      // a) select our shader program:
        gl.useProgram(this.shaderLoc);	
      //		Each call to useProgram() selects a shader program from the GPU memory,
      // but that's all -- it does nothing else!  Any previously used shader program's 
      // connections to attributes and uniforms are now invalid, and thus we must now
      // establish new connections between our shader program's attributes and the VBO
      // we wish to use.  
        
      // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
      //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
      //    supply values to use as attributes in our newly-selected shader program:
        gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
                          this.vboLoc);			// the ID# the GPU uses for our VBO.
      
      // c) connect our newly-bound VBO to supply attribute variable values for each
      // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
      // this sets up data paths from VBO to our shader units:
        // 	Here's how to use the almost-identical OpenGL version of this function:
        //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
        gl.vertexAttribPointer(
          this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
          this.vboFcount_a_Pos1, // # of floats used by this attribute: 1,2,3 or 4?
          gl.FLOAT,		  // type == what data type did we use for those numbers?
          false,				// isNormalized == are these fixed-point values that we need
                        //									normalize before use? true or false
          this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                        // stored attrib for this vertex to the same stored attrib
                        //  for the next vertex in our VBO.  This is usually the 
                        // number of bytes used to store one complete vertex.  If set 
                        // to zero, the GPU gets attribute values sequentially from 
                        // VBO, starting at 'Offset'.	
                        // (Our vertex size in bytes: 4 floats for pos + 3 for color)
          this.vboOffset_a_Pos1);						
                        // Offset == how many bytes from START of buffer to the first
                        // value we will actually use?  (we start with position).
        gl.vertexAttribPointer(this.a_Colr1Loc, this.vboFcount_a_Colr1,
                               gl.FLOAT, false, 
                               this.vboStride,  this.vboOffset_a_Colr1);
        gl.vertexAttribPointer(this.a_normalLoc, 3, gl.FLOAT, false, this.vboStride, 0);
        //gl.vertexAttribPointer(this.a_PtSiz1Loc,this.vboFcount_a_PtSiz1, 
                               //gl.FLOAT, false, 
                               //this.vboStride,	this.vboOffset_a_PtSiz1);	
        //-- Enable this assignment of the attribute to its' VBO source:
        gl.enableVertexAttribArray(this.a_Pos1Loc);
        //gl.enableVertexAttribArray(this.a_Colr1Loc);
        gl.enableVertexAttribArray(this.a_normalLoc);
        //gl.enableVertexAttribArray(this.a_PtSiz1Loc);
      
        this.eyePosWorld.set([eyex, eyey, eyez]);
        this.lamp0.I_pos.elements.set( [lampx, lampy, lampz]);
        this.lamp0.I_ambi.elements.set([ambr, ambg, ambb]);
        this.lamp0.I_diff.elements.set([difr, difg, difb]);
        this.lamp0.I_spec.elements.set([specr, specg, specb]);
        gl.uniform3fv(this.lamp0.u_pos, this.lamp0.I_pos.elements.slice(0, 3));
        gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);        // ambient
        gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);        // diffuse
        gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);        // Specular
        gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0, 3));                // Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0, 3));                // Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0, 3));                // Kd    diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0, 3));                // Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny
          
        gl.uniform1i(this.u_lightTypeLoc, lightType);
        gl.uniform1i(this.u_lightOnLoc, lightOn);
    
        // Set the light color (white)
        //gl.uniform3f(this.u_LightColorLoc, 0.8, 0.4, 0.0);
        // Set the light direction (in the world coordinate)
        //gl.uniform3f(this.u_LightPositionLoc, 5.0, 8.0, 7.0);
        // Set the ambient light
        //gl.uniform3f(this.u_AmbientLightLoc, 0.4, 0.4, 0.4);
      }
      
      VBObox7.prototype.isReady = function() {
      //==============================================================================
      // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
      // this objects VBO and shader program; else return false.
      // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
      
      var isOK = true;
      
        if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
          console.log(this.constructor.name + 
                      '.isReady() false: shader program at this.shaderLoc not in use!');
          isOK = false;
        }
        if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
            console.log(this.constructor.name + 
                    '.isReady() false: vbo at this.vboLoc not in use!');
          isOK = false;
        }
        return isOK;
      }
      
      VBObox7.prototype.adjust = function() {
        //==============================================================================
        // Update the GPU to newer, current values we now store for 'uniform' vars on 
        // the GPU; and (if needed) update each attribute's stride and offset in VBO.
        
          // check: was WebGL context set to use our VBO & shader program?
          if(this.isReady()==false) {
                console.log('ERROR! before' + this.constructor.name + 
                      '.adjust() call you needed to call this.switchToMe()!!');
          }
          
          
          
          
          
          // Adjust values for our uniforms,
          this.ModelMatrix.setIdentity();
        // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
          //this.ModelMatrix.set(g_worldMat);
          
        //  this.ModelMatrix.rotate(g_angleNow1, 0, 0, 1);	// -spin drawing axes,
          this.ModelMatrix.translate(-5.0, 0.0, 0);
          this.ModelMatrix.rotate(g_angleNow0, 0, 0);
          //this.ModelMatrix.rotate(g_angleNow0, 0, 0);						// then translate them.
          //  Transfer new uniforms' values to the GPU:-------------
          // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
          gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
                              false, 										// use matrix transpose instead?
                              this.ModelMatrix.elements);	// send data from Javascript.
          
          this.MvpMatrix.set(g_worldMat);
          this.MvpMatrix.multiply(this.ModelMatrix);
          gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
          this.NormalMatrix.setInverseOf(this.ModelMatrix);
          this.NormalMatrix.transpose();
          gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
        
        
        }
        
        VBObox7.prototype.draw = function() {
        //=============================================================================
        // Send commands to GPU to select and render current VBObox contents.
        
          // check: was WebGL context set to use our VBO & shader program?
          if(this.isReady()==false) {
                console.log('ERROR! before' + this.constructor.name + 
                      '.draw() call you needed to call this.switchToMe()!!');
          }
          
          // ----------------------------Draw the contents of the currently-bound VBO:
          //gl.uniform3fv(this.u_eyePosLoc, this.eyePos);// use it to set our uniform
          //gl.uniform1i(this.u_lightType, lightType);
          gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
                          // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                          //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
                          spherestart1/7, 								// location of 1st vertex to draw;
                          (this.vboContents.length/7)-3);//(this.vboContents.length/7)-3);		// number of vertices to draw on-screen.
          this.ModelMatrix.rotate(g_angleNow1, 1, 0, 0);
          this.ModelMatrix.translate(0.0 ,0.0, 1.5);
                    this.ModelMatrix.scale(0.6, 0.6, 0.6);
                    //this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
          gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
          this.MvpMatrix.set(g_worldMat);
          this.MvpMatrix.multiply(this.ModelMatrix);
          gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
          this.NormalMatrix.setInverseOf(this.ModelMatrix);
          this.NormalMatrix.transpose();
          gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
    
          gl.drawArrays(gl.TRIANGLES,	spherestart1/7, (this.vboContents.length/7)-3);
    
          this.ModelMatrix.rotate(g_angleNow1, 1, 0, 0);
          this.ModelMatrix.translate(0.0 ,0.0, 1.5);
                    this.ModelMatrix.scale(0.6, 0.6, 0.6);
                    //this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
          gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
          this.MvpMatrix.set(g_worldMat);
          this.MvpMatrix.multiply(this.ModelMatrix);
          gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
          this.NormalMatrix.setInverseOf(this.ModelMatrix);
          this.NormalMatrix.transpose();
          gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
    
          gl.drawArrays(gl.TRIANGLES,	spherestart1/7, (this.vboContents.length/7)-3);
                          
        }
      
      
      VBObox7.prototype.reload = function() {
      //=============================================================================
      // Over-write current values in the GPU for our already-created VBO: use 
      // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
      // contents to our VBO without changing any GPU memory allocations.
      
       gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                        0,                  // byte offset to where data replacement
                                            // begins in the VBO.
                          this.vboContents);   // the JS source-data array used to fill VBO
 }




 function VBObox8() {
  //=============================================================================
  //=============================================================================
  // CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
  // needed to render vertices from one Vertex Buffer Object (VBO) using one 
  // separate shader program (a vertex-shader & fragment-shader pair) and one
  // set of 'uniform' variables.
  
  // Constructor goal: 
  // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
  // written into code) in all other VBObox functions. Keeping all these (initial)
  // values here, in this one coonstrutor function, ensures we can change them 
  // easily WITHOUT disrupting any other code, ever!
    
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    'precision highp int;\n' +
    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '		};\n' +
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                            //		   w==0.0 for distant light from x,y,z direction 
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +
    //
    'attribute vec4 a_Pos1;\n' +
    'attribute vec4 a_Normal;\n' +    //added
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_MvpMatrix;\n' +   //added
    'uniform mat4 u_NormalMatrix;\n' +   // added Transformation matrix of the normal
    'uniform vec3 u_eyePos; \n' +
    'uniform MatlT u_MatlSet[1];\n' +
    'uniform LampT u_LampSet[1];\n' +
    'uniform bool u_lightOn;\n' +
    'uniform bool v_lightType;\n' +
    //-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
    'varying vec3 v_Kd; \n' +
    'varying vec4 v_Position; \n' +				
    'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0
    'varying vec4 v_Color;\n' +
    //
    
    //'attribute vec3 a_Colr1;\n'+
    //'varying vec4 v_Colr1;\n' +  
    //'uniform vec3 u_LightColor;\n' +     // added Light color (((Diffuse Color))))
    //'uniform vec3 u_LightPosition;\n' +  // added  Position of the light source
    //'uniform vec3 u_AmbientLight;\n' +   // added  Ambient light color
    
    //
    'void main() {\n' +
    //'  gl_PointSize = a_PtSiz1;\n' +
    '  gl_Position = u_MvpMatrix * a_Pos1;\n' +
    '  v_Position = u_ModelMatrix * a_Pos1;\n' +
    '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '	 v_Kd = u_MatlSet[0].diff; \n' +
    '  vec3 normal = normalize(v_Normal);\n' +
    '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
    '  vec3 eyeDirection = normalize(u_eyePos - v_Position.xyz); \n' +
    '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
    '  float e64; \n' +
    'if(v_lightType){\n' +
      '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
      '  float nDotH = max(dot(H, normal), 0.0); \n' +
      ' e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
    '}\n' +
    'else{\n' +
      '  vec3 H = normalize(reflect((-lightDirection), normal));\n' +
      '   float nDotH = max(dot(H, eyeDirection), 0.0); \n' +
      ' float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
    '}\n' +
    '	 vec3 emissive = 	u_MatlSet[0].emit;' +
    '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
    '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
    '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
    ' if(u_lightOn) {\n' +
    '	 v_Color = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
      '}\n' +
    ' else {\n' +
    ' v_Color = vec4(0, 0, 0, 1.0);}\n' +
  
    //'	 vec4 color = vec4(a_Colr1.x, a_Colr1.y, a_Colr1.z, 1.0);\n' + 
    //added
       // Calculate a normal to be fit with a model matrix, and make it 1.0 in length
       // Calculate world coordinate of vertex
    //'  vec4 vertexPosition = u_ModelMatrix * a_Pos1;\n' +
       // Calculate the light direction and make it 1.0 in length
    //'  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
       // The dot product of the light direction and the normal
    //'  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    
       // Calculate the color due to diffuse reflection
    //'  vec3 diffuse = u_LightColor * nDotL;\n' + // * color.rgb
       // Calculate the color due to ambient reflection
    //'  vec3 ambient = u_AmbientLight;\n' + // * color.rgb
       // Add the surface colors due to diffuse reflection and ambient reflection
    //'  v_Colr1 = vec4(diffuse + ambient, color.a);\n' + 
    ' }\n';
  /*
   // SQUARE dots:
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;\n' +
    'varying vec3 v_Colr1;\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(v_Colr1, 1.0);\n' +  
    '}\n';
  */
  /*
   // ROUND FLAT dots:
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;\n' +
    'varying vec3 v_Colr1;\n' +
    'void main() {\n' +
    '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' + 
    '  if(dist < 0.5) {\n' +
    '    gl_FragColor = vec4(v_Colr1, 1.0);\n' +  
    '    } else {discard;};' +
    '}\n';
  */
  /*
   // SHADED, sphere-like dots:
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;\n' +
    'varying vec3 v_Colr1;\n' +
    'void main() {\n' +
    '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' + 
    '  if(dist < 0.5) {\n' + 
     '  	gl_FragColor = vec4((1.0-2.0*dist)*v_Colr1.rgb, 1.0);\n' +
    '    } else {discard;};' +
    '}\n';
    */
  
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' + 
    '}\n';
    makesphere();
    c30 = Math.sqrt(0.75);          // == cos(30deg) == sqrt(3) / 2
    sq2 = Math.sqrt(2.0);
    this.vboContents = spherepoints//--------------------------------------------------------
      /*new Float32Array ([					// Array of vertex attribute values we will
                                  // transfer to GPU's vertex buffer object (VBO)
        // 1 vertex per line: pos1 x,y,z,w;   colr1; r,g,b;   ptSiz1; 
        0.0,  0.5, 1.4, 1.0,     0.8,  0.4,  0.3,  // Node 0
        0.8, 0.0, 0.0, 1.0,     0.8,  0.4,  0.3,  // Node 1
        0.0,  1.5, 0.0, 1.0,      0.8,  0.4,  0.3,  // Node 2
             // Face 1: (right side)
          0.0,   0.5, 1.4, 1.0,     -0.8,  0.4,  0.3,  // Node 0
        0.0,  1.5, 0.0, 1.0,      -0.8,  0.4,  0.3,  // Node 2
         -0.8, 0.0, 0.0, 1.0,     -0.8, 0.4, 0.3,  // Node 3
           // Face 2: (lower side)
          0.0,   0.5, 1.4, 1.0,     0.0,  -0.9,  0.3,  // Node 0 
         -0.8, 0.0, 0.0, 1.0,     0.0,  -0.9,  0.3,  // Node 3
        0.8, 0.0, 0.0, 1.0,     0.0,  -0.9,  0.3,  // Node 1 
          // Face 3: (base side)  
         -0.8, 0.0,  0.0, 1.0,    0.0,  0.0,  -1.0,  // Node 3
        0.0,  1.5,  0.0, 1.0,   0.0,  0.0,  -1.0,  // Node 2
        0.8, 0.0,  0.0, 1.0,    0.0,  0.0,  -1.0,
        //axis
        0.0,  0.0,  0.0, 1.0,   0.3,  0.3,  0.3,  // X axis line (origin: gray)
           5.0,  0.0,  0.0, 1.0,    1.0,  0.3,  0.3,  //             (endpoint: red)
           
           0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,  // Y axis line (origin: white)
           0.0,  5.0,  0.0, 1.0,    0.3,  1.0,  0.3,  //             (endpoint: green)
      
           0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,  // Z axis line (origin:white)
           0.0,  0.0,  5.0, 1.0,    0.3,  0.3,  1.0  //33.0,
    ]);	*/
  
    var floatsPerVertex = 7;
    
    /*maketriangle();
    savesize1 = this.vboContents.length;
        var mySiz = (trianglepoints.length + this.vboContents.length);
        var mypoints = new Float32Array(mySiz);
            //lineStart = 0;           // next, we'll store the sphere;
          for(i=0, j=0; j< this.vboContents.length; i++, j++) {// don't initialize i -- reuse it!
            mypoints[i] = this.vboContents[j];
            }
            spherestart1 = i;             // we stored the cylinder first.
          for(j=0; j< trianglepoints.length; i++,j++) {
            mypoints[i] = trianglepoints[j];
            }
        this.vboContents = mypoints;
    */
    this.vboVerts = (this.vboContents.length /floatsPerVertex);							// # of vertices held in 'vboContents' array;
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
                                  // bytes req'd by 1 vboContents array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                                  // (#  of floats in vboContents array) * 
                                  // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;     
                                  // (== # of bytes to store one complete vertex).
                                  // From any attrib in a given vertex in the VBO, 
                                  // move forward by 'vboStride' bytes to arrive 
                                  // at the same attrib for the next vertex.
                                   
                //----------------------Attribute sizes
    this.vboFcount_a_Pos1 =  4;    // # of floats in the VBO needed to store the
                                  // attribute named a_Pos1. (4: x,y,z,w values)
    this.vboFcount_a_Colr1 = 3;   // # of floats for this attrib (r,g,b values)
    //this.vboFcount_a_PtSiz1 = 0;  // # of floats for this attrib (just one!)   
    console.assert((this.vboFcount_a_Pos1 +     // check the size of each and
                    this.vboFcount_a_Colr1 ) * //+
                   // this.vboFcount_a_PtSiz1) *   // every attribute in our VBO
                    this.FSIZE == this.vboStride, // for agreeement with'stride'
                    "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
                    
                //----------------------Attribute offsets
    this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
                                  // of 1st a_Pos1 attrib value in vboContents[]
    this.vboOffset_a_Colr1 = (this.vboFcount_a_Pos1) * this.FSIZE;  
                                  // == 4 floats * bytes/float
                                  //# of bytes from START of vbo to the START
                                  // of 1st a_Colr1 attrib value in vboContents[]
    this.vboOffset_a_PtSiz1 =(this.vboFcount_a_Pos1 +
                              this.vboFcount_a_Colr1) * this.FSIZE; 
                                  // == 7 floats * bytes/float
                                  // # of bytes from START of vbo to the START
                                  // of 1st a_PtSize attrib value in vboContents[]
  
                //-----------------------GPU memory locations:                                
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                  // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                                  // set by compile/link of VERT_SRC and FRAG_SRC.
                            //------Attribute locations in our shaders:
    this.a_Pos1Loc;							  // GPU location: shader 'a_Pos1' attribute
    this.a_Colr1Loc;							// GPU location: shader 'a_Colr1' attribute
    this.a_PtSiz1Loc;							// GPU location: shader 'a_PtSiz1' attribute
    
                //---------------------- Uniform locations &values in our shaders
    this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMatrixLoc;						// GPU location for u_ModelMat uniform
  
    this.MvpMatrix = new Matrix4();
    this.u_MvpMatrixLoc; 
    
    
    this.NormalMatrix = new Matrix4();
    this.u_NormalMatrixLoc; 
  
    this.eyePos = new Float32Array(3);
    this.u_eyeposloc;
  
    this.lamp0 = new LightsT();
    this.matlSel= MATL_RUBY;	
    this.matl0 = new Material(this.matlSel);
      
    this.u_lightOnLoc;
  
    this.u_lightTypeLoc;
    
    //this.u_LightColorLoc;
    //this.u_LightPositionLoc;
    //this.u_AmbientLightLoc;
  };
  
  
  VBObox8.prototype.init = function() {
  //==============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create executable Shaders on the GPU. Bye!');
      return;
    }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  
  // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }
    
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                    this.vboLoc);				  // the ID# the GPU uses for this buffer.
                          
    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                      this.vboContents, 		// JavaScript Float32Array
                     gl.STATIC_DRAW);			// Usage hint.  
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.
  
  // c1) Find All Attributes:-----------------------------------------------------
  //  Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
    this.a_Pos1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
    if(this.a_Pos1Loc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Pos1');
      return -1;	// error exit.
    }
     //this.a_Colr1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Colr1');
    //if(this.a_Colr1Loc < 0) {
     // console.log(this.constructor.name + 
    //  						'.init() failed to get the GPU location of attribute a_Colr1');
     // return -1;	// error exit.
    //}
    //this.a_PtSiz1Loc = gl.getAttribLocation(this.shaderLoc, 'a_PtSiz1');
    //if(this.a_PtSiz1Loc < 0) {
      //console.log(this.constructor.name + 
       // 					'.init() failed to get the GPU location of attribute a_PtSiz1');
      //return -1;	// error exit.
    //}
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
   this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
    if (!this.u_ModelMatrixLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ModelMatrix uniform');
      return;
    }
  
    this.u_eyeposloc = gl.getUniformLocation(this.shaderLoc, 'u_eyePos');
        if (!this.u_eyeposloc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_eyePos uniform');
        return;
        }
  
    this.a_normalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
    this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    //this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
    //this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
    if (!this.u_MvpMatrixLoc || !this.u_NormalMatrixLoc || !this.a_normalLoc) { 
      console.log('Failed to get the storage location');
      return;
    }
  
    this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
    this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
    this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
    this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
    this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
  
    this.lamp0.u_pos  = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos');	
    this.lamp0.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].ambi');
    this.lamp0.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].diff');
    this.lamp0.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].spec');
      
    if( !this.lamp0.u_pos || !this.lamp0.u_ambi	|| !this.lamp0.u_diff || !this.lamp0.u_spec	|| !this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny) {
      console.log('.init() Failed to get GPU location of uniforms of matl0 or lamp0');
      return;
    }
      
    this.u_lightOnLoc = gl.getUniformLocation(this.shaderLoc, 'u_lightOn');
    if(!this.u_lightOnLoc) {
      console.log('.init() Failed to get GPU location of unifrom u_lightOn');
      return;
    }
  
  
    this.u_lightTypeLoc = gl.getUniformLocation(this.shaderLoc, 'v_lightType');
    if(!this.u_lightTypeLoc) {
      console.log('.init() Failed to get GPU location of varying LightType');
      return;
    } 
  
  }
  
  VBObox8.prototype.switchToMe = function () {
  //==============================================================================
  // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
  //
  // We only do this AFTER we called the init() function, which does the one-time-
  // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
  // even then, you are STILL not ready to draw our VBObox's contents onscreen!
  // We must also first complete these steps:
  //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
  //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
  //  c) tell the GPU to connect the shader program's attributes to that VBO.
  
  // a) select our shader program:
    gl.useProgram(this.shaderLoc);	
  //		Each call to useProgram() selects a shader program from the GPU memory,
  // but that's all -- it does nothing else!  Any previously used shader program's 
  // connections to attributes and uniforms are now invalid, and thus we must now
  // establish new connections between our shader program's attributes and the VBO
  // we wish to use.  
    
  // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
  //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
  //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
                      this.vboLoc);			// the ID# the GPU uses for our VBO.
  
  // c) connect our newly-bound VBO to supply attribute variable values for each
  // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
  // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
      this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
      this.vboFcount_a_Pos1, // # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,		  // type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.vboOffset_a_Pos1);						
                    // Offset == how many bytes from START of buffer to the first
                    // value we will actually use?  (we start with position).
    gl.vertexAttribPointer(this.a_Colr1Loc, this.vboFcount_a_Colr1,
                           gl.FLOAT, false, 
                           this.vboStride,  this.vboOffset_a_Colr1);
    gl.vertexAttribPointer(this.a_normalLoc, 3, gl.FLOAT, false, this.vboStride, 0);
    //gl.vertexAttribPointer(this.a_PtSiz1Loc,this.vboFcount_a_PtSiz1, 
                           //gl.FLOAT, false, 
                           //this.vboStride,	this.vboOffset_a_PtSiz1);	
    //-- Enable this assignment of the attribute to its' VBO source:
    gl.enableVertexAttribArray(this.a_Pos1Loc);
    //gl.enableVertexAttribArray(this.a_Colr1Loc);
    gl.enableVertexAttribArray(this.a_normalLoc);
    //gl.enableVertexAttribArray(this.a_PtSiz1Loc);
  
    // Set the light color (white)
    //gl.uniform3f(this.u_LightColorLoc, 0.8, 0.4, 0.0);
    // Set the light direction (in the world coordinate)
    //gl.uniform3f(this.u_LightPositionLoc, 5.0, 8.0, 7.0);
    // Set the ambient light
    //gl.uniform3f(this.u_AmbientLightLoc, 0.4, 0.4, 0.4);
  
    this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
    this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
    this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
    this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
    this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
              
    this.eyePos.set([eyex, eyey, eyez]);
    this.lamp0.I_pos.elements.set( [lampx, lampy, lampz]);
    this.lamp0.I_ambi.elements.set([ambr, ambg, ambb]);
    this.lamp0.I_diff.elements.set([difr, difg, difb]);
    this.lamp0.I_spec.elements.set([specr, specg, specb]);
    gl.uniform3fv(this.lamp0.u_pos, this.lamp0.I_pos.elements.slice(0, 3));
    gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);        // ambient
    gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);        // diffuse
    gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);        // Specular
    gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0, 3));                // Ke emissive
    gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0, 3));                // Ka ambient
    gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0, 3));                // Kd    diffuse
    gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0, 3));                // Ks specular
    gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny
                
    gl.uniform1i(this.u_lightTypeLoc, lightType);
    gl.uniform1i(this.u_lightOnLoc, lightOn);
  
  }
  
  VBObox8.prototype.isReady = function() {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
  
  var isOK = true;
  
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
      console.log(this.constructor.name + 
                  '.isReady() false: shader program at this.shaderLoc not in use!');
      isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                '.isReady() false: vbo at this.vboLoc not in use!');
      isOK = false;
    }
    return isOK;
  }
  
  VBObox8.prototype.adjust = function() {
  //==============================================================================
  // Update the GPU to newer, current values we now store for 'uniform' vars on 
  // the GPU; and (if needed) update each attribute's stride and offset in VBO.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.adjust() call you needed to call this.switchToMe()!!');
    }
    
    
    
    
    
    // Adjust values for our uniforms,
    this.ModelMatrix.setIdentity();
  // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    //this.ModelMatrix.set(g_worldMat);
    
  //  this.ModelMatrix.rotate(g_angleNow1, 0, 0, 1);	// -spin drawing axes,
    this.ModelMatrix.translate(-5.0, 0.0, 0);
    this.ModelMatrix.rotate(g_angleNow0, 0, 0);
    //this.ModelMatrix.rotate(g_angleNow0, 0, 0);						// then translate them.
    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
                        false, 										// use matrix transpose instead?
                        this.ModelMatrix.elements);	// send data from Javascript.
    
    this.MvpMatrix.set(g_worldMat);
    this.MvpMatrix.multiply(this.ModelMatrix);
    gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
    this.NormalMatrix.setInverseOf(this.ModelMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
  
  
  }
  
  VBObox8.prototype.draw = function() {
  //=============================================================================
  // Send commands to GPU to select and render current VBObox contents.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.draw() call you needed to call this.switchToMe()!!');
    }
    
    // ----------------------------Draw the contents of the currently-bound VBO:
    //gl.uniform3fv(this.u_eyePosLoc, this.eyePos);// use it to set our uniform
    //gl.uniform1i(this.u_lightType, lightType);
    gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
                    // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                    //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
                    0, 								// location of 1st vertex to draw;
                    (this.vboContents.length/7));//(this.vboContents.length/7)-3);		// number of vertices to draw on-screen.
    this.ModelMatrix.rotate(g_angleNow1, 1, 0, 0);
    this.ModelMatrix.translate(0.0 ,0.0, 1.5);
              this.ModelMatrix.scale(0.6, 0.6, 0.6);
              //this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
    this.MvpMatrix.set(g_worldMat);
    this.MvpMatrix.multiply(this.ModelMatrix);
    gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
    this.NormalMatrix.setInverseOf(this.ModelMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);

    gl.drawArrays(gl.TRIANGLES,	0, (this.vboContents.length/7));

    this.ModelMatrix.rotate(g_angleNow1, 1, 0, 0);
    this.ModelMatrix.translate(0.0 ,0.0, 1.5);
              this.ModelMatrix.scale(0.6, 0.6, 0.6);
              //this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
    this.MvpMatrix.set(g_worldMat);
    this.MvpMatrix.multiply(this.ModelMatrix);
    gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
    this.NormalMatrix.setInverseOf(this.ModelMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);

    gl.drawArrays(gl.TRIANGLES,	0, (this.vboContents.length/7));
                    
  }
  
  
  VBObox8.prototype.reload = function() {
  //=============================================================================
  // Over-write current values in the GPU for our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.
  
   gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                    0,                  // byte offset to where data replacement
                                        // begins in the VBO.
                      this.vboContents);   // the JS source-data array used to fill VBO
  }






function maketriangle() {
   c30 = Math.sqrt(0.75);          // == cos(30deg) == sqrt(3) / 2
     sq2 = Math.sqrt(2.0);
  trianglepoints = new Float32Array ([
    0.0,  0.5, sq2, 1.0,     0.81,  0.47,  0.33,  // Node 0
      c30, 0.0, 0.0, 1.0,     0.81,  0.47,  0.33,  // Node 1
      0.0,  1.5, 0.0, 1.0,      0.81,  0.47,  0.33,  // Node 2
           // Face 1: (right side)
        0.0,   0.5, sq2, 1.0,     -0.81,  0.47,  0.33,  // Node 0
      0.0,  1.5, 0.0, 1.0,      -0.81,  0.47,  0.33,  // Node 2
       -c30, 0.0, 0.0, 1.0,     -0.81, 0.47, 0.33,  // Node 3
         // Face 2: (lower side)
        0.0,   0.5, sq2, 1.0,     0.0,  -0.94,  0.33,  // Node 0 
       -c30, 0.0, 0.0, 1.0,     0.0,  -0.94,  0.33,  // Node 3
      c30, 0.0, 0.0, 1.0,     0.0,  -0.94,  0.33,  // Node 1 
        // Face 3: (base side)  
       -c30, 0.0,  0.0, 1.0,    0.0,  0.0,  1.0,  // Node 3
      0.0,  1.5,  0.0, 1.0,   0.0,  0.0,  1.0,  // Node 2
      c30, 0.0,  0.0, 1.0,    0.0,  0.0,  1.0,
      //axis
      0.0,  0.0,  0.0, 1.0,   0.3,  0.3,  0.3,  // X axis line (origin: gray)
         5.0,  0.0,  0.0, 1.0,    1.0,  0.3,  0.3,  //             (endpoint: red)
         
         0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,  // Y axis line (origin: white)
         0.0,  5.0,  0.0, 1.0,    0.3,  1.0,  0.3,  //             (endpoint: green)
    
         0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,  // Z axis line (origin:white)
         0.0,  0.0,  5.0, 1.0,    0.3,  0.3,  1.0])
}

//=============================================================================
//=============================================================================
//=============================================================================

function makesphere() {
  spherepoints = new Float32Array ([0.0,-1.0,0.0,1.0,-1.306012939612e-06,-0.9999999999991471,7.024692550196524e-18,
    0.20318100000000006,-0.96795,0.14761800000000003,1.0,0.21095266289464853,-0.9654061618992498,0.15326420516420788,
    -0.07760699999999998,-0.96795,0.23885299999999998,1.0,-0.08057675620781352,-0.9654060832357604,0.2479888723519962,
    0.7236069999999999,-0.44721999999999995,0.525725,1.0,0.7236067216830413,-0.4472196513214831,0.5257260653677089,
    0.6095470000000001,-0.657519,0.4428559999999999,1.0,0.6042310408008547,-0.6649722006723842,0.43899524105124693,
    0.812729,-0.502301,0.2952379999999999,1.0,0.8151848055269568,-0.503817229437447,0.2857305236756347,
    0.0,-1.0,0.0,1.0,-1.306012939612e-06,-0.9999999999991471,7.024692550196524e-18,
    -0.07760699999999998,-0.96795,0.23885299999999998,1.0,-0.08057675620781352,-0.9654060832357604,0.2479888723519962,
    -0.251147,-0.967949,0.0,1.0,-0.26075247981128585,-0.965405688957526,8.4223782992918e-07,
    0.0,-1.0,0.0,1.0,-1.306012939612e-06,-0.9999999999991471,7.024692550196524e-18,
    -0.251147,-0.967949,0.0,1.0,-0.26075247981128585,-0.965405688957526,8.4223782992918e-07,
    -0.07760699999999998,-0.96795,-0.23885299999999998,1.0,-0.08057588379380852,-0.9654061724258667,-0.24798880860410688,
    0.0,-1.0,0.0,1.0,-1.306012939612e-06,-0.9999999999991471,7.024692550196524e-18,
    -0.07760699999999998,-0.96795,-0.23885299999999998,1.0,-0.08057588379380852,-0.9654061724258667,-0.24798880860410688,
    0.20318100000000006,-0.96795,-0.14761800000000003,1.0,0.21095286907952562,-0.9654060533326492,-0.15326460522832558,
    0.7236069999999999,-0.44721999999999995,0.525725,1.0,0.7236067216830413,-0.4472196513214831,0.5257260653677089,
    0.812729,-0.502301,0.2952379999999999,1.0,0.8151848055269568,-0.503817229437447,0.2857305236756347,
    0.860698,-0.251151,0.442858,1.0,0.864986890060841,-0.24306353018273283,0.4389963557001157,
    -0.2763880000000001,-0.44721999999999995,0.850649,1.0,-0.27638775259514803,-0.44721995820039745,0.8506492339399584,
    -0.02963899999999997,-0.502302,0.8641839999999998,1.0,-0.019838689717257413,-0.5038192559913451,0.8635812548235572,
    -0.155215,-0.25115200000000004,0.955422,1.0,-0.15021677729008256,-0.24306351370824936,0.9583084305819194,
    -0.894426,-0.44721600000000006,0.0,1.0,-0.8944264388330798,-0.44721509983046726,3.5123469383576465e-18,
    -0.831051,-0.502299,0.23885299999999998,1.0,-0.8274488479658778,-0.5038149789897272,0.24798965894876002,
    -0.956626,-0.25114900000000007,0.14761800000000003,1.0,-0.9578262170326509,-0.24306111405524763,0.1532652367601444,
    -0.2763880000000001,-0.44721999999999995,-0.850649,1.0,-0.2763877525951483,-0.44721995820039734,-0.8506492339399583,
    -0.48397099999999993,-0.502302,-0.716565,1.0,-0.4915461091474215,-0.5038186497816622,-0.7103162610515219,
    -0.43600700000000003,-0.25115200000000004,-0.864188,1.0,-0.4417472320955005,-0.24306420283334987,-0.8635850718006606,
    0.7236069999999999,-0.44721999999999995,-0.525725,1.0,0.7236067216830413,-0.4472196513214831,-0.525726065367709,
    0.531941,-0.502302,-0.681712,1.0,0.5236579140350146,-0.503818798851909,-0.6869854488938736,
    0.6871589999999999,-0.25115200000000004,-0.681715,1.0,0.6848117102472356,-0.2430639714860927,-0.6869882293559796,
    0.7236069999999999,-0.44721999999999995,0.525725,1.0,0.7236067216830413,-0.4472196513214831,0.5257260653677089,
    0.860698,-0.251151,0.442858,1.0,0.864986890060841,-0.24306353018273283,0.4389963557001157,
    0.6871589999999999,-0.25115200000000004,0.6817150000000001,1.0,0.6848111757491196,-0.24306484466307332,0.6869884532203029,
    -0.2763880000000001,-0.44721999999999995,0.850649,1.0,-0.27638775259514803,-0.44721995820039745,0.8506492339399584,
    -0.155215,-0.25115200000000004,0.955422,1.0,-0.15021677729008256,-0.24306351370824936,0.9583084305819194,
    -0.43600700000000003,-0.25115200000000004,0.864188,1.0,-0.4417470436660011,-0.2430638114471244,0.8635852783466985,
    -0.894426,-0.44721600000000006,0.0,1.0,-0.8944264388330798,-0.44721509983046726,3.5123469383576465e-18,
    -0.956626,-0.25114900000000007,0.14761800000000003,1.0,-0.9578262170326509,-0.24306111405524763,0.1532652367601444,
    -0.956626,-0.25114900000000007,-0.14761800000000003,1.0,-0.9578262170326509,-0.24306111405524766,-0.15326523676014436,
    -0.2763880000000001,-0.44721999999999995,-0.850649,1.0,-0.2763877525951483,-0.44721995820039734,-0.8506492339399583,
    -0.43600700000000003,-0.25115200000000004,-0.864188,1.0,-0.4417472320955005,-0.24306420283334987,-0.8635850718006606,
    -0.155215,-0.25115200000000004,-0.955422,1.0,-0.1502164527684422,-0.24306415178722385,-0.9583083196099383,
    0.7236069999999999,-0.44721999999999995,-0.525725,1.0,0.7236067216830413,-0.4472196513214831,-0.525726065367709,
    0.6871589999999999,-0.25115200000000004,-0.681715,1.0,0.6848117102472356,-0.2430639714860927,-0.6869882293559796,
    0.860698,-0.251151,-0.442858,1.0,0.8649868190167103,-0.2430628154105527,-0.4389968914377966,
    0.2763880000000001,0.44721999999999995,0.850649,1.0,0.27638775259514803,0.44721995820039745,0.8506492339399583,
    0.48397099999999993,0.502302,0.7165650000000001,1.0,0.4915465997259058,0.5038185159472155,0.7103160164931138,
    0.23282200000000008,0.657519,0.7165629999999998,1.0,0.2307912277766018,0.6649729391400707,0.7103142962047043,
    -0.723607,0.44721999999999995,0.525725,1.0,-0.7236067216830413,0.4472196513214834,0.5257260653677087,
    -0.531941,0.502302,0.6817120000000001,1.0,-0.5236576234680893,0.50381866852951,0.6869857659550921,
    -0.609547,0.657519,0.4428559999999999,1.0,-0.6042309075875276,0.6649723338191165,0.4389952227201456,
    -0.723607,0.44721999999999995,-0.525725,1.0,-0.7236067216830412,0.44721965132148317,-0.5257260653677089,
    -0.812729,0.5023010000000001,-0.295238,1.0,-0.8151846510833863,0.503817580270061,-0.2857303456913146,
    -0.609547,0.657519,-0.442856,1.0,-0.6042309075875275,0.6649723338191165,-0.43899522272014574,
    0.2763880000000001,0.44721999999999995,-0.850649,1.0,0.27638775259514836,0.44721995820039734,-0.8506492339399583,
    0.02963899999999997,0.502302,-0.864184,1.0,0.019838395348954305,0.5038189457553266,-0.8635814425796619,
    0.23282200000000008,0.657519,-0.716563,1.0,0.230791227776602,0.6649729391400707,-0.7103142962047043,
    0.8944260000000002,0.44721600000000006,0.0,1.0,0.8944264388330799,0.4472150998304671,-7.024693876715296e-18,
    0.831051,0.502299,-0.23885299999999998,1.0,0.8274486846864867,0.5038152762710822,-0.24798959979502425,
    0.753442,0.6575150000000001,0.0,1.0,0.746871320486886,0.6649685937201661,-3.519020267383579e-18,
    0.251147,0.967949,0.0,1.0,0.26075244445654044,0.9654056985070778,0.0,
    0.07760699999999998,0.9679500000000001,-0.23885299999999998,1.0,0.0805764015653053,0.9654061629757468,-0.24798867715932643,
    0.0,1.0,0.0,1.0,1.3060129397770804e-06,0.9999999999991471,0.0,
    0.52573,0.850652,0.0,1.0,0.5257289266852015,0.8506521590206104,-1.057645314374342e-17,
    0.3618000000000001,0.8944290000000001,-0.26286300000000007,1.0,0.36820620295749656,0.8904258595923642,-0.2675181875552053,
    0.251147,0.967949,0.0,1.0,0.26075244445654044,0.9654056985070778,0.0,
    0.753442,0.6575150000000001,0.0,1.0,0.746871320486886,0.6649685937201661,-3.519020267383579e-18,
    0.6381939999999999,0.7236099999999999,-0.262864,1.0,0.6317479702095651,0.7275492343102217,-0.2675193708700447,
    0.52573,0.850652,0.0,1.0,0.5257289266852015,0.8506521590206104,-1.057645314374342e-17,
    0.251147,0.967949,0.0,1.0,0.26075244445654044,0.9654056985070778,0.0,
    0.3618000000000001,0.8944290000000001,-0.26286300000000007,1.0,0.36820620295749656,0.8904258595923642,-0.2675181875552053,
    0.07760699999999998,0.9679500000000001,-0.23885299999999998,1.0,0.0805764015653053,0.9654061629757468,-0.24798867715932643,
    0.3618000000000001,0.8944290000000001,-0.26286300000000007,1.0,0.36820620295749656,0.8904258595923642,-0.2675181875552053,
    0.16245599999999993,0.850654,-0.49999499999999997,1.0,0.16245637815790648,0.8506538865776185,-0.49999589042931863,
    0.07760699999999998,0.9679500000000001,-0.23885299999999998,1.0,0.0805764015653053,0.9654061629757468,-0.24798867715932643,
    0.52573,0.850652,0.0,1.0,0.5257289266852015,0.8506521590206104,-1.057645314374342e-17,
    0.6381939999999999,0.7236099999999999,-0.262864,1.0,0.6317479702095651,0.7275492343102217,-0.2675193708700447,
    0.3618000000000001,0.8944290000000001,-0.26286300000000007,1.0,0.36820620295749656,0.8904258595923642,-0.2675181875552053,
    0.6381939999999999,0.7236099999999999,-0.262864,1.0,0.6317479702095651,0.7275492343102217,-0.2675193708700447,
    0.44720899999999997,0.7236120000000001,-0.525728,1.0,0.44964377423881924,0.7275512992269764,-0.5181598047720494,
    0.3618000000000001,0.8944290000000001,-0.26286300000000007,1.0,0.36820620295749656,0.8904258595923642,-0.2675181875552053,
    0.3618000000000001,0.8944290000000001,-0.26286300000000007,1.0,0.36820620295749656,0.8904258595923642,-0.2675181875552053,
    0.44720899999999997,0.7236120000000001,-0.525728,1.0,0.44964377423881924,0.7275512992269764,-0.5181598047720494,
    0.16245599999999993,0.850654,-0.49999499999999997,1.0,0.16245637815790648,0.8506538865776185,-0.49999589042931863,
    0.44720899999999997,0.7236120000000001,-0.525728,1.0,0.44964377423881924,0.7275512992269764,-0.5181598047720494,
    0.23282200000000008,0.657519,-0.716563,1.0,0.230791227776602,0.6649729391400707,-0.7103142962047043,
    0.16245599999999993,0.850654,-0.49999499999999997,1.0,0.16245637815790648,0.8506538865776185,-0.49999589042931863,
    0.753442,0.6575150000000001,0.0,1.0,0.746871320486886,0.6649685937201661,-3.519020267383579e-18,
    0.831051,0.502299,-0.23885299999999998,1.0,0.8274486846864867,0.5038152762710822,-0.24798959979502425,
    0.6381939999999999,0.7236099999999999,-0.262864,1.0,0.6317479702095651,0.7275492343102217,-0.2675193708700447,
    0.831051,0.502299,-0.23885299999999998,1.0,0.8274486846864867,0.5038152762710822,-0.24798959979502425,
    0.6881889999999999,0.525736,-0.499997,1.0,0.688189315323338,0.5257353070007666,-0.49999785324299634,
    0.6381939999999999,0.7236099999999999,-0.262864,1.0,0.6317479702095651,0.7275492343102217,-0.2675193708700447,
    0.6381939999999999,0.7236099999999999,-0.262864,1.0,0.6317479702095651,0.7275492343102217,-0.2675193708700447,
    0.6881889999999999,0.525736,-0.499997,1.0,0.688189315323338,0.5257353070007666,-0.49999785324299634,
    0.44720899999999997,0.7236120000000001,-0.525728,1.0,0.44964377423881924,0.7275512992269764,-0.5181598047720494,
    0.6881889999999999,0.525736,-0.499997,1.0,0.688189315323338,0.5257353070007666,-0.49999785324299634,
    0.48397099999999993,0.502302,-0.716565,1.0,0.4915463260698537,0.5038187053981455,-0.7103160714908299,
    0.44720899999999997,0.7236120000000001,-0.525728,1.0,0.44964377423881924,0.7275512992269764,-0.5181598047720494,
    0.44720899999999997,0.7236120000000001,-0.525728,1.0,0.44964377423881924,0.7275512992269764,-0.5181598047720494,
    0.48397099999999993,0.502302,-0.716565,1.0,0.4915463260698537,0.5038187053981455,-0.7103160714908299,
    0.23282200000000008,0.657519,-0.716563,1.0,0.230791227776602,0.6649729391400707,-0.7103142962047043,
    0.48397099999999993,0.502302,-0.716565,1.0,0.4915463260698537,0.5038187053981455,-0.7103160714908299,
    0.2763880000000001,0.44721999999999995,-0.850649,1.0,0.27638775259514836,0.44721995820039734,-0.8506492339399583,
    0.23282200000000008,0.657519,-0.716563,1.0,0.230791227776602,0.6649729391400707,-0.7103142962047043,
    0.07760699999999998,0.9679500000000001,-0.23885299999999998,1.0,0.0805764015653053,0.9654061629757468,-0.24798867715932643,
    -0.20318100000000006,0.9679500000000001,-0.14761800000000003,1.0,-0.21095224816685468,0.9654061955752871,-0.15326456386980095,
    0.0,1.0,0.0,1.0,1.3060129397770804e-06,0.9999999999991471,0.0,
    0.16245599999999993,0.850654,-0.49999499999999997,1.0,0.16245637815790648,0.8506538865776185,-0.49999589042931863,
    -0.13819700000000001,0.8944299999999998,-0.425319,1.0,-0.14064429309391377,0.8904261866643726,-0.4328514628858925,
    0.07760699999999998,0.9679500000000001,-0.23885299999999998,1.0,0.0805764015653053,0.9654061629757468,-0.24798867715932643,
    0.23282200000000008,0.657519,-0.716563,1.0,0.230791227776602,0.6649729391400707,-0.7103142962047043,
    -0.052790000000000004,0.7236120000000001,-0.688185,1.0,-0.059207598386989156,0.7275518109725035,-0.6834931035817958,
    0.16245599999999993,0.850654,-0.49999499999999997,1.0,0.16245637815790648,0.8506538865776185,-0.49999589042931863,
    0.07760699999999998,0.9679500000000001,-0.23885299999999998,1.0,0.0805764015653053,0.9654061629757468,-0.24798867715932643,
    -0.13819700000000001,0.8944299999999998,-0.425319,1.0,-0.14064429309391377,0.8904261866643726,-0.4328514628858925,
    -0.20318100000000006,0.9679500000000001,-0.14761800000000003,1.0,-0.21095224816685468,0.9654061955752871,-0.15326456386980095,
    -0.13819700000000001,0.8944299999999998,-0.425319,1.0,-0.14064429309391377,0.8904261866643726,-0.4328514628858925,
    -0.425323,0.850654,-0.3090109999999999,1.0,-0.4253228822840165,0.8506537460570991,-0.3090123785945165,
    -0.20318100000000006,0.9679500000000001,-0.14761800000000003,1.0,-0.21095224816685468,0.9654061955752871,-0.15326456386980095,
    0.16245599999999993,0.850654,-0.49999499999999997,1.0,0.16245637815790648,0.8506538865776185,-0.49999589042931863,
    -0.052790000000000004,0.7236120000000001,-0.688185,1.0,-0.059207598386989156,0.7275518109725035,-0.6834931035817958,
    -0.13819700000000001,0.8944299999999998,-0.425319,1.0,-0.14064429309391377,0.8904261866643726,-0.4328514628858925,
    -0.052790000000000004,0.7236120000000001,-0.688185,1.0,-0.059207598386989156,0.7275518109725035,-0.6834931035817958,
    -0.361804,0.7236120000000001,-0.587778,1.0,-0.3538539217412299,0.7275517393882928,-0.5877549392233308,
    -0.13819700000000001,0.8944299999999998,-0.425319,1.0,-0.14064429309391377,0.8904261866643726,-0.4328514628858925,
    -0.13819700000000001,0.8944299999999998,-0.425319,1.0,-0.14064429309391377,0.8904261866643726,-0.4328514628858925,
    -0.361804,0.7236120000000001,-0.587778,1.0,-0.3538539217412299,0.7275517393882928,-0.5877549392233308,
    -0.425323,0.850654,-0.3090109999999999,1.0,-0.4253228822840165,0.8506537460570991,-0.3090123785945165,
    -0.361804,0.7236120000000001,-0.587778,1.0,-0.3538539217412299,0.7275517393882928,-0.5877549392233308,
    -0.609547,0.657519,-0.442856,1.0,-0.6042309075875275,0.6649723338191165,-0.43899522272014574,
    -0.425323,0.850654,-0.3090109999999999,1.0,-0.4253228822840165,0.8506537460570991,-0.3090123785945165,
    0.23282200000000008,0.657519,-0.716563,1.0,0.230791227776602,0.6649729391400707,-0.7103142962047043,
    0.02963899999999997,0.502302,-0.864184,1.0,0.019838395348954305,0.5038189457553266,-0.8635814425796619,
    -0.052790000000000004,0.7236120000000001,-0.688185,1.0,-0.059207598386989156,0.7275518109725035,-0.6834931035817958,
    0.02963899999999997,0.502302,-0.864184,1.0,0.019838395348954305,0.5038189457553266,-0.8635814425796619,
    -0.262869,0.525738,-0.809012,1.0,-0.2628688830438233,0.5257372869737825,-0.8090119006619986,
    -0.052790000000000004,0.7236120000000001,-0.688185,1.0,-0.059207598386989156,0.7275518109725035,-0.6834931035817958,
    -0.052790000000000004,0.7236120000000001,-0.688185,1.0,-0.059207598386989156,0.7275518109725035,-0.6834931035817958,
    -0.262869,0.525738,-0.809012,1.0,-0.2628688830438233,0.5257372869737825,-0.8090119006619986,
    -0.361804,0.7236120000000001,-0.587778,1.0,-0.3538539217412299,0.7275517393882928,-0.5877549392233308,
    -0.262869,0.525738,-0.809012,1.0,-0.2628688830438233,0.5257372869737825,-0.8090119006619986,
    -0.531941,0.502302,-0.681712,1.0,-0.5236577408730431,0.5038188776590388,-0.6869855230921009,
    -0.361804,0.7236120000000001,-0.587778,1.0,-0.3538539217412299,0.7275517393882928,-0.5877549392233308,
    -0.361804,0.7236120000000001,-0.587778,1.0,-0.3538539217412299,0.7275517393882928,-0.5877549392233308,
    -0.531941,0.502302,-0.681712,1.0,-0.5236577408730431,0.5038188776590388,-0.6869855230921009,
    -0.609547,0.657519,-0.442856,1.0,-0.6042309075875275,0.6649723338191165,-0.43899522272014574,
    -0.531941,0.502302,-0.681712,1.0,-0.5236577408730431,0.5038188776590388,-0.6869855230921009,
    -0.723607,0.44721999999999995,-0.525725,1.0,-0.7236067216830412,0.44721965132148317,-0.5257260653677089,
    -0.609547,0.657519,-0.442856,1.0,-0.6042309075875275,0.6649723338191165,-0.43899522272014574,
    -0.20318100000000006,0.9679500000000001,-0.14761800000000003,1.0,-0.21095224816685468,0.9654061955752871,-0.15326456386980095,
    -0.20318100000000006,0.9679500000000001,0.14761800000000003,1.0,-0.21095224816685468,0.9654061955752871,0.15326456386980092,
    0.0,1.0,0.0,1.0,1.3060129397770804e-06,0.9999999999991471,0.0,
    -0.425323,0.850654,-0.3090109999999999,1.0,-0.4253228822840165,0.8506537460570991,-0.3090123785945165,
    -0.44721,0.8944290000000001,0.0,1.0,-0.4551286493768027,0.8904256917432513,3.526214980202345e-18,
    -0.20318100000000006,0.9679500000000001,-0.14761800000000003,1.0,-0.21095224816685468,0.9654061955752871,-0.15326456386980095,
    -0.609547,0.657519,-0.442856,1.0,-0.6042309075875275,0.6649723338191165,-0.43899522272014574,
    -0.670817,0.723611,-0.16245699999999996,1.0,-0.6683380216406349,0.7275501061976027,-0.15490362100783547,
    -0.425323,0.850654,-0.3090109999999999,1.0,-0.4253228822840165,0.8506537460570991,-0.3090123785945165,
    -0.20318100000000006,0.9679500000000001,-0.14761800000000003,1.0,-0.21095224816685468,0.9654061955752871,-0.15326456386980095,
    -0.44721,0.8944290000000001,0.0,1.0,-0.4551286493768027,0.8904256917432513,3.526214980202345e-18,
    -0.20318100000000006,0.9679500000000001,0.14761800000000003,1.0,-0.21095224816685468,0.9654061955752871,0.15326456386980092,
    -0.44721,0.8944290000000001,0.0,1.0,-0.4551286493768027,0.8904256917432513,3.526214980202345e-18,
    -0.425323,0.850654,0.3090109999999999,1.0,-0.4253228822840165,0.8506537460570992,0.3090123785945165,
    -0.20318100000000006,0.9679500000000001,0.14761800000000003,1.0,-0.21095224816685468,0.9654061955752871,0.15326456386980092,
    -0.425323,0.850654,-0.3090109999999999,1.0,-0.4253228822840165,0.8506537460570991,-0.3090123785945165,
    -0.670817,0.723611,-0.16245699999999996,1.0,-0.6683380216406349,0.7275501061976027,-0.15490362100783547,
    -0.44721,0.8944290000000001,0.0,1.0,-0.4551286493768027,0.8904256917432513,3.526214980202345e-18,
    -0.670817,0.723611,-0.16245699999999996,1.0,-0.6683380216406349,0.7275501061976027,-0.15490362100783547,
    -0.670817,0.723611,0.16245700000000007,1.0,-0.6683380216406349,0.7275501061976029,0.15490362100783564,
    -0.44721,0.8944290000000001,0.0,1.0,-0.4551286493768027,0.8904256917432513,3.526214980202345e-18,
    -0.44721,0.8944290000000001,0.0,1.0,-0.4551286493768027,0.8904256917432513,3.526214980202345e-18,
    -0.670817,0.723611,0.16245700000000007,1.0,-0.6683380216406349,0.7275501061976029,0.15490362100783564,
    -0.425323,0.850654,0.3090109999999999,1.0,-0.4253228822840165,0.8506537460570992,0.3090123785945165,
    -0.670817,0.723611,0.16245700000000007,1.0,-0.6683380216406349,0.7275501061976029,0.15490362100783564,
    -0.609547,0.657519,0.4428559999999999,1.0,-0.6042309075875276,0.6649723338191165,0.4389952227201456,
    -0.425323,0.850654,0.3090109999999999,1.0,-0.4253228822840165,0.8506537460570992,0.3090123785945165,
    -0.609547,0.657519,-0.442856,1.0,-0.6042309075875275,0.6649723338191165,-0.43899522272014574,
    -0.812729,0.5023010000000001,-0.295238,1.0,-0.8151846510833863,0.503817580270061,-0.2857303456913146,
    -0.670817,0.723611,-0.16245699999999996,1.0,-0.6683380216406349,0.7275501061976027,-0.15490362100783547,
    -0.812729,0.5023010000000001,-0.295238,1.0,-0.8151846510833863,0.503817580270061,-0.2857303456913146,
    -0.850648,0.525736,0.0,1.0,-0.850648504669507,0.5257348395374611,-2.2739670286765194e-07,
    -0.670817,0.723611,-0.16245699999999996,1.0,-0.6683380216406349,0.7275501061976027,-0.15490362100783547,
    -0.670817,0.723611,-0.16245699999999996,1.0,-0.6683380216406349,0.7275501061976027,-0.15490362100783547,
    -0.850648,0.525736,0.0,1.0,-0.850648504669507,0.5257348395374611,-2.2739670286765194e-07,
    -0.670817,0.723611,0.16245700000000007,1.0,-0.6683380216406349,0.7275501061976029,0.15490362100783564,
    -0.850648,0.525736,0.0,1.0,-0.850648504669507,0.5257348395374611,-2.2739670286765194e-07,
    -0.812729,0.5023010000000001,0.2952379999999999,1.0,-0.8151843815554107,0.5038178905016056,0.28573056763082694,
    -0.670817,0.723611,0.16245700000000007,1.0,-0.6683380216406349,0.7275501061976029,0.15490362100783564,
    -0.670817,0.723611,0.16245700000000007,1.0,-0.6683380216406349,0.7275501061976029,0.15490362100783564,
    -0.812729,0.5023010000000001,0.2952379999999999,1.0,-0.8151843815554107,0.5038178905016056,0.28573056763082694,
    -0.609547,0.657519,0.4428559999999999,1.0,-0.6042309075875276,0.6649723338191165,0.4389952227201456,
    -0.812729,0.5023010000000001,0.2952379999999999,1.0,-0.8151843815554107,0.5038178905016056,0.28573056763082694,
    -0.723607,0.44721999999999995,0.525725,1.0,-0.7236067216830413,0.4472196513214834,0.5257260653677087,
    -0.609547,0.657519,0.4428559999999999,1.0,-0.6042309075875276,0.6649723338191165,0.4389952227201456,
    -0.20318100000000006,0.9679500000000001,0.14761800000000003,1.0,-0.21095224816685468,0.9654061955752871,0.15326456386980092,
    0.07760699999999998,0.9679500000000001,0.23885299999999998,1.0,0.08057640156530528,0.9654061629757468,0.24798867715932643,
    0.0,1.0,0.0,1.0,1.3060129397770804e-06,0.9999999999991471,0.0,
    -0.425323,0.850654,0.3090109999999999,1.0,-0.4253228822840165,0.8506537460570992,0.3090123785945165,
    -0.13819700000000001,0.8944299999999998,0.425319,1.0,-0.1406442930939137,0.8904261866643726,0.4328514628858925,
    -0.20318100000000006,0.9679500000000001,0.14761800000000003,1.0,-0.21095224816685468,0.9654061955752871,0.15326456386980092,
    -0.609547,0.657519,0.4428559999999999,1.0,-0.6042309075875276,0.6649723338191165,0.4389952227201456,
    -0.361804,0.7236120000000001,0.5877780000000001,1.0,-0.35385392174123004,0.7275517393882929,0.5877549392233307,
    -0.425323,0.850654,0.3090109999999999,1.0,-0.4253228822840165,0.8506537460570992,0.3090123785945165,
    -0.20318100000000006,0.9679500000000001,0.14761800000000003,1.0,-0.21095224816685468,0.9654061955752871,0.15326456386980092,
    -0.13819700000000001,0.8944299999999998,0.425319,1.0,-0.1406442930939137,0.8904261866643726,0.4328514628858925,
    0.07760699999999998,0.9679500000000001,0.23885299999999998,1.0,0.08057640156530528,0.9654061629757468,0.24798867715932643,
    -0.13819700000000001,0.8944299999999998,0.425319,1.0,-0.1406442930939137,0.8904261866643726,0.4328514628858925,
    0.16245599999999993,0.850654,0.49999499999999997,1.0,0.16245637815790648,0.8506538865776185,0.49999589042931875,
    0.07760699999999998,0.9679500000000001,0.23885299999999998,1.0,0.08057640156530528,0.9654061629757468,0.24798867715932643,
    -0.425323,0.850654,0.3090109999999999,1.0,-0.4253228822840165,0.8506537460570992,0.3090123785945165,
    -0.361804,0.7236120000000001,0.5877780000000001,1.0,-0.35385392174123004,0.7275517393882929,0.5877549392233307,
    -0.13819700000000001,0.8944299999999998,0.425319,1.0,-0.1406442930939137,0.8904261866643726,0.4328514628858925,
    -0.361804,0.7236120000000001,0.5877780000000001,1.0,-0.35385392174123004,0.7275517393882929,0.5877549392233307,
    -0.052790000000000004,0.7236120000000001,0.688185,1.0,-0.0592075983869889,0.7275518109725035,0.6834931035817959,
    -0.13819700000000001,0.8944299999999998,0.425319,1.0,-0.1406442930939137,0.8904261866643726,0.4328514628858925,
    -0.13819700000000001,0.8944299999999998,0.425319,1.0,-0.1406442930939137,0.8904261866643726,0.4328514628858925,
    -0.052790000000000004,0.7236120000000001,0.688185,1.0,-0.0592075983869889,0.7275518109725035,0.6834931035817959,
    0.16245599999999993,0.850654,0.49999499999999997,1.0,0.16245637815790648,0.8506538865776185,0.49999589042931875,
    -0.052790000000000004,0.7236120000000001,0.688185,1.0,-0.0592075983869889,0.7275518109725035,0.6834931035817959,
    0.23282200000000008,0.657519,0.7165629999999998,1.0,0.2307912277766018,0.6649729391400707,0.7103142962047043,
    0.16245599999999993,0.850654,0.49999499999999997,1.0,0.16245637815790648,0.8506538865776185,0.49999589042931875,
    -0.609547,0.657519,0.4428559999999999,1.0,-0.6042309075875276,0.6649723338191165,0.4389952227201456,
    -0.531941,0.502302,0.6817120000000001,1.0,-0.5236576234680893,0.50381866852951,0.6869857659550921,
    -0.361804,0.7236120000000001,0.5877780000000001,1.0,-0.35385392174123004,0.7275517393882929,0.5877549392233307,
    -0.531941,0.502302,0.6817120000000001,1.0,-0.5236576234680893,0.50381866852951,0.6869857659550921,
    -0.262869,0.525738,0.8090120000000001,1.0,-0.26286917763817624,0.5257368727147139,0.8090120741472168,
    -0.361804,0.7236120000000001,0.5877780000000001,1.0,-0.35385392174123004,0.7275517393882929,0.5877549392233307,
    -0.361804,0.7236120000000001,0.5877780000000001,1.0,-0.35385392174123004,0.7275517393882929,0.5877549392233307,
    -0.262869,0.525738,0.8090120000000001,1.0,-0.26286917763817624,0.5257368727147139,0.8090120741472168,
    -0.052790000000000004,0.7236120000000001,0.688185,1.0,-0.0592075983869889,0.7275518109725035,0.6834931035817959,
    -0.262869,0.525738,0.8090120000000001,1.0,-0.26286917763817624,0.5257368727147139,0.8090120741472168,
    0.02963899999999997,0.502302,0.8641839999999998,1.0,0.01983839534895446,0.5038189457553266,0.8635814425796619,
    -0.052790000000000004,0.7236120000000001,0.688185,1.0,-0.0592075983869889,0.7275518109725035,0.6834931035817959,
    -0.052790000000000004,0.7236120000000001,0.688185,1.0,-0.0592075983869889,0.7275518109725035,0.6834931035817959,
    0.02963899999999997,0.502302,0.8641839999999998,1.0,0.01983839534895446,0.5038189457553266,0.8635814425796619,
    0.23282200000000008,0.657519,0.7165629999999998,1.0,0.2307912277766018,0.6649729391400707,0.7103142962047043,
    0.02963899999999997,0.502302,0.8641839999999998,1.0,0.01983839534895446,0.5038189457553266,0.8635814425796619,
    0.2763880000000001,0.44721999999999995,0.850649,1.0,0.27638775259514803,0.44721995820039745,0.8506492339399583,
    0.23282200000000008,0.657519,0.7165629999999998,1.0,0.2307912277766018,0.6649729391400707,0.7103142962047043,
    0.07760699999999998,0.9679500000000001,0.23885299999999998,1.0,0.08057640156530528,0.9654061629757468,0.24798867715932643,
    0.251147,0.967949,0.0,1.0,0.26075244445654044,0.9654056985070778,0.0,
    0.0,1.0,0.0,1.0,1.3060129397770804e-06,0.9999999999991471,0.0,
    0.16245599999999993,0.850654,0.49999499999999997,1.0,0.16245637815790648,0.8506538865776185,0.49999589042931875,
    0.3618000000000001,0.8944290000000001,0.26286300000000007,1.0,0.36820620295749656,0.8904258595923642,0.26751818755520523,
    0.07760699999999998,0.9679500000000001,0.23885299999999998,1.0,0.08057640156530528,0.9654061629757468,0.24798867715932643,
    0.23282200000000008,0.657519,0.7165629999999998,1.0,0.2307912277766018,0.6649729391400707,0.7103142962047043,
    0.44720899999999997,0.7236120000000001,0.525728,1.0,0.4496437742388191,0.7275512992269764,0.5181598047720494,
    0.16245599999999993,0.850654,0.49999499999999997,1.0,0.16245637815790648,0.8506538865776185,0.49999589042931875,
    0.07760699999999998,0.9679500000000001,0.23885299999999998,1.0,0.08057640156530528,0.9654061629757468,0.24798867715932643,
    0.3618000000000001,0.8944290000000001,0.26286300000000007,1.0,0.36820620295749656,0.8904258595923642,0.26751818755520523,
    0.251147,0.967949,0.0,1.0,0.26075244445654044,0.9654056985070778,0.0,
    0.3618000000000001,0.8944290000000001,0.26286300000000007,1.0,0.36820620295749656,0.8904258595923642,0.26751818755520523,
    0.52573,0.850652,0.0,1.0,0.5257289266852015,0.8506521590206104,-1.057645314374342e-17,
    0.251147,0.967949,0.0,1.0,0.26075244445654044,0.9654056985070778,0.0,
    0.16245599999999993,0.850654,0.49999499999999997,1.0,0.16245637815790648,0.8506538865776185,0.49999589042931875,
    0.44720899999999997,0.7236120000000001,0.525728,1.0,0.4496437742388191,0.7275512992269764,0.5181598047720494,
    0.3618000000000001,0.8944290000000001,0.26286300000000007,1.0,0.36820620295749656,0.8904258595923642,0.26751818755520523,
    0.44720899999999997,0.7236120000000001,0.525728,1.0,0.4496437742388191,0.7275512992269764,0.5181598047720494,
    0.6381939999999999,0.7236099999999999,0.262864,1.0,0.6317479702095651,0.7275492343102217,0.2675193708700447,
    0.3618000000000001,0.8944290000000001,0.26286300000000007,1.0,0.36820620295749656,0.8904258595923642,0.26751818755520523,
    0.3618000000000001,0.8944290000000001,0.26286300000000007,1.0,0.36820620295749656,0.8904258595923642,0.26751818755520523,
    0.6381939999999999,0.7236099999999999,0.262864,1.0,0.6317479702095651,0.7275492343102217,0.2675193708700447,
    0.52573,0.850652,0.0,1.0,0.5257289266852015,0.8506521590206104,-1.057645314374342e-17,
    0.6381939999999999,0.7236099999999999,0.262864,1.0,0.6317479702095651,0.7275492343102217,0.2675193708700447,
    0.753442,0.6575150000000001,0.0,1.0,0.746871320486886,0.6649685937201661,-3.519020267383579e-18,
    0.52573,0.850652,0.0,1.0,0.5257289266852015,0.8506521590206104,-1.057645314374342e-17,
    0.23282200000000008,0.657519,0.7165629999999998,1.0,0.2307912277766018,0.6649729391400707,0.7103142962047043,
    0.48397099999999993,0.502302,0.7165650000000001,1.0,0.4915465997259058,0.5038185159472155,0.7103160164931138,
    0.44720899999999997,0.7236120000000001,0.525728,1.0,0.4496437742388191,0.7275512992269764,0.5181598047720494,
    0.48397099999999993,0.502302,0.7165650000000001,1.0,0.4915465997259058,0.5038185159472155,0.7103160164931138,
    0.6881889999999999,0.525736,0.499997,1.0,0.6881896241859202,0.5257346676673482,0.49999810037193615,
    0.44720899999999997,0.7236120000000001,0.525728,1.0,0.4496437742388191,0.7275512992269764,0.5181598047720494,
    0.44720899999999997,0.7236120000000001,0.525728,1.0,0.4496437742388191,0.7275512992269764,0.5181598047720494,
    0.6881889999999999,0.525736,0.499997,1.0,0.6881896241859202,0.5257346676673482,0.49999810037193615,
    0.6381939999999999,0.7236099999999999,0.262864,1.0,0.6317479702095651,0.7275492343102217,0.2675193708700447,
    0.6881889999999999,0.525736,0.499997,1.0,0.6881896241859202,0.5257346676673482,0.49999810037193615,
    0.831051,0.502299,0.23885299999999998,1.0,0.8274487904509396,0.5038149163054394,0.24798997820359664,
    0.6381939999999999,0.7236099999999999,0.262864,1.0,0.6317479702095651,0.7275492343102217,0.2675193708700447,
    0.6381939999999999,0.7236099999999999,0.262864,1.0,0.6317479702095651,0.7275492343102217,0.2675193708700447,
    0.831051,0.502299,0.23885299999999998,1.0,0.8274487904509396,0.5038149163054394,0.24798997820359664,
    0.753442,0.6575150000000001,0.0,1.0,0.746871320486886,0.6649685937201661,-3.519020267383579e-18,
    0.831051,0.502299,0.23885299999999998,1.0,0.8274487904509396,0.5038149163054394,0.24798997820359664,
    0.8944260000000002,0.44721600000000006,0.0,1.0,0.8944264388330799,0.4472150998304671,-7.024693876715296e-18,
    0.753442,0.6575150000000001,0.0,1.0,0.746871320486886,0.6649685937201661,-3.519020267383579e-18,
    0.956626,0.25114900000000007,-0.14761800000000003,1.0,0.9578262483355788,0.24306118218022527,-0.15326493309476094,
    0.831051,0.502299,-0.23885299999999998,1.0,0.8274486846864867,0.5038152762710822,-0.24798959979502425,
    0.8944260000000002,0.44721600000000006,0.0,1.0,0.8944264388330799,0.4472150998304671,-7.024693876715296e-18,
    0.951058,0.0,-0.309013,1.0,0.9510575012112954,5.074933413732154e-07,-0.30901396309789836,
    0.861804,0.2763960000000001,-0.425322,1.0,0.8593175031254149,0.27241679196618035,-0.43285392487207186,
    0.956626,0.25114900000000007,-0.14761800000000003,1.0,0.9578262483355788,0.24306118218022527,-0.15326493309476094,
    0.860698,-0.251151,-0.442858,1.0,0.8649868190167103,-0.2430628154105527,-0.4389968914377966,
    0.8090190000000002,0.0,-0.587782,1.0,0.8089870842176278,0.008873212629478702,-0.5877594437069411,
    0.951058,0.0,-0.309013,1.0,0.9510575012112954,5.074933413732154e-07,-0.30901396309789836,
    0.956626,0.25114900000000007,-0.14761800000000003,1.0,0.9578262483355788,0.24306118218022527,-0.15326493309476094,
    0.861804,0.2763960000000001,-0.425322,1.0,0.8593175031254149,0.27241679196618035,-0.43285392487207186,
    0.831051,0.502299,-0.23885299999999998,1.0,0.8274486846864867,0.5038152762710822,-0.24798959979502425,
    0.861804,0.2763960000000001,-0.425322,1.0,0.8593175031254149,0.27241679196618035,-0.43285392487207186,
    0.6881889999999999,0.525736,-0.499997,1.0,0.688189315323338,0.5257353070007666,-0.49999785324299634,
    0.831051,0.502299,-0.23885299999999998,1.0,0.8274486846864867,0.5038152762710822,-0.24798959979502425,
    0.951058,0.0,-0.309013,1.0,0.9510575012112954,5.074933413732154e-07,-0.30901396309789836,
    0.8090190000000002,0.0,-0.587782,1.0,0.8089870842176278,0.008873212629478702,-0.5877594437069411,
    0.861804,0.2763960000000001,-0.425322,1.0,0.8593175031254149,0.27241679196618035,-0.43285392487207186,
    0.8090190000000002,0.0,-0.587782,1.0,0.8089870842176278,0.008873212629478702,-0.5877594437069411,
    0.6708210000000001,0.276397,-0.688189,1.0,0.6772151552047805,0.272417935232739,-0.6834969657024793,
    0.861804,0.2763960000000001,-0.425322,1.0,0.8593175031254149,0.27241679196618035,-0.43285392487207186,
    0.861804,0.2763960000000001,-0.425322,1.0,0.8593175031254149,0.27241679196618035,-0.43285392487207186,
    0.6708210000000001,0.276397,-0.688189,1.0,0.6772151552047805,0.272417935232739,-0.6834969657024793,
    0.6881889999999999,0.525736,-0.499997,1.0,0.688189315323338,0.5257353070007666,-0.49999785324299634,
    0.6708210000000001,0.276397,-0.688189,1.0,0.6772151552047805,0.272417935232739,-0.6834969657024793,
    0.48397099999999993,0.502302,-0.716565,1.0,0.4915463260698537,0.5038187053981455,-0.7103160714908299,
    0.6881889999999999,0.525736,-0.499997,1.0,0.688189315323338,0.5257353070007666,-0.49999785324299634,
    0.860698,-0.251151,-0.442858,1.0,0.8649868190167103,-0.2430628154105527,-0.4389968914377966,
    0.6871589999999999,-0.25115200000000004,-0.681715,1.0,0.6848117102472356,-0.2430639714860927,-0.6869882293559796,
    0.8090190000000002,0.0,-0.587782,1.0,0.8089870842176278,0.008873212629478702,-0.5877594437069411,
    0.6871589999999999,-0.25115200000000004,-0.681715,1.0,0.6848117102472356,-0.2430639714860927,-0.6869882293559796,
    0.5877859999999999,0.0,-0.809017,1.0,0.5877858829948915,-2.554691144635855e-08,-0.809016536142442,
    0.8090190000000002,0.0,-0.587782,1.0,0.8089870842176278,0.008873212629478702,-0.5877594437069411,
    0.8090190000000002,0.0,-0.587782,1.0,0.8089870842176278,0.008873212629478702,-0.5877594437069411,
    0.5877859999999999,0.0,-0.809017,1.0,0.5877858829948915,-2.554691144635855e-08,-0.809016536142442,
    0.6708210000000001,0.276397,-0.688189,1.0,0.6772151552047805,0.272417935232739,-0.6834969657024793,
    0.5877859999999999,0.0,-0.809017,1.0,0.5877858829948915,-2.554691144635855e-08,-0.809016536142442,
    0.43600700000000003,0.25115200000000004,-0.864188,1.0,0.44174743584464,0.2430637566759591,-0.8635850931525253,
    0.6708210000000001,0.276397,-0.688189,1.0,0.6772151552047805,0.272417935232739,-0.6834969657024793,
    0.6708210000000001,0.276397,-0.688189,1.0,0.6772151552047805,0.272417935232739,-0.6834969657024793,
    0.43600700000000003,0.25115200000000004,-0.864188,1.0,0.44174743584464,0.2430637566759591,-0.8635850931525253,
    0.48397099999999993,0.502302,-0.716565,1.0,0.4915463260698537,0.5038187053981455,-0.7103160714908299,
    0.43600700000000003,0.25115200000000004,-0.864188,1.0,0.44174743584464,0.2430637566759591,-0.8635850931525253,
    0.2763880000000001,0.44721999999999995,-0.850649,1.0,0.27638775259514836,0.44721995820039734,-0.8506492339399583,
    0.48397099999999993,0.502302,-0.716565,1.0,0.4915463260698537,0.5038187053981455,-0.7103160714908299,
    0.1552150000000001,0.25115200000000004,-0.955422,1.0,0.15021657377136222,0.24306347133980513,-0.9583084732301164,
    0.02963899999999997,0.502302,-0.864184,1.0,0.019838395348954305,0.5038189457553266,-0.8635814425796619,
    0.2763880000000001,0.44721999999999995,-0.850649,1.0,0.27638775259514836,0.44721995820039734,-0.8506492339399583,
    0.0,0.0,-1.0,1.0,8.386527000463054e-07,1.0350315843348408e-07,-0.999999999999643,
    -0.13819899999999996,0.276397,-0.951055,1.0,-0.14612907117205193,0.2724178643965829,-0.9510177715037708,
    0.1552150000000001,0.25115200000000004,-0.955422,1.0,0.15021657377136222,0.24306347133980513,-0.9583084732301164,
    -0.155215,-0.25115200000000004,-0.955422,1.0,-0.1502164527684422,-0.24306415178722385,-0.9583083196099383,
    -0.30901599999999996,0.0,-0.951057,1.0,-0.30900375318742496,0.00887256725174435,-0.9510194309615595,
    0.0,0.0,-1.0,1.0,8.386527000463054e-07,1.0350315843348408e-07,-0.999999999999643,
    0.1552150000000001,0.25115200000000004,-0.955422,1.0,0.15021657377136222,0.24306347133980513,-0.9583084732301164,
    -0.13819899999999996,0.276397,-0.951055,1.0,-0.14612907117205193,0.2724178643965829,-0.9510177715037708,
    0.02963899999999997,0.502302,-0.864184,1.0,0.019838395348954305,0.5038189457553266,-0.8635814425796619,
    -0.13819899999999996,0.276397,-0.951055,1.0,-0.14612907117205193,0.2724178643965829,-0.9510177715037708,
    -0.262869,0.525738,-0.809012,1.0,-0.2628688830438233,0.5257372869737825,-0.8090119006619986,
    0.02963899999999997,0.502302,-0.864184,1.0,0.019838395348954305,0.5038189457553266,-0.8635814425796619,
    0.0,0.0,-1.0,1.0,8.386527000463054e-07,1.0350315843348408e-07,-0.999999999999643,
    -0.30901599999999996,0.0,-0.951057,1.0,-0.30900375318742496,0.00887256725174435,-0.9510194309615595,
    -0.13819899999999996,0.276397,-0.951055,1.0,-0.14612907117205193,0.2724178643965829,-0.9510177715037708,
    -0.30901599999999996,0.0,-0.951057,1.0,-0.30900375318742496,0.00887256725174435,-0.9510194309615595,
    -0.4472149999999999,0.276397,-0.850649,1.0,-0.440777418602302,0.2724181414021976,-0.8552798509758447,
    -0.13819899999999996,0.276397,-0.951055,1.0,-0.14612907117205193,0.2724178643965829,-0.9510177715037708,
    -0.13819899999999996,0.276397,-0.951055,1.0,-0.14612907117205193,0.2724178643965829,-0.9510177715037708,
    -0.4472149999999999,0.276397,-0.850649,1.0,-0.440777418602302,0.2724181414021976,-0.8552798509758447,
    -0.262869,0.525738,-0.809012,1.0,-0.2628688830438233,0.5257372869737825,-0.8090119006619986,
    -0.4472149999999999,0.276397,-0.850649,1.0,-0.440777418602302,0.2724181414021976,-0.8552798509758447,
    -0.531941,0.502302,-0.681712,1.0,-0.5236577408730431,0.5038188776590388,-0.6869855230921009,
    -0.262869,0.525738,-0.809012,1.0,-0.2628688830438233,0.5257372869737825,-0.8090119006619986,
    -0.155215,-0.25115200000000004,-0.955422,1.0,-0.1502164527684422,-0.24306415178722385,-0.9583083196099383,
    -0.43600700000000003,-0.25115200000000004,-0.864188,1.0,-0.4417472320955005,-0.24306420283334987,-0.8635850718006606,
    -0.30901599999999996,0.0,-0.951057,1.0,-0.30900375318742496,0.00887256725174435,-0.9510194309615595,
    -0.43600700000000003,-0.25115200000000004,-0.864188,1.0,-0.4417472320955005,-0.24306420283334987,-0.8635850718006606,
    -0.587786,0.0,-0.809017,1.0,-0.5877863671165282,8.898111888585574e-08,-0.8090161844066818,
    -0.30901599999999996,0.0,-0.951057,1.0,-0.30900375318742496,0.00887256725174435,-0.9510194309615595,
    -0.30901599999999996,0.0,-0.951057,1.0,-0.30900375318742496,0.00887256725174435,-0.9510194309615595,
    -0.587786,0.0,-0.809017,1.0,-0.5877863671165282,8.898111888585574e-08,-0.8090161844066818,
    -0.4472149999999999,0.276397,-0.850649,1.0,-0.440777418602302,0.2724181414021976,-0.8552798509758447,
    -0.587786,0.0,-0.809017,1.0,-0.5877863671165282,8.898111888585574e-08,-0.8090161844066818,
    -0.687159,0.25115200000000004,-0.681715,1.0,-0.6848117463759701,0.2430639454016199,-0.6869882025706792,
    -0.4472149999999999,0.276397,-0.850649,1.0,-0.440777418602302,0.2724181414021976,-0.8552798509758447,
    -0.4472149999999999,0.276397,-0.850649,1.0,-0.440777418602302,0.2724181414021976,-0.8552798509758447,
    -0.687159,0.25115200000000004,-0.681715,1.0,-0.6848117463759701,0.2430639454016199,-0.6869882025706792,
    -0.531941,0.502302,-0.681712,1.0,-0.5236577408730431,0.5038188776590388,-0.6869855230921009,
    -0.687159,0.25115200000000004,-0.681715,1.0,-0.6848117463759701,0.2430639454016199,-0.6869882025706792,
    -0.723607,0.44721999999999995,-0.525725,1.0,-0.7236067216830412,0.44721965132148317,-0.5257260653677089,
    -0.531941,0.502302,-0.681712,1.0,-0.5236577408730431,0.5038188776590388,-0.6869855230921009,
    -0.860698,0.2511510000000001,-0.442858,1.0,-0.8649868290678857,0.2430624631623782,-0.43899706666505395,
    -0.812729,0.5023010000000001,-0.295238,1.0,-0.8151846510833863,0.503817580270061,-0.2857303456913146,
    -0.723607,0.44721999999999995,-0.525725,1.0,-0.7236067216830412,0.44721965132148317,-0.5257260653677089,
    -0.951058,0.0,-0.309013,1.0,-0.9510573479382253,-7.330831644240639e-07,-0.30901443482816815,
    -0.947213,0.2763960000000001,-0.162458,1.0,-0.9496281766536325,0.27241723641349325,-0.15490376176946866,
    -0.860698,0.2511510000000001,-0.442858,1.0,-0.8649868290678857,0.2430624631623782,-0.43899706666505395,
    -0.956626,-0.25114900000000007,-0.14761800000000003,1.0,-0.9578262170326509,-0.24306111405524766,-0.15326523676014436,
    -1.0,9.999999999177334e-07,0.0,1.0,-0.999960625461639,0.008873980299981307,-5.7641038767457417e-08,
    -0.951058,0.0,-0.309013,1.0,-0.9510573479382253,-7.330831644240639e-07,-0.30901443482816815,
    -0.860698,0.2511510000000001,-0.442858,1.0,-0.8649868290678857,0.2430624631623782,-0.43899706666505395,
    -0.947213,0.2763960000000001,-0.162458,1.0,-0.9496281766536325,0.27241723641349325,-0.15490376176946866,
    -0.812729,0.5023010000000001,-0.295238,1.0,-0.8151846510833863,0.503817580270061,-0.2857303456913146,
    -0.947213,0.2763960000000001,-0.162458,1.0,-0.9496281766536325,0.27241723641349325,-0.15490376176946866,
    -0.850648,0.525736,0.0,1.0,-0.850648504669507,0.5257348395374611,-2.2739670286765194e-07,
    -0.812729,0.5023010000000001,-0.295238,1.0,-0.8151846510833863,0.503817580270061,-0.2857303456913146,
    -0.951058,0.0,-0.309013,1.0,-0.9510573479382253,-7.330831644240639e-07,-0.30901443482816815,
    -1.0,9.999999999177334e-07,0.0,1.0,-0.999960625461639,0.008873980299981307,-5.7641038767457417e-08,
    -0.947213,0.2763960000000001,-0.162458,1.0,-0.9496281766536325,0.27241723641349325,-0.15490376176946866,
    -1.0,9.999999999177334e-07,0.0,1.0,-0.999960625461639,0.008873980299981307,-5.7641038767457417e-08,
    -0.947213,0.276397,0.162458,1.0,-0.9496280396827057,0.2724178616838374,0.1549035018454631,
    -0.947213,0.2763960000000001,-0.162458,1.0,-0.9496281766536325,0.27241723641349325,-0.15490376176946866,
    -0.947213,0.2763960000000001,-0.162458,1.0,-0.9496281766536325,0.27241723641349325,-0.15490376176946866,
    -0.947213,0.276397,0.162458,1.0,-0.9496280396827057,0.2724178616838374,0.1549035018454631,
    -0.850648,0.525736,0.0,1.0,-0.850648504669507,0.5257348395374611,-2.2739670286765194e-07,
    -0.947213,0.276397,0.162458,1.0,-0.9496280396827057,0.2724178616838374,0.1549035018454631,
    -0.812729,0.5023010000000001,0.2952379999999999,1.0,-0.8151843815554107,0.5038178905016056,0.28573056763082694,
    -0.850648,0.525736,0.0,1.0,-0.850648504669507,0.5257348395374611,-2.2739670286765194e-07,
    -0.956626,-0.25114900000000007,-0.14761800000000003,1.0,-0.9578262170326509,-0.24306111405524766,-0.15326523676014436,
    -0.956626,-0.25114900000000007,0.14761800000000003,1.0,-0.9578262170326509,-0.24306111405524763,0.1532652367601444,
    -1.0,9.999999999177334e-07,0.0,1.0,-0.999960625461639,0.008873980299981307,-5.7641038767457417e-08,
    -0.956626,-0.25114900000000007,0.14761800000000003,1.0,-0.9578262170326509,-0.24306111405524763,0.1532652367601444,
    -0.951058,0.0,0.309013,1.0,-0.951057331086145,-8.671557238488273e-07,0.3090144866936615,
    -1.0,9.999999999177334e-07,0.0,1.0,-0.999960625461639,0.008873980299981307,-5.7641038767457417e-08,
    -1.0,9.999999999177334e-07,0.0,1.0,-0.999960625461639,0.008873980299981307,-5.7641038767457417e-08,
    -0.951058,0.0,0.309013,1.0,-0.951057331086145,-8.671557238488273e-07,0.3090144866936615,
    -0.947213,0.276397,0.162458,1.0,-0.9496280396827057,0.2724178616838374,0.1549035018454631,
    -0.951058,0.0,0.309013,1.0,-0.951057331086145,-8.671557238488273e-07,0.3090144866936615,
    -0.860698,0.2511510000000001,0.442858,1.0,-0.8649867092922593,0.24306239483169045,0.43899734050040895,
    -0.947213,0.276397,0.162458,1.0,-0.9496280396827057,0.2724178616838374,0.1549035018454631,
    -0.947213,0.276397,0.162458,1.0,-0.9496280396827057,0.2724178616838374,0.1549035018454631,
    -0.860698,0.2511510000000001,0.442858,1.0,-0.8649867092922593,0.24306239483169045,0.43899734050040895,
    -0.812729,0.5023010000000001,0.2952379999999999,1.0,-0.8151843815554107,0.5038178905016056,0.28573056763082694,
    -0.860698,0.2511510000000001,0.442858,1.0,-0.8649867092922593,0.24306239483169045,0.43899734050040895,
    -0.723607,0.44721999999999995,0.525725,1.0,-0.7236067216830413,0.4472196513214834,0.5257260653677087,
    -0.812729,0.5023010000000001,0.2952379999999999,1.0,-0.8151843815554107,0.5038178905016056,0.28573056763082694,
    -0.687159,0.25115200000000004,0.6817150000000001,1.0,-0.6848115755465203,0.24306396103886968,0.6869883673262506,
    -0.531941,0.502302,0.6817120000000001,1.0,-0.5236576234680893,0.50381866852951,0.6869857659550921,
    -0.723607,0.44721999999999995,0.525725,1.0,-0.7236067216830413,0.4472196513214834,0.5257260653677087,
    -0.587786,0.0,0.8090169999999999,1.0,-0.5877858058415312,4.349631417008017e-07,0.8090165921976091,
    -0.44721600000000006,0.276397,0.8506480000000001,1.0,-0.440777780043386,0.2724176399428321,0.8552798244247329,
    -0.687159,0.25115200000000004,0.6817150000000001,1.0,-0.6848115755465203,0.24306396103886968,0.6869883673262506,
    -0.43600700000000003,-0.25115200000000004,0.864188,1.0,-0.4417470436660011,-0.2430638114471244,0.8635852783466985,
    -0.309017,-1.0000000000287557e-06,0.9510559999999999,1.0,-0.30900470758363174,0.008872576054985893,0.9510191207779699,
    -0.587786,0.0,0.8090169999999999,1.0,-0.5877858058415312,4.349631417008017e-07,0.8090165921976091,
    -0.687159,0.25115200000000004,0.6817150000000001,1.0,-0.6848115755465203,0.24306396103886968,0.6869883673262506,
    -0.44721600000000006,0.276397,0.8506480000000001,1.0,-0.440777780043386,0.2724176399428321,0.8552798244247329,
    -0.531941,0.502302,0.6817120000000001,1.0,-0.5236576234680893,0.50381866852951,0.6869857659550921,
    -0.44721600000000006,0.276397,0.8506480000000001,1.0,-0.440777780043386,0.2724176399428321,0.8552798244247329,
    -0.262869,0.525738,0.8090120000000001,1.0,-0.26286917763817624,0.5257368727147139,0.8090120741472168,
    -0.531941,0.502302,0.6817120000000001,1.0,-0.5236576234680893,0.50381866852951,0.6869857659550921,
    -0.587786,0.0,0.8090169999999999,1.0,-0.5877858058415312,4.349631417008017e-07,0.8090165921976091,
    -0.309017,-1.0000000000287557e-06,0.9510559999999999,1.0,-0.30900470758363174,0.008872576054985893,0.9510191207779699,
    -0.44721600000000006,0.276397,0.8506480000000001,1.0,-0.440777780043386,0.2724176399428321,0.8552798244247329,
    -0.309017,-1.0000000000287557e-06,0.9510559999999999,1.0,-0.30900470758363174,0.008872576054985893,0.9510191207779699,
    -0.13819899999999996,0.276397,0.951055,1.0,-0.14613018086329244,0.2724171419127992,0.9510178079473188,
    -0.44721600000000006,0.276397,0.8506480000000001,1.0,-0.440777780043386,0.2724176399428321,0.8552798244247329,
    -0.44721600000000006,0.276397,0.8506480000000001,1.0,-0.440777780043386,0.2724176399428321,0.8552798244247329,
    -0.13819899999999996,0.276397,0.951055,1.0,-0.14613018086329244,0.2724171419127992,0.9510178079473188,
    -0.262869,0.525738,0.8090120000000001,1.0,-0.26286917763817624,0.5257368727147139,0.8090120741472168,
    -0.13819899999999996,0.276397,0.951055,1.0,-0.14613018086329244,0.2724171419127992,0.9510178079473188,
    0.02963899999999997,0.502302,0.8641839999999998,1.0,0.01983839534895446,0.5038189457553266,0.8635814425796619,
    -0.262869,0.525738,0.8090120000000001,1.0,-0.26286917763817624,0.5257368727147139,0.8090120741472168,
    -0.43600700000000003,-0.25115200000000004,0.864188,1.0,-0.4417470436660011,-0.2430638114471244,0.8635852783466985,
    -0.155215,-0.25115200000000004,0.955422,1.0,-0.15021677729008256,-0.24306351370824936,0.9583084305819194,
    -0.309017,-1.0000000000287557e-06,0.9510559999999999,1.0,-0.30900470758363174,0.008872576054985893,0.9510191207779699,
    -0.155215,-0.25115200000000004,0.955422,1.0,-0.15021677729008256,-0.24306351370824936,0.9583084305819194,
    0.0,0.0,1.0,1.0,-6.802996438484687e-08,1.7058485892572035e-07,0.9999999999999832,
    -0.309017,-1.0000000000287557e-06,0.9510559999999999,1.0,-0.30900470758363174,0.008872576054985893,0.9510191207779699,
    -0.309017,-1.0000000000287557e-06,0.9510559999999999,1.0,-0.30900470758363174,0.008872576054985893,0.9510191207779699,
    0.0,0.0,1.0,1.0,-6.802996438484687e-08,1.7058485892572035e-07,0.9999999999999832,
    -0.13819899999999996,0.276397,0.951055,1.0,-0.14613018086329244,0.2724171419127992,0.9510178079473188,
    0.0,0.0,1.0,1.0,-6.802996438484687e-08,1.7058485892572035e-07,0.9999999999999832,
    0.1552150000000001,0.25115200000000004,0.955422,1.0,0.15021657377136222,0.24306347133980513,0.9583084732301164,
    -0.13819899999999996,0.276397,0.951055,1.0,-0.14613018086329244,0.2724171419127992,0.9510178079473188,
    -0.13819899999999996,0.276397,0.951055,1.0,-0.14613018086329244,0.2724171419127992,0.9510178079473188,
    0.1552150000000001,0.25115200000000004,0.955422,1.0,0.15021657377136222,0.24306347133980513,0.9583084732301164,
    0.02963899999999997,0.502302,0.8641839999999998,1.0,0.01983839534895446,0.5038189457553266,0.8635814425796619,
    0.1552150000000001,0.25115200000000004,0.955422,1.0,0.15021657377136222,0.24306347133980513,0.9583084732301164,
    0.2763880000000001,0.44721999999999995,0.850649,1.0,0.27638775259514803,0.44721995820039745,0.8506492339399583,
    0.02963899999999997,0.502302,0.8641839999999998,1.0,0.01983839534895446,0.5038189457553266,0.8635814425796619,
    0.43600700000000003,0.25115200000000004,0.864188,1.0,0.4417474635405354,0.24306379703966605,0.8635850676245875,
    0.48397099999999993,0.502302,0.7165650000000001,1.0,0.4915465997259058,0.5038185159472155,0.7103160164931138,
    0.2763880000000001,0.44721999999999995,0.850649,1.0,0.27638775259514803,0.44721995820039745,0.8506492339399583,
    0.5877859999999999,0.0,0.8090169999999999,1.0,0.5877853232201069,3.613410911975069e-08,0.8090169428429995,
    0.67082,0.2763960000000001,0.6881900000000001,1.0,0.6772144971664549,0.27241774977147326,0.6834976916106101,
    0.43600700000000003,0.25115200000000004,0.864188,1.0,0.4417474635405354,0.24306379703966605,0.8635850676245875,
    0.6871589999999999,-0.25115200000000004,0.6817150000000001,1.0,0.6848111757491196,-0.24306484466307332,0.6869884532203029,
    0.8090190000000002,-1.999999999946489e-06,0.5877829999999999,1.0,0.8089866848506967,0.008871945415033243,0.5877600125211242,
    0.5877859999999999,0.0,0.8090169999999999,1.0,0.5877853232201069,3.613410911975069e-08,0.8090169428429995,
    0.43600700000000003,0.25115200000000004,0.864188,1.0,0.4417474635405354,0.24306379703966605,0.8635850676245875,
    0.67082,0.2763960000000001,0.6881900000000001,1.0,0.6772144971664549,0.27241774977147326,0.6834976916106101,
    0.48397099999999993,0.502302,0.7165650000000001,1.0,0.4915465997259058,0.5038185159472155,0.7103160164931138,
    0.67082,0.2763960000000001,0.6881900000000001,1.0,0.6772144971664549,0.27241774977147326,0.6834976916106101,
    0.6881889999999999,0.525736,0.499997,1.0,0.6881896241859202,0.5257346676673482,0.49999810037193615,
    0.48397099999999993,0.502302,0.7165650000000001,1.0,0.4915465997259058,0.5038185159472155,0.7103160164931138,
    0.5877859999999999,0.0,0.8090169999999999,1.0,0.5877853232201069,3.613410911975069e-08,0.8090169428429995,
    0.8090190000000002,-1.999999999946489e-06,0.5877829999999999,1.0,0.8089866848506967,0.008871945415033243,0.5877600125211242,
    0.67082,0.2763960000000001,0.6881900000000001,1.0,0.6772144971664549,0.27241774977147326,0.6834976916106101,
    0.8090190000000002,-1.999999999946489e-06,0.5877829999999999,1.0,0.8089866848506967,0.008871945415033243,0.5877600125211242,
    0.861804,0.27639400000000003,0.4253230000000001,1.0,0.8593173212717677,0.2724158342746917,0.43285488861596255,
    0.67082,0.2763960000000001,0.6881900000000001,1.0,0.6772144971664549,0.27241774977147326,0.6834976916106101,
    0.67082,0.2763960000000001,0.6881900000000001,1.0,0.6772144971664549,0.27241774977147326,0.6834976916106101,
    0.861804,0.27639400000000003,0.4253230000000001,1.0,0.8593173212717677,0.2724158342746917,0.43285488861596255,
    0.6881889999999999,0.525736,0.499997,1.0,0.6881896241859202,0.5257346676673482,0.49999810037193615,
    0.861804,0.27639400000000003,0.4253230000000001,1.0,0.8593173212717677,0.2724158342746917,0.43285488861596255,
    0.831051,0.502299,0.23885299999999998,1.0,0.8274487904509396,0.5038149163054394,0.24798997820359664,
    0.6881889999999999,0.525736,0.499997,1.0,0.6881896241859202,0.5257346676673482,0.49999810037193615,
    0.6871589999999999,-0.25115200000000004,0.6817150000000001,1.0,0.6848111757491196,-0.24306484466307332,0.6869884532203029,
    0.860698,-0.251151,0.442858,1.0,0.864986890060841,-0.24306353018273283,0.4389963557001157,
    0.8090190000000002,-1.999999999946489e-06,0.5877829999999999,1.0,0.8089866848506967,0.008871945415033243,0.5877600125211242,
    0.860698,-0.251151,0.442858,1.0,0.864986890060841,-0.24306353018273283,0.4389963557001157,
    0.951058,0.0,0.309013,1.0,0.9510576790560566,4.844418859218338e-07,0.30901341574156965,
    0.8090190000000002,-1.999999999946489e-06,0.5877829999999999,1.0,0.8089866848506967,0.008871945415033243,0.5877600125211242,
    0.8090190000000002,-1.999999999946489e-06,0.5877829999999999,1.0,0.8089866848506967,0.008871945415033243,0.5877600125211242,
    0.951058,0.0,0.309013,1.0,0.9510576790560566,4.844418859218338e-07,0.30901341574156965,
    0.861804,0.27639400000000003,0.4253230000000001,1.0,0.8593173212717677,0.2724158342746917,0.43285488861596255,
    0.951058,0.0,0.309013,1.0,0.9510576790560566,4.844418859218338e-07,0.30901341574156965,
    0.956626,0.25114900000000007,0.14761800000000003,1.0,0.9578261805030606,0.24306129258052184,0.15326518192989683,
    0.861804,0.27639400000000003,0.4253230000000001,1.0,0.8593173212717677,0.2724158342746917,0.43285488861596255,
    0.861804,0.27639400000000003,0.4253230000000001,1.0,0.8593173212717677,0.2724158342746917,0.43285488861596255,
    0.956626,0.25114900000000007,0.14761800000000003,1.0,0.9578261805030606,0.24306129258052184,0.15326518192989683,
    0.831051,0.502299,0.23885299999999998,1.0,0.8274487904509396,0.5038149163054394,0.24798997820359664,
    0.956626,0.25114900000000007,0.14761800000000003,1.0,0.9578261805030606,0.24306129258052184,0.15326518192989683,
    0.8944260000000002,0.44721600000000006,0.0,1.0,0.8944264388330799,0.4472150998304671,-7.024693876715296e-18,
    0.831051,0.502299,0.23885299999999998,1.0,0.8274487904509396,0.5038149163054394,0.24798997820359664,
    0.43600700000000003,0.25115200000000004,-0.864188,1.0,0.44174743584464,0.2430637566759591,-0.8635850931525253,
    0.1552150000000001,0.25115200000000004,-0.955422,1.0,0.15021657377136222,0.24306347133980513,-0.9583084732301164,
    0.2763880000000001,0.44721999999999995,-0.850649,1.0,0.27638775259514836,0.44721995820039734,-0.8506492339399583,
    0.5877859999999999,0.0,-0.809017,1.0,0.5877858829948915,-2.554691144635855e-08,-0.809016536142442,
    0.3090169999999999,0.0,-0.951056,1.0,0.3090047066659712,-0.008872910630520342,-0.9510191179546391,
    0.43600700000000003,0.25115200000000004,-0.864188,1.0,0.44174743584464,0.2430637566759591,-0.8635850931525253,
    0.6871589999999999,-0.25115200000000004,-0.681715,1.0,0.6848117102472356,-0.2430639714860927,-0.6869882293559796,
    0.44721600000000006,-0.2763979999999999,-0.850648,1.0,0.4407780664296207,-0.27241829131158907,-0.8552794693627569,
    0.5877859999999999,0.0,-0.809017,1.0,0.5877858829948915,-2.554691144635855e-08,-0.809016536142442,
    0.43600700000000003,0.25115200000000004,-0.864188,1.0,0.44174743584464,0.2430637566759591,-0.8635850931525253,
    0.3090169999999999,0.0,-0.951056,1.0,0.3090047066659712,-0.008872910630520342,-0.9510191179546391,
    0.1552150000000001,0.25115200000000004,-0.955422,1.0,0.15021657377136222,0.24306347133980513,-0.9583084732301164,
    0.3090169999999999,0.0,-0.951056,1.0,0.3090047066659712,-0.008872910630520342,-0.9510191179546391,
    0.0,0.0,-1.0,1.0,8.386527000463054e-07,1.0350315843348408e-07,-0.999999999999643,
    0.1552150000000001,0.25115200000000004,-0.955422,1.0,0.15021657377136222,0.24306347133980513,-0.9583084732301164,
    0.5877859999999999,0.0,-0.809017,1.0,0.5877858829948915,-2.554691144635855e-08,-0.809016536142442,
    0.44721600000000006,-0.2763979999999999,-0.850648,1.0,0.4407780664296207,-0.27241829131158907,-0.8552794693627569,
    0.3090169999999999,0.0,-0.951056,1.0,0.3090047066659712,-0.008872910630520342,-0.9510191179546391,
    0.44721600000000006,-0.2763979999999999,-0.850648,1.0,0.4407780664296207,-0.27241829131158907,-0.8552794693627569,
    0.13819899999999996,-0.2763979999999999,-0.951055,1.0,0.14612974047217775,-0.27241779329109583,-0.9510176890299905,
    0.3090169999999999,0.0,-0.951056,1.0,0.3090047066659712,-0.008872910630520342,-0.9510191179546391,
    0.3090169999999999,0.0,-0.951056,1.0,0.3090047066659712,-0.008872910630520342,-0.9510191179546391,
    0.13819899999999996,-0.2763979999999999,-0.951055,1.0,0.14612974047217775,-0.27241779329109583,-0.9510176890299905,
    0.0,0.0,-1.0,1.0,8.386527000463054e-07,1.0350315843348408e-07,-0.999999999999643,
    0.13819899999999996,-0.2763979999999999,-0.951055,1.0,0.14612974047217775,-0.27241779329109583,-0.9510176890299905,
    -0.155215,-0.25115200000000004,-0.955422,1.0,-0.1502164527684422,-0.24306415178722385,-0.9583083196099383,
    0.0,0.0,-1.0,1.0,8.386527000463054e-07,1.0350315843348408e-07,-0.999999999999643,
    0.6871589999999999,-0.25115200000000004,-0.681715,1.0,0.6848117102472356,-0.2430639714860927,-0.6869882293559796,
    0.531941,-0.502302,-0.681712,1.0,0.5236579140350146,-0.503818798851909,-0.6869854488938736,
    0.44721600000000006,-0.2763979999999999,-0.850648,1.0,0.4407780664296207,-0.27241829131158907,-0.8552794693627569,
    0.531941,-0.502302,-0.681712,1.0,0.5236579140350146,-0.503818798851909,-0.6869854488938736,
    0.262869,-0.525738,-0.809012,1.0,0.26286895228372437,-0.5257372320187721,-0.8090119138767345,
    0.44721600000000006,-0.2763979999999999,-0.850648,1.0,0.4407780664296207,-0.27241829131158907,-0.8552794693627569,
    0.44721600000000006,-0.2763979999999999,-0.850648,1.0,0.4407780664296207,-0.27241829131158907,-0.8552794693627569,
    0.262869,-0.525738,-0.809012,1.0,0.26286895228372437,-0.5257372320187721,-0.8090119138767345,
    0.13819899999999996,-0.2763979999999999,-0.951055,1.0,0.14612974047217775,-0.27241779329109583,-0.9510176890299905,
    0.262869,-0.525738,-0.809012,1.0,0.26286895228372437,-0.5257372320187721,-0.8090119138767345,
    -0.02963899999999997,-0.502302,-0.864184,1.0,-0.019838720158978862,-0.5038191057760348,-0.8635813417608618,
    0.13819899999999996,-0.2763979999999999,-0.951055,1.0,0.14612974047217775,-0.27241779329109583,-0.9510176890299905,
    0.13819899999999996,-0.2763979999999999,-0.951055,1.0,0.14612974047217775,-0.27241779329109583,-0.9510176890299905,
    -0.02963899999999997,-0.502302,-0.864184,1.0,-0.019838720158978862,-0.5038191057760348,-0.8635813417608618,
    -0.155215,-0.25115200000000004,-0.955422,1.0,-0.1502164527684422,-0.24306415178722385,-0.9583083196099383,
    -0.02963899999999997,-0.502302,-0.864184,1.0,-0.019838720158978862,-0.5038191057760348,-0.8635813417608618,
    -0.2763880000000001,-0.44721999999999995,-0.850649,1.0,-0.2763877525951483,-0.44721995820039734,-0.8506492339399583,
    -0.155215,-0.25115200000000004,-0.955422,1.0,-0.1502164527684422,-0.24306415178722385,-0.9583083196099383,
    -0.687159,0.25115200000000004,-0.681715,1.0,-0.6848117463759701,0.2430639454016199,-0.6869882025706792,
    -0.860698,0.2511510000000001,-0.442858,1.0,-0.8649868290678857,0.2430624631623782,-0.43899706666505395,
    -0.723607,0.44721999999999995,-0.525725,1.0,-0.7236067216830412,0.44721965132148317,-0.5257260653677089,
    -0.587786,0.0,-0.809017,1.0,-0.5877863671165282,8.898111888585574e-08,-0.8090161844066818,
    -0.809018,0.0,-0.587783,1.0,-0.8089865397400394,-0.008873289185182267,-0.587760191964779,
    -0.687159,0.25115200000000004,-0.681715,1.0,-0.6848117463759701,0.2430639454016199,-0.6869882025706792,
    -0.43600700000000003,-0.25115200000000004,-0.864188,1.0,-0.4417472320955005,-0.24306420283334987,-0.8635850718006606,
    -0.670819,-0.276397,-0.688191,1.0,-0.6772137611074175,-0.2724178575158659,-0.6834983779594587,
    -0.587786,0.0,-0.809017,1.0,-0.5877863671165282,8.898111888585574e-08,-0.8090161844066818,
    -0.687159,0.25115200000000004,-0.681715,1.0,-0.6848117463759701,0.2430639454016199,-0.6869882025706792,
    -0.809018,0.0,-0.587783,1.0,-0.8089865397400394,-0.008873289185182267,-0.587760191964779,
    -0.860698,0.2511510000000001,-0.442858,1.0,-0.8649868290678857,0.2430624631623782,-0.43899706666505395,
    -0.809018,0.0,-0.587783,1.0,-0.8089865397400394,-0.008873289185182267,-0.587760191964779,
    -0.951058,0.0,-0.309013,1.0,-0.9510573479382253,-7.330831644240639e-07,-0.30901443482816815,
    -0.860698,0.2511510000000001,-0.442858,1.0,-0.8649868290678857,0.2430624631623782,-0.43899706666505395,
    -0.587786,0.0,-0.809017,1.0,-0.5877863671165282,8.898111888585574e-08,-0.8090161844066818,
    -0.670819,-0.276397,-0.688191,1.0,-0.6772137611074175,-0.2724178575158659,-0.6834983779594587,
    -0.809018,0.0,-0.587783,1.0,-0.8089865397400394,-0.008873289185182267,-0.587760191964779,
    -0.670819,-0.276397,-0.688191,1.0,-0.6772137611074175,-0.2724178575158659,-0.6834983779594587,
    -0.861803,-0.276396,-0.42532400000000004,1.0,-0.8593167049440582,-0.2724165069227901,-0.43285568883875336,
    -0.809018,0.0,-0.587783,1.0,-0.8089865397400394,-0.008873289185182267,-0.587760191964779,
    -0.809018,0.0,-0.587783,1.0,-0.8089865397400394,-0.008873289185182267,-0.587760191964779,
    -0.861803,-0.276396,-0.42532400000000004,1.0,-0.8593167049440582,-0.2724165069227901,-0.43285568883875336,
    -0.951058,0.0,-0.309013,1.0,-0.9510573479382253,-7.330831644240639e-07,-0.30901443482816815,
    -0.861803,-0.276396,-0.42532400000000004,1.0,-0.8593167049440582,-0.2724165069227901,-0.43285568883875336,
    -0.956626,-0.25114900000000007,-0.14761800000000003,1.0,-0.9578262170326509,-0.24306111405524766,-0.15326523676014436,
    -0.951058,0.0,-0.309013,1.0,-0.9510573479382253,-7.330831644240639e-07,-0.30901443482816815,
    -0.43600700000000003,-0.25115200000000004,-0.864188,1.0,-0.4417472320955005,-0.24306420283334987,-0.8635850718006606,
    -0.48397099999999993,-0.502302,-0.716565,1.0,-0.4915461091474215,-0.5038186497816622,-0.7103162610515219,
    -0.670819,-0.276397,-0.688191,1.0,-0.6772137611074175,-0.2724178575158659,-0.6834983779594587,
    -0.48397099999999993,-0.502302,-0.716565,1.0,-0.4915461091474215,-0.5038186497816622,-0.7103162610515219,
    -0.688189,-0.525736,-0.499997,1.0,-0.6881896629138985,-0.5257350598001616,-0.4999976347497809,
    -0.670819,-0.276397,-0.688191,1.0,-0.6772137611074175,-0.2724178575158659,-0.6834983779594587,
    -0.670819,-0.276397,-0.688191,1.0,-0.6772137611074175,-0.2724178575158659,-0.6834983779594587,
    -0.688189,-0.525736,-0.499997,1.0,-0.6881896629138985,-0.5257350598001616,-0.4999976347497809,
    -0.861803,-0.276396,-0.42532400000000004,1.0,-0.8593167049440582,-0.2724165069227901,-0.43285568883875336,
    -0.688189,-0.525736,-0.499997,1.0,-0.6881896629138985,-0.5257350598001616,-0.4999976347497809,
    -0.831051,-0.502299,-0.23885299999999998,1.0,-0.827448675299351,-0.503815221812631,-0.24798974175404667,
    -0.861803,-0.276396,-0.42532400000000004,1.0,-0.8593167049440582,-0.2724165069227901,-0.43285568883875336,
    -0.861803,-0.276396,-0.42532400000000004,1.0,-0.8593167049440582,-0.2724165069227901,-0.43285568883875336,
    -0.831051,-0.502299,-0.23885299999999998,1.0,-0.827448675299351,-0.503815221812631,-0.24798974175404667,
    -0.956626,-0.25114900000000007,-0.14761800000000003,1.0,-0.9578262170326509,-0.24306111405524766,-0.15326523676014436,
    -0.831051,-0.502299,-0.23885299999999998,1.0,-0.827448675299351,-0.503815221812631,-0.24798974175404667,
    -0.894426,-0.44721600000000006,0.0,1.0,-0.8944264388330798,-0.44721509983046726,3.5123469383576465e-18,
    -0.956626,-0.25114900000000007,-0.14761800000000003,1.0,-0.9578262170326509,-0.24306111405524766,-0.15326523676014436,
    -0.860698,0.2511510000000001,0.442858,1.0,-0.8649867092922593,0.24306239483169045,0.43899734050040895,
    -0.687159,0.25115200000000004,0.6817150000000001,1.0,-0.6848115755465203,0.24306396103886968,0.6869883673262506,
    -0.723607,0.44721999999999995,0.525725,1.0,-0.7236067216830413,0.4472196513214834,0.5257260653677087,
    -0.951058,0.0,0.309013,1.0,-0.951057331086145,-8.671557238488273e-07,0.3090144866936615,
    -0.809018,0.0,0.5877829999999999,1.0,-0.8089865397400394,-0.008873289185182359,0.5877601919647789,
    -0.860698,0.2511510000000001,0.442858,1.0,-0.8649867092922593,0.24306239483169045,0.43899734050040895,
    -0.956626,-0.25114900000000007,0.14761800000000003,1.0,-0.9578262170326509,-0.24306111405524763,0.1532652367601444,
    -0.861803,-0.276396,0.42532400000000004,1.0,-0.8593167049440582,-0.2724165069227901,0.43285568883875347,
    -0.951058,0.0,0.309013,1.0,-0.951057331086145,-8.671557238488273e-07,0.3090144866936615,
    -0.860698,0.2511510000000001,0.442858,1.0,-0.8649867092922593,0.24306239483169045,0.43899734050040895,
    -0.809018,0.0,0.5877829999999999,1.0,-0.8089865397400394,-0.008873289185182359,0.5877601919647789,
    -0.687159,0.25115200000000004,0.6817150000000001,1.0,-0.6848115755465203,0.24306396103886968,0.6869883673262506,
    -0.809018,0.0,0.5877829999999999,1.0,-0.8089865397400394,-0.008873289185182359,0.5877601919647789,
    -0.587786,0.0,0.8090169999999999,1.0,-0.5877858058415312,4.349631417008017e-07,0.8090165921976091,
    -0.687159,0.25115200000000004,0.6817150000000001,1.0,-0.6848115755465203,0.24306396103886968,0.6869883673262506,
    -0.951058,0.0,0.309013,1.0,-0.951057331086145,-8.671557238488273e-07,0.3090144866936615,
    -0.861803,-0.276396,0.42532400000000004,1.0,-0.8593167049440582,-0.2724165069227901,0.43285568883875347,
    -0.809018,0.0,0.5877829999999999,1.0,-0.8089865397400394,-0.008873289185182359,0.5877601919647789,
    -0.861803,-0.276396,0.42532400000000004,1.0,-0.8593167049440582,-0.2724165069227901,0.43285568883875347,
    -0.670819,-0.276397,0.688191,1.0,-0.6772137611074175,-0.2724178575158658,0.6834983779594588,
    -0.809018,0.0,0.5877829999999999,1.0,-0.8089865397400394,-0.008873289185182359,0.5877601919647789,
    -0.809018,0.0,0.5877829999999999,1.0,-0.8089865397400394,-0.008873289185182359,0.5877601919647789,
    -0.670819,-0.276397,0.688191,1.0,-0.6772137611074175,-0.2724178575158658,0.6834983779594588,
    -0.587786,0.0,0.8090169999999999,1.0,-0.5877858058415312,4.349631417008017e-07,0.8090165921976091,
    -0.670819,-0.276397,0.688191,1.0,-0.6772137611074175,-0.2724178575158658,0.6834983779594588,
    -0.43600700000000003,-0.25115200000000004,0.864188,1.0,-0.4417470436660011,-0.2430638114471244,0.8635852783466985,
    -0.587786,0.0,0.8090169999999999,1.0,-0.5877858058415312,4.349631417008017e-07,0.8090165921976091,
    -0.956626,-0.25114900000000007,0.14761800000000003,1.0,-0.9578262170326509,-0.24306111405524763,0.1532652367601444,
    -0.831051,-0.502299,0.23885299999999998,1.0,-0.8274488479658778,-0.5038149789897272,0.24798965894876002,
    -0.861803,-0.276396,0.42532400000000004,1.0,-0.8593167049440582,-0.2724165069227901,0.43285568883875347,
    -0.831051,-0.502299,0.23885299999999998,1.0,-0.8274488479658778,-0.5038149789897272,0.24798965894876002,
    -0.688189,-0.525736,0.499997,1.0,-0.6881895511641616,-0.5257349869564159,0.49999786515384953,
    -0.861803,-0.276396,0.42532400000000004,1.0,-0.8593167049440582,-0.2724165069227901,0.43285568883875347,
    -0.861803,-0.276396,0.42532400000000004,1.0,-0.8593167049440582,-0.2724165069227901,0.43285568883875347,
    -0.688189,-0.525736,0.499997,1.0,-0.6881895511641616,-0.5257349869564159,0.49999786515384953,
    -0.670819,-0.276397,0.688191,1.0,-0.6772137611074175,-0.2724178575158658,0.6834983779594588,
    -0.688189,-0.525736,0.499997,1.0,-0.6881895511641616,-0.5257349869564159,0.49999786515384953,
    -0.48397099999999993,-0.502302,0.7165650000000001,1.0,-0.49154612462755637,-0.503818632525199,0.7103162625789089,
    -0.670819,-0.276397,0.688191,1.0,-0.6772137611074175,-0.2724178575158658,0.6834983779594588,
    -0.670819,-0.276397,0.688191,1.0,-0.6772137611074175,-0.2724178575158658,0.6834983779594588,
    -0.48397099999999993,-0.502302,0.7165650000000001,1.0,-0.49154612462755637,-0.503818632525199,0.7103162625789089,
    -0.43600700000000003,-0.25115200000000004,0.864188,1.0,-0.4417470436660011,-0.2430638114471244,0.8635852783466985,
    -0.48397099999999993,-0.502302,0.7165650000000001,1.0,-0.49154612462755637,-0.503818632525199,0.7103162625789089,
    -0.2763880000000001,-0.44721999999999995,0.850649,1.0,-0.27638775259514803,-0.44721995820039745,0.8506492339399584,
    -0.43600700000000003,-0.25115200000000004,0.864188,1.0,-0.4417470436660011,-0.2430638114471244,0.8635852783466985,
    0.1552150000000001,0.25115200000000004,0.955422,1.0,0.15021657377136222,0.24306347133980513,0.9583084732301164,
    0.43600700000000003,0.25115200000000004,0.864188,1.0,0.4417474635405354,0.24306379703966605,0.8635850676245875,
    0.2763880000000001,0.44721999999999995,0.850649,1.0,0.27638775259514803,0.44721995820039745,0.8506492339399583,
    0.0,0.0,1.0,1.0,-6.802996438484687e-08,1.7058485892572035e-07,0.9999999999999832,
    0.3090169999999999,0.0,0.9510559999999999,1.0,0.30900470666597124,-0.008872910630520276,0.9510191179546391,
    0.1552150000000001,0.25115200000000004,0.955422,1.0,0.15021657377136222,0.24306347133980513,0.9583084732301164,
    -0.155215,-0.25115200000000004,0.955422,1.0,-0.15021677729008256,-0.24306351370824936,0.9583084305819194,
    0.13819899999999996,-0.2763979999999999,0.951055,1.0,0.14612974047217758,-0.2724177932910958,0.9510176890299905,
    0.0,0.0,1.0,1.0,-6.802996438484687e-08,1.7058485892572035e-07,0.9999999999999832,
    0.1552150000000001,0.25115200000000004,0.955422,1.0,0.15021657377136222,0.24306347133980513,0.9583084732301164,
    0.3090169999999999,0.0,0.9510559999999999,1.0,0.30900470666597124,-0.008872910630520276,0.9510191179546391,
    0.43600700000000003,0.25115200000000004,0.864188,1.0,0.4417474635405354,0.24306379703966605,0.8635850676245875,
    0.3090169999999999,0.0,0.9510559999999999,1.0,0.30900470666597124,-0.008872910630520276,0.9510191179546391,
    0.5877859999999999,0.0,0.8090169999999999,1.0,0.5877853232201069,3.613410911975069e-08,0.8090169428429995,
    0.43600700000000003,0.25115200000000004,0.864188,1.0,0.4417474635405354,0.24306379703966605,0.8635850676245875,
    0.0,0.0,1.0,1.0,-6.802996438484687e-08,1.7058485892572035e-07,0.9999999999999832,
    0.13819899999999996,-0.2763979999999999,0.951055,1.0,0.14612974047217758,-0.2724177932910958,0.9510176890299905,
    0.3090169999999999,0.0,0.9510559999999999,1.0,0.30900470666597124,-0.008872910630520276,0.9510191179546391,
    0.13819899999999996,-0.2763979999999999,0.951055,1.0,0.14612974047217758,-0.2724177932910958,0.9510176890299905,
    0.44721600000000006,-0.2763979999999999,0.8506480000000001,1.0,0.44077806642962053,-0.27241829131158873,0.8552794693627571,
    0.3090169999999999,0.0,0.9510559999999999,1.0,0.30900470666597124,-0.008872910630520276,0.9510191179546391,
    0.3090169999999999,0.0,0.9510559999999999,1.0,0.30900470666597124,-0.008872910630520276,0.9510191179546391,
    0.44721600000000006,-0.2763979999999999,0.8506480000000001,1.0,0.44077806642962053,-0.27241829131158873,0.8552794693627571,
    0.5877859999999999,0.0,0.8090169999999999,1.0,0.5877853232201069,3.613410911975069e-08,0.8090169428429995,
    0.44721600000000006,-0.2763979999999999,0.8506480000000001,1.0,0.44077806642962053,-0.27241829131158873,0.8552794693627571,
    0.6871589999999999,-0.25115200000000004,0.6817150000000001,1.0,0.6848111757491196,-0.24306484466307332,0.6869884532203029,
    0.5877859999999999,0.0,0.8090169999999999,1.0,0.5877853232201069,3.613410911975069e-08,0.8090169428429995,
    -0.155215,-0.25115200000000004,0.955422,1.0,-0.15021677729008256,-0.24306351370824936,0.9583084305819194,
    -0.02963899999999997,-0.502302,0.8641839999999998,1.0,-0.019838689717257413,-0.5038192559913451,0.8635812548235572,
    0.13819899999999996,-0.2763979999999999,0.951055,1.0,0.14612974047217758,-0.2724177932910958,0.9510176890299905,
    -0.02963899999999997,-0.502302,0.8641839999999998,1.0,-0.019838689717257413,-0.5038192559913451,0.8635812548235572,
    0.262869,-0.525738,0.8090120000000001,1.0,0.26286888259023233,-0.5257372188438393,0.8090119450836976,
    0.13819899999999996,-0.2763979999999999,0.951055,1.0,0.14612974047217758,-0.2724177932910958,0.9510176890299905,
    0.13819899999999996,-0.2763979999999999,0.951055,1.0,0.14612974047217758,-0.2724177932910958,0.9510176890299905,
    0.262869,-0.525738,0.8090120000000001,1.0,0.26286888259023233,-0.5257372188438393,0.8090119450836976,
    0.44721600000000006,-0.2763979999999999,0.8506480000000001,1.0,0.44077806642962053,-0.27241829131158873,0.8552794693627571,
    0.262869,-0.525738,0.8090120000000001,1.0,0.26286888259023233,-0.5257372188438393,0.8090119450836976,
    0.531941,-0.502302,0.6817120000000001,1.0,0.5236580515960895,-0.5038185204865161,0.6869855481837774,
    0.44721600000000006,-0.2763979999999999,0.8506480000000001,1.0,0.44077806642962053,-0.27241829131158873,0.8552794693627571,
    0.44721600000000006,-0.2763979999999999,0.8506480000000001,1.0,0.44077806642962053,-0.27241829131158873,0.8552794693627571,
    0.531941,-0.502302,0.6817120000000001,1.0,0.5236580515960895,-0.5038185204865161,0.6869855481837774,
    0.6871589999999999,-0.25115200000000004,0.6817150000000001,1.0,0.6848111757491196,-0.24306484466307332,0.6869884532203029,
    0.531941,-0.502302,0.6817120000000001,1.0,0.5236580515960895,-0.5038185204865161,0.6869855481837774,
    0.7236069999999999,-0.44721999999999995,0.525725,1.0,0.7236067216830413,-0.4472196513214831,0.5257260653677089,
    0.6871589999999999,-0.25115200000000004,0.6817150000000001,1.0,0.6848111757491196,-0.24306484466307332,0.6869884532203029,
    0.956626,0.25114900000000007,0.14761800000000003,1.0,0.9578261805030606,0.24306129258052184,0.15326518192989683,
    0.956626,0.25114900000000007,-0.14761800000000003,1.0,0.9578262483355788,0.24306118218022527,-0.15326493309476094,
    0.8944260000000002,0.44721600000000006,0.0,1.0,0.8944264388330799,0.4472150998304671,-7.024693876715296e-18,
    0.951058,0.0,0.309013,1.0,0.9510576790560566,4.844418859218338e-07,0.30901341574156965,
    1.0,0.0,0.0,1.0,0.9999606296359095,-0.00887350991183931,0.0,
    0.956626,0.25114900000000007,0.14761800000000003,1.0,0.9578261805030606,0.24306129258052184,0.15326518192989683,
    0.860698,-0.251151,0.442858,1.0,0.864986890060841,-0.24306353018273283,0.4389963557001157,
    0.9472130000000001,-0.276396,0.162458,1.0,0.9496282556409833,-0.27241716831043955,0.15490339730937155,
    0.951058,0.0,0.309013,1.0,0.9510576790560566,4.844418859218338e-07,0.30901341574156965,
    0.956626,0.25114900000000007,0.14761800000000003,1.0,0.9578261805030606,0.24306129258052184,0.15326518192989683,
    1.0,0.0,0.0,1.0,0.9999606296359095,-0.00887350991183931,0.0,
    0.956626,0.25114900000000007,-0.14761800000000003,1.0,0.9578262483355788,0.24306118218022527,-0.15326493309476094,
    1.0,0.0,0.0,1.0,0.9999606296359095,-0.00887350991183931,0.0,
    0.951058,0.0,-0.309013,1.0,0.9510575012112954,5.074933413732154e-07,-0.30901396309789836,
    0.956626,0.25114900000000007,-0.14761800000000003,1.0,0.9578262483355788,0.24306118218022527,-0.15326493309476094,
    0.951058,0.0,0.309013,1.0,0.9510576790560566,4.844418859218338e-07,0.30901341574156965,
    0.9472130000000001,-0.276396,0.162458,1.0,0.9496282556409833,-0.27241716831043955,0.15490339730937155,
    1.0,0.0,0.0,1.0,0.9999606296359095,-0.00887350991183931,0.0,
    0.9472130000000001,-0.276396,0.162458,1.0,0.9496282556409833,-0.27241716831043955,0.15490339730937155,
    0.9472130000000001,-0.276396,-0.162458,1.0,0.9496282556409833,-0.27241716831043955,-0.15490339730937153,
    1.0,0.0,0.0,1.0,0.9999606296359095,-0.00887350991183931,0.0,
    1.0,0.0,0.0,1.0,0.9999606296359095,-0.00887350991183931,0.0,
    0.9472130000000001,-0.276396,-0.162458,1.0,0.9496282556409833,-0.27241716831043955,-0.15490339730937153,
    0.951058,0.0,-0.309013,1.0,0.9510575012112954,5.074933413732154e-07,-0.30901396309789836,
    0.9472130000000001,-0.276396,-0.162458,1.0,0.9496282556409833,-0.27241716831043955,-0.15490339730937153,
    0.860698,-0.251151,-0.442858,1.0,0.8649868190167103,-0.2430628154105527,-0.4389968914377966,
    0.951058,0.0,-0.309013,1.0,0.9510575012112954,5.074933413732154e-07,-0.30901396309789836,
    0.860698,-0.251151,0.442858,1.0,0.864986890060841,-0.24306353018273283,0.4389963557001157,
    0.812729,-0.502301,0.2952379999999999,1.0,0.8151848055269568,-0.503817229437447,0.2857305236756347,
    0.9472130000000001,-0.276396,0.162458,1.0,0.9496282556409833,-0.27241716831043955,0.15490339730937155,
    0.812729,-0.502301,0.2952379999999999,1.0,0.8151848055269568,-0.503817229437447,0.2857305236756347,
    0.8506480000000001,-0.525736,0.0,1.0,0.8506487792762305,-0.5257343952185694,-1.551196823478276e-07,
    0.9472130000000001,-0.276396,0.162458,1.0,0.9496282556409833,-0.27241716831043955,0.15490339730937155,
    0.9472130000000001,-0.276396,0.162458,1.0,0.9496282556409833,-0.27241716831043955,0.15490339730937155,
    0.8506480000000001,-0.525736,0.0,1.0,0.8506487792762305,-0.5257343952185694,-1.551196823478276e-07,
    0.9472130000000001,-0.276396,-0.162458,1.0,0.9496282556409833,-0.27241716831043955,-0.15490339730937153,
    0.8506480000000001,-0.525736,0.0,1.0,0.8506487792762305,-0.5257343952185694,-1.551196823478276e-07,
    0.812729,-0.502301,-0.295238,1.0,0.8151846510833864,-0.5038175802700607,-0.2857303456913148,
    0.9472130000000001,-0.276396,-0.162458,1.0,0.9496282556409833,-0.27241716831043955,-0.15490339730937153,
    0.9472130000000001,-0.276396,-0.162458,1.0,0.9496282556409833,-0.27241716831043955,-0.15490339730937153,
    0.812729,-0.502301,-0.295238,1.0,0.8151846510833864,-0.5038175802700607,-0.2857303456913148,
    0.860698,-0.251151,-0.442858,1.0,0.8649868190167103,-0.2430628154105527,-0.4389968914377966,
    0.812729,-0.502301,-0.295238,1.0,0.8151846510833864,-0.5038175802700607,-0.2857303456913148,
    0.7236069999999999,-0.44721999999999995,-0.525725,1.0,0.7236067216830413,-0.4472196513214831,-0.525726065367709,
    0.860698,-0.251151,-0.442858,1.0,0.8649868190167103,-0.2430628154105527,-0.4389968914377966,
    0.6095470000000001,-0.657519,-0.442856,1.0,0.60423092704266,-0.6649723365238669,-0.4389951918451463,
    0.531941,-0.502302,-0.681712,1.0,0.5236579140350146,-0.503818798851909,-0.6869854488938736,
    0.7236069999999999,-0.44721999999999995,-0.525725,1.0,0.7236067216830413,-0.4472196513214831,-0.525726065367709,
    0.4253230000000001,-0.850654,-0.3090109999999999,1.0,0.42532286056333185,-0.8506540013904963,-0.3090117056044348,
    0.3618030000000001,-0.723612,-0.587779,1.0,0.3538531927575634,-0.727551553663659,-0.5877556080012123,
    0.6095470000000001,-0.657519,-0.442856,1.0,0.60423092704266,-0.6649723365238669,-0.4389951918451463,
    0.20318100000000006,-0.96795,-0.14761800000000003,1.0,0.21095286907952562,-0.9654060533326492,-0.15326460522832558,
    0.1381969999999999,-0.894429,-0.42532100000000006,1.0,0.14064406863988954,-0.890425561238057,-0.4328528223892147,
    0.4253230000000001,-0.850654,-0.3090109999999999,1.0,0.42532286056333185,-0.8506540013904963,-0.3090117056044348,
    0.6095470000000001,-0.657519,-0.442856,1.0,0.60423092704266,-0.6649723365238669,-0.4389951918451463,
    0.3618030000000001,-0.723612,-0.587779,1.0,0.3538531927575634,-0.727551553663659,-0.5877556080012123,
    0.531941,-0.502302,-0.681712,1.0,0.5236579140350146,-0.503818798851909,-0.6869854488938736,
    0.3618030000000001,-0.723612,-0.587779,1.0,0.3538531927575634,-0.727551553663659,-0.5877556080012123,
    0.262869,-0.525738,-0.809012,1.0,0.26286895228372437,-0.5257372320187721,-0.8090119138767345,
    0.531941,-0.502302,-0.681712,1.0,0.5236579140350146,-0.503818798851909,-0.6869854488938736,
    0.4253230000000001,-0.850654,-0.3090109999999999,1.0,0.42532286056333185,-0.8506540013904963,-0.3090117056044348,
    0.1381969999999999,-0.894429,-0.42532100000000006,1.0,0.14064406863988954,-0.890425561238057,-0.4328528223892147,
    0.3618030000000001,-0.723612,-0.587779,1.0,0.3538531927575634,-0.727551553663659,-0.5877556080012123,
    0.1381969999999999,-0.894429,-0.42532100000000006,1.0,0.14064406863988954,-0.890425561238057,-0.4328528223892147,
    0.052788999999999975,-0.723611,-0.688186,1.0,0.05920646379214723,-0.7275510143742654,-0.683494049811852,
    0.3618030000000001,-0.723612,-0.587779,1.0,0.3538531927575634,-0.727551553663659,-0.5877556080012123,
    0.3618030000000001,-0.723612,-0.587779,1.0,0.3538531927575634,-0.727551553663659,-0.5877556080012123,
    0.052788999999999975,-0.723611,-0.688186,1.0,0.05920646379214723,-0.7275510143742654,-0.683494049811852,
    0.262869,-0.525738,-0.809012,1.0,0.26286895228372437,-0.5257372320187721,-0.8090119138767345,
    0.052788999999999975,-0.723611,-0.688186,1.0,0.05920646379214723,-0.7275510143742654,-0.683494049811852,
    -0.02963899999999997,-0.502302,-0.864184,1.0,-0.019838720158978862,-0.5038191057760348,-0.8635813417608618,
    0.262869,-0.525738,-0.809012,1.0,0.26286895228372437,-0.5257372320187721,-0.8090119138767345,
    0.20318100000000006,-0.96795,-0.14761800000000003,1.0,0.21095286907952562,-0.9654060533326492,-0.15326460522832558,
    -0.07760699999999998,-0.96795,-0.23885299999999998,1.0,-0.08057588379380852,-0.9654061724258667,-0.24798880860410688,
    0.1381969999999999,-0.894429,-0.42532100000000006,1.0,0.14064406863988954,-0.890425561238057,-0.4328528223892147,
    -0.07760699999999998,-0.96795,-0.23885299999999998,1.0,-0.08057588379380852,-0.9654061724258667,-0.24798880860410688,
    -0.16245599999999993,-0.850654,-0.49999499999999997,1.0,-0.1624559605874681,-0.8506538252498717,-0.4999961304423903,
    0.1381969999999999,-0.894429,-0.42532100000000006,1.0,0.14064406863988954,-0.890425561238057,-0.4328528223892147,
    0.1381969999999999,-0.894429,-0.42532100000000006,1.0,0.14064406863988954,-0.890425561238057,-0.4328528223892147,
    -0.16245599999999993,-0.850654,-0.49999499999999997,1.0,-0.1624559605874681,-0.8506538252498717,-0.4999961304423903,
    0.052788999999999975,-0.723611,-0.688186,1.0,0.05920646379214723,-0.7275510143742654,-0.683494049811852,
    -0.16245599999999993,-0.850654,-0.49999499999999997,1.0,-0.1624559605874681,-0.8506538252498717,-0.4999961304423903,
    -0.23282199999999997,-0.657519,-0.716563,1.0,-0.23079127648765035,-0.664972933661906,-0.7103142855062675,
    0.052788999999999975,-0.723611,-0.688186,1.0,0.05920646379214723,-0.7275510143742654,-0.683494049811852,
    0.052788999999999975,-0.723611,-0.688186,1.0,0.05920646379214723,-0.7275510143742654,-0.683494049811852,
    -0.23282199999999997,-0.657519,-0.716563,1.0,-0.23079127648765035,-0.664972933661906,-0.7103142855062675,
    -0.02963899999999997,-0.502302,-0.864184,1.0,-0.019838720158978862,-0.5038191057760348,-0.8635813417608618,
    -0.23282199999999997,-0.657519,-0.716563,1.0,-0.23079127648765035,-0.664972933661906,-0.7103142855062675,
    -0.2763880000000001,-0.44721999999999995,-0.850649,1.0,-0.2763877525951483,-0.44721995820039734,-0.8506492339399583,
    -0.02963899999999997,-0.502302,-0.864184,1.0,-0.019838720158978862,-0.5038191057760348,-0.8635813417608618,
    -0.23282199999999997,-0.657519,-0.716563,1.0,-0.23079127648765035,-0.664972933661906,-0.7103142855062675,
    -0.48397099999999993,-0.502302,-0.716565,1.0,-0.4915461091474215,-0.5038186497816622,-0.7103162610515219,
    -0.2763880000000001,-0.44721999999999995,-0.850649,1.0,-0.2763877525951483,-0.44721995820039734,-0.8506492339399583,
    -0.16245599999999993,-0.850654,-0.49999499999999997,1.0,-0.1624559605874681,-0.8506538252498717,-0.4999961304423903,
    -0.447211,-0.723612,-0.525727,1.0,-0.4496452961078909,-0.7275509278708348,-0.5181590055594274,
    -0.23282199999999997,-0.657519,-0.716563,1.0,-0.23079127648765035,-0.664972933661906,-0.7103142855062675,
    -0.07760699999999998,-0.96795,-0.23885299999999998,1.0,-0.08057588379380852,-0.9654061724258667,-0.24798880860410688,
    -0.36180100000000004,-0.894429,-0.26286300000000007,1.0,-0.36820701052687826,-0.8904256400317344,-0.2675178068333686,
    -0.16245599999999993,-0.850654,-0.49999499999999997,1.0,-0.1624559605874681,-0.8506538252498717,-0.4999961304423903,
    -0.23282199999999997,-0.657519,-0.716563,1.0,-0.23079127648765035,-0.664972933661906,-0.7103142855062675,
    -0.447211,-0.723612,-0.525727,1.0,-0.4496452961078909,-0.7275509278708348,-0.5181590055594274,
    -0.48397099999999993,-0.502302,-0.716565,1.0,-0.4915461091474215,-0.5038186497816622,-0.7103162610515219,
    -0.447211,-0.723612,-0.525727,1.0,-0.4496452961078909,-0.7275509278708348,-0.5181590055594274,
    -0.688189,-0.525736,-0.499997,1.0,-0.6881896629138985,-0.5257350598001616,-0.4999976347497809,
    -0.48397099999999993,-0.502302,-0.716565,1.0,-0.4915461091474215,-0.5038186497816622,-0.7103162610515219,
    -0.16245599999999993,-0.850654,-0.49999499999999997,1.0,-0.1624559605874681,-0.8506538252498717,-0.4999961304423903,
    -0.36180100000000004,-0.894429,-0.26286300000000007,1.0,-0.36820701052687826,-0.8904256400317344,-0.2675178068333686,
    -0.447211,-0.723612,-0.525727,1.0,-0.4496452961078909,-0.7275509278708348,-0.5181590055594274,
    -0.36180100000000004,-0.894429,-0.26286300000000007,1.0,-0.36820701052687826,-0.8904256400317344,-0.2675178068333686,
    -0.638195,-0.723609,-0.26286300000000007,1.0,-0.6317494048790507,-0.7275484141008814,-0.2675182135374292,
    -0.447211,-0.723612,-0.525727,1.0,-0.4496452961078909,-0.7275509278708348,-0.5181590055594274,
    -0.447211,-0.723612,-0.525727,1.0,-0.4496452961078909,-0.7275509278708348,-0.5181590055594274,
    -0.638195,-0.723609,-0.26286300000000007,1.0,-0.6317494048790507,-0.7275484141008814,-0.2675182135374292,
    -0.688189,-0.525736,-0.499997,1.0,-0.6881896629138985,-0.5257350598001616,-0.4999976347497809,
    -0.638195,-0.723609,-0.26286300000000007,1.0,-0.6317494048790507,-0.7275484141008814,-0.2675182135374292,
    -0.831051,-0.502299,-0.23885299999999998,1.0,-0.827448675299351,-0.503815221812631,-0.24798974175404667,
    -0.688189,-0.525736,-0.499997,1.0,-0.6881896629138985,-0.5257350598001616,-0.4999976347497809,
    -0.07760699999999998,-0.96795,-0.23885299999999998,1.0,-0.08057588379380852,-0.9654061724258667,-0.24798880860410688,
    -0.251147,-0.967949,0.0,1.0,-0.26075247981128585,-0.965405688957526,8.4223782992918e-07,
    -0.36180100000000004,-0.894429,-0.26286300000000007,1.0,-0.36820701052687826,-0.8904256400317344,-0.2675178068333686,
    -0.251147,-0.967949,0.0,1.0,-0.26075247981128585,-0.965405688957526,8.4223782992918e-07,
    -0.52573,-0.850652,0.0,1.0,-0.5257291351746985,-0.8506520301675546,5.30161602573815e-07,
    -0.36180100000000004,-0.894429,-0.26286300000000007,1.0,-0.36820701052687826,-0.8904256400317344,-0.2675178068333686,
    -0.36180100000000004,-0.894429,-0.26286300000000007,1.0,-0.36820701052687826,-0.8904256400317344,-0.2675178068333686,
    -0.52573,-0.850652,0.0,1.0,-0.5257291351746985,-0.8506520301675546,5.30161602573815e-07,
    -0.638195,-0.723609,-0.26286300000000007,1.0,-0.6317494048790507,-0.7275484141008814,-0.2675182135374292,
    -0.52573,-0.850652,0.0,1.0,-0.5257291351746985,-0.8506520301675546,5.30161602573815e-07,
    -0.753442,-0.657515,0.0,1.0,-0.7468712183386028,-0.6649687084497966,-1.4345962018813593e-07,
    -0.638195,-0.723609,-0.26286300000000007,1.0,-0.6317494048790507,-0.7275484141008814,-0.2675182135374292,
    -0.638195,-0.723609,-0.26286300000000007,1.0,-0.6317494048790507,-0.7275484141008814,-0.2675182135374292,
    -0.753442,-0.657515,0.0,1.0,-0.7468712183386028,-0.6649687084497966,-1.4345962018813593e-07,
    -0.831051,-0.502299,-0.23885299999999998,1.0,-0.827448675299351,-0.503815221812631,-0.24798974175404667,
    -0.753442,-0.657515,0.0,1.0,-0.7468712183386028,-0.6649687084497966,-1.4345962018813593e-07,
    -0.894426,-0.44721600000000006,0.0,1.0,-0.8944264388330798,-0.44721509983046726,3.5123469383576465e-18,
    -0.831051,-0.502299,-0.23885299999999998,1.0,-0.827448675299351,-0.503815221812631,-0.24798974175404667,
    -0.753442,-0.657515,0.0,1.0,-0.7468712183386028,-0.6649687084497966,-1.4345962018813593e-07,
    -0.831051,-0.502299,0.23885299999999998,1.0,-0.8274488479658778,-0.5038149789897272,0.24798965894876002,
    -0.894426,-0.44721600000000006,0.0,1.0,-0.8944264388330798,-0.44721509983046726,3.5123469383576465e-18,
    -0.52573,-0.850652,0.0,1.0,-0.5257291351746985,-0.8506520301675546,5.30161602573815e-07,
    -0.638195,-0.723609,0.262864,1.0,-0.6317485209773642,-0.7275487814839495,0.2675193017412632,
    -0.753442,-0.657515,0.0,1.0,-0.7468712183386028,-0.6649687084497966,-1.4345962018813593e-07,
    -0.251147,-0.967949,0.0,1.0,-0.26075247981128585,-0.965405688957526,8.4223782992918e-07,
    -0.36180100000000004,-0.894428,0.262864,1.0,-0.3682072805368218,-0.8904250916957412,0.26751926031280254,
    -0.52573,-0.850652,0.0,1.0,-0.5257291351746985,-0.8506520301675546,5.30161602573815e-07,
    -0.753442,-0.657515,0.0,1.0,-0.7468712183386028,-0.6649687084497966,-1.4345962018813593e-07,
    -0.638195,-0.723609,0.262864,1.0,-0.6317485209773642,-0.7275487814839495,0.2675193017412632,
    -0.831051,-0.502299,0.23885299999999998,1.0,-0.8274488479658778,-0.5038149789897272,0.24798965894876002,
    -0.638195,-0.723609,0.262864,1.0,-0.6317485209773642,-0.7275487814839495,0.2675193017412632,
    -0.688189,-0.525736,0.499997,1.0,-0.6881895511641616,-0.5257349869564159,0.49999786515384953,
    -0.831051,-0.502299,0.23885299999999998,1.0,-0.8274488479658778,-0.5038149789897272,0.24798965894876002,
    -0.52573,-0.850652,0.0,1.0,-0.5257291351746985,-0.8506520301675546,5.30161602573815e-07,
    -0.36180100000000004,-0.894428,0.262864,1.0,-0.3682072805368218,-0.8904250916957412,0.26751926031280254,
    -0.638195,-0.723609,0.262864,1.0,-0.6317485209773642,-0.7275487814839495,0.2675193017412632,
    -0.36180100000000004,-0.894428,0.262864,1.0,-0.3682072805368218,-0.8904250916957412,0.26751926031280254,
    -0.447211,-0.72361,0.5257290000000001,1.0,-0.44964507698926237,-0.7275501699756488,0.5181602598692076,
    -0.638195,-0.723609,0.262864,1.0,-0.6317485209773642,-0.7275487814839495,0.2675193017412632,
    -0.638195,-0.723609,0.262864,1.0,-0.6317485209773642,-0.7275487814839495,0.2675193017412632,
    -0.447211,-0.72361,0.5257290000000001,1.0,-0.44964507698926237,-0.7275501699756488,0.5181602598692076,
    -0.688189,-0.525736,0.499997,1.0,-0.6881895511641616,-0.5257349869564159,0.49999786515384953,
    -0.447211,-0.72361,0.5257290000000001,1.0,-0.44964507698926237,-0.7275501699756488,0.5181602598692076,
    -0.48397099999999993,-0.502302,0.7165650000000001,1.0,-0.49154612462755637,-0.503818632525199,0.7103162625789089,
    -0.688189,-0.525736,0.499997,1.0,-0.6881895511641616,-0.5257349869564159,0.49999786515384953,
    -0.251147,-0.967949,0.0,1.0,-0.26075247981128585,-0.965405688957526,8.4223782992918e-07,
    -0.07760699999999998,-0.96795,0.23885299999999998,1.0,-0.08057675620781352,-0.9654060832357604,0.2479888723519962,
    -0.36180100000000004,-0.894428,0.262864,1.0,-0.3682072805368218,-0.8904250916957412,0.26751926031280254,
    -0.07760699999999998,-0.96795,0.23885299999999998,1.0,-0.08057675620781352,-0.9654060832357604,0.2479888723519962,
    -0.16245599999999993,-0.850654,0.49999499999999997,1.0,-0.16245708015289456,-0.8506538856343064,0.4999956639446509,
    -0.36180100000000004,-0.894428,0.262864,1.0,-0.3682072805368218,-0.8904250916957412,0.26751926031280254,
    -0.36180100000000004,-0.894428,0.262864,1.0,-0.3682072805368218,-0.8904250916957412,0.26751926031280254,
    -0.16245599999999993,-0.850654,0.49999499999999997,1.0,-0.16245708015289456,-0.8506538856343064,0.4999956639446509,
    -0.447211,-0.72361,0.5257290000000001,1.0,-0.44964507698926237,-0.7275501699756488,0.5181602598692076,
    -0.16245599999999993,-0.850654,0.49999499999999997,1.0,-0.16245708015289456,-0.8506538856343064,0.4999956639446509,
    -0.23282199999999997,-0.657519,0.7165629999999998,1.0,-0.23079124291012987,-0.6649730641972427,0.7103141742131627,
    -0.447211,-0.72361,0.5257290000000001,1.0,-0.44964507698926237,-0.7275501699756488,0.5181602598692076,
    -0.447211,-0.72361,0.5257290000000001,1.0,-0.44964507698926237,-0.7275501699756488,0.5181602598692076,
    -0.23282199999999997,-0.657519,0.7165629999999998,1.0,-0.23079124291012987,-0.6649730641972427,0.7103141742131627,
    -0.48397099999999993,-0.502302,0.7165650000000001,1.0,-0.49154612462755637,-0.503818632525199,0.7103162625789089,
    -0.23282199999999997,-0.657519,0.7165629999999998,1.0,-0.23079124291012987,-0.6649730641972427,0.7103141742131627,
    -0.2763880000000001,-0.44721999999999995,0.850649,1.0,-0.27638775259514803,-0.44721995820039745,0.8506492339399584,
    -0.48397099999999993,-0.502302,0.7165650000000001,1.0,-0.49154612462755637,-0.503818632525199,0.7103162625789089,
    0.812729,-0.502301,-0.295238,1.0,0.8151846510833864,-0.5038175802700607,-0.2857303456913148,
    0.6095470000000001,-0.657519,-0.442856,1.0,0.60423092704266,-0.6649723365238669,-0.4389951918451463,
    0.7236069999999999,-0.44721999999999995,-0.525725,1.0,0.7236067216830413,-0.4472196513214831,-0.525726065367709,
    0.8506480000000001,-0.525736,0.0,1.0,0.8506487792762305,-0.5257343952185694,-1.551196823478276e-07,
    0.670817,-0.723611,-0.16245699999999996,1.0,0.6683377704518599,-0.7275503751292589,-0.15490344165547704,
    0.812729,-0.502301,-0.295238,1.0,0.8151846510833864,-0.5038175802700607,-0.2857303456913148,
    0.812729,-0.502301,0.2952379999999999,1.0,0.8151848055269568,-0.503817229437447,0.2857305236756347,
    0.6708180000000001,-0.72361,0.162458,1.0,0.6683384936921797,-0.727549561234357,0.1549041438986152,
    0.8506480000000001,-0.525736,0.0,1.0,0.8506487792762305,-0.5257343952185694,-1.551196823478276e-07,
    0.812729,-0.502301,-0.295238,1.0,0.8151846510833864,-0.5038175802700607,-0.2857303456913148,
    0.670817,-0.723611,-0.16245699999999996,1.0,0.6683377704518599,-0.7275503751292589,-0.15490344165547704,
    0.6095470000000001,-0.657519,-0.442856,1.0,0.60423092704266,-0.6649723365238669,-0.4389951918451463,
    0.670817,-0.723611,-0.16245699999999996,1.0,0.6683377704518599,-0.7275503751292589,-0.15490344165547704,
    0.4253230000000001,-0.850654,-0.3090109999999999,1.0,0.42532286056333185,-0.8506540013904963,-0.3090117056044348,
    0.6095470000000001,-0.657519,-0.442856,1.0,0.60423092704266,-0.6649723365238669,-0.4389951918451463,
    0.8506480000000001,-0.525736,0.0,1.0,0.8506487792762305,-0.5257343952185694,-1.551196823478276e-07,
    0.6708180000000001,-0.72361,0.162458,1.0,0.6683384936921797,-0.727549561234357,0.1549041438986152,
    0.670817,-0.723611,-0.16245699999999996,1.0,0.6683377704518599,-0.7275503751292589,-0.15490344165547704,
    0.6708180000000001,-0.72361,0.162458,1.0,0.6683384936921797,-0.727549561234357,0.1549041438986152,
    0.447211,-0.894428,9.999999999177334e-07,1.0,0.4551295869979919,-0.8904252124903946,6.877146626628624e-07,
    0.670817,-0.723611,-0.16245699999999996,1.0,0.6683377704518599,-0.7275503751292589,-0.15490344165547704,
    0.670817,-0.723611,-0.16245699999999996,1.0,0.6683377704518599,-0.7275503751292589,-0.15490344165547704,
    0.447211,-0.894428,9.999999999177334e-07,1.0,0.4551295869979919,-0.8904252124903946,6.877146626628624e-07,
    0.4253230000000001,-0.850654,-0.3090109999999999,1.0,0.42532286056333185,-0.8506540013904963,-0.3090117056044348,
    0.447211,-0.894428,9.999999999177334e-07,1.0,0.4551295869979919,-0.8904252124903946,6.877146626628624e-07,
    0.20318100000000006,-0.96795,-0.14761800000000003,1.0,0.21095286907952562,-0.9654060533326492,-0.15326460522832558,
    0.4253230000000001,-0.850654,-0.3090109999999999,1.0,0.42532286056333185,-0.8506540013904963,-0.3090117056044348,
    0.812729,-0.502301,0.2952379999999999,1.0,0.8151848055269568,-0.503817229437447,0.2857305236756347,
    0.6095470000000001,-0.657519,0.4428559999999999,1.0,0.6042310408008547,-0.6649722006723842,0.43899524105124693,
    0.6708180000000001,-0.72361,0.162458,1.0,0.6683384936921797,-0.727549561234357,0.1549041438986152,
    0.6095470000000001,-0.657519,0.4428559999999999,1.0,0.6042310408008547,-0.6649722006723842,0.43899524105124693,
    0.4253230000000001,-0.850654,0.3090109999999999,1.0,0.42532325551188366,-0.8506538075846909,0.30901169551076946,
    0.6708180000000001,-0.72361,0.162458,1.0,0.6683384936921797,-0.727549561234357,0.1549041438986152,
    0.6708180000000001,-0.72361,0.162458,1.0,0.6683384936921797,-0.727549561234357,0.1549041438986152,
    0.4253230000000001,-0.850654,0.3090109999999999,1.0,0.42532325551188366,-0.8506538075846909,0.30901169551076946,
    0.447211,-0.894428,9.999999999177334e-07,1.0,0.4551295869979919,-0.8904252124903946,6.877146626628624e-07,
    0.4253230000000001,-0.850654,0.3090109999999999,1.0,0.42532325551188366,-0.8506538075846909,0.30901169551076946,
    0.20318100000000006,-0.96795,0.14761800000000003,1.0,0.21095266289464853,-0.9654061618992498,0.15326420516420788,
    0.447211,-0.894428,9.999999999177334e-07,1.0,0.4551295869979919,-0.8904252124903946,6.877146626628624e-07,
    0.447211,-0.894428,9.999999999177334e-07,1.0,0.4551295869979919,-0.8904252124903946,6.877146626628624e-07,
    0.20318100000000006,-0.96795,0.14761800000000003,1.0,0.21095266289464853,-0.9654061618992498,0.15326420516420788,
    0.20318100000000006,-0.96795,-0.14761800000000003,1.0,0.21095286907952562,-0.9654060533326492,-0.15326460522832558,
    0.20318100000000006,-0.96795,0.14761800000000003,1.0,0.21095266289464853,-0.9654061618992498,0.15326420516420788,
    0.0,-1.0,0.0,1.0,-1.306012939612e-06,-0.9999999999991471,7.024692550196524e-18,
    0.20318100000000006,-0.96795,-0.14761800000000003,1.0,0.21095286907952562,-0.9654060533326492,-0.15326460522832558,
    -0.23282199999999997,-0.657519,0.7165629999999998,1.0,-0.23079124291012987,-0.6649730641972427,0.7103141742131627,
    -0.02963899999999997,-0.502302,0.8641839999999998,1.0,-0.019838689717257413,-0.5038192559913451,0.8635812548235572,
    -0.2763880000000001,-0.44721999999999995,0.850649,1.0,-0.27638775259514803,-0.44721995820039745,0.8506492339399584,
    -0.16245599999999993,-0.850654,0.49999499999999997,1.0,-0.16245708015289456,-0.8506538856343064,0.4999956639446509,
    0.05278999999999989,-0.723612,0.688185,1.0,0.05920723925994218,-0.7275515145351986,0.6834934502369095,
    -0.23282199999999997,-0.657519,0.7165629999999998,1.0,-0.23079124291012987,-0.6649730641972427,0.7103141742131627,
    -0.07760699999999998,-0.96795,0.23885299999999998,1.0,-0.08057675620781352,-0.9654060832357604,0.2479888723519962,
    0.13819899999999996,-0.894429,0.42532100000000006,1.0,0.1406455146287707,-0.8904254422627637,0.4328525972960891,
    -0.16245599999999993,-0.850654,0.49999499999999997,1.0,-0.16245708015289456,-0.8506538856343064,0.4999956639446509,
    -0.23282199999999997,-0.657519,0.7165629999999998,1.0,-0.23079124291012987,-0.6649730641972427,0.7103141742131627,
    0.05278999999999989,-0.723612,0.688185,1.0,0.05920723925994218,-0.7275515145351986,0.6834934502369095,
    -0.02963899999999997,-0.502302,0.8641839999999998,1.0,-0.019838689717257413,-0.5038192559913451,0.8635812548235572,
    0.05278999999999989,-0.723612,0.688185,1.0,0.05920723925994218,-0.7275515145351986,0.6834934502369095,
    0.262869,-0.525738,0.8090120000000001,1.0,0.26286888259023233,-0.5257372188438393,0.8090119450836976,
    -0.02963899999999997,-0.502302,0.8641839999999998,1.0,-0.019838689717257413,-0.5038192559913451,0.8635812548235572,
    -0.16245599999999993,-0.850654,0.49999499999999997,1.0,-0.16245708015289456,-0.8506538856343064,0.4999956639446509,
    0.13819899999999996,-0.894429,0.42532100000000006,1.0,0.1406455146287707,-0.8904254422627637,0.4328525972960891,
    0.05278999999999989,-0.723612,0.688185,1.0,0.05920723925994218,-0.7275515145351986,0.6834934502369095,
    0.13819899999999996,-0.894429,0.42532100000000006,1.0,0.1406455146287707,-0.8904254422627637,0.4328525972960891,
    0.36180499999999993,-0.723611,0.587779,1.0,0.3538549988818572,-0.7275505518078368,0.5877557607803032,
    0.05278999999999989,-0.723612,0.688185,1.0,0.05920723925994218,-0.7275515145351986,0.6834934502369095,
    0.05278999999999989,-0.723612,0.688185,1.0,0.05920723925994218,-0.7275515145351986,0.6834934502369095,
    0.36180499999999993,-0.723611,0.587779,1.0,0.3538549988818572,-0.7275505518078368,0.5877557607803032,
    0.262869,-0.525738,0.8090120000000001,1.0,0.26286888259023233,-0.5257372188438393,0.8090119450836976,
    0.36180499999999993,-0.723611,0.587779,1.0,0.3538549988818572,-0.7275505518078368,0.5877557607803032,
    0.531941,-0.502302,0.6817120000000001,1.0,0.5236580515960895,-0.5038185204865161,0.6869855481837774,
    0.262869,-0.525738,0.8090120000000001,1.0,0.26286888259023233,-0.5257372188438393,0.8090119450836976,
    -0.07760699999999998,-0.96795,0.23885299999999998,1.0,-0.08057675620781352,-0.9654060832357604,0.2479888723519962,
    0.20318100000000006,-0.96795,0.14761800000000003,1.0,0.21095266289464853,-0.9654061618992498,0.15326420516420788,
    0.13819899999999996,-0.894429,0.42532100000000006,1.0,0.1406455146287707,-0.8904254422627637,0.4328525972960891,
    0.20318100000000006,-0.96795,0.14761800000000003,1.0,0.21095266289464853,-0.9654061618992498,0.15326420516420788,
    0.4253230000000001,-0.850654,0.3090109999999999,1.0,0.42532325551188366,-0.8506538075846909,0.30901169551076946,
    0.13819899999999996,-0.894429,0.42532100000000006,1.0,0.1406455146287707,-0.8904254422627637,0.4328525972960891,
    0.13819899999999996,-0.894429,0.42532100000000006,1.0,0.1406455146287707,-0.8904254422627637,0.4328525972960891,
    0.4253230000000001,-0.850654,0.3090109999999999,1.0,0.42532325551188366,-0.8506538075846909,0.30901169551076946,
    0.36180499999999993,-0.723611,0.587779,1.0,0.3538549988818572,-0.7275505518078368,0.5877557607803032,
    0.4253230000000001,-0.850654,0.3090109999999999,1.0,0.42532325551188366,-0.8506538075846909,0.30901169551076946,
    0.6095470000000001,-0.657519,0.4428559999999999,1.0,0.6042310408008547,-0.6649722006723842,0.43899524105124693,
    0.36180499999999993,-0.723611,0.587779,1.0,0.3538549988818572,-0.7275505518078368,0.5877557607803032,
    0.36180499999999993,-0.723611,0.587779,1.0,0.3538549988818572,-0.7275505518078368,0.5877557607803032,
    0.6095470000000001,-0.657519,0.4428559999999999,1.0,0.6042310408008547,-0.6649722006723842,0.43899524105124693,
    0.531941,-0.502302,0.6817120000000001,1.0,0.5236580515960895,-0.5038185204865161,0.6869855481837774,
    0.6095470000000001,-0.657519,0.4428559999999999,1.0,0.6042310408008547,-0.6649722006723842,0.43899524105124693,
    0.7236069999999999,-0.44721999999999995,0.525725,1.0,0.7236067216830413,-0.4472196513214831,0.5257260653677089,
    0.531941,-0.502302,0.6817120000000001,1.0,0.5236580515960895,-0.5038185204865161,0.6869855481837774]);

}