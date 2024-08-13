//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//==============================================================================
//
// LookAtTrianglesWithKey_ViewVolume.js (c) 2012 matsuda
//
//  MODIFIED 2014.02.19 J. Tumblin to 
//		--demonstrate multiple viewports (see 'draw()' function at bottom of file)
//		--draw ground plane in the 3D scene:  makeGroundPlane()


//console.log('FML');


var showGround = true;
var showNoL = false; 
var showGouraud = true;
var showPhong = false;

var worldBox = new VBObox0();  // Ground Grid
var nolightBox = new VBObox1();  // no lighting -> works
var gouraudbox = new VBObox2();   //Gouraud
var phongbox = new VBObox3(); //phong


var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
var sq2	= Math.sqrt(2.0);

var floatsPerVertex = 12;	// # of Float32Array elements used for each vertex	// (x,y,z)position + (r,g,b)color

var currentAngle = 0.0;
var ANGLE_STEP = 25.0;

var rot_angle = 0;                  // initial rotation angle
var rot_angleRate = 45.0;           // rotation speed, in degrees/second 

var flipper_angle = 0;                  // initial rotation angle
var flipper_angleRate = 15.0; 

var translate = 0;
var translateRate = 5;


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

// Mouse click and drag
var isDrag=false;
var xMclik=0.0;
var yMclik=0.0;   
var xMdragTot=0.0;
var yMdragTot=0.0; 



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

  worldBox.init(gl);
  nolightBox.init(gl);
  gouraudbox.init(gl);
  phongbox.init(gl);

   
	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);			 // WebGL default setting:
	gl.enable(gl.DEPTH_TEST); 
	

  // Specify the color for clearing <canvas>
  //gl.clearColor(0.25, 0.2, 0.25, 1.0);
  gl.clearColor(0.1, 0.12, 0.1, 1.0);

  normalMatrix = new Matrix4();
  vpMatrix = new Matrix4();
  mvpMatrix = new Matrix4();

 // Register the event handler to be called on key press
  document.onkeydown= function(ev){keydown(ev, gl); };
  canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  					// when user's mouse button goes down, call mouseDown() function
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };
											// when the mouse moves, call mouseMove() function					
  canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};


  var tick = function() {
    currentAngle = timeall(currentAngle);  // Update the rotation angle
    
    drawResize();
    requestAnimationFrame(tick, canvas);   
  };
  tick();	

  
}

  function makeSphere() {
    var slices =12;		
    var sliceVerts	= 21;

    var topColr = new Float32Array([1.0, 0.0, 1.0]);
    var equColr = new Float32Array([1.0, 0.0, 1.0]);
    var botColr = new Float32Array([1.0, 0.0, 1.0]);
    var sliceAngle = Math.PI/slices;	

    sphVerts1 = new Float32Array(((slices*2*sliceVerts)-2) * floatsPerVertex);
                                
    var cos0 = 0.0;				
    var sin0 = 0.0;				
    var cos1 = 0.0;			
    var sin1 = 0.0;
    var j = 0;					
    var isLast = 0;
    var isFirst = 1;	
    for(s=0; s<slices; s++) {	
        if(s==0) {
            isFirst = 1;		
            cos0 =  0.0; 		
            sin0 = -1.0;		
        }
        else {					
            isFirst = 0;	
            cos0 = cos1;
            sin0 = sin1;
        }						
        cos1 = Math.cos((-Math.PI/2) +(s+1)*sliceAngle); 
        sin1 = Math.sin((-Math.PI/2) +(s+1)*sliceAngle);
        if(s==slices-1) isLast=1;
        for(v=isFirst;    v< 2*sliceVerts-isLast;   v++,j+=floatsPerVertex)
        {					
            if(v%2 ==0) { 
                sphVerts1[j  ] = cos0 * Math.cos(Math.PI * v/sliceVerts);	
                sphVerts1[j+1] = cos0 * Math.sin(Math.PI * v/sliceVerts);	
                sphVerts1[j+2] = sin0;																			// z
                sphVerts1[j+3] = 1.0;	
                sphVerts1[j+7] = cos0 * Math.cos(Math.PI * v/sliceVerts);	
                sphVerts1[j+8] = cos0 * Math.sin(Math.PI * v/sliceVerts);	
                sphVerts1[j+9] = sin0;																			// w.				
            }
            else {	
                sphVerts1[j  ] = cos1 * Math.cos(Math.PI * (v-1)/sliceVerts); 
                sphVerts1[j+1] = cos1 * Math.sin(Math.PI * (v-1)/sliceVerts);
                sphVerts1[j+2] = sin1;		
                sphVerts1[j+3] = 1.0;	
                sphVerts1[j+7] = cos1 * Math.cos(Math.PI * (v-1)/sliceVerts); 
                sphVerts1[j+8] = cos1 * Math.sin(Math.PI * (v-1)/sliceVerts);
                sphVerts1[j+9] = sin1;
            }
            if(v==0) { 	
                sphVerts1[j+4]=equColr[0]; 
                sphVerts1[j+5]=equColr[1]; 
                sphVerts1[j+6]=equColr[2];				
                }
            else if(isFirst==1) {	
                sphVerts1[j+4]=botColr[0]; 
                sphVerts1[j+5]=botColr[1]; 
                sphVerts1[j+6]=botColr[2];	
                }
            else if(isLast==1) {
                sphVerts1[j+4]=topColr[0]; 
                sphVerts1[j+5]=topColr[1]; 
                sphVerts1[j+6]=topColr[2];	
            }
            else {	
                sphVerts1[j+4]= 1.0; 
                sphVerts1[j+5]= 0.0;	
                sphVerts1[j+6]= 1.0;	
            }
            sphVerts1[j+10] = 0.0;  // Texture Coord
            sphVerts1[j+11] = 0.0;
        }
    } 
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
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(7*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= 7) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
      gndVerts[j+3] = 1.0;
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
      gndVerts[j+3] = 1.0;
		}
		gndVerts[j+4] = xColr[0];			// red
		gndVerts[j+5] = xColr[1];			// grn
		gndVerts[j+6] = xColr[2];			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= 7) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
      gndVerts[j+3] = 1.0;
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
      gndVerts[j+3] = 1.0;
		}
		gndVerts[j+4] = yColr[0];			// red
		gndVerts[j+5] = yColr[1];			// grn
		gndVerts[j+6] = yColr[2];			// blu
	}
}


