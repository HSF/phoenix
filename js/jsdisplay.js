(function(THREE, Stats, window){
  'use strict';
  
  function define_EventDisplay(){
    var EventDisplay = {};
    
    // Global variables for THREE
    var camera, scene, controls, stats, renderer;
    
    // Global variables for visualisation
	  var detectorGeometry = {};
	  var eventData = {};
    
    // Global variable for GUI etc
    var guiParameters = {};
    var geomFolder,eventFolder, detailedGeomFolder, simpleGeomFolder,gui;
    var mouse = new THREE.Vector2();
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    var onChangeFunction = function(identifier, this_collection){
          return function(value){
            console.log("onChange1 for "+identifier);
            this_collection.Scene.visible = value;
          }
        };

    function _init(){
      
      var container;

      container = document.createElement( 'div' );
      document.body.appendChild( container );
      
      camera = new THREE.PerspectiveCamera( 33, window.innerWidth / window.innerHeight, 1, 10000 );
      camera.position.z = 2500;
      camera.position.y = 200;
      camera.position.x = 1000;
      
      // Reset far clip plane
      camera.far = camera.position.length()*50.0;
      camera.updateProjectionMatrix();
      
      controls = new THREE.OrbitControls( camera );
      controls.autoRotate=false;
      
      scene = new THREE.Scene();
      scene.name="Root"
    
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
      
      var axis = new THREE.AxisHelper( 2000 );
      // blue is z, red is phi=0
      scene.add( axis );
      axis.visible=false; // off by default
      
      // Add stats
      stats = new Stats();
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.top = '0px';
      container.appendChild( stats.domElement );
      
      // Menu
      gui = new dat.GUI();
      
      var controlsFolder   = gui.addFolder('Controls');
      guiParameters.rotate=controls.autoRotate;
      var autoRotate = controlsFolder.add( guiParameters, 'rotate' ).name('Auto Rotate?').listen();
      autoRotate.onChange(function(value)
      { controls.autoRotate=value; });
      
      guiParameters.axis=false;
      var axisVis = controlsFolder.add( guiParameters, 'axis' ).name('Axes').listen();
      axisVis.onChange(function(value)
      { axis.visible = value; });
      guiParameters.Geometry = false;
      
      
      renderer.domElement.addEventListener( 'mousemove', onMouseMove );
      window.addEventListener( 'resize', onWindowResize, false );
      
    }
    
    function _getPosition(length, eta, phi){
      var theta = 2 * Math.atan(Math.pow(Math.E,eta) );
      return new THREE.Vector3( length* Math.cos(phi)*Math.sin(theta), 
                                  length * Math.sin(phi)*Math.sin(theta), 
                                  length * Math.cos(theta) );
    }
    
    function _updateMenu(){
      console.log("_updateMenu");
      // Take care of the uppermost level stuff.
      
      if (geomFolder===undefined) {
        geomFolder   = gui.addFolder('Geometry');
        // detailedGeomFolder   = geomFolder.addFolder('Detailed');
        // simpleGeomFolder   = geomFolder.addFolder('Simplified');
      }
      // TODO - add cleanup.
      // _buildGeometryMenu('Detailed', detailedGeomFolder);
      // _buildGeometryMenu('Simplified', geomFolder);
      _buildGeometryMenu(detectorGeometry, geomFolder);
      // scene.add(detectorGeometry.Scene);
      // detectorGeometry.Scene.visible = guiParameters["Geometry"] = false;
      // onChangeFunction(detectorGeometry.Name, detectorGeometry);
      
      // _buildEventMenu();
      // console.log(guiParameters);
      console.log(scene);
    }
    
    function _buildGeometryMenu(volume, currentfolder){
      console.log("_buildGeometryMenu for ",volume.Name);
      console.log(volume);
      
      // Add the group which holds the 3D objects
      volume.Scene = new THREE.Group();
      volume.Scene.name=volume.Name;
      
      guiParameters[volume.Name]=true; // FIXME - we should check that this is unique?
      volume["Menu"] = currentfolder.add( guiParameters, volume.Name ).name("Show").listen();
      volume["Menu"].onChange( onChangeFunction( volume.Name, volume) );
      volume.Scene.visible = guiParameters[volume.Name];
      
      // if (level) {
      //   var levelGeometry = detectorGeometry[level];
      var len=0,i=0,vname='';   
      
      if (('Volumes' in volume) && (volume.Volumes.length>0)){
        // console.log('Lets add some more levels');
        for (len = volume.Volumes.length, i=0;i<len;++i){
          console.log('i:',i)
          _buildGeometryMenu(volume.Volumes[i], currentfolder.addFolder(volume.Volumes[i].Name));
          volume.Scene.add(volume.Volumes[i].Scene);
        }
      }

      // Ignoring this for the moment - will put it back in one day.
      
      // var count = 0;
//
//
//       for (var k in levelGeometry) if (levelGeometry.hasOwnProperty(k)) ++count;
//       var hasMoreThanTenEntries=false;
//       var currentFolder =guifolder;
//
//       if (count>10) {
//         hasMoreThanTenEntries=true;
//         currentFolder =  guifolder.addFolder('Subfolder1');
//       }
//       count=0;
//       var folderCount=2;

      if (('Layers' in volume) && (volume.Layers.length>0)){
        for (len = volume.Layers.length, i=0;i<len;++i){
          var layer = volume.Layers[i];
          console.log('Adding menu for layer', layer);
          // var identifier = prop + " " + layer.Shape;
          var identifier = 'Layer '+layer.Index;
          // if (layer.Name) identifier = layer.Name;
          guiParameters[identifier]=true; // FIXME - we should check that this is unique?
          var menu = layer["Menu"] = currentfolder.add( guiParameters, identifier ).name(identifier).listen();
          menu.onChange( onChangeFunction( identifier, layer) );
          
          // Now make 3D
          var geometry = _buildGeometryFromLayer(layer);
          _buildShapeFromLayer(layer,geometry,volume);
        }
      }
    

      // var prop;
      // for (prop in levelGeometry){
      //   count++;
      //   if (!levelGeometry.hasOwnProperty(prop)){ continue; }
      //   var layer = levelGeometry[prop];
      //   // console.log(layer)
      //   var identifier = prop + " " + layer.Shape;
      //   if (layer.Name) identifier = layer.Name;
      //
      //   guiParameters[identifier]=true;
      //   if (count%10===0){
      //     // console.log("Adding folder "+folderCount)
      //     currentFolder =  guifolder.addFolder('Subfolder '+folderCount++);
      //   }
      //
      //   var menu = layer["Menu"] = currentFolder.add( guiParameters, identifier ).name(identifier).listen();
      //   // console.log("menu: ");
      //   menu.onChange( onChangeFunction( identifier, layer) );
      // }
    }
    
    function _buildGeometryFromLayer(layer) {
      // console.log(layer)
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
        var outside = new THREE.Shape();
        outside.absarc(0,0,layer.Dimensions[0]+layer.Dimensions[1]/2.0,0.0,Math.PI*2.0,false);

        var inside = new THREE.Shape();
        inside.absarc(0,0,layer.Dimensions[0]-layer.Dimensions[1]/2.0,0.0,Math.PI*2.0,true);

        outside.holes.push(inside);
        geometry = outside.extrude({ amount: layer.Dimensions[2]*2.0, bevelEnabled: false });
        break;
      case "DIS":
      case "DISC":
        // r_i,r_o,th
        // ignoring thickness for the moment.
        geometry = new THREE.RingGeometry( layer.Dimensions[0], layer.Dimensions[1], 32 );
        break;
      case "TRA":
        //hx1, hx2,hy,th
        var pts = [];
        var hx1 = layer.Dimensions[0];
        var hx2 = layer.Dimensions[1];
        var h = layer.Dimensions[2];
        // var h = 10;
        pts.push(new THREE.Vector2(-hx2,h));
        pts.push(new THREE.Vector2(hx2,h));
        pts.push(new THREE.Vector2(hx1,-h));
        pts.push(new THREE.Vector2(-hx1,-h));

        var shape = new THREE.Shape( pts );
        geometry = shape.extrude({ amount: 1.0, bevelEnabled: false });
        break;
      default:
        console.log("Unknown geometry type! ["+layer.Shape+"]");
      }
      // console.log(geometry)
      return geometry;
    }
    
    function _buildGeometryFromJSON(detgeometry) {
      console.log('_buildGeometryFromJSON with this geom:');
      console.log(detgeometry);
      
      // console.log("buildGeometryFromJSON: Processing "+detgeometry.length+ " layers")
      detectorGeometry = detgeometry;
      // detectorGeometry.Scene = new THREE.Group(); // Will hold 3D objects
      // detectorGeometry.Scene.name="DetectorGeometry"
      
      // for (var i = 0; i < detgeometry.length; i++){
      // _buildGeometryLevelFromJSON(detgeometry); // FIXME!
      // detectorGeometry.Scene.visible = guiParameters["Geometry"];
      // console.log("vis = "+guiParameters["Geometry"])
      _updateMenu();
      scene.add(detectorGeometry.Scene);
      detectorGeometry.Scene.visible = guiParameters[detectorGeometry.Name]=false;
      
    }
    
    function _buildShapeFromLayer(layer,geometry,volume) {
      
      // Add the group which holds the 3D objects
      layer.Scene = new THREE.Group();
      layer.Scene.name = "Layer" + layer.Index + ":"+layer.Shape
      
      // var material = new THREE.MeshPhongMaterial( { color: 0x00ff00  } );
      if (!layer.hasOwnProperty("Colour")){
        layer.Colour=0x00ff00;
      }
      
      if (!layer.hasOwnProperty("EdgeColour")){
        layer.EdgeColour=0x00dd00;
      }
      var material = new THREE.MeshBasicMaterial( { color: Number(layer.Colour), opacity:0.5, transparent:true } );
      var materialDS = new THREE.MeshBasicMaterial( { color: Number(layer.Colour), opacity:0.5, transparent:true, side:THREE.DoubleSide } );
       // Build objects from geometry.
      var modulecentre; 
      // var coords = layer[2];
      var numCoords = layer.Coords.length/2;
      // console.log("numCoords="+numCoords)
      for (var j = 0; j < numCoords; j++) {
        // console.log(j)
        var index = j*2;
        modulecentre =   new THREE.Vector3( layer.Coords[index][0], layer.Coords[index][1], layer.Coords[index][2] );
        // if it's a cylinder, we need to shift along z.
        if (layer.Shape=='CYL') modulecentre.z -= layer.Dimensions[2];
        var modulegeometry = geometry.clone();
        
        var geom;
        if (layer.Shape=='DIS' || layer.Shape=='DISC')  {
          geom = new THREE.Mesh( geometry.clone(), materialDS );
        } else {
          geom = new THREE.Mesh( geometry.clone(), material );
        }
        geom.matrix.makeRotationFromEuler( new THREE.Euler( layer.Coords[index+1][0], layer.Coords[index+1][1], layer.Coords[index+1][2]) );
        geom.matrix.setPosition(modulecentre);
        geom.matrixAutoUpdate = false;
        layer.Scene.add( geom );
    
        var egh = new THREE.EdgesHelper( geom, Number(layer.EdgeColour) );
        egh.material.linewidth = 2;
        layer.Scene.add( egh );
    
        // console.log(layer);
      }
      volume.Scene.add(layer["Scene"]);
    }
    
    function _buildGeometryLevelFromJSON(volume) {
      // for (var i = 0; i < detgeometry.length; i++){
      console.log('_buildGeometryLevelFromJSON: level',volume);
        
      // var levelGeometry = detectorGeometry[level]; // FIXME!
      
      
      
      for (var prop in levelGeometry){
        if (!levelGeometry.hasOwnProperty(prop)){ continue; }

        var layer = levelGeometry[prop];
        // console.log("Layer "+prop+":"+layer);
        var geometry = _buildGeometryFromLayer(layer);
        _buildShapeFromLayer(layer, geometry)
      }
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
      // console.log('_buildGeometryFromParameters for module '+moduleName)

      // Make the geometry and material
      var geometry = new THREE.BoxGeometry(moduleXdim, moduleYdim, moduleZdim );
      var material = new THREE.MeshBasicMaterial( { color: colour , opacity:0.5, transparent:true } );

      var zstep = (maxZ-minZ)/numZEl;
      var phistep = 2.*Math.PI/numPhiEl;

      var z = minZ+zstep/2.;

      var halfPi = Math.PI/2.0;
      var modulecentre;
      for (var elZ =0; elZ < numZEl ; elZ++){
        console.log(elZ);
        var phi = phiOffset;
        for ( var elPhi=0 ; elPhi<  numPhiEl ; elPhi++){
          phi += phistep;
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
    
    function _buildEventDataFromJSON(eventdata) {
      //console.log("dumping eventdata:");
      //console.log(eventdata);
      eventData = eventdata; // YUCK
      eventFolder   = gui.addFolder('Reconstruction');
      var eventScene = new THREE.Group();

      // Switch to turn off all reco
      var recoIdentifier = "Show";
      guiParameters[recoIdentifier]=true; // On by default      
      eventData.Menu = eventFolder.add( guiParameters, recoIdentifier ).name(recoIdentifier).listen();
      eventData.Menu.onChange( onChangeFunction( recoIdentifier, eventData) );
      
      // console.log(recoMenu);
      
      // Fill data      
      _addEventCollections(eventData["xAOD::Type::TrackParticle"], _addTrack, "Tracks", eventScene);
      _addEventCollections(eventData["xAOD::Type::Jet"], _addJet, "Jets", eventScene);
      // _addEventCollections(eventData["Measurement"], _addMeasurement);
      
      // Caloclusters - special because we need dimensions of calorimeter.
      // TODO - get from JSON?
      var clustercollections = eventData["xAOD::Type::CaloCluster"];
      var typeFolder =  eventFolder.addFolder("CaloClusters");
      
      var collscene;
      for (var collname in clustercollections){
        if (!clustercollections.hasOwnProperty(collname)){ continue; }
        var collection = clustercollections[collname];
        if (!collection) {continue;}
        collscene = new THREE.Group();
        for (var clusname in collection) {
          if (!collection.hasOwnProperty(clusname)){ continue; }
          _addCluster(collection,clusname,collscene, 1100.0, 3200.0)
          
        }
        collection.Scene = collscene;
        eventScene.add(collection.Scene)
        // _addMenuEventCollection(typeFolder, collection)
        guiParameters[collname]=true; // On by default
        collection.Menu = typeFolder.add( guiParameters, collname ).name(collname).listen();
        collection.Menu.onChange( onChangeFunction( collname, collection) );
      }
      
      eventData.Scene = eventScene;
      scene.add(eventData.Scene);
      
    }

    function _addEventCollections(collections, addObject, folder, scene){
      var collscene;
      var typeFolder =  eventFolder.addFolder(folder);
      
      for (var collname in collections){
        if (!collections.hasOwnProperty(collname)){ continue; }
        var collection = collections[collname];
        if (!collection) {continue;}
        collscene = new THREE.Group();

        for (var objname in collection) {
            if (!collection.hasOwnProperty(objname)){ continue; }
            addObject(collection,objname,collscene)
        }
        
        guiParameters[collname]=true; // On by default
        collection.Menu = typeFolder.add( guiParameters, collname ).name(collname).listen();
        collection.Menu.onChange( onChangeFunction( collname, collection) );
        
        collection.Scene = collscene;
        scene.add(collection.Scene)
      }
    }
    
    function _addTrack(tracks, trkName, scene){
      // console.log('Adding track '+trkName+' which is of type '+tracks[trkName].type)
      var length = 100;
      var colour = 0x00ff2d;
      
      var positions = tracks[trkName].pos;
      var numPoints = positions.length;
      if (numPoints<3){
        console.log("Track with too few points. Skipping.");
        return;
      }
      var points = [];
      
      for (var i=0; i<numPoints;i++){
        points.push(new THREE.Vector3(positions[i][0],positions[i][1],positions[i][2]) );
      }
      var curve = new THREE.SplineCurve3( points );
      var geometry = new THREE.Geometry();
      geometry.vertices = curve.getPoints( 150 );
      var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
      var splineObject = new THREE.Line( geometry, material );

      scene.add( splineObject );
    }
    
    function _addCluster(clustercollections, clusName, scene, maxR, maxZ){
      // console.log('Adding cluster '+clusName+' with energy '+clustercollections[clusName].energy)
      var length = clustercollections[clusName].energy*0.003;
      var geometry = new THREE.BoxGeometry( 30, 30, length );
      var material = new THREE.MeshBasicMaterial( { color: Math.random()*0xffffff } );
      var cube = new THREE.Mesh( geometry, material );
      
      var pos = _getPosition(4000.0, clustercollections[clusName].eta, clustercollections[clusName].phi);
      cube.position.x = pos.x;
      cube.position.y = pos.y;
      if (pos.x*pos.x+pos.y*pos.y > maxR * maxR) {
        cube.position.x = maxR*Math.cos(clustercollections[clusName].phi);
        cube.position.y = maxR*Math.sin(clustercollections[clusName].phi);
      }
      cube.position.z = Math.max(Math.min(pos.z, maxZ), -maxZ); // keep in maxZ range.
      cube.lookAt(new THREE.Vector3( 0, 0, 0 ));
      // console.log('Adding cluster '+clusName+' at ');
      //console.log(cube.position);
      
      scene.add( cube );
    }
    
    function _addJet(jetcollections, jetName, scene){
      // console.log('Adding jet '+jetName+' with energy '+clustercollections[clusName].energy)
      // var dR = jetcollections[jetName].coneR;
  
      var eta = jetcollections[jetName].eta;
      var phi = jetcollections[jetName].phi;
      var theta = 2 * Math.atan(Math.pow(Math.E,eta) );
      var length = jetcollections[jetName].energy*0.01;
      var width = length*0.1;

      var sphi   = Math.sin(phi);
      var cphi   = Math.cos(phi);
      var stheta = Math.sin(theta);
      var ctheta = Math.cos(theta);
      //
      var translation = new THREE.Vector3( 0.5*length*cphi*stheta, 0.5*length*sphi*stheta, 0.5*length*ctheta );
    
      var x=cphi*stheta, y=sphi*stheta, z=ctheta;
      var v1=new THREE.Vector3(0,1,0);
      var v2=new THREE.Vector3(x,y,z);
      var quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(v1,v2);
    
      var geometry = new THREE.CylinderGeometry(width, 1, length, 50, 50, false) ; // Cone
 
      var material = new THREE.MeshBasicMaterial({color: 0x2194CE, opacity: 0.3, transparent: true});
      material.opacity = 0.5;
      var mesh = new THREE.Mesh( geometry, material ) ;
      mesh.position.copy( translation );
      mesh.quaternion.copy(quaternion);
      // mesh.matrixAutoUpdate = false;
      scene.add( mesh );
  
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
    };
    
    EventDisplay.init = function(){
      _init();
    };
    
    EventDisplay.buildGeometryFromJSON = function(detgeometry){
      // console.log("EventDisplay.buildGeometryFromJSON ")
      _buildGeometryFromJSON(detgeometry);
    };
    
    EventDisplay.buildGeometryFromParameters = function(parameters){
      _buildGeometryFromParameters(parameters);
    };
    
    EventDisplay.buildEventDataFromJSON = function(edgeometry){
      // console.log(detgeometry)
      _buildEventDataFromJSON(edgeometry);
    };
    
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
