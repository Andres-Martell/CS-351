//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//==============================================================================
//
// LookAtTrianglesWithKey_ViewVolume.js (c) 2012 matsuda
//
//  MODIFIED 2014.02.19 J. Tumblin to 
//		--demonstrate multiple viewports (see 'draw()' function at bottom of file)
//		--draw ground plane in the 3D scene:  makeGroundPlane()

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_modelMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_modelMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';
  
var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex	
// (x,y,z)position + (r,g,b)color

var currentAngle = 0.0;
var ANGLE_STEP = 75.0;

//rotangle
var rot_angle = 0;                  // initial rotation angle
var rot_angleRate = 60.0;           // rotation speed, in degrees/second 


//flipper
var flipper_angle = 0;                  // initial rotation angle
var flipper_angleRate = 100.0; 

var translate = 0;
var translateRate = 5;

var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
var sq2	= Math.sqrt(2.0);

// Mouse click and drag
var isDrag=false;
var xMclik=0.0;
var yMclik=0.0;   
var xMdragTot=0.0;
var yMdragTot=0.0; 

// View & Projection
var eyeX = 0.0;
var eyeY = 5.0;
var eyeZ = 1.0;
var atX = 0.0;
var atY = 0.0;
var atZ = 0.0;
var theta = 0.0;  // turn camera horizontally to angle theta
var r = eyeY-atY;  // radius of camera cylinder
var tilt = 0.0;


function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }


   // Initialize shaders
   if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }


  	
	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);			 // WebGL default setting:
	gl.enable(gl.DEPTH_TEST); 
	
  // Set the vertex coordinates and color (the blue triangle is in the front)
  var n = initVertexBuffers(gl);


  if (n < 0) {
    console.log('Failed to specify the vertex information');
    return;
  }

  modelMatrix = new Matrix4();

  qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
  qTot = new Quaternion(0,0,0,1);
  quatMatrix = new Matrix4();  // rotation matrix
  // Specify the color for clearing <canvas>
  //gl.clearColor(0.25, 0.2, 0.25, 1.0);
  gl.clearColor(0.1, 0.1, 0.1, 1.0);

 
 

   // Get the graphics system storage locations of
  // the uniform variables u_modelMatrix.
  u_modelMatrix = gl.getUniformLocation(gl.program, 'u_modelMatrix');
  gl.uniformMatrix4fv(u_modelMatrix, false, modelMatrix.elements);  // 2nd para is Transpose. Must be false in WebGL.

  //var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix'); 
  if (!u_modelMatrix) { 
    console.log('Failed to get u_modelmatrix');
    return;
  }
 
 // Register the event handler to be called on key press
 document.onkeydown= function(ev){keydown(ev, gl, u_modelMatrix, modelMatrix); };
 canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
           // when user's mouse button goes down, call mouseDown() function
 canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };
                     // when the mouse moves, call mouseMove() function					
 canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};

  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    // console.log(currentAngle);
    drawResize();
    requestAnimationFrame(tick, canvas);   
  };
  tick();	


}

