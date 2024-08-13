//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda AND
// Chapter 2: ColoredPoints.js (c) 2012 matsuda
//
// merged and modified to became:
//
// ControlMulti.js for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

//		--converted from 2D to 4D (x,y,z,w) vertices
//		--demonstrate how to keep & use MULTIPLE colored shapes 
//			in just one Vertex Buffer Object(VBO).
//		--demonstrate several different user I/O methods: 
//				--Webpage pushbuttons 
//				--Webpage edit-box text, and 'innerHTML' for text display
//				--Mouse click & drag within our WebGL-hosting 'canvas'
//				--Keyboard input: alphanumeric + 'special' keys (arrows, etc)
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 

`uniform mat4 u_ModelMatrix;
 attribute vec4 a_Position;
 attribute vec4 a_Color;
 varying vec4 v_Color;
 void main() {
   gl_Position = u_ModelMatrix * a_Position;
   gl_PointSize = 10.0; 
   v_Color = a_Color;
 }`;

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
`//  #ifdef GL_ES
precision mediump float;
//  '#endif GL_ES
varying vec4 v_Color;
void main() {
  gl_FragColor = v_Color;
}`;

// Global Variables
// =========================
// Use globals to avoid needlessly complex & tiresome function argument lists,
// and for user-adjustable controls.
// For example, the WebGL rendering context 'gl' gets used in almost every fcn;
// requiring 'gl' as an argument won't give us any added 'encapsulation'; make
// it global.  Later, if the # of global vars grows too large, we can put them 
// into one (or just a few) sensible global objects for better modularity.
//------------For WebGL-----------------------------------------------
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var canvas = document.getElementById('webgl');     
                  // our HTML-5 canvas object that uses 'gl' for drawing.
                  
// ----------For tetrahedron & its matrix---------------------------------
var vertsMax = 0;                 // number of vertices held in the VBO 
                                    // (global: replaces local 'n' variable)
var modelMatrix = new Matrix4();  // Construct 4x4 matrix; contents get sent
                                    // to the GPU/Shaders as a 'uniform' var.
var modelMatLoc;                  // that uniform's location in the GPU

//------------For Animation---------------------------------------------
var isRun = true;                 // run/stop for animation; used in tick().
var lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 
                                    // in milliseconds; used by 'animate()' fcn 
                                    // (now called 'timerAll()' ) to find time
                                    // elapsed since last on-screen image.
var rot_angle = 0;                  // initial rotation angle
var ANGLE_STEP = 100.0;           // rotation speed, in degrees/second 

var angle02 = 0;                  // initial rotation angle
var angle02Rate = 200;           // rotation speed, in degrees/second 

var flipper_angle = 0;                  // initial rotation angle
var flipper_angleRate = 100.0;

var translate = 0;
var translateRate = 100;

//------------For mouse click-and-drag: -------------------------------
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0; 
var digits=4;			// DIAGNOSTICS: # of digits to print in console.log (
									//    console.log('xVal:', xVal.toFixed(digits)); // print 5 digits
								 