function makeCube(){
  var faceVerts = 4;
  cubeVerts = new Float32Array((2*faceVerts+1)*6*floatsPerVertex);

  upColor = new Float32Array([0.1, 0.3, 0.1]);

  unitLen = Math.sqrt(2);
  // up face
  for (v = 0,j = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
      if (v%2 == 0){  
          cubeVerts[j] = Math.cos(Math.PI*v/4 + Math.PI/4);
          cubeVerts[j+1] = unitLen/2;
          cubeVerts[j+2] = -Math.sin(Math.PI*v/4 + Math.PI/4);
          cubeVerts[j+3] = 1.0;
          cubeVerts[j+4] = upColor[0];
          cubeVerts[j+5] = upColor[1];
          cubeVerts[j+6] = upColor[2];
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = 1.0;
          cubeVerts[j+9] = 0.0;
      } else {  // central vertices
          cubeVerts[j] = 0.0;
          cubeVerts[j+1] = unitLen/2;
          cubeVerts[j+2] = 0.0;
          cubeVerts[j+3] = 1.0; 
          cubeVerts[j+4] = upColor[0];
          cubeVerts[j+5] = upColor[1];
          cubeVerts[j+6] = upColor[2];
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = 1.0;
          cubeVerts[j+9] = 0.0;
      }
      cubeVerts[j+10] = 0.0;  // Texture Coord
      cubeVerts[j+11] = 0.0;
  }

  // bottom face
  for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
      if (v%2 == 0){  
          cubeVerts[j] = Math.cos(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+1] = -unitLen/2;
          cubeVerts[j+2] = -Math.sin(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+3] = 1.0;
          cubeVerts[j+4] = 0.0;
          cubeVerts[j+5] = 0.2;
          cubeVerts[j+6] = 0.0;
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = -1.0;
          cubeVerts[j+9] = 0.0;
      } else {  // central vertices
          cubeVerts[j] = 0.0;
          cubeVerts[j+1] = -unitLen/2;
          cubeVerts[j+2] = 0.0;
          cubeVerts[j+3] = 1.0; 
          cubeVerts[j+4] = 0.0;
          cubeVerts[j+5] = 0.2;
          cubeVerts[j+6] = 0.0;
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = -1.0;
          cubeVerts[j+9] = 0.0;
      }
      cubeVerts[j+10] = 0.0;  // Texture Coord
      cubeVerts[j+11] = 0.0;
  }

  // back
  for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
      if (v%2 == 0){  
          cubeVerts[j] = Math.cos(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+2] = unitLen/2;
          cubeVerts[j+3] = 1.0;
          cubeVerts[j+4] = 0.6;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 0.6;
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = 1.0;
      } else {  // central vertices
          cubeVerts[j] = 0.0;
          cubeVerts[j+1] = 0.0;
          cubeVerts[j+2] = unitLen/2;
          cubeVerts[j+3] = 1.0; 
          cubeVerts[j+4] = 0.6;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 0.6;
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = 1.0;
      }
      cubeVerts[j+10] = 0.0;  // Texture Coord
      cubeVerts[j+11] = 0.0;
  }
  // front
  for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
      if (v%2 == 0){  
          cubeVerts[j] = Math.cos(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+2] = -unitLen/2;
          cubeVerts[j+3] = 1.0;
          cubeVerts[j+4] = 0.8;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 0.8;
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = -1.0;
      } else {  // central vertices
          cubeVerts[j] = 0.0;
          cubeVerts[j+1] = 0.0;
          cubeVerts[j+2] = -unitLen/2;
          cubeVerts[j+3] = 1.0; 
          cubeVerts[j+4] = 0.8;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 0.8;
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = -1.0;
      }
      cubeVerts[j+10] = 0.0;  // Texture Coord
      cubeVerts[j+11] = 0.0;
  }

  // right
  for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
      if (v%2 == 0){  
          cubeVerts[j] = unitLen/2;
          cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+2] = -Math.cos(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+3] = 1.0;
          cubeVerts[j+4] = 0.0;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 1.0;
          cubeVerts[j+7] = 1.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = 0.0;
      } else {  // central vertices
          cubeVerts[j] = unitLen/2;
          cubeVerts[j+1] = 0.0;
          cubeVerts[j+2] = 0.0;
          cubeVerts[j+3] = 1.0; 
          cubeVerts[j+4] = 0.0;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 1.0;
          cubeVerts[j+7] = 1.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = 0.0;
      }
      cubeVerts[j+10] = 0.0;  // Texture Coord
      cubeVerts[j+11] = 0.0;
  }
  // left
  for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
      if (v%2 == 0){  
          cubeVerts[j] = -unitLen/2;
          cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+2] = -Math.cos(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+3] = 1.0;
          cubeVerts[j+4] = 0.0;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 0.5;
          cubeVerts[j+7] = -1.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = 0.0;
      } else {  // central vertices
          cubeVerts[j] = -unitLen/2;
          cubeVerts[j+1] = 0.0;
          cubeVerts[j+2] = 0.0;
          cubeVerts[j+3] = 1.0; 
          cubeVerts[j+4] = 0.0;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 0.5;
          cubeVerts[j+7] = -1.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = 0.0;
      }
      cubeVerts[j+10] = 0.0;  // Texture Coord
      cubeVerts[j+11] = 0.0;
  }
}