function makeCylinder() {
  //==============================================================================
  // Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
  // 'stepped spiral' design described in notes.
  // Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
  //
   var ctrColr = new Float32Array([0.2, 0.2, 0.2]);	// dark gray
   var topColr = new Float32Array([0.4, 0.7, 0.4]);	// light green
   var botColr = new Float32Array([0.5, 0.5, 1.0]);	// light blue
   var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
   var botRadius = 1.6;		// radius of bottom of cylinder (top always 1.0)
   
   // Create a (global) array to hold this cylinder's vertices;
   cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
                      // # of vertices * # of elements needed to store them. 
  
    // Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
    // v counts vertices: j counts array elements (vertices * elements per vertex)
    for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
      // skip the first vertex--not needed.
      if(v%2==0)
      {				// put even# vertices at center of cylinder's top cap:
        cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
        cylVerts[j+1] = 0.0;	
        cylVerts[j+2] = 1.0; 
        cylVerts[j+3] = 1.0;			// r,g,b = topColr[]
        cylVerts[j+4]=ctrColr[0]; 
        cylVerts[j+5]=ctrColr[1]; 
        cylVerts[j+6]=ctrColr[2];
      }
      else { 	// put odd# vertices around the top cap's outer edge;
              // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
              // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
        cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);			// x
        cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);			// y
        //	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
        //	 can simplify cos(2*PI * (v-1)/(2*capVerts))
        cylVerts[j+2] = 1.0;	// z
        cylVerts[j+3] = 1.0;	// w.
        // r,g,b = topColr[]
        cylVerts[j+4]=topColr[0]; 
        cylVerts[j+5]=topColr[1]; 
        cylVerts[j+6]=topColr[2];			
      }
    }
    // Create the cylinder side walls, made of 2*capVerts vertices.
    // v counts vertices within the wall; j continues to count array elements
    for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
      if(v%2==0)	// position all even# vertices along top cap:
      {		
          cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
          cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
          cylVerts[j+2] = 1.0;	// z
          cylVerts[j+3] = 1.0;	// w.
          // r,g,b = topColr[]
          cylVerts[j+4]=topColr[0]; 
          cylVerts[j+5]=topColr[1]; 
          cylVerts[j+6]=topColr[2];			
      }
      else		// position all odd# vertices along the bottom cap:
      {
          cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
          cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
          cylVerts[j+2] =-1.0;	// z
          cylVerts[j+3] = 1.0;	// w.
          // r,g,b = topColr[]
          cylVerts[j+4]=botColr[0]; 
          cylVerts[j+5]=botColr[1]; 
          cylVerts[j+6]=botColr[2];			
      }
    }
    // Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
    // v counts the vertices in the cap; j continues to count array elements
    for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
      if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
        cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
        cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
        cylVerts[j+2] =-1.0;	// z
        cylVerts[j+3] = 1.0;	// w.
        // r,g,b = topColr[]
        cylVerts[j+4]=botColr[0]; 
        cylVerts[j+5]=botColr[1]; 
        cylVerts[j+6]=botColr[2];		
      }
      else {				// position odd#'d vertices at center of the bottom cap:
        cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
        cylVerts[j+1] = 0.0;	
        cylVerts[j+2] =-1.0; 
        cylVerts[j+3] = 1.0;			// r,g,b = botColr[]
        cylVerts[j+4]=botColr[0]; 
        cylVerts[j+5]=botColr[1]; 
        cylVerts[j+6]=botColr[2];
      }
    }
  }
  
  function makeSphere() {
  //==============================================================================
  // Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
  // equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
  // and connect them as a 'stepped spiral' design (see makeCylinder) to build the
  // sphere from one triangle strip.
    var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
                        // (choose odd # or prime# to avoid accidental symmetry)
    var sliceVerts	= 27;	// # of vertices around the top edge of the slice
                        // (same number of vertices on bottom of slice, too)
    var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
    var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
    var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
    var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.
  
    // Create a (global) array to hold this sphere's vertices:
    sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
                      // # of vertices * # of elements needed to store them. 
                      // each slice requires 2*sliceVerts vertices except 1st and
                      // last ones, which require only 2*sliceVerts-1.
                      
    // Create dome-shaped top slice of sphere at z=+1
    // s counts slices; v counts vertices; 
    // j counts array elements (vertices * elements per vertex)
    var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
    var sin0 = 0.0;
    var cos1 = 0.0;
    var sin1 = 0.0;	
    var j = 0;							// initialize our array index
    var isLast = 0;
    var isFirst = 1;
    for(s=0; s<slices; s++) {	// for each slice of the sphere,
      // find sines & cosines for top and bottom of this slice
      if(s==0) {
        isFirst = 1;	// skip 1st vertex of 1st slice.
        cos0 = 1.0; 	// initialize: start at north pole.
        sin0 = 0.0;
      }
      else {					// otherwise, new top edge == old bottom edge
        isFirst = 0;	
        cos0 = cos1;
        sin0 = sin1;
      }								// & compute sine,cosine for new bottom edge.
      cos1 = Math.cos((s+1)*sliceAngle);
      sin1 = Math.sin((s+1)*sliceAngle);
      // go around the entire slice, generating TRIANGLE_STRIP verts
      // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
      if(s==slices-1) isLast=1;	// skip last vertex of last slice.
      for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
        if(v%2==0)
        {				// put even# vertices at the the slice's top edge
                // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
                // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
          sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
          sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
          sphVerts[j+2] = cos0;		
          sphVerts[j+3] = 1.0;			
        }
        else { 	// put odd# vertices around the slice's lower edge;
                // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
          sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
          sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
          sphVerts[j+2] = cos1;																				// z
          sphVerts[j+3] = 1.0;																				// w.		
        }
        if(s==0) {	// finally, set some interesting colors for vertices:
          sphVerts[j+4]=topColr[0]; 
          sphVerts[j+5]=topColr[1]; 
          sphVerts[j+6]=topColr[2];	
          }
        else if(s==slices-1) {
          sphVerts[j+4]=botColr[0]; 
          sphVerts[j+5]=botColr[1]; 
          sphVerts[j+6]=botColr[2];	
        }
        else {
            sphVerts[j+4]=Math.random();// equColr[0]; 
            sphVerts[j+5]=Math.random();// equColr[1]; 
            sphVerts[j+6]=Math.random();// equColr[2];					
        }
      }
    }
  }
  
  function makeTorus() {
  //==============================================================================
  // 		Create a torus centered at the origin that circles the z axis.  
  // Terminology: imagine a torus as a flexible, cylinder-shaped bar or rod bent 
  // into a circle around the z-axis. The bent bar's centerline forms a circle
  // entirely in the z=0 plane, centered at the origin, with radius 'rbend'.  The 
  // bent-bar circle begins at (rbend,0,0), increases in +y direction to circle  
  // around the z-axis in counter-clockwise (CCW) direction, consistent with our
  // right-handed coordinate system.
  // 		This bent bar forms a torus because the bar itself has a circular cross-
  // section with radius 'rbar' and angle 'phi'. We measure phi in CCW direction 
  // around the bar's centerline, circling right-handed along the direction 
  // forward from the bar's start at theta=0 towards its end at theta=2PI.
  // 		THUS theta=0, phi=0 selects the torus surface point (rbend+rbar,0,0);
  // a slight increase in phi moves that point in -z direction and a slight
  // increase in theta moves that point in the +y direction.  
  // To construct the torus, begin with the circle at the start of the bar:
  //					xc = rbend + rbar*cos(phi); 
  //					yc = 0; 
  //					zc = -rbar*sin(phi);			(note negative sin(); right-handed phi)
  // and then rotate this circle around the z-axis by angle theta:
  //					x = xc*cos(theta) - yc*sin(theta) 	
  //					y = xc*sin(theta) + yc*cos(theta)
  //					z = zc
  // Simplify: yc==0, so
  //					x = (rbend + rbar*cos(phi))*cos(theta)
  //					y = (rbend + rbar*cos(phi))*sin(theta) 
  //					z = -rbar*sin(phi)
  // To construct a torus from a single triangle-strip, make a 'stepped spiral' 
  // along the length of the bent bar; successive rings of constant-theta, using 
  // the same design used for cylinder walls in 'makeCyl()' and for 'slices' in 
  // makeSphere().  Unlike the cylinder and sphere, we have no 'special case' 
  // for the first and last of these bar-encircling rings.
  //
  var rbend = 1.0;										// Radius of circle formed by torus' bent bar
  var rbar = 0.5;											// radius of the bar we bent to form torus
  var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
                                      // more segments for more-circular torus
  var barSides = 13;										// # of sides of the bar (and thus the 
                                      // number of vertices in its cross-section)
                                      // >=3 req'd;
                                      // more sides for more-circular cross-section
  // for nice-looking torus with approx square facets, 
  //			--choose odd or prime#  for barSides, and
  //			--choose pdd or prime# for barSlices of approx. barSides *(rbend/rbar)
  // EXAMPLE: rbend = 1, rbar = 0.5, barSlices =23, barSides = 11.
  
    // Create a (global) array to hold this torus's vertices:
   torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
  //	Each slice requires 2*barSides vertices, but 1st slice will skip its first 
  // triangle and last slice will skip its last triangle. To 'close' the torus,
  // repeat the first 2 vertices at the end of the triangle-strip.  Assume 7
  
  var phi=0, theta=0;										// begin torus at angles 0,0
  var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
  var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
                                        // (WHY HALF? 2 vertices per step in phi)
    // s counts slices of the bar; v counts vertices within one slice; j counts
    // array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
    for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
      for(v=0; v< 2*barSides; v++, j+=7) {		// for each vertex in this slice:
        if(v%2==0)	{	// even #'d vertices at bottom of slice,
          torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * 
                                               Math.cos((s)*thetaStep);
                  //	x = (rbend + rbar*cos(phi)) * cos(theta)
          torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
                                               Math.sin((s)*thetaStep);
                  //  y = (rbend + rbar*cos(phi)) * sin(theta) 
          torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
                  //  z = -rbar  *   sin(phi)
          torVerts[j+3] = 1.0;		// w
        }
        else {				// odd #'d vertices at top of slice (s+1);
                      // at same phi used at bottom of slice (v-1)
          torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * 
                                               Math.cos((s+1)*thetaStep);
                  //	x = (rbend + rbar*cos(phi)) * cos(theta)
          torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
                                               Math.sin((s+1)*thetaStep);
                  //  y = (rbend + rbar*cos(phi)) * sin(theta) 
          torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
                  //  z = -rbar  *   sin(phi)
          torVerts[j+3] = 1.0;		// w
        }
        torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
        torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
        torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
      }
    }
    // Repeat the 1st 2 vertices of the triangle strip to complete the torus:
        torVerts[j  ] = rbend + rbar;	// copy vertex zero;
                //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
        torVerts[j+1] = 0.0;
                //  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
        torVerts[j+2] = 0.0;
                //  z = -rbar  *   sin(phi==0)
        torVerts[j+3] = 1.0;		// w
        torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
        torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
        torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
        j+=7; // go to next vertex:
        torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
                //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
        torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
                //  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
        torVerts[j+2] = 0.0;
                //  z = -rbar  *   sin(phi==0)
        torVerts[j+3] = 1.0;		// w
        torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
        torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
        torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
  }

  function makeShark(){ 
    sharkVerts = new Float32Array([
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
     
       
         // +x face: 
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
         
        
            // +y face: 
          -0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 1
          -0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 5
            0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 4
        
         0.5,  0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 4
         0.5,  0.5, -0.5, 1.0,	  0.0, 0.0, 1.0,	// Node 2 
          -0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 0.0,	// Node 1
        
            // +z face: 
          -0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 5
          -0.5, -0.5,  0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 6
           0.5, -0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 7
        
         0.5, -0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 7
         0.5,  0.5,  0.5, 1.0,	  1.0, 0.0, 0.0,	// Node 4
          -0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 5
        
            // -x face: 
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
          
            // -y face: 
         0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 0.0,	// Node 3
         0.5, -0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 7
          -0.5, -0.5,  0.5, 1.0,	  0.0, 0.0, 1.0,	// Node 6
        
          -0.5, -0.5,  0.5, 1.0,	  0.0, 0.0, 1.0,	// Node 6
          -0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 0.0,	// Node 0
           0.5, -0.5, -0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 3
        
         // -z face: 
         0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 2
         0.5, -0.5, -0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 3
          -0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 0		
        
          -0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 0
          -0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 1
           0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 2
    ]);
}

  function makeAxis(){
    axisVerts = new Float32Array([
        0.0,  0.0,  0.0, 1.0,		0.5,  0.5,  0.5,	// X axis line (origin: gray)
        5.5,  0.0,  0.0, 1.0,		1.0,  1.0,  0.3,	// 						 (endpoint: red)
     
        0.0,  0.0,  0.0, 1.0,       0.5,  0.5,  0.5,	// Y axis line (origin: white)
        0.0,  5.5,  0.0, 1.0,		0.5, 1.0, 0.5,	//						 (endpoint: purpe)
  
        0.0,  0.0,  0.0, 1.0,		0.5,  0.5,  0.5,// Z axis line (origin:white)
        0.0,  0.0,  5.5, 1.0,		0.3,  0.3,  1.0,	//						 (endpoint: blue)
    ]);
  }

  function makeGroundGrid() {
    //==============================================================================
    // Create a list of vertices that create a large grid of lines in the x,y plane
    // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.
    
      var xcount = 100;			// # of lines to draw in x,y to make the grid.
      var ycount = 100;		
      var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
       var xColr = new Float32Array([1.0, .3, 0.3]);	// bright yellow
       var yColr = new Float32Array([0.0, 0.4, 0.8]);	// bright green.
       
      // var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
       //var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.


      // Create an (global) array to hold this ground-plane's vertices:
      gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
                // draw a grid made of xcount+ycount lines; 2 vertices per line.
                
      var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
      var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
      
      // First, step thru x values as we make vertical lines of constant-x:
      for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
        if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
          gndVerts[j  ] = -xymax + (v  )*xgap;	// x
          gndVerts[j+1] = -xymax;								// y
          gndVerts[j+2] = 0.0;									// z
          gndVerts[j+3] = 1.0;									// w.
        }
        else {				// put odd-numbered vertices at (xnow, +xymax, 0).
          gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
          gndVerts[j+1] = xymax;								// y
          gndVerts[j+2] = 0.0;									// z
          gndVerts[j+3] = 1.0;									// w.
        }
        gndVerts[j+4] = xColr[0];			// red
        gndVerts[j+5] = xColr[1];			// grn
        gndVerts[j+6] = xColr[2];			// blu
      }
      // Second, step thru y values as wqe make horizontal lines of constant-y:
      // (don't re-initialize j--we're adding more vertices to the array)
      for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
        if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
          gndVerts[j  ] = -xymax;								// x
          gndVerts[j+1] = -xymax + (v  )*ygap;	// y
          gndVerts[j+2] = 0.0;									// z
          gndVerts[j+3] = 1.0;									// w.
        }
        else {					// put odd-numbered vertices at (+xymax, ynow, 0).
          gndVerts[j  ] = xymax;								// x
          gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
          gndVerts[j+2] = 0.0;									// z
          gndVerts[j+3] = 1.0;									// w.
        }
        gndVerts[j+4] = yColr[0];			// red
        gndVerts[j+5] = yColr[1];			// grn
        gndVerts[j+6] = yColr[2];			// blu
      }
    }



