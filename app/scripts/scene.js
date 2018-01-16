/**
 * Created by romain on 04/12/15.
 * scene.js
 */

var g_height = 600;
var g_width = 600;



var clock, scene, camera, renderer, cube;


function init() {
  clock = new THREE.Clock();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, g_width / g_height, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor( 0xffffff );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( g_width, g_height );
  renderer.domElement.style.position = "relative";
  document.body.appendChild( renderer.domElement );

  camera.position.z = 6;
  camera.position.x = 6;
  camera.position.y = 6;

  var geometry = new THREE.BoxGeometry( 2, 2, 2 );
  //var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  var materialSpheres = new THREE.MeshLambertMaterial( { color: 0xc43eee, shading: THREE.FlatShading, overdraw: 0.5 } );
  cube = new THREE.Mesh( geometry, materialSpheres );
  scene.add( cube );


  var ambient = new THREE.AmbientLight( 0xeeeeee );
  scene.add( ambient );

  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( 3, 3, 3 );
  scene.add( directionalLight );
}

function render() {
  var r = clock.getElapsedTime();

  camera.position.x = 6 * Math.cos( r );
  camera.position.z = 6 * Math.sin( r );
  camera.lookAt(cube.position);

  renderer.render( scene, camera );
}

function animate() {
  requestAnimationFrame( animate );
  render();
}

function onWindowResize() {
  var g_height = 400;
  var g_width = 600;

  camera.aspect = g_width / g_height;
  camera.updateProjectionMatrix();

  webglRenderer.setSize( g_width, g_height );

}

init();
animate();