function makePyramid() {
  botVert = 4;  // number of vertices on the bottom
  pyrVerts = new Float32Array((4*botVert+3)*floatsPerVertex);

  // bottom
  for (v = 0, j = 0; v < 2*botVert+2; v++, j += floatsPerVertex){
      if (v%2 == 0){
          pyrVerts[j] = Math.cos(Math.PI*v/botVert);
          pyrVerts[j+1] = Math.sin(Math.PI*v/botVert);
          pyrVerts[j+2] = 0.0;
          pyrVerts[j+3] = 1.0;
          pyrVerts[j+4] = 0.3;
          pyrVerts[j+5] = 0.3;
          pyrVerts[j+6] = 0.3;
      }else{
          pyrVerts[j] = 0.0;
          pyrVerts[j+1] = 0.0;
          pyrVerts[j+2] = 0.0;
          pyrVerts[j+3] = 1.0;
          pyrVerts[j+4] = 0.3;
          pyrVerts[j+5] = 0.3;
          pyrVerts[j+6] = 0.3;           
      }
      pyrVerts[j+7] = 0.0;
      pyrVerts[j+8] = 0.0;
      pyrVerts[j+9] = 1.0;
      pyrVerts[j+10] = 0.0;  // Texture Coord
      pyrVerts[j+11] = 0.0;
  }

  // wall
  for (v = 0; v < 2*botVert+1; v++, j+=floatsPerVertex){
      if (v%2 == 0){
          pyrVerts[j] = Math.cos(Math.PI*v/botVert);
          pyrVerts[j+1] = Math.sin(Math.PI*v/botVert);
          pyrVerts[j+2] = 0.0;
          pyrVerts[j+3] = 1.0;
          pyrVerts[j+4] = 0.3;
          pyrVerts[j+5] = 0.5;
          pyrVerts[j+6] = 0.3;
          pyrVerts[j+7] = Math.cos(Math.PI*v/botVert);
          pyrVerts[j+8] = Math.sin(Math.PI*v/botVert);
          pyrVerts[j+9] = 1.0;
          pyrVerts[j+10] = Math.abs(Math.sin(Math.PI*v/4));  // Texture Coord
          pyrVerts[j+11] = 0.0;
      } else{
          pyrVerts[j] = 0.0;
          pyrVerts[j+1] = 0.0;
          pyrVerts[j+2] = 1.0;
          pyrVerts[j+3] = 1.0;
          pyrVerts[j+4] = 0.3;
          pyrVerts[j+5] = 0.7;
          pyrVerts[j+6] = 0.3;
          pyrVerts[j+7] = Math.cos(Math.PI*(v-1)/botVert);
          pyrVerts[j+8] = Math.sin(Math.PI*(v-1)/botVert);
          pyrVerts[j+9] = 1.0;
          pyrVerts[j+10] = 1.0;  // Texture Coord
          pyrVerts[j+11] = 1.0;
      }
  }
}