//[1.0, 1.0, 0.3]);	// bright yellow
       //var yColr = new Float32Array([0.5, 1.0, 0.5])



function initVertexBuffers(gl) {
//==============================================================================

	 // make our 'forest' of triangular-shaped trees:
  forestVerts = new Float32Array([
    // 3 Vertex coordinates (x,y,z) and 3 colors (r,g,b)
     0.0,  0.5,  -0.4,  0.4,  1.0,  0.4, // The back green one
    -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4,
     0.5, -0.5,  -0.4,  1.0,  0.4,  0.4, 
   
     0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, // The middle yellow one
    -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,
     0.0, -0.6,  -0.2,  1.0,  1.0,  0.4, 

     0.0,  0.5,   0.0,  0.4,  0.4,  1.0,  // The front blue one 
    -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,
     0.5, -0.5,   0.0,  1.0,  0.4,  0.4, 
  ]); 
  
  // Make our 'ground plane'; can you make a'torus' shape too?
  // (recall the 'basic shapes' starter code...)
  makeCylinder();					// create, fill the cylVerts array
  makeSphere();						// create, fill the sphVerts array
  makeTorus();
 
  makeGroundGrid();
  makeAxis();
  makeShark();
  

	// How much space to store all the shapes in one array?
	// (no 'var' means this is a global variable)
	mySiz = cylVerts.length + sphVerts.length + 
  torVerts.length + gndVerts.length + axisVerts.length+ sharkVerts.length;

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);

	// Copy all shapes into one big Float32 array:
  var verticesColors = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	/* forestStart = 0;							// we store the forest first.
  for(i=0,j=0; j< forestVerts.length; i++,j++) {
  	verticesColors[i] = forestVerts[j];
		}  */

  
    cylStart = 0;
  for(i = 0,j=0; j<cylVerts.length; i++,j++) {
    verticesColors[i] = cylVerts[j];
		}
		sphStart = i;						// next, we'll store the sphere;
	for(j=0; j< sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
		verticesColors[i] = sphVerts[j];
		}
		torStart = i;						// next, we'll store the torus;
	for(j=0; j< torVerts.length; i++, j++) {
		verticesColors[i] = torVerts[j];
		}
      
	gndStart = i;						// next we'll store the ground-plane;
	for(j=0; j< gndVerts.length; i++, j++) {
		verticesColors[i] = gndVerts[j];
		}
  axisStart = i;
  for(j=0; j< axisVerts.length; i++, j++) {
		verticesColors[i] = axisVerts[j];
    }
    sharkStart = i;
    for(j=0; j< sharkVerts.length; i++, j++) {
		verticesColors[i] = sharkVerts[j];
		}

  
  // Create a vertex buffer object (VBO)
  var vertexColorbuffer = gl.createBuffer();  
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * floatsPerVertex, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * floatsPerVertex, FSIZE * 4);
  gl.enableVertexAttribArray(a_Color);

   return mySiz/floatsPerVertex;	;	// return # of vertices
}

