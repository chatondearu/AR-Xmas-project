console.log('\'Allo \'Allo!');

//add video
Webcam.set({
  width: 320,
  height: 240,
  image_format: 'jpeg',
  jpeg_quality: 90,
  flip_horiz: true
});

Webcam.attach('#main_stream');

function take_snapshot() {
  Webcam.snap( function(data_uri) {
    document.getElementById('my_result').innerHTML = '<img src="'+data_uri+'"/>';
  } );
}

var video = document.getElementById('main_stream');

var canvas = document.getElementById('c_main');
var raster = new NyARRgbRaster_Canvas2D(canvas);
// Here we create a FLARParam for images with 320x240 pixel dimensions.
var param = new FLARParam(320, 240);
var detector = new FLARMultiIdMarkerDetector(param, 120);

detector.setContinueMode(true);
param.copyCameraMatrix(display.camera.perspectiveMatrix, 10, 10000);

canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
canvas.changed = true;

var markerCount = detector.detectMarkerLite(raster, threshold);
var resultMat = new NyARTransMatResult();
var markers = {};

for (var idx = 0; idx < markerCount; idx++) {
  var id = detector.getIdMarkerData(idx);
  var currId = -1;

  if (id.packetLength <= 4) {
    currId = 0;
    for (var i = 0; i < id.packetLength; i++) {
      currId = (currId << 8) | id.getPacketData(i);
    }
  }

  if (markers[currId] == null) {
    markers[currId] = {};
  }

  detector.getTransformMatrix(idx, resultMat);
  markers[currId].transform = Object.asCopy(resultMat);
}

function copyMarkerMatrix(arMat, glMat) {
  glMat[0] = arMat.m00;
  glMat[1] = -arMat.m10;
  glMat[2] = arMat.m20;
  glMat[3] = 0;
  glMat[4] = arMat.m01;
  glMat[5] = -arMat.m11;
  glMat[6] = arMat.m21;
  glMat[7] = 0;
  glMat[8] = -arMat.m02;
  glMat[9] = arMat.m12;
  glMat[10] = -arMat.m22;
  glMat[11] = 0;
  glMat[12] = arMat.m03;
  glMat[13] = -arMat.m13;
  glMat[14] = arMat.m23;
  glMat[15] = 1;
}




// -------------------------------------------------------------------------------------------------


// I'm going to use a glMatrix-style matrix as an intermediary.
// So the first step is to create a function to convert a glMatrix matrix into a Three.js Matrix4.
THREE.Matrix4.prototype.setFromArray = function(m) {
  return this.set(
    m[0], m[4], m[8], m[12],
    m[1], m[5], m[9], m[13],
    m[2], m[6], m[10], m[14],
    m[3], m[7], m[11], m[15]
  );
};

// glMatrix matrices are flat arrays.
var tmp = new Float32Array(16);

// Create a camera and a marker root object for your Three.js scene.
var camera = new THREE.Camera();
scene.add(camera);

var markerRoot = new THREE.Object3D();
markerRoot.matrixAutoUpdate = false;

// Add the marker models and suchlike into your marker root object.
var cube = new THREE.Mesh(
  new THREE.CubeGeometry(100,100,100),
  new THREE.MeshBasicMaterial({color: 0xff00ff})
);
cube.position.z = -50;
markerRoot.add(cube);

// Add the marker root to your scene.
scene.add(markerRoot);

// Next we need to make the Three.js camera use the FLARParam matrix.
param.copyCameraMatrix(tmp, 10, 10000);
camera.projectionMatrix.setFromArray(tmp);


// To display the video, first create a texture from it.
var videoTex = new THREE.Texture(videoCanvas);

// Then create a plane textured with the video.
var plane = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2, 0),
  new THREE.MeshBasicMaterial({map: videoTex})
);

// The video plane shouldn't care about the z-buffer.
plane.material.depthTest = false;
plane.material.depthWrite = false;

// Create a camera and a scene for the video plane and
// add the camera and the video plane to the scene.
var videoCam = new THREE.Camera();
var videoScene = new THREE.Scene();
videoScene.add(plane);
videoScene.add(videoCam);

// -------------------------------------------------------------------------------------------------

// On every frame do the following:
function tick() {
  // Draw the video frame to the canvas.
  videoCanvas.getContext('2d').drawImage(video, 0, 0);
  canvas.getContext('2d').drawImage(videoCanvas, 0, 0, canvas.width, canvas.height);

  // Tell JSARToolKit that the canvas has changed.
  canvas.changed = true;

  // Update the video texture.
  videoTex.needsUpdate = true;

  // Detect the markers in the video frame.
  var markerCount = detector.detectMarkerLite(raster, threshold);
  for (var i=0; i<markerCount; i++) {
    // Get the marker matrix into the result matrix.
    detector.getTransformMatrix(i, resultMat);

    // Copy the marker matrix to the tmp matrix.
    copyMarkerMatrix(resultMat, tmp);

    // Copy the marker matrix over to your marker root object.
    markerRoot.matrix.setFromArray(tmp);
  }

  // Render the scene.
  renderer.autoClear = false;
  renderer.clear();
  renderer.render(videoScene, videoCam);
  renderer.render(scene, camera);
}