// Last time that this function was called:  (used for animation timing)
var last = Date.now();

function timeall(angle) {
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
  
    
  };
  

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


  
  //Alter the position of the Lamp TODO -------------------------
  MouseLamp.I_pos.elements.set([
    MouseLamp.I_pos.elements[0] - (x - xMclik)*10,
    MouseLamp.I_pos.elements[1],
    MouseLamp.I_pos.elements[2] + (y - yMclik)*10]);
	
	xMclik = x;													// Make NEXT drag-measurement from here.
	yMclik = y;
	
};


function keydown(ev) {
  //------------------------------------------------------
  
  
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
    

       case "KeyX":
        if(showNoL){
          showNoL = false;
          showGouraud = true;
          showPhong = false;
        }
        else if(showGouraud){
          showNoL = false;
          showGouraud = false;
          showPhong = true;
        }
        else if(showPhong){
          showNoL = true;
          showGouraud = false;
          showPhong = false;
        }
        break;

      case "KeyC":
       
          blinnOn = -blinnOn;
          break;

      case "Digit4":
          matlSel0 = (matlSel0 +1)%MATL_DEFAULT;
          matl0.setMatl(matlSel0);
          break;

        case "Digit5":
          if (MouseLampOn == 1){
            MouseLampOn = 0;
          } else {
            MouseLampOn = 1;
          }
          break;
        case "Digit6":
          if (camLampOn == 1){
            camLampOn = 0;
          } else {
            camLampOn = 1;
          }
          break;
        case "Digit7":
          if (roofLampOn == 1){
            roofLampOn = 0;
          } else {
            roofLampOn = 1;
          }
          break;
        
       
   
  }
  
  }


