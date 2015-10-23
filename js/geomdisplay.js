(function(THREE, Stats, window){
  'use strict';
  
  function define_EventDisplay(){
    var EventDisplay = {};
    
    // Global variables for THREE
    var camera, scene, controls, stats, renderer;
    
    // Global variables for visualisation
	  var detectorGeometry = {};
    
    // Global variable for GUI etc
    var guiParameters = {};
    var geomFolder,gui;
    var mouse = new THREE.Vector2();
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;    

    function _init(){
      
      var container;

      container = document.createElement( 'div' );
      document.body.appendChild( container );
      
      camera = new THREE.PerspectiveCamera( 33, window.innerWidth / window.innerHeight, 1, 10000 );
      camera.position.z = 700;
      camera.position.y = 200;
      
      controls = new THREE.OrbitControls( camera );
      controls.autoRotate=false;

      scene = new THREE.Scene();
    
      // var ambient = new THREE.AmbientLight( 0x444444 );
      // scene.add( ambient );
      //
      // var directionalLight = new THREE.DirectionalLight( 0xffeedd );
      // directionalLight.position.set( 0, 0, 1 ).normalize();
      // scene.add( directionalLight );
    
      renderer = new THREE.WebGLRenderer( { antialias: true } );
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );
      // renderer.sortObjects = false;
      container.appendChild( renderer.domElement );
      
      var axis = new THREE.AxisHelper( 200 );
      // blue is z, red is phi=0
      scene.add( axis );
      axis.visible=true; // off by default
      
      // Add stats
      stats = new Stats();
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.top = '0px';
      container.appendChild( stats.domElement );
      
      // Menu
      
      gui = new dat.GUI();
      // geomFolder   = gui.addFolder('Geometry');
      
      renderer.domElement.addEventListener( 'mousemove', onMouseMove );
      window.addEventListener( 'resize', onWindowResize, false );
      
    }
    
    function _updateMenu(){
      console.log("_updateMenu")
      
      // geometry
      if (guiParameters===undefined) {
        guiParameters["test"]=0
      }
      
      if (geomFolder===undefined) {
        geomFolder   = gui.addFolder('Geometry');
      }
      
      var prop;
      for (prop in detectorGeometry){
        if (!detectorGeometry.hasOwnProperty(prop)){ continue; }
        var layer = detectorGeometry[prop];
        var identifier = layer.Name;
        guiParameters[identifier]=true;
        
        var menu = layer["Menu"] = geomFolder.add( guiParameters, identifier ).name(identifier).listen();
        // console.log("menu: ");
        menu.onChange(function(value) {
          var thisidentifier = this.property;
          // Clumsy - change once we sort our JSON better.
          var thislayer;
          for (prop in detectorGeometry){
          	if (!detectorGeometry.hasOwnProperty(prop)){ continue; }
          	if (detectorGeometry[prop]!==thisidentifier) {continue; }
          }
          console.log("layer[Menu].onChange for ...")
          console.log(layer)
          thislayer.Scene.visible = value;
          // if (parameters['labels']) muonlabels.visible = value;
        });
        // console.log(menu);
        
      }
      console.log(guiParameters);
    }
    
    function _buildGeometryFromLayer(layer) {
      // Add the group which holds the 3D objects
      layer["Scene"] = new THREE.Group();
      console.log(layer)
      // Now build actual geometry
      var geometry;
      switch (layer.Shape) {
      case "CUB":
      case "BOX":
        // xh,yh,zh
        geometry = new THREE.BoxGeometry(layer.Dimensions[0], layer.Dimensions[1], layer.Dimensions[2] );
        break;
      case "CYL":
        // r,th,z
        var outside = new THREE.Shape()
        outside.absarc(0,0,layer.Dimensions[0]+layer.Dimensions[1]/2.0,0.0,Math.PI*2.0,false);
      
        var inside = new THREE.Shape()
        inside.absarc(0,0,layer.Dimensions[0]-layer.Dimensions[1]/2.0,0.0,Math.PI*2.0,true);
      
        outside.holes.push(inside);
        geometry = outside.extrude({ amount: layer.Dimensions[2], bevelEnabled: false });
        break;
      case "DIS":
        // r_i,r_o,th
        // ignoring thickness for the moment.
        geometry = new THREE.RingGeometry( layer.Dimensions[0], layer.Dimensions[1], 32 );;
        break;
      case "TRA":
        //hx1, hx2,hy,th
        var pts = [];
        var hx1 = layer.Dimensions[0]/2.0;
        var hx2 = layer.Dimensions[1]/2.0;
        var h = layer.Dimensions[2]/2.0;
      
        pts.push(new THREE.Vector2(-hx2,h));
        pts.push(new THREE.Vector2(hx2,h));
        pts.push(new THREE.Vector2(hx1,-h));
        pts.push(new THREE.Vector2(-hx1,-h));
      
        var shape = new THREE.Shape( pts );
        geometry = shape.extrude({ amount: layer.Dimensions[3], bevelEnabled: false });
        break;  
      default:
        console.log("Unknown geometry type! ["+layer.Shape+"]");
      }
      return geometry;
    }
    
    function _buildGeometryFromJSON(detgeometry) {
      console.log(detgeometry);
      
      // console.log("buildGeometryFromJSON: Processing "+detgeometry.length+ " layers")
      detectorGeometry = detgeometry;
      // for (var i = 0; i < detgeometry.length; i++){
      var i = 0;
      var prop;
        
      for (prop in detectorGeometry){
        if (!detectorGeometry.hasOwnProperty(prop)){ continue; }

        var layer = detectorGeometry[prop];
        console.log("Layer "+prop+":"+layer);
        
        var geometry = _buildGeometryFromLayer(layer);
        // var material = new THREE.MeshPhongMaterial( { color: 0x00ff00  } );
        if (layer.hasOwnProperty("LayerColor")){
          layer.LayerColor=0x00ff00;
        }
        var material = new THREE.MeshBasicMaterial( { color: layer.Colour, opacity:0.5, transparent:true } );
         // Build objects from geometry.
        var modulecentre; 
        // var coords = layer[2];
        var numCoords = layer.Coords.length/2;
        // console.log("numCoords="+numCoords)
        for (var j = 0; j < numCoords; j++) {
          // console.log(j)
          var index = j*2;
          modulecentre =   new THREE.Vector3( layer.Coords[index][0], layer.Coords[index][1], layer.Coords[index][2] );
          var modulegeometry = geometry.clone();
          var geom = new THREE.Mesh( geometry.clone(), material );
   
          geom.matrix.makeRotationFromEuler( new THREE.Euler( layer.Coords[index+1][0], layer.Coords[index+1][1], layer.Coords[index+1][2]) );
          geom.matrix.setPosition(modulecentre);
          geom.matrixAutoUpdate = false;
          layer["Scene"].add( geom );
      
          var egh = new THREE.EdgesHelper( geom, 0x449458 );
          egh.material.linewidth = 2;
          layer["Scene"].add( egh );
      
          // console.log(layer);
        }
        scene.add(layer["Scene"]);
      }
      // _updateMenu();
    }
    
    function _buildGeometryFromParameters(parameters) {
    
      // Get parameters - will throw exception if anything is missing, but that's fine.
      var moduleName = parameters.ModuleName;      
      var moduleXdim = parameters.Xdim; 
      var moduleYdim = parameters.Ydim; 
      var moduleZdim = parameters.Zdim; 
      var numPhiEl   = parameters.NumPhiEl; 
      var numZEl     = parameters.NumZEl; 
      var radius     = parameters.Radius; 
      
      var minZ       = parameters.MinZ;
      var maxZ       = parameters.MaxZ;
      var tiltAngle  = parameters.TiltAngle;
      var ztiltAngle  = parameters.ZTiltAngle;
      var phiOffset  = parameters.PhiOffset;
      var colour     = parameters.Colour;
      var edgecolour = parameters.EdgeColour;
      console.log('_buildGeometryFromParameters for module '+moduleName)

      // Make the geometry and material
      var geometry = new THREE.BoxGeometry(moduleXdim, moduleYdim, moduleZdim );
      var material = new THREE.MeshBasicMaterial( { color: colour , opacity:0.5, transparent:true } );

      var zstep = (maxZ-minZ)/numZEl
      var phistep = 2.*Math.PI/numPhiEl

      var z = minZ+zstep/2.

      var halfPi = Math.PI/2.0;
      var modulecentre;
      for (var elZ =0; elZ < numZEl ; elZ++){
        console.log(elZ);
        var phi = phiOffset
        for ( var elPhi=0 ; elPhi<  numPhiEl ; elPhi++){
          phi += phistep
          modulecentre = new THREE.Vector3( radius*Math.cos(phi), radius*Math.sin(phi), z );
          var cube = new THREE.Mesh( geometry.clone(), material );
            
          cube.matrix.makeRotationFromEuler( new THREE.Euler( ztiltAngle, 0.0, halfPi + phi+tiltAngle) );
          cube.matrix.setPosition(modulecentre);
          cube.matrixAutoUpdate = false;
          scene.add( cube );
          
          var egh = new THREE.EdgesHelper( cube, edgecolour );
          egh.material.linewidth = 2;
          scene.add( egh );
        }
        z += zstep
      }
    }
    
    function onWindowResize() {
      console.log('onWindowResize: camera x/y='+camera.position.x +'/'+camera.position.y+'\t mouseX/Y='+mouse.x+'/'+mouse.y)

      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize( window.innerWidth, window.innerHeight );

    }
    
    function onMouseMove( e ) {
      // console.log('onMouseMove');
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
  
    function onDocumentMouseMove( event ) {
      mouse.x = ( event.clientX - windowHalfX ) / 2;
      mouse.y = ( event.clientY - windowHalfY ) / 2;
      console.log('onDocumentMouseMove: camera x/y='+camera.position.x +'/'+camera.position.y+'\t mouseX/Y='+mouseX+'/'+mouseY)
    }

    
    function _render() {
      // console.log('camera x/y='+camera.position.x +'/'+camera.position.y+'\t mouseX/Y='+mouseX+'/'+mouseY)
      // camera.position.x += ( mouse.x - camera.position.x ) * .05;
      // camera.position.y += ( - mouse.y - camera.position.y ) * .05;
      // //
      // camera.lookAt( scene.position );
      // console.log(camera.position)
      // console.log(vv);
      // innerdetector.material.uniforms.viewVector.value =  camera.position;
    
      controls.update();    
      stats.update();
      renderer.render( scene, camera );

    }
    EventDisplay.animate = function() {
      // console('animate');
      requestAnimationFrame( EventDisplay.animate );
      _render();
    }
    
    EventDisplay.init = function(){
      _init();
    }
    
    EventDisplay.buildGeometryFromJSON = function(detgeometry){
      _buildGeometryFromJSON(detgeometry.detailed);
    }
    
    EventDisplay.buildGeometryFromParameters = function(parameters){
      _buildGeometryFromParameters(parameters);
    }
    
    return EventDisplay;
  }
  
  if(typeof(EventDisplay) === 'undefined'){
    console.log('EventDisplay not yet known - defining and adding to window.')
    window.EventDisplay = define_EventDisplay();
  }
  else{
    console.log("EventDisplay already defined.");
  }

})(THREE, Stats, window);