//var EyeX = 0.20, EyeY = 0.25, EyeZ = 4.25; 
// Global vars for Eye position. 
// NOTE!  I moved eyepoint BACKWARDS from the forest: from EyeZ=0.25
// a distance far enough away to see the whole 'forest' of trees within the
// 30-degree field-of-view of our 'perspective' camera.  I ALSO increased
// the 'keydown()' function's effect on EyeX position.


// Last time that this function was called:  (used for animation timing)
var last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - last;
  last = now;    
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
//  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
//  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;

  //rot_angle
  rot_angle = rot_angle + (rot_angleRate * elapsed) / 1000.0;
  if(rot_angle > 180.0) rot_angle = rot_angle - 360.0;
  if(rot_angle <-180.0) rot_angle = rot_angle + 360.0;

  flipper_angle = flipper_angle + (flipper_angleRate * elapsed) / 1000.0;
  if(flipper_angle > 180.0) flipper_angle = flipper_angle - 360.0;
  if(flipper_angle <-180.0) flipper_angle = flipper_angle + 360.0;

  if(flipper_angle > 15.0 && flipper_angleRate > 0) flipper_angleRate *= -1.0;
  if(flipper_angle < 0.0  && flipper_angleRate < 0) flipper_angleRate *= -1.0;

  translate = translate + (translateRate * elapsed) / 1000.0;
  if(translate > 5) translateRate = -5;
  if(translate <-5) translateRate = 5;


  return newAngle %= 360;
}


function keydown(ev) {
//------------------------------------------------------
//HTML calls this'Event handler' or 'callback function' when we press a key:

switch(ev.code){
    case "ArrowLeft": 
      atX += 0.05 * Math.cos(theta*Math.PI/180);
      atY += 0.05 * Math.sin(theta*Math.PI/180);
        eyeX += 0.05 * Math.cos(theta*Math.PI/180);
        eyeY += 0.05 * Math.sin(theta*Math.PI/180);
       
        break;
    case "ArrowRight": 
    atX -= 0.05 * Math.cos(theta*Math.PI/180);
        atY -= 0.05 * Math.sin(theta*Math.PI/180);
        eyeX -= 0.05 * Math.cos(theta*Math.PI/180);
        eyeY -= 0.05* Math.sin(theta*Math.PI/180);
        
        break;
        case "ArrowDown":
        atZ -= 0.05;
        eyeZ -= 0.05;
        break;
    case "ArrowUp":
        atZ += 0.05;
        eyeZ += 0.05;
        break;
    
        case "KeyA":
          theta += 1.5;
          atX = eyeX + r*Math.sin(theta*Math.PI/180);
          atY = eyeY - r*Math.cos(theta*Math.PI/180);
          break;
      case "KeyD":
          theta -= 1.5;
          atX = eyeX + r*Math.sin(theta*Math.PI/180);
          atY = eyeY - r*Math.cos(theta*Math.PI/180);
          break;
    case "KeyW":
        atZ += 0.1;
        break;
    case "KeyS":
        atZ -= 0.1;
        break;
   
    case "KeyM":
      var tan = (atZ - eyeZ)/(atY - eyeY);
        eyeZ -= 0.1*Math.cos(theta*Math.PI/180)*tan;
        atZ -= 0.1*Math.cos(theta*Math.PI/180)*tan;
        eyeX += 0.1*Math.sin(theta*Math.PI/180);
        atX += 0.1*Math.sin(theta*Math.PI/180);
        eyeY -= 0.1*Math.cos(theta*Math.PI/180);
        atY -= 0.1*Math.cos(theta*Math.PI/180);
        
        break;
    case "KeyN":
      var tan = (atZ - eyeZ)/(atY - eyeY);
        eyeZ += 0.1*Math.cos(theta*Math.PI/180)*tan;
        atZ += 0.1*Math.cos(theta*Math.PI/180)*tan;
        eyeX -= 0.1*Math.sin(theta*Math.PI/180);
        atX -= 0.1*Math.sin(theta*Math.PI/180);
        eyeY += 0.1*Math.cos(theta*Math.PI/180);
        atY += 0.1*Math.cos(theta*Math.PI/180);
        
        break;






}

}
function myMouseDown(ev, gl, canvas) {
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
};



function myMouseMove(ev, gl, canvas) {
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
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	// AND use any mouse-dragging we found to update quaternions qNew and qTot.
	dragQuat(x - xMclik, y - yMclik);
	
	xMclik = x;													// Make NEXT drag-measurement from here.
	yMclik = y;

  


};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
//	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);

	// AND use any mouse-dragging we found to update quaternions qNew and qTot;
	dragQuat(x - xMclik, y - yMclik);

	
};

function dragQuat(xdrag, ydrag) {
//==============================================================================
// Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
// We find a rotation axis perpendicular to the drag direction, and convert the 
// drag distance to an angular rotation amount, and use both to set the value of 
// the quaternion qNew.  We then combine this new rotation with the current 
// rotation stored in quaternion 'qTot' by quaternion multiply.  Note the 
// 'draw()' function converts this current 'qTot' quaternion to a rotation 
// matrix for drawing. 
	var res = 5;
	var qTmp = new Quaternion(0,0,0,1);
	
	var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
	// console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
	qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist*150.0);
	// (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
							// why axis (x,y,z) = (-yMdrag,+xMdrag,0)? 
							// -- to rotate around +x axis, drag mouse in -y direction.
							// -- to rotate around +y axis, drag mouse in +x direction.
							
	qTmp.multiply(qNew,qTot);			// apply new rotation to current rotation. 
	//--------------------------
	// IMPORTANT! Why qNew*qTot instead of qTot*qNew? (Try it!)
	// ANSWER: Because 'duality' governs ALL transformations, not just matrices. 
	// If we multiplied in (qTot*qNew) order, we would rotate the drawing axes
	// first by qTot, and then by qNew--we would apply mouse-dragging rotations
	// to already-rotated drawing axes.  Instead, we wish to apply the mouse-drag
	// rotations FIRST, before we apply rotations from all the previous dragging.
	//------------------------
	// IMPORTANT!  Both qTot and qNew are unit-length quaternions, but we store 
	// them with finite precision. While the product of two (EXACTLY) unit-length
	// quaternions will always be another unit-length quaternion, the qTmp length
	// may drift away from 1.0 if we repeat this quaternion multiply many times.
	// A non-unit-length quaternion won't work with our quaternion-to-matrix fcn.
	// Matrix4.prototype.setFromQuat().
//	qTmp.normalize();						// normalize to ensure we stay at length==1.0.
	qTot.copy(qTmp);
	};

  function drawResize() {
    //==============================================================================
    // Called when user re-sizes their browser window , because our HTML file
    // contains:  <body onload="main()" onresize="winResize()">
    
      //Report our current browser-window contents:
  
      var nuCanvas = document.getElementById('webgl');	// get current canvas
      var nuGl = getWebGLContext(nuCanvas);
  
      console.log('Canvas width,height=', nuCanvas.width, nuCanvas.height);		
     console.log('Browser window: innerWidth,innerHeight=', 
                                    innerWidth, innerHeight);	
                                    // http://www.w3schools.com/jsref/obj_window.asp
    
      //Make canvas fill the top 3/4 of our browser window:
      var xtraMargin = 16;    // keep a margin (otherwise, browser adds scroll-bars)
      nuCanvas.width = innerWidth - xtraMargin;
      nuCanvas.height = (innerHeight*2/3) - xtraMargin;
      // IMPORTANT!  Need a fresh drawing in the re-sized viewports.
  
      draw(nuGl);   // Draw the triangles
    }

function draw(gl) {
//==============================================================================
  
  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Using OpenGL/ WebGL 'viewports':
  // these determine the mapping of CVV to the 'drawing context',
	// (for WebGL, the 'gl' context describes how we draw inside an HTML-5 canvas)
	// Details? see
	//
  //  https://www.khronos.org/registry/webgl/specs/1.0/#2.3
  // Draw in the FIRST of several 'viewports'
  //------------------------------------------
	// CHANGE from our default viewport:
	// gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	// to a smaller one:
	// Viewport left side
  gl.viewport(0, 0, gl.drawingBufferWidth*2/3, gl.drawingBufferHeight); 
  
  ratio = gl.drawingBufferWidth/gl.drawingBufferHeight;
  modelMatrix.setPerspective(35, ratio, 1, 100);
  
  modelMatrix.lookAt(eyeX,eyeY,eyeZ, atX,atY,atZ, 0.0,0.0,1.0);  
  

  // Pass the view projection matrix
  //gl.uniformMatrix4fv(u_modelMatrix, false, modelMatrix.elements);

	// Draw the scene:
	drawMyScene(gl, u_modelMatrix, modelMatrix);
 
    // Draw in the SECOND of several 'viewports'
  //------------------------------------------
	gl.viewport(gl.drawingBufferWidth*2/3, 
              0, 
              gl.drawingBufferWidth/3, 
              gl.drawingBufferHeight); 
  modelMatrix.setOrtho(-Math.tan(20/180*Math.PI)*12/ratio,
  Math.tan(15/180*Math.PI)*12/ratio, -Math.tan(15/180*Math.PI)*12,
   Math.tan(15/180*Math.PI)*12, 1.0, 100.0);  // left, right, bottom, top, near, far
   
  modelMatrix.lookAt(eyeX,eyeY,eyeZ, atX,atY,atZ, 0.0,0.0,1.0);  
    //pushMatrix(modelMatrix);							// up vector

  // Pass the view projection matrix to our shaders:
  //gl.uniformMatrix4fv(u_modelMatrix, false, modelMatrix.elements);

	// Draw the scene:
	drawMyScene(gl, u_modelMatrix, modelMatrix);
    
  
}

function drawMyScene(myGL, myu_ModelMatrix, myModelMatrix) {
/* //===============================================================================
// Called ONLY from within the 'draw()' function
// Assumes already-correctly-set View matrix and Proj matrix; 
// draws all items in 'world' coords.

	// DON'T clear <canvas> or you'll WIPE OUT what you drew 
	// in all previous viewports!
	// myGL.clear(gl.COLOR_BUFFER_BIT);  						
  
  
  // Now, using these drawing axes, draw our ground plane: 
  myGL.drawArrays(myGL.LINES,							// use this drawing primitive, and
  							gndStart/floatsPerVertex,	// start at this vertex number, and
  							gndVerts.length/floatsPerVertex);		// draw this many vertices */

  pushMatrix(myModelMatrix);     // SAVE world coord system;
    	//-------Draw Spinning Cylinder:
    myModelMatrix.translate(-1.0,-1.0, 0.0);  // 'set' means DISCARD old matrix,
    						// (drawing axes centered in CVV), and then make new
    						// drawing axes moved to the lower-left corner of CVV. 
    myModelMatrix.scale(0.3, 0.3, 0.3);
    						// if you DON'T scale, cyl goes outside the CVV; clipped!
    myModelMatrix.rotate(currentAngle, 0, 1, 0);  // spin around y axis.
  	// Drawing:
    // Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements);
    // Draw the cylinder's vertices, and no other vertices:
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							cylStart/floatsPerVertex, // start at this vertex number, and
    							cylVerts.length/floatsPerVertex);	// draw this many vertices.
    myModelMatrix = popMatrix();  // RESTORE 'world' drawing coords.


   

  //===========================================================

  pushMatrix(myModelMatrix);     // SAVE world coord system;
    	//-------Draw Spinning Cylinder:
    myModelMatrix.translate(1.0,1.0, 0.0);  // 'set' means DISCARD old matrix,
    						// (drawing axes centered in CVV), and then make new
    						// drawing axes moved to the lower-left corner of CVV. 
    myModelMatrix.scale(0.1, 0.1, 0.1);
    						// if you DON'T scale, cyl goes outside the CVV; clipped!
    myModelMatrix.rotate(-currentAngle, 0, 1, 1);  // spin around y axis.
  	// Drawing:
    // Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements);
    // Draw the cylinder's vertices, and no other vertices:
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							cylStart/floatsPerVertex, // start at this vertex number, and
    							cylVerts.length/floatsPerVertex);	// draw this many vertices.
    myModelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  //===========================================================
  //  
  pushMatrix(myModelMatrix);  // SAVE world drawing coords.
    //--------Draw Spinning Sphere
    myModelMatrix.translate( 1.0, -1.0, 0.0); // 'set' means DISCARD old matrix,
    						// (drawing axes centered in CVV), and then make new
    						// drawing axes moved to the lower-left corner of CVV.
                          // to match WebGL display canvas.
    myModelMatrix.scale(0.3, 0.3, 0.3);
    						// Make it smaller:
    myModelMatrix.rotate(currentAngle, 1, 1, 0);  // Spin on XY diagonal axis
  	// Drawing:		
  	// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements);
    		// Draw just the sphere's vertices
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							sphStart/floatsPerVertex,	// start at this vertex number, and 
    							sphVerts.length/floatsPerVertex);	// draw this many vertices.
  myModelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  
  //===========================================================
  //  
  pushMatrix(myModelMatrix);  // SAVE world drawing coords.
  //--------Draw Spinning torus
    myModelMatrix.translate(-1.0, 1.0, 0.0);	// 'set' means DISCARD old matrix,
  
    myModelMatrix.scale(0.25, 0.25, 0.25);
    						// Make it smaller:
    myModelMatrix.rotate(currentAngle, 0, 1, 1);  // Spin on YZ axis
    quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion Drag
	myModelMatrix.concat(quatMatrix);
    //pushMatrix(modelMatrix);
  	// Drawing:		
  	// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements);
    		// Draw just the torus's vertices
    gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
    						  torStart/floatsPerVertex,	// start at this vertex number, and
    						  torVerts.length/floatsPerVertex);	// draw this many vertices.
  myModelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  //myModelMatrix = popMatrix();
  //===========================================================
  //

  //DRAW SHARK 
  pushMatrix(myModelMatrix);  // SAVE world drawing coords.
  myModelMatrix.scale(1.3, 1.3, 1.3);	// shrink by 10X:
  drawShark(myModelMatrix, myu_ModelMatrix);

  
  myModelMatrix = popMatrix();
  
  pushMatrix(myModelMatrix);  // SAVE world drawing coords.
  	//---------Draw Ground Plane, without spinning.
  	// position it.



    
  	myModelMatrix.translate( 0.0, 0.0, 0.0);	

    gl.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements); // draw axis
    gl.drawArrays(gl.LINES, axisStart/floatsPerVertex, axisVerts.length/floatsPerVertex);
     
    
    myModelMatrix.scale(0.1, 0.1, 0.1);	// shrink by 10X:
  	// Drawing:
  	// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements);
    // Draw just the ground-plane's vertices
    gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
    			  gndStart/floatsPerVertex,	// start at this vertex number, and
    			  gndVerts.length/floatsPerVertex);	// draw this many vertices.
    
  myModelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  //===========================================================


}

function drawShark(modelMatrix, modelMatLoc){
    pushMatrix(modelMatrix); 
		modelMatrix.translate(-0.5, -0.5, 0.0);
		modelMatrix.scale(0.2, 0.2, 0.2);
		// Make it smaller:
		modelMatrix.rotate(rot_angle, 1, 0, 1);  // Spin on XY diagonal axis
		// DRAW CUBE:		Use ths matrix to transform & draw
		//						the second set of vertices stored in our VBO:
		modelMatrix.translate(translate, translate * 0.2, 2);
		
		gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);
		// Draw just the first set of vertices: start at vertex SHAPE_0_SIZE
		gl.drawArrays(gl.TRIANGLES, sharkStart/floatsPerVertex + 12, 48);    
		
		pushMatrix(modelMatrix);
	
			// side triangles 
		
      modelMatrix.scale(0.5, 0.5, 0.5);
			
			modelMatrix.rotate(-90,0,0,1);
			modelMatrix.rotate(-45,0,1,0);
			modelMatrix.translate(0,-2.4, 0);

			modelMatrix.rotate(rot_angle * 8, 0, .5, 0);

			gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);

			gl.drawArrays(gl.TRIANGLES, sharkStart/floatsPerVertex, 12);
      modelMatrix.scale(0.85, 0.85, 0.85);
      modelMatrix.translate(0,-1.4, 0);
			modelMatrix.rotate(rot_angle * 1, 0, 1, 0);
      gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, sharkStart/floatsPerVertex, 12);
      modelMatrix.scale(0.85, 0.85, 0.85);
      modelMatrix.translate(0,-1.4, 0);
			modelMatrix.rotate(rot_angle * 1, 0, 1, 0);
      gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, sharkStart/floatsPerVertex, 12);
      modelMatrix.scale(0.85, 0.85, 0.85);
      modelMatrix.translate(0,-1.4, 0);
			modelMatrix.rotate(rot_angle * 1, 0, 1, 0);
      gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, sharkStart/floatsPerVertex, 12);

		modelMatrix = popMatrix();
		pushMatrix(modelMatrix);
			
	
    modelMatrix.translate(0,-0.2, 1);
	
    modelMatrix.rotate(-40,0,1,0);
    modelMatrix.rotate(-50,1,0,0);

    modelMatrix.translate(-0.5,0, 0);

    modelMatrix.rotate(-flipper_angle * 2, 0, 1, 0);
    
    modelMatrix.scale(0.4, 0.4, 0.4);

			gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);

			gl.drawArrays(gl.TRIANGLES, sharkStart/floatsPerVertex, 4);
		modelMatrix = popMatrix();
		pushMatrix(modelMatrix);
	
    modelMatrix.translate(-0.2,-0.3, -0.65);
	
    modelMatrix.rotate(50,0,1,0);
    modelMatrix.rotate(100,1,0,0);

    modelMatrix.translate(0,0, -0.2);

    modelMatrix.rotate(-flipper_angle * 4, 0, 1, 0);
    
    modelMatrix.scale(0.4, 0.4, 0.4);

    gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix.elements);

			gl.drawArrays(gl.TRIANGLES, sharkStart/floatsPerVertex, 4);
	//	modelMatrix = popMatrix();
		
	modelMatrix = popMatrix();




}


//==================HTML Button Callbacks

function spinDown() {
 ANGLE_STEP -= 20; 
}

function spinUp() {
  ANGLE_STEP += 20; 
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
  }
}

  