function draw(gl) {
//==============================================================================
  
  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  //------------------------------------------
	// CHANGE from our default viewport:
	// gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	// to a smaller one:
	// Viewport left side
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); 
  /* if (frustum){
      modelMatrix.setFrustum(fLeft,fRight,fBottom,fTop,fNear,fFar);
  } else{ */
      ratio = gl.drawingBufferWidth/gl.drawingBufferHeight;
      vpMatrix.setPerspective(35, ratio, 1, 100);
  //}
  vpMatrix.lookAt(eyeX,eyeY,eyeZ, atX,atY,atZ, .0,0.0,.1);  
  //pushMatrix(modelMatrix);

  // Pass the view projection matrix
  //gl.uniformMatrix4fv(u_modelMatrix, false, modelMatrix.elements);

	// Draw the scene:

  if (showNoL){  // no light
    nolightBox.switchToMe();  
    nolightBox.adjust();
    nolightBox.draw();
  } 
  if (showGouraud){  // Gouroud
    gouraudbox.switchToMe();  
    gouraudbox.adjust();
    gouraudbox.draw();
}
    if (showPhong){  // Phong
    phongbox.switchToMe();  
    phongbox.adjust();
    phongbox.draw();
  }

  if (showGround){  // Ground Grid
    worldBox.switchToMe();  
    worldBox.adjust();
    worldBox.draw();
  }

 
}

function drawSphere(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix){
  modelMatrix.scale(0.6,0.6,0.6);
  modelMatrix.translate(0,0,0);
  modelMatrix.rotate(currentAngle, 0,0,1);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  mvpMatrix.set(vpMatrix).multiply(modelMatrix);
  
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, sphStart/floatsPerVertex, sphVerts1.length/floatsPerVertex);
}

function drawForest(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix){
  //modelMatrix.translate(1.5,-1.5,0);
    pushMatrix(modelMatrix);
    modelMatrix.translate(0,0,.7)
    
    //modelMatrix.scale(1.3,1.3,1.3);

    modelMatrix.scale(0.6,0.6,0.25);
    pushMatrix(modelMatrix);  // new
    modelMatrix.rotate(flipper_angle,0,.0,1);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, pyrStart/floatsPerVertex, pyrVerts.length/floatsPerVertex);
    
    modelMatrix = popMatrix();  
    modelMatrix.translate(0,0,1);
    modelMatrix.scale(0.7,0.7,1);
    pushMatrix(modelMatrix);  
    modelMatrix.rotate(-rot_angle*2,0,0,1);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, pyrStart/floatsPerVertex, pyrVerts.length/floatsPerVertex);
    
    modelMatrix = popMatrix();  //
    modelMatrix.translate(0,0,1);
    modelMatrix.scale(0.8,0.8,1.);
    pushMatrix(modelMatrix); 
    modelMatrix.rotate(flipper_angle*4,0,0,1);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, pyrStart/floatsPerVertex, pyrVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();  //
    modelMatrix.translate(0,0,1);
    modelMatrix.scale(0.7,0.7,.7);
    modelMatrix.rotate(flipper_angle*2,0,0,1);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, pyrStart/floatsPerVertex, pyrVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.translate(0,0,0.35);
    modelMatrix.scale(0.1,0.1,0.5);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex); }


    

    

function drawResize() {
  //==============================================================================
  // Called when user re-sizes their browser window , because our HTML file
  // contains:  <body onload="main()" onresize="winResize()">
  
    //Report our current browser-window contents:

    var nuCanvas = document.getElementById('webgl');	// get current canvas
    var nuGl = getWebGLContext(nuCanvas);

                                  // http://www.w3schools.com/jsref/obj_window.asp
  

    //Make canvas fill the top 3/4 of our browser window:
    var xtraMargin = 16;    // keep a margin (otherwise, browser adds scroll-bars)
    nuCanvas.width = innerWidth - xtraMargin;
    nuCanvas.height = (innerHeight*2/3) - xtraMargin;
    // IMPORTANT!  Need a fresh drawing in the re-sized viewports.

    draw(nuGl);   // Draw the triangles
  }

//==================HTML Button Callbacks



  