function main() {
//==============================================================================
/*REPLACED THIS: 
// Retrieve <canvas> element:
 var canvas = document.getElementById('webgl'); 
//with global variable 'canvas' declared & set above.
*/
  
  // Get gl, the rendering context for WebGL, from our 'canvas' object
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // THE 'REVERSED DEPTH' PROBLEM:=======================================
    // IF we don't transform our vertices by a 3D Camera Projection Matrix
    // (and we don't -- not until Project B) then the GPU will compute reversed 
    // depth values: depth==0 for vertex z == -1; depth==1 for vertex z==-1.
    // To correct the 'REVERSED DEPTH' problem, we will
    // reverse the depth-buffer's usage of computed depth values, like this:
  gl.enable(gl.DEPTH_TEST); // enabled by default, but let's be SURE.
  gl.clearDepth(0.0); // each time we 'clear' our depth buffer, set all
    // pixel depths to 0.0 (1.0 is DEFAULT)
  gl.depthFunc(gl.GREATER); // (gl.LESS is DEFAULT; reverse it!)
    // draw a pixel only if its depth value is GREATER
    // than the depth buffer's stored value.
//=====================================================================

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Initialize a Vertex Buffer in the graphics system to hold our vertices
  maxVerts = initVertexBuffer(gl);  
  if (maxVerts < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

	// Register the Keyboard & Mouse Event-handlers------------------------------
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system create a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
  // KEYBOARD:
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
	window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function.  The 'false' 
	// arg (default) ensures myKeyDown() call in 'bubbling', not 'capture' stage)
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
	// Called when user RELEASES the key.  Now rarely used...
	//window.addEventListener("keypress", myKeyPress, false);

	// MOUSE:
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
	
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, try:
	// canvasID.addEventListener("click", myCanvasClick);
  //
	// Wait wait wait -- these 'mouse listeners' just NAME the function called 
	// when the event occurs!   How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	// END Keyboard & Mouse Event-Handlers---------------------------------------
	
  // Specify the color for clearing <canvas>
  gl.clearColor(0.4, 0.2, 0.5, 0.8);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
	//gl.depthFunc(gl.LESS);
	//gl.enable(gl.DEPTH_TEST); 

  // Get handle to graphics system's storage location of u_ModelMatrix
  modelMatLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!modelMatLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
/* REPLACED by global var 'ModelMatrix' (declared, constructed at top)
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
*/
/* REPLACED by global rot_angle variable (declared at top)
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;
*/

  // ANIMATION: create 'tick' variable whose value is this function:
  //----------------- 
  var tick = function() {
    animate();   // Update the rotation angle
    draw();   // Draw all parts
//    console.log('rot_angle=',rot_angle.toFixed(digits)); // put text in console.

//	Show some always-changing text in the webpage :  
//		--find the HTML element called 'CurAngleDisplay' in our HTML page,
//			 	(a <div> element placed just after our WebGL 'canvas' element)
// 				and replace it's internal HTML commands (if any) with some
//				on-screen text that reports our current angle value:
//		--HINT: don't confuse 'getElementByID() and 'getElementById()
		document.getElementById('CurAngleDisplay').innerHTML= 
			'rot_angle= '+rot_angle.toFixed(digits);
		// Also display our current mouse-dragging state:
		document.getElementById('Mouse').innerHTML=
			'Mouse Drag totals (CVV coords):\t'+
			xMdragTot.toFixed(7)+', \t'+yMdragTot.toFixed(digits);	
		//--------------------------------
    requestAnimationFrame(tick, canvas);   
    									// Request that the browser re-draw the webpage
    									// (causes webpage to endlessly re-draw itself)
  };
  tick();							// start (and continue) animation: draw current image
	
}

function initVertexBuffer() {
//==============================================================================
// NOTE!  'gl' is now a global variable -- no longer needed as fcn argument!

	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);						 

  var colorShapes = new Float32Array([
  // Vertex coordinates(x,y,z,w) and color (R,G,B) for a color tetrahedron:
	//		Apex on +z axis; equilateral triangle base at z=0
/*	Nodes:
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 (apex, +z axis;  white)
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 (base: lower rt; red)
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2 (base: +y axis;  grn)
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3 (base:lower lft; blue)

*/
		// Face 0: (left side)  
     0.0,  0.0, sq2, 1.0,		-1.0, 1.0,	1.0,	// Node 0
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1
     0.0,  1.0, 0.0, 1.0,  		1.0,  1.0,  0.0,	// Node 2
		// Face 1: (right side)
	 0.0,  0.0, sq2, 1.0,		1.0, 1.0,	1.0,	// Node 0
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  1.0,	// Node 2
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
    	// Face 2: (lower side)
	 0.0,  0.0, sq2, 1.0,		1.0,  0.0,	1.0,	// Node 0 
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  1.0, 	// Node 1 
     	// Face 3: (base side)  
    -c30, -0.5,  0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     0.0,  1.0,  0.0, 1.0,  	1.0,  0.0,  0.0,	// Node 2
     c30, -0.5,  0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1

	
		// +x face: RED
		0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 0.0,	// Node 3
		0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 2
		1.0,  0.0,  0.0, 0.6,	  1.0, 1.0, 1.0,  // Node 4
		
		0.5,  0.5,  0.5, 1.0,	  1.0, 0.0, 0.0,	// Node 4
		0.5, -0.5,  0.5, 1.0,	  1.0, 1.0, 1.0,	// Node 7
		1.0,  0.0,  0.0, 0.6,	  1.0, 1.0, 1.0,	// Node 3

		0.5,  0.5,  0.5, 1.0,     1.0, 0.0, 0.0,
		0.5,  0.5, -0.5, 1.0, 	  1.0, 1.0, 1.0,
		1.0,  0.0,  0.0, 0.6,	  1.0, 1.0, 0.0,

		0.5, -0.5,  0.5, 1.0,     1.0, 1.0, 1.0,
		0.5, -0.5, -0.5, 1.0, 	  1.0, 1.0, 0.0,
		1.0,  0.0,  0.0, 0.6,	  1.0, 1.0, 1.0,
		
   
		   // +y face: GREEN
	   -0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 1
	   -0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 5
	   	0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 4
   
		0.5,  0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 4
		0.5,  0.5, -0.5, 1.0,	  0.0, 0.0, 1.0,	// Node 2 
	   -0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 0.0,	// Node 1
   
		   // +z face: BLUE
	   -0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 5
	   -0.5, -0.5,  0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 6
	    0.5, -0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 7
   
		0.5, -0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 7
		0.5,  0.5,  0.5, 1.0,	  1.0, 0.0, 0.0,	// Node 4
	   -0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 5
   
		   // -x face: CYAN
	   -0.5, -0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 6	
	   -0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 5 
	   -1.0,  0.0,  0.0, 1.0,	  0.0, 1.0, 1.0,	// Node 1
	   
	   -0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 1
	   -0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 0  
	   -1.0,  0.0,  0.0, 1.0,	  1.0, 0.0, 1.0,	// Node 6
	   
	   -0.5,  0.5,  0.5, 1.0,     1.0, 1.0, 0.0,
	   -0.5,  0.5, -0.5, 1.0, 	  0.0, 1.0, 1.0,
	   -1.0,  0.0,  0.0, 1.0,	  1.0, 1.0, 1.0,

	   -0.5, -0.5,  0.5, 1.0,     1.0, 0.0, 1.0,
	   -0.5, -0.5, -0.5, 1.0, 	  1.0, 0.0, 1.0,
	   -1.0,  0.0,  0.0, 1.0,	  0.0, 1.0, 1.0,  
	   
		   // -y face: MAGENTA
		0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 0.0,	// Node 3
		0.5, -0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 7
	   -0.5, -0.5,  0.5, 1.0,	  0.0, 0.0, 1.0,	// Node 6
   
	   -0.5, -0.5,  0.5, 1.0,	  0.0, 0.0, 1.0,	// Node 6
	   -0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 0.0,	// Node 0
	    0.5, -0.5, -0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 3
   
		// -z face: YELLOW
		0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 2
		0.5, -0.5, -0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 3
	   -0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 0		
   
	   -0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 0
	   -0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 1
	    0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 2

		//TOP SHAPE
		0.0,  0.0, sq2, 1.0,		1.0, 1.0,	1.0,	// Node 0
     	c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1
    	c30,0.75,sq2,1.0,		1.0, 0.0, 1.0,

		0.0,  0.0, sq2, 1.0,		1.0, 1.0,	1.0,	// Node 0
		0.0,  1.0, 0.0, 1.0, 		1.0,  1.0,  1.0, 	// Node 1
    	c30,0.75,sq2,1.0,		1.0, 0.0, 1.0,

		0.0,  1.0, 0.0, 1.0,		0.0, 1.0,	1.0,	// Node 0
     	c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1
    	c30,0.75,sq2,1.0,		1.0, 0.0, 1.0,

			

		// Face 1: (right side)
		 0.0,  0.0, sq2, 1.0,		1.0, 1.0,	1.0,	// Node 0
    	 0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
    	-c30, 0.75, sq2, 1.0, 	0.0,  0.5,  1.0, 	// Node 3

		0.0,  0.0, sq2, 1.0,		1.0, 1.0,	1.0,	// Node 0
    	-c30, -0.5, 0.0, 1.0,  		1.0,  0.5,  0.0,	// Node 2
    	-c30, 0.75, sq2, 1.0,	0.0,  0.5,  1.0, 	// Node 3

		-c30, -0.5, 0.0, 1.0,		1.0, 0.5,	0.0,	// Node 0
    	 0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
		 -c30, 0.75, sq2, 1.0,	0.0,  0.5,  1.0, 	// Node 3

    	// Face 2: (lower side)
		 0.0,  0.0, sq2, 1.0,		1.0,  1.0,	1.0,	// Node 0 
   	 	-c30, -0.5, 0.0, 1.0, 		1.0,  0.5,  0.0, 	// Node 3
  	     0.0, -1.0, sq2, 1.0, 	0.0,  0.0,  1.0, 	// Node 1 

		0.0,  0.0, sq2, 1.0,		1.0,  1.0,	1.0,	// Node 0 
		c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  1.0, 	// Node 3
		0.0, -1.0, sq2, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 

		c30, -0.5, 0.0, 1.0,		0.0,  1.0,	0.0,	// Node 0 
		-c30, -0.5, 0.0, 1.0, 		1.0,  0.5,  0.0, 	// Node 3
		0.0, -1.0, sq2, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 
     	// Face 3: (base side)  
    	-c30, -0.5,  0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     	0.0,  1.0,  0.0, 1.0,  	1.0,  1.0,  0.0,	// Node 2
     	0.0, 0.5,  -0.5, 1.0, 		0.5,  0.75,  0.2, 	// Node 1

		-c30, -0.5,  0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
		c30, -0.5,  0.0, 1.0,  	1.0,  1.0,  1.0,	// Node 2
		0.0, 0.5,  -0.5, 1.0, 		0.5,  0.75,  0.2, 	// Node 1

		 c30, -0.5,  0.0, 1.0, 		1.0,  1.0,  1.0, 	// Node 3
     	0.0,  1.0,  0.0, 1.0,  	1.0,  0.0,  0.0,	// Node 2
     	0.0, 0.5,  -0.5, 1.0, 		0.5,  0.75,  0.2, 	// Node 1

  ]);
  vertsMax = 104;		// 12 tetrahedron vertices + 36 cube verticies + 12 + 12 + 18
  								// we can also draw any subset of these we wish,
  								// such as the last 3 vertices.(onscreen at upper right)
	
  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return vertsMax;

/* REMOVED -- global 'vertsMax' means we don't need it anymore
  return nn;
*/
}

function draw() {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
// Great question from student:
// "?How can I get the screen-clearing color (or any of the many other state
//		variables of OpenGL)?  'glGet()' doesn't seem to work..."
// ANSWER: from WebGL specification page: 
//							https://www.khronos.org/registry/webgl/specs/1.0/
//	search for 'glGet()' (ctrl-f) yields:
//  OpenGL's 'glGet()' becomes WebGL's 'getParameter()'

	clrColr = new Float32Array(4);
	clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
	// console.log("clear value:", clrColr);

  modelMatrix.setTranslate(0.4, 0.4, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV.
	pushMatrix(modelMatrix);
  		modelMatrix.scale(0.2, 0.2, 0.2);	//draw mouse controlled triangle
		
  
							// rotate on axis perpendicular to the mouse-drag direction:
		var dist = Math.sqrt(xMdragTot*xMdragTot + yMdragTot*yMdragTot);
							// why add 0.001? avoids divide-by-zero in next statement
							// in cases where user didn't drag the mouse.)
		modelMatrix.rotate(dist*100.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);
				// Acts weirdly as rotation amounts get far from 0 degrees.
				// ?why does intuition fail so quickly here?
		pushMatrix(modelMatrix);
			modelMatrix.rotate(flipper_angle, 0,1,0)
  			gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);
  			// Draw only the last 2 triangles: start at vertex 6, draw 6 vertices
  			gl.drawArrays(gl.TRIANGLES, 0,12);
		modelMatrix = popMatrix();

		modelMatrix.translate(0, 1.35, -0.35);
		modelMatrix.rotate(180, 0,0,1)
		modelMatrix.rotate(45, 1,0,0)
		modelMatrix.rotate(flipper_angle, 0,1,0)
		modelMatrix.scale(1.0, 0.5, 0.5);
		gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);
  
		gl.drawArrays(gl.TRIANGLES, 60,36);
	modelMatrix = popMatrix();

	pushMatrix(modelMatrix); // shark
		modelMatrix.translate(-0.5, -0.5, 0.0);
		modelMatrix.scale(0.2, 0.2, 0.2);
		// Make it smaller:
		modelMatrix.rotate(rot_angle, 1, 0, 1);  // Spin on XY diagonal axis
		// DRAW CUBE:		Use ths matrix to transform & draw
		//						the second set of vertices stored in our VBO:
		modelMatrix.translate(translate, translate * 0.2, 2);
		
		gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);
		// Draw just the first set of vertices: start at vertex SHAPE_0_SIZE
		gl.drawArrays(gl.TRIANGLES, 12, 48);    
		
		pushMatrix(modelMatrix);
	
			
		
			modelMatrix.scale(0.5, 0.5, 0.5);
			
			modelMatrix.rotate(-90,0,0,1);
			modelMatrix.rotate(-45,0,1,0);
			modelMatrix.translate(0,-3, 0);

			modelMatrix.rotate(rot_angle * 8, 0, 1, 0);

			gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);

			gl.drawArrays(gl.TRIANGLES, 0, 10);

		modelMatrix = popMatrix();
		pushMatrix(modelMatrix);
			
	
			modelMatrix.translate(0,-0.2, 1);
	
			modelMatrix.rotate(-40,0,1,0);
			modelMatrix.rotate(-50,1,0,0);

			modelMatrix.translate(-0.5,0, 0);
	
			modelMatrix.rotate(-angle02 * 2, 0, 1, 0);
			
			modelMatrix.scale(0.4, 0.4, 0.4);

			gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);

			gl.drawArrays(gl.TRIANGLES, 0, 4);
		modelMatrix = popMatrix();
		pushMatrix(modelMatrix);
			
	
			modelMatrix.translate(-0.2,-0.3, -0.65);
	
			modelMatrix.rotate(50,0,1,0);
			modelMatrix.rotate(100,1,0,0);

			modelMatrix.translate(0,0, -0.2);
	
			modelMatrix.rotate(-angle02 * 4, 0, 1, 0);
			
			modelMatrix.scale(0.4, 0.4, 0.4);

			gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);

			gl.drawArrays(gl.TRIANGLES, 0, 4);
	//	modelMatrix = popMatrix();
		
	//modelMatrix = popMatrix();
}

// Last time that this function was called:  (used for animation timing)
var last = Date.now();


//CHECK THIS FUNCTION 
function animate() {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - last;
  last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +120 and -85 degrees:
//  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
//  if(angle <  -85.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  rot_angle = rot_angle + (ANGLE_STEP * elapsed) / 1000.0;
  if(rot_angle > 180.0) rot_angle = rot_angle - 360.0;
  if(rot_angle <-180.0) rot_angle = rot_angle + 360.0;

  angle02 = angle02 + (angle02Rate * elapsed) / 1000.0;
  if(angle02 > 180.0) angle02 = angle02 - 360.0;
  if(angle02 <-180.0) angle02 = angle02 + 360.0;

  flipper_angle = flipper_angle + (flipper_angleRate * elapsed) / 1000.0;
  if(flipper_angle > 180.0) flipper_angle = flipper_angle - 360.0;
  if(flipper_angle <-180.0) flipper_angle = flipper_angle + 360.0;

  translate = translate + (translateRate * elapsed) / 1000.0;
  if(translate > 5) translateRate = -5;
  if(translate <-5) translateRate = 5;
  
  if(angle02 > 15.0 && angle02Rate > 0) angle02Rate *= -1.0;
  if(angle02 < 0.0  && angle02Rate < 0) angle02Rate *= -1.0;
}

//==================HTML Button Callbacks======================

function angleSubmit() {
// Called when user presses 'Submit' button on our webpage
//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
//	the HTML 'input' element with id='usrAngle'.  Within that
//	element you'll find a 'button' element that calls this fcn.

// Read HTML edit-box contents:
	var UsrTxt = document.getElementById('usrAngle').value;	
// Display what we read from the edit-box: use it to fill up
// the HTML 'div' element with id='editBoxOut':
  document.getElementById('EditBoxOut').innerHTML ='You Typed: '+UsrTxt;

  //FIX THIS
  console.log('angleSubmit: UsrTxt:', UsrTxt); // print in console, and
  rot_angle = parseFloat(UsrTxt);     // convert string to float number 
};

function clearDrag() {
// Called when user presses 'Clear' button in our webpage
	xMdragTot = 0.0;
	yMdragTot = 0.0;
}

function spinUp() {
// Called when user presses the 'Spin >>' button on our webpage.
// ?HOW? Look in the HTML file (e.g. ControlMulti.html) to find
// the HTML 'button' element with onclick='spinUp()'.
  ANGLE_STEP += 25; 
}

function spinDown() {
// Called when user presses the 'Spin <<' button
 ANGLE_STEP -= 25; 
}

function runStop() {
// Called when user presses the 'Run/Stop' button
  if(ANGLE_STEP*ANGLE_STEP > 1) {  // if nonzero rate,
    myTmp = ANGLE_STEP;  // store the current rate,
    ANGLE_STEP = 0;      // and set to zero.
  }				// TODO: erase comments here 
  else {    // but if rate is zero,
  	ANGLE_STEP = myTmp;  // use the stored rate.
  }
}

//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev, gl) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
	// report on webpage
	document.getElementById('MouseAtResult').innerHTML =  //FIX THIS
	  'Mouse At: '+x.toFixed(digits)+', '+y.toFixed(digits);
};


function myMouseMove(ev, gl) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);		// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//									-1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);			// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	// Report new mouse position & how far we moved on webpage:
	document.getElementById('MouseAtResult').innerHTML = 
	  'Mouse At: '+x.toFixed(digits)+', '+y.toFixed(digits);
	document.getElementById('MouseDragResult').innerHTML =   //FIX THIS
	  'Mouse Drag: '+(x - xMclik).toFixed(digits)+', ' 
	  					  +(y - yMclik).toFixed(digits);

	xMclik = x;											// Make next drag-measurement from here.
	yMclik = y;
};

function myMouseUp(ev, gl) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords):\n\t xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):\n\t x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
	// Report new mouse position:
	document.getElementById('MouseAtResult').innerHTML = 
	  'Mouse At: '+x.toFixed(digits)+', '+y.toFixed(digits);
	console.log('myMouseUp: xMdragTot,yMdragTot =',
		xMdragTot.toFixed(digits),',\t',yMdragTot.toFixed(digits));
		console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
};



function myMouseClick(ev) {
//=============================================================================
// Called when user completes a mouse-button single-click event 
// (e.g. mouse-button pressed down, then released)
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouseClick() on button: ", ev.button); 
}	

	

function myKeyDown(kev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 2/2019:  use kev.key and kev.code instead.
//
// Report EVERYTHING in console:
  console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);

// and report EVERYTHING on webpage:
	document.getElementById('KeyDownResult').innerHTML = ''; // clear old results
  document.getElementById('KeyModResult' ).innerHTML = ''; 
  // key details:
  document.getElementById('KeyModResult' ).innerHTML = 
        "   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
    "<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
    "<br>--kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;
 
	switch(kev.code) {
		case "KeyP":
			console.log("Pause/unPause!\n");                // print on console,
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found p/P key. Pause/unPause!';   // print on webpage
			if(isRun==true) {
			  isRun = false;    // STOP animation
			  }
			else {
			  isRun = true;     // RESTART animation
			  tick();
			  }
			break;
		
		//----------------Arrow keys------------------------
		case "ArrowLeft": 	
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Left Arrow='+kev.keyCode;
			break;
		case "ArrowRight":
			console.log('right-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():Right Arrow:keyCode='+kev.keyCode;
  		break;
		case "ArrowUp":		
			console.log('   up-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():   Up Arrow:keyCode='+kev.keyCode;
			 //var temp = translate;
			 var temp2 = translateRate;
			  //translate = 0;
			  translateRate = 5;
			  
			  break;
		case "ArrowDown":
			console.log(' down-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Down Arrow:keyCode='+kev.keyCode;
			 // translate = temp;
			  translateRate = 0;
  		break;	
    default:
      console.log("UNUSED!");
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): UNUSED!';
      break;
	}
}

/*
function myKeyDown(ev) {
	//===============================================================================
	// Called when user presses down ANY key on the keyboard, and captures the 
	// keyboard's scancode or keycode(varies for different countries and alphabets).
	//  CAUTION: You may wish to avoid 'keydown' and 'keyup' events: if you DON'T 
	// need to sense non-ASCII keys (arrow keys, function keys, pgUp, pgDn, Ins, 
	// Del, etc), then just use the 'keypress' event instead.
	//	 The 'keypress' event captures the combined effects of alphanumeric keys and // the SHIFT, ALT, and CTRL modifiers.  It translates pressed keys into ordinary
	// ASCII codes; you'll get the ASCII code for uppercase 'S' if you hold shift 
	// and press the 's' key.
	// For a light, easy explanation of keyboard events in JavaScript,
	// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
	// For a thorough explanation of the messy way JavaScript handles keyboard events
	// see:    http://javascript.info/tutorial/keyboard-events
	//
	
		switch(ev.keyCode) {			// keycodes !=ASCII, but are very consistent for 
		//	nearly all non-alphanumeric keys for nearly all keyboards in all countries.
			case 37:		// left-arrow key
				// print in console:
				console.log(' left-arrow.');
				// and print on webpage in the <div> element with id='Result':
			  document.getElementById('Result').innerHTML =
				  ' Left Arrow:keyCode='+ev.keyCode;
				break;
			case 38:		// up-arrow key
				console.log('   up-arrow.');
			  document.getElementById('Result').innerHTML =
				  '   Up Arrow:keyCode='+ev.keyCode;
				  'myKeyDown():   Up Arrow:keyCode='+kev.keyCode;
			 	 translateRate = 5;
				break;
			case 39:		// right-arrow key
				console.log('right-arrow.');
			  document.getElementById('Result').innerHTML =
				  'Right Arrow:keyCode='+ev.keyCode;
			  break;
			case 40:		// down-arrow key
				console.log(' down-arrow.');
			  document.getElementById('Result').innerHTML =
				  ' Down Arrow:keyCode='+ev.keyCode;
				  'myKeyDown(): Down Arrow:keyCode='+kev.keyCode;
			
			  translateRate = 0;
			  break;
			default:
				console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);
			  document.getElementById('Result').innerHTML =
				  'myKeyDown()--keyCode='+ev.keyCode;
				break;


	
		}
	}
*/

function myKeyUp(ev) {
	//===============================================================================
	// Called when user releases ANY key on the keyboard; captures scancodes well
	
		console.log('myKeyUp()--keyCode='+ev.keyCode+' released.');
		//console.log('THIS WORKS');
	}
