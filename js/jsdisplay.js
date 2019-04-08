(function(THREE, Stats, window){
  'use strict';
  
  function define_EventDisplay(){
    var EventDisplay = {};
    
    // Global variables for THREE
    var camera, scene, controls, stats, renderer, raycaster;
    
		var clipPlanes = [
			new THREE.Plane( new THREE.Vector3( 1,  0,  0 ), 0 ), 
      new THREE.Plane( new THREE.Vector3( 0, -1,  0 ), 0 ),
      new THREE.Plane( new THREE.Vector3( 0,  0, -1 ), 0 )
		];
    
    // Global variables for visualisation
	  var detectorGeometry = {};
    var geomcolour;
	  var objGeometry = {};
	  var eventData = {};
    var animationSphere = 0;
    var trackPointsObj;
        
    //configuration
    var configuration = {};
    var fileApiAvailable = true;
    
    // Global variable for GUI etc
    var guiParameters = {};
    var geomFolder,eventFolder, detailedGeomFolder, simpleGeomFolder,gui;
    var mouse = new THREE.Vector2();
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    var onChangeFunction = function(identifier, this_collection){
          return function(value){
            console.log("onChange1 for "+identifier+" with value="+value);
            console.log(this_collection);
            console.log("this_collection.Scene.visible"+this_collection.Scene.visible);
            this_collection.Scene.visible = value;
          };
        };
    
    // var wwObjLoader2 = new THREE.OBJLoader2.WWOBJLoader2();
    // wwObjLoader2.setCrossOrigin( 'anonymous' );
    
    // Selection
    var lastSelectedObject=0;
    var lastSelectedObjectMaterial=0;

    function _init( newConf ){
      configuration = newConf;
      var container;

      container = document.createElement( 'div' );
      document.body.appendChild( container );
    
      scene = new THREE.Scene();
      scene.name="Root";
      
      camera = new THREE.PerspectiveCamera( 33, window.innerWidth / window.innerHeight, 1, 10000 );
      camera.position.z = 4500;
      camera.position.y = 2900;
      camera.position.x = -6500;
      
      // Reset far clip plane
      camera.far = camera.position.length()*50.0;
      camera.updateProjectionMatrix();
      scene.add(camera);
      
      // var ambient = new THREE.AmbientLight( 0x707070 );
      // scene.add( ambient );
      
			var ambientLight = new THREE.AmbientLight( 0x404040 );
			var directionalLight1 = new THREE.DirectionalLight( 0xC0C090 );
			var directionalLight2 = new THREE.DirectionalLight( 0xC0C090 );

			directionalLight1.position.set( -100, -50, 100 );
			directionalLight2.position.set( 100, 50, -100 );

			scene.add( directionalLight1 );
			scene.add( directionalLight2 );
			scene.add( ambientLight );
       
      var directionalLight = new THREE.PointLight( 0xeeeedd );
      directionalLight.position.set( camera.position );
      // directionalLight.target(new THREE.Vector3(0,0,0));
      // camera.add( directionalLight );
      
      raycaster = new THREE.Raycaster();
      raycaster.linePrecision = 5;
    
      renderer = new THREE.WebGLRenderer( { antialias: true } );
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );
      renderer.localClippingEnabled = true;
      // renderer.sortObjects = false;
      container.appendChild( renderer.domElement );
      
      controls = new THREE.OrbitControls( camera, renderer.domElement );
      controls.autoRotate=false;
      
      if (configuration.allowShowAxes) {
        var axis = new THREE.AxesHelper( 2000 );
        // blue is z, red is phi=0
        scene.add( axis );
        axis.visible=false; // off by default
      }
      
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
      
      if (configuration.allowShowAxes) {      
        guiParameters.axis=false;
        var axisVis = controlsFolder.add( guiParameters, 'axis' ).name('Axes').listen();
        axisVis.onChange(function(value)
        { axis.visible = value; });
      }
      // guiParameters.Geometry = false;
      
      guiParameters.clipping=renderer.localClippingEnabled;
      var doClipping = controlsFolder.add( guiParameters, 'clipping' ).name('Enable clipping').listen();
      doClipping.onChange(function(value)
      { renderer.localClippingEnabled=value; });
      
			guiParameters.clipIntersection = true;
			guiParameters.xClipPosition = 0;
			guiParameters.yClipPosition = 0;
			guiParameters.zClipPosition = -configuration.zClipPosition;
      
      // controlsFolder.add( guiParameters, 'clipIntersection' ).onChange( function () {
      //   for (var geometry in objGeometry) {
      //     var children = geometry.Scene.children;
      //     for ( var i = 0; i < children.length; i ++ ) {
      //       var child = children[ i ];
      //       child.material.clipIntersection = ! child.material.clipIntersection;
      //     }
      //   }
      //   }
      // );
      controlsFolder.add( guiParameters, 'xClipPosition', -configuration.xClipPosition, configuration.xClipPosition );
      controlsFolder.add( guiParameters, 'yClipPosition', -configuration.yClipPosition, configuration.yClipPosition );
      controlsFolder.add( guiParameters, 'zClipPosition', -configuration.zClipPosition, configuration.zClipPosition );
      
      guiParameters.selectObj=true;
      var selectObj = controlsFolder.add( guiParameters, 'selectObj' ).name('Select?').listen();
      selectObj.onChange(function(value)
      { selectObj = value; });
      
      var geomFileInput = document.getElementById( configuration.geomFileUploader );
      
      if ( fileApiAvailable && geomFileInput) {
        guiParameters.loadObjFile = function () {
        					geomFileInput.click();
        				};
        controlsFolder.add( guiParameters, 'loadObjFile' ).name( 'Load OBJ/MTL Files' );
        
        // var handleFileSelect = function ( object3d ) {
        //           _handleObjFileSelect( object3d );
        //         };
        geomFileInput.addEventListener( 'change' , _handleObjFileSelect, false );
        
      }
      
      var eventFileInput = document.getElementById( configuration.eventFileUploader );
      
      if ( fileApiAvailable && eventFileInput) {
        guiParameters.loadEventFile = function () {
        					eventFileInput.click();
        				};
        controlsFolder.add( guiParameters, 'loadEventFile' ).name( 'Load event Files' );
        
        // var handleFileSelect = function ( eventFile ) {
        //           _handleEventFileSelect( this.eventFile );
        //         };
        eventFileInput.addEventListener( 'change' , _handleEventFileSelect, false );    
      }
      
      window.addEventListener( 'resize', onWindowResize, false );
      // renderer.domElement.addEventListener( 'mousemove', onMouseMove, false );
      renderer.domElement.addEventListener( 'click', onMouseClick, false );      
    }
    
    function _handleObjFileSelect( object3d ) {
      var fileObj = null;
  		var fileMtl = null;
  		var files = event.target.files;
  		for ( var i = 0, file; !!(file = files[ i ]); i++) {
  			if ( file.name.indexOf( '\.obj' ) > 0 && fileObj === null ) {
  				fileObj = file;
  			}
  			if ( file.name.indexOf( '\.mtl' ) > 0 && fileMtl === null ) {
  				fileMtl = file;
  			}
  		}
      
      var Validator = THREE.OBJLoader2.prototype._getValidator();
			if ( ! Validator.isValid( fileObj ) ) {
				alert( 'Unable to load OBJ file from given files. If you want to load a MTL file as well, select them both at the same time.' );
			} else {
        console.log(fileObj);
        
        if (fileMtl) {
          var mtlLoader = new THREE.MTLLoader();
  				mtlLoader.setPath( 'obj/male02/' );
  				mtlLoader.load( 'male02_dds.mtl', function( materials ) {
  					materials.preload();
  					var objLoader = new THREE.OBJLoader();
  					objLoader.setMaterials( materials );
  					objLoader.setPath( 'obj/male02/' );
  					objLoader.load( 'male02.obj', function ( object ) {
  						object.position.y = - 95;
  						scene.add( object );
  					}, onProgress, onError );
  				});
        } else {
    			var fileReader = new FileReader();
    			fileReader.onload = function( fileDataObj ) {
    				console.log('fileReader onload ',fileDataObj);
    				_loadGeomFromObj(fileDataObj.target.result, fileObj.name.replace('.obj',''), fileMtl);
    			};
    			fileReader.readAsDataURL( fileObj );
        }
      }
    }
    
    function _handleEventFileSelect( eventfile ) {
      console.log("Calling custom convertor for ", eventfile.target.files);
      
      var eventNum=null;
      var filename="";
      for (var i = 0; i < eventfile.target.files.length; i++){
        filename=eventfile.target.files[i].name;
        console.log(filename);
        if (! eventNum){
          eventNum = parseInt(filename.match(/\d+/));
        } else {
          if (parseInt(filename.match(/\d+/))!=eventNum) {
            console.log('Error, mismatched event numbers. Aborting.');
            _printInfoMessage('Error, you attempted to load files with mismatched event numbers. Aborting.');
            return;
          }
        } 
      }
      
      if (configuration.customEventFileConvertor) {
        console.log("Calling custom convertor for ", eventfile.target.files);
        configuration.customEventFileConvertor(eventfile.target.files, eventNum);
      } else {
        console.log('Got event files: ', event.target.files);
  			var fileReader = new FileReader();
  			fileReader.onload = function( fileDataObj ) {
  				console.log('fileReader onload ',fileDataObj);
          var myArr = JSON.parse(fileDataObj.target.result);
  				_buildEventDataFromJSON(myArr);
  			};
  			fileReader.readAsText( event.target.files[0]);
      }
    }
    
    function _getPosition(length, eta, phi){
      var theta = 2 * Math.atan(Math.pow(Math.E,eta) );
      return new THREE.Vector3( length* Math.cos(phi)*Math.sin(theta), 
                                  length * Math.sin(phi)*Math.sin(theta), 
                                  length * Math.cos(theta) );
    }
    
    // function _updateMenu(){
    //   console.log("_updateMenu");
    //   // Take care of the uppermost level stuff.
    //
    //   if (geomFolder===undefined) {
    //     geomFolder   = gui.addFolder('Geometry');
    //     // detailedGeomFolder   = geomFolder.addFolder('Detailed');
    //     // simpleGeomFolder   = geomFolder.addFolder('Simplified');
    //   }
    //   // TODO - add cleanup.
    //   // _buildGeometryMenu('Detailed', detailedGeomFolder);
    //   // _buildGeometryMenu('Simplified', geomFolder);
    //   _buildGeometryMenu(detectorGeometry, geomFolder);
    //   // scene.add(detectorGeometry.Scene);
    //   // detectorGeometry.Scene.visible = guiParameters["Geometry"] = false;
    //   // onChangeFunction(detectorGeometry.Name, detectorGeometry);
    //
    //   // _buildEventMenu();
    //   // console.log(guiParameters);
    //   console.log(scene);
    // }
    
    function _buildGeometry(volume, currentfolder){
      console.log("_buildGeometry for ",volume.Name);
      console.log(volume);
      
      // Add the group which holds the 3D objects
      volume.Scene = new THREE.Group();
      volume.Scene.name=volume.Name;
      
      guiParameters[volume.Name]=true; // FIXME - we should check that this is unique?
      volume.Menu = currentfolder.add( guiParameters, volume.Name ).name("Show").listen();
      volume.Menu.onChange( onChangeFunction( volume.Name, volume) );
      volume.Scene.visible = guiParameters[volume.Name];
      
      // if (level) {
      //   var levelGeometry = detectorGeometry[level];
      var len=0,i=0,vname='';   
      
      if (('Volumes' in volume) && (volume.Volumes.length>0)){
        // console.log('Lets add some more levels');
        for (len = volume.Volumes.length, i=0;i<len;++i){
          console.log('i:',i);
          _buildGeometry(volume.Volumes[i], currentfolder.addFolder(volume.Volumes[i].Name));
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

      if ( configuration.showSurfaces && ('Layers' in volume) && (volume.Layers.length>0)){
        for (len = volume.Layers.length, i=0;i<len;++i){
          var layer = volume.Layers[i];
          console.log('Adding menu for layer', layer);
          // var identifier = prop + " " + layer.Shape;
          var identifier = 'Layer '+layer.Index;
          // if (layer.Name) identifier = layer.Name;
          guiParameters[identifier]=true; // FIXME - we should check that this is unique?
          var menu = layer.Menu = currentfolder.add( guiParameters, identifier ).name(identifier).listen();
          menu.onChange( onChangeFunction( identifier, layer) );
          
          // Now make 3D
          var geometry1 = _buildGeometryFromLayer(layer);
          _buildShapeFromLayer(layer,geometry1,volume);
        }
      }
      
      if (configuration.showVolumes && ('Bounds' in volume) ){
        // console.log('Lets make 3d volume from ',volume);
        var geometry2 = _buildGeometryFromVolume(volume);
        _buildShapeFromVolume(geometry2,volume);
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
        var boxgeometry = new THREE.BoxGeometry(layer.Dimensions[0], layer.Dimensions[1], layer.Dimensions[2] );
        geometry = new THREE.BufferGeometry();
        geometry.fromGeometry(boxgeometry);
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
    
    function _buildGeometryFromJSON(detgeometry, showsurfaces, showvolumes) {
      console.log('_buildGeometryFromJSON with this geom:', 'showsurfaces',showsurfaces,'showvolumes',showvolumes);
      console.log(detgeometry);
      
      // console.log("buildGeometryFromJSON: Processing "+detgeometry.length+ " layers")
      detectorGeometry = detgeometry;
      configuration.showSurfaces = showsurfaces;
      configuration.showVolumes = showvolumes;
      
      // Let's build the menu and geometry
      if (geomFolder===undefined) {
        geomFolder   = gui.addFolder('Geometry');
      }

      _buildGeometry(detectorGeometry, geomFolder);
      guiParameters.Geometry = false;
      
      scene.add(detectorGeometry.Scene);
      // detectorGeometry.Scene.visible = guiParameters[detectorGeometry.Name]=false;
      // detectorGeometry.Scene.visible = guiParameters[detectorGeometry.Name]=false;
    }
    
    function _setObjFlat( object3d, colour, doublesided ) {
      // console.log(object3d, colour);
      var material2 = new THREE.MeshPhongMaterial({ color: colour, wireframe: false });
      // material2.flatShading = false;
      material2.clippingPlanes = clipPlanes;
      material2.clipIntersection = true;
      material2.clipShadows = false;
      material2.wireframe = false;
      if (doublesided) material2.side = THREE.DoubleSide;
      
      // var wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, wireframeLinewidth: 10 });
      // wireframeMaterial.clippingPlanes = clipPlanes;
      // wireframeMaterial.clipIntersection = true
      // wireframeMaterial.clipShadows = false;
      
      object3d.traverse( function(child) {
          if (child instanceof THREE.Mesh) {

            console.log('Found mesh');
            // apply custom material
            // child.material = [ material2, wireframeMaterial ];
            child.material = material2;

            // enable casting shadows
            child.castShadow = false;
            child.receiveShadow = false;
          }
        });
      
			// if ( object3d.material ) {
//         console.log("material");
//
//         _setMatFlat( object3d.material );
//       } else {
//         console.log("No material!");
//         var material2 = new THREE.MeshLambertMaterial({ color: 0xa65e00 });
//         material2.shading = THREE.FlatShading;
//         object3d.material = material2;
//       }
		}
    
    function _loadGeomFromObj(objectname, name, colour, doublesided, materials){ 
      // by default, let's clear the existing geometry here.
      
      if (!colour ) {
        geomcolour = 0x41a6f4;     
      } else {
        geomcolour=colour;
      }
      
			var manager = new THREE.LoadingManager();
			manager.onProgress = function ( item, loaded, total ) {
				console.log( item, loaded, total );
			};
      
			var onProgress = function ( xhr ) {
				if ( xhr.lengthComputable ) {
					var percentComplete = xhr.loaded / xhr.total * 100;
					console.log( Math.round(percentComplete, 2) + '% downloaded' );
				}
			};
			var onError = function ( xhr ) {
        console.log('Error loading');
			};
      
      var testOBJ2Loader=true;
      var loader;
      if (testOBJ2Loader){
        console.log('Using OBJLoader2 for '+name);
        // loader = new THREE.OBJLoader2( manager );
        //         if (materials) loader.setMaterials(materials);  
        // loader.load( objectname, function ( object ) {
        //         _setObjFlat(object, colour);
        //         // console.log('Add object');
        //         scene.add( object );
        //         objGeometry[name]={
        //           Scene: object,
        //           Colour: colour,
        //           Menu: 0
          //         }

				var callbackOnLoad = function ( event ) {
					console.log( 'Loading complete: ' + event.detail.modelName );
          console.log(scene);
          _setObjFlat(event.detail.loaderRootNode, colour, doublesided);
				};
      
        var Validator = THREE.LoaderSupport.Validator;
      
				var callbackOnProgress = function( event ) {
					var output = Validator.verifyInput( event.detail.text, '' );
					console.log( 'Progress: ' + output );
				};
        
        var prepData = new THREE.LoaderSupport.PrepData( name );  
        var local = new THREE.Object3D( );
        local.name=name;
        scene.add( local );

        prepData.setStreamMeshesTo( local );
        prepData.addResource( new THREE.LoaderSupport.ResourceDescriptor( objectname, 'OBJ' ) );

				var callbacks = prepData.getCallbacks();
				callbacks.setCallbackOnProgress( callbackOnProgress );
				callbacks.setCallbackOnLoad( callbackOnLoad );
        
				var objLoader = new THREE.OBJLoader2();
				objLoader.run( prepData );
        objGeometry[name]={
          Scene: local,
          Colour: colour,
          Menu: 0
        };
        var geometry  = objGeometry[name];
        if (geomFolder===undefined) {
          geomFolder   = gui.addFolder('Geometry');
        }
        guiParameters.Geometry = true;

        guiParameters[name]=true; // FIXME - we should check that this is unique?
        geometry.Menu = geomFolder.add( guiParameters, name).name(name).listen();
        geometry.Menu.onChange( onChangeFunction( name, geometry) );
        geometry.Scene.visible = guiParameters[name];
        
      } else {
        var manager2 = new THREE.LoadingManager();
        			manager2.onProgress = function ( item, loaded, total ) {
        				console.log( item, loaded, total );
        			};
      
        			var onProgress2 = function ( xhr ) {
        				if ( xhr.lengthComputable ) {
        					var percentComplete = xhr.loaded / xhr.total * 100;
        					console.log( Math.round(percentComplete, 2) + '% downloaded' );
        				}
        			};
        			var onError2 = function ( xhr ) {
                console.log('Error loading');
        			};
      
        			loader = new THREE.OBJLoader( manager2 );    
              loader.load( objectname, function ( object ) {
                      _setObjFlat(object, colour, doublesided);
                      // console.log('Add object');
                      scene.add( object );
                      objGeometry[name]={
                        Scene: object,
                        Colour: colour,
                        Menu: 0
                      };
        var geometry  = objGeometry[name];
        // geometry.computeFaceNormals();
        // console.log(geometry);
      
        if (geomFolder===undefined) {
          geomFolder   = gui.addFolder('Geometry');
        }
        guiParameters.Geometry = true;

        guiParameters[name]=true; // FIXME - we should check that this is unique?
        geometry.Menu = geomFolder.add( guiParameters, name).name(name).listen();
        geometry.Menu.onChange( onChangeFunction( name, geometry) );
        geometry.Scene.visible = guiParameters[name];
			}, onProgress2, onError2 );
    }
  }
  
    function _buildGeometryFromVolume(volume) {
      // console.log(layer)
      // Now build actual geometry
      var geometry;
      switch (volume.Shape) {
      case "CUB":
      case "BOX":
        // xh,yh,zh
        var boxgeometry = new THREE.BoxGeometry(volume.Bounds[0], volume.Bounds[1], volume.Bounds[2] );
        geometry = new THREE.BufferGeometry();
        geometry.fromGeometry(boxgeometry);
        break;
      case "CYL":
        // r,th,z
        var outside = new THREE.Shape();
        outside.absarc(0,0,volume.Bounds[0]+volume.Bounds[1]/2.0,0.0,Math.PI*2.0,false);

        var inside = new THREE.Shape();
        inside.absarc(0,0,volume.Bounds[0]-volume.Bounds[1]/2.0,0.0,Math.PI*2.0,true);

        outside.holes.push(inside);
        geometry = outside.extrude({ amount: volume.Bounds[2]*2.0, bevelEnabled: false });
        break;
      case "TRA":
        //hx1, hx2,hy,th
        var pts = [];
        var hx1 = volume.Bounds[0];
        var hx2 = volume.Bounds[1];
        var h = volume.Bounds[2];
        // var h = 10;
        pts.push(new THREE.Vector2(-hx2,h));
        pts.push(new THREE.Vector2(hx2,h));
        pts.push(new THREE.Vector2(hx1,-h));
        pts.push(new THREE.Vector2(-hx1,-h));

        var shape = new THREE.Shape( pts );
        geometry = shape.extrude({ amount: 1.0, bevelEnabled: false });
        break;
      default:
        console.log("Unknown volume type! ["+volume.Shape+"]");
      }
      // console.log(geometry)
      return geometry;
    }
    
    function _buildShapeFromVolume(geometry,volume) {
      if (!volume.hasOwnProperty("Colour")){
        volume.Colour=0xd2bedf;
      }
      
      if (!volume.hasOwnProperty("EdgeColour")){
        volume.EdgeColour=0xa2bef9;
      }
      
      console.log('volume',volume);
      var material = new THREE.MeshBasicMaterial( { color: Number(volume.Colour), opacity:0.5, transparent:true } );
      var volumecentre =   new THREE.Vector3( volume.Coords[0][0], volume.Coords[0][1], volume.Coords[0][2] -  volume.Coords[1][2]);
      // if (volume.Shape=='CYL') volumecentre.z -= layer.Bounds[1];
      var geom = new THREE.Mesh( geometry.clone(), material );    
      geom.matrix.makeRotationFromEuler( new THREE.Euler( volume.Coords[1][0], volume.Coords[1][1], volume.Coords[1][2]) );
      geom.matrix.setPosition(volumecentre);
      geom.matrixAutoUpdate = false;
      volume.Scene.add( geom );
      var egh = new THREE.EdgesHelper( geom, Number(volume.EdgeColour) );
      egh.material.linewidth = 2;
      volume.Scene.add( egh );
    }
    
    function _buildShapeFromLayer(layer,geometry,volume) {
      
      // Add the group which holds the 3D objects
      layer.Scene = new THREE.Group();
      layer.Scene.name = "Layer" + layer.Index + ":"+layer.Shape;
      
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
        // var modulegeometry = geometry.clone();
        
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
      volume.Scene.add(layer.Scene);
    }
    
    function _buildGeometryLevelFromJSON(volume) {
      // for (var i = 0; i < detgeometry.length; i++){
      console.log('_buildGeometryLevelFromJSON: level',volume);
      
      for (var prop in levelGeometry){
        if (!levelGeometry.hasOwnProperty(prop)){ continue; }

        var layer = levelGeometry[prop];
        // console.log("Layer "+prop+":"+layer);
        var geometry = _buildGeometryFromLayer(layer);
        _buildShapeFromLayer(layer, geometry);
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
      var phistep = 2.0*Math.PI/numPhiEl;

      var z = minZ+zstep/2.0;

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
        z += zstep;
      } 

    }
    
    function _buildEventDataFromJSON(jsonData) {
      console.log("_buildEventDataFromJSON: dumping input eventdata:");
      console.log(jsonData);
      eventData = jsonData; 
      // console.log(gui);
      eventFolder   = gui.addFolder('Reconstruction');
      var eventScene = new THREE.Group();
      eventScene.name="Event data";
      // Switch to turn off all reco
      var recoIdentifier = "Show";
      guiParameters[recoIdentifier]=true; // On by default   
      eventData.Menu = "test";   
      eventData.Menu = eventFolder.add( guiParameters, recoIdentifier ).name(recoIdentifier).listen();
      eventData.Menu.onChange( onChangeFunction( recoIdentifier, eventData) );
      
      // console.log(recoMenu);
      
      // Fill data
      if (eventData.Tracks){
        console.log("Adding Tracks");
        _addEventCollections(eventData.Tracks, _addTrack, "Tracks", eventScene);
        // _addTrackPoints(eventData, eventScene);
      }
      
      if (eventData.Jets){
        console.log("Adding Jets");
        _addEventCollections(eventData.Jets, _addJet, "Jets", eventScene);
      }
      
      // _addEventCollections(eventData["Measurement"], _addMeasurement);
      
      
      // Caloclusters - special because we need dimensions of calorimeter.
      // if (eventData["CaloClusters"]){
      //   console.log("Adding CaloClusters")
      //   _addClusterCollections(eventData, eventScene);
      // }
      
      if (eventData.Hits){
        console.log("Adding Hits");
        _addHits(eventData, eventScene);  
      }   
     
      eventData.Scene = eventScene;
      scene.add(eventData.Scene);
      console.log("Event data scene:");
      console.log(eventData.Scene.children);
      
    }
    
  function _addClusterCollections(eventData, eventScene){
    var clustercollections = eventData.CaloClusters;
    var typeFolder =  eventFolder.addFolder("CaloClusters");
    
    var collscene;
    for (var collname in clustercollections){
      if (!clustercollections.hasOwnProperty(collname)){ continue; }
      var collection = clustercollections[collname];
      if (!collection) {continue;}
      collscene = new THREE.Group();
      collscene.name="Clusters";
      for (var clusname in collection) {
        if (!collection.hasOwnProperty(clusname)){ continue; }
        _addCluster(collection,clusname,collscene, 1100.0, 3200.0);
        
      }
      collection.Scene = collscene;
      eventScene.add(collection.Scene);
      // _addMenuEventCollection(typeFolder, collection)
      guiParameters[collname]=true; // On by default
      collection.Menu = typeFolder.add( guiParameters, collname ).name(collname).listen();
      collection.Menu.onChange( onChangeFunction( collname, collection) );
    } 
  }
  
  function _addHits(hits, scene){
    console.log("_addHits");
    
    var points = [];
    
    var collections = eventData.Hits;
    
    var typeFolder =  eventFolder.addFolder("Hits");
  
    var collscene;
    for (var collname in collections){
      points = collections[collname];
      var collection = collections[collname];
      
      console.log('hits named ', collname, 'with this many entries:',points.length);
      
      collscene = new THREE.Group();
      collscene.name=collname;
        
        // we'll do all points at the same time
        var pointPos = new Float32Array( points.length * 3 );
        for ( var i = 0; i < points.length; i += 3 ) {
          pointPos[i]=points[i][0];
          pointPos[i+1]=points[i][1];
          pointPos[i+2]=points[i][2];
        }

        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute( 'position', new THREE.BufferAttribute( pointPos, 3 ) );
        geometry.computeBoundingSphere();
        var material = new THREE.PointsMaterial( { size: 25} );
        var pointsObj = new THREE.Points( geometry, material );
        pointsObj.name = collname;
        // console.log(pointsObj)
        collscene.add( pointsObj );

        guiParameters[collname]=true; // On by default
        typeFolder.Menu = typeFolder.add( guiParameters, collname ).name(collname).listen();
        typeFolder.Menu.onChange( onChangeFunction( collname, points) );
        
        points.Scene = collscene;
        scene.add(points.Scene);
        // console.log(points)        
    } 
  }
  

    function _addEventCollections(collections, addObject, folder, scene){
      var collscene;
      var typeFolder =  eventFolder.addFolder(folder);
      
      for (var collname in collections){
        console.log(collname);
        if (!collections.hasOwnProperty(collname)){ continue; }
        var collection = collections[collname];
        if (!collection) {continue;}
        collscene = new THREE.Group();
        collscene.name = collname;

        for (var objname in collection) {
            if (!collection.hasOwnProperty(objname)){ continue; }
            addObject(collection,objname,collscene);
        }
        
        guiParameters[collname]=true; // On by default
        collection.Menu = typeFolder.add( guiParameters, collname ).name(collname).listen();
        collection.Menu.onChange( onChangeFunction( collname, collection) );
        
        collection.Scene = collscene;
        scene.add(collection.Scene);
      }
    }
    
    function _updateEventCollections(collections, updateObject){
      var collscene;
      
      for (var collname in collections){
        if (!collections.hasOwnProperty(collname)){ continue; }
        var collection = collections[collname];
        if (!collection) {continue;}
            // console.log(collections)

        for (var objname in collection) {      
            // console.log(collection)
            if (objname==='Menu' || objname==='Scene') { continue; } // Find a better solution

            if (!collection.hasOwnProperty(objname)){ continue; }
            updateObject(collection,objname);
        }
      }
    }
    
    function _addTrack(tracks, trkName, scene){
      // console.log('Adding track '+trkName+' which is of type '+tracks[trkName].type)
      var length = 100;
      var colour = 0x00ff2d;
      
      var positions = tracks[trkName].pos;
      
      //Now sort these. 
      positions.sort(function(a, b) {
        var dist_a = a[0]*a[0]+a[1]*a[1]+a[2]*a[2];
        var dist_b = b[0]*b[0]+b[1]*b[1]+b[2]*b[2];
        if (dist_a < dist_b) {return -1;}
        if (dist_a > dist_b) {return -1;}
        return 0;
      });
      
      var numPoints = positions.length;
      if (numPoints<3){
        console.log("Track with too few points["+numPoints+"]. Skipping. Positions are: "+positions+" particle_id: "+tracks[trkName].particle_id);
        return;
      }
      
      // Apply pT cut TODO - make this configurable.
      if (tracks[trkName].hasOwnProperty("mom")){
        var mom=tracks[trkName].mom;      
        if (mom[0]*mom[0]+mom[1]*mom[1]+mom[2]*mom[2]<0.25){
          console.log("Track mom<0.5 GeV. Skipping. Positions are: "+positions+" particle_id: "+tracks[trkName].particle_id);
          return;
        }
      }
      
      //
      var points = [];
      
      for (var i=0; i<numPoints;i++){
        points.push(new THREE.Vector3(positions[i][0],positions[i][1],positions[i][2]) );
      }
      
      var curve         = new THREE.CatmullRomCurve3( points );
      var geometry      = new THREE.Geometry();
      geometry.vertices = curve.getPoints( 50 );
      var material      = new THREE.LineBasicMaterial( { color : 0xff0000 } );
      var splineObject  = new THREE.Line( geometry, material );
      splineObject.name = trkName;

      scene.add( splineObject );
      tracks[trkName].geometry = splineObject;
      splineObject.eventData = tracks[trkName];
    }
    
    function _updateTrack(tracks, trkName){
      var length = 100;
      var colour = 0x00ff2d;
      
      var positions = tracks[trkName].pos;
      var numPoints = positions.length;
      if (numPoints<3){
        // console.log("Track with too few points. Skipping. "+positions);
        return;
      }
      
      var points = [];
      
      for (var i=0; i<numPoints;i++){
        points.push(new THREE.Vector3(positions[i][0],positions[i][1],positions[i][2]) );
      }
      
      var curve         = new THREE.CatmullRomCurve3( points );
      var geometry      = new THREE.Geometry();
      points = [];
      var curvePoints = curve.getPoints( 25 );
      for (var point in curvePoints){
        if (Math.sqrt 
         (point[0]*point[0] + 
          point[1]*point[1] +
          point[2]*point[2])> animationSphere) break;
      
          points.push(point);
      }
      geometry.vertices = points;
          
      var material      = new THREE.LineBasicMaterial( { color : 0xff0000 } );
      var splineObject = tracks[trkName].geometry;
      geometry.verticesNeedUpdate = true;
      splineObject.geometry = geometry;      
    }
    
    function _addTrackPoints(tracks, scene){
      console.log("_addTrackPoints");
      
      var points = [];
      
      var trackcollections = eventData.Tracks;
      var typeFolder =  eventFolder.addFolder("Track Points");
    
      var collscene;
      for (var collname in trackcollections){
        if (!trackcollections.hasOwnProperty(collname)){ continue; }
        var collection = trackcollections[collname];
        if (!collection) {continue;}
        collscene = new THREE.Group();
        collscene.name = collname;
        for (var trackname in collection) {
          if (!collection.hasOwnProperty(trackname)){ continue; }
          
          var positions = collection[trackname].pos;
          if (!positions) { continue;}
          
          for (var i=0; i<positions.length;i++){
            points.push(new THREE.Vector3(positions[i][0],positions[i][1],positions[i][2]) );
          }
        }
        // _addMenuEventCollection(typeFolder, collection)

      } 
      // console.log(points);
      
      
      // we'll do all points at the same time
      var pointPos = new Float32Array( points.length * 3 );
			for ( var j = 0; j < points.length; j += 3 ) {
        pointPos[j]=points[j].x;
        pointPos[j+1]=points[j].y;
        pointPos[j+2]=points[j].z;
      }
      
			var geometry = new THREE.BufferGeometry();
      geometry.addAttribute( 'position', new THREE.BufferAttribute( pointPos, 3 ) );
      geometry.computeBoundingSphere();
      var material = new THREE.PointsMaterial( { size: 15, color: 0xffff66}  );
      trackPointsObj = new THREE.Points( geometry, material );
      
      scene.add( trackPointsObj );
      trackPointsObj.Scene=trackPointsObj; // Yuck?

      guiParameters.Points=true; // On by default
      trackPointsObj.Menu = typeFolder.add( guiParameters, "Points" ).name('Track Points').listen();
      trackPointsObj.Menu.onChange( onChangeFunction( "Points", trackPointsObj) );
      // console.log(trackPointsObj);
    }
    
    function _addCluster(clustercollections, clusName, scene, maxR, maxZ){
      // console.log('Adding cluster '+clusName+' with energy '+clustercollections[clusName].energy)
      var length = clustercollections[clusName].energy*0.003;
      var geometry = new THREE.BoxGeometry( 30, 30, length );
      var material = new THREE.MeshBasicMaterial( { color: Math.random()*0xffffff } );
      var cube = new THREE.Mesh( geometry, material );
      cube.name = clusName;
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
      console.log('Adding jet '+jetName+' with data ');
      console.log(jetcollections[jetName]);
      // var dR = jetcollections[jetName].coneR;
  
      var eta = jetcollections[jetName].eta;
      var phi = jetcollections[jetName].phi;
      var theta = 2 * Math.atan(Math.pow(Math.E,eta) );
      var length = jetcollections[jetName].energy*0.2;
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
      mesh.name=jetName;
      // mesh.matrixAutoUpdate = false;
      scene.add( mesh );
  
    }
    
    function _printInfoMessage(message){
      if (info) {
        info.innerHTML = message;
      }
    }

    function _setPresetViews(views){
      var presetViewFolder = gui.addFolder('Preset Views');
      for(var i=0; i<views.length; i++){
        views[i].setView = function () {
          camera.position.set(...this.cameraPos);
        };
        presetViewFolder.add( views[i], 'setView' ).name(views[i].name);
      }
    }
    
    function onWindowResize() {
      console.log('onWindowResize: camera x/y='+camera.position.x +'/'+camera.position.y+'\t mouseX/Y='+mouse.x+'/'+mouse.y);

      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize( window.innerWidth, window.innerHeight );

    }
    
    function onMouseMove( e ) {
      console.log('onMouseMove');
      // mouse.x = e.clientX;
      // mouse.y = e.clientY;
    }
    
    function onMouseClick( e ) {
    	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
      // console.log('onMouseClick: '+mouse.x+', '+mouse.y);
      // console.log(eventData.Scene);
      // console.log(scene.children);
      
      var clickedmaterial = new THREE.LineBasicMaterial( {
      	color: 0xffffff,
      	linecap: 'round', //ignored by WebGLRenderer
      	linejoin:  'round' //ignored by WebGLRenderer
      } );
      
      if (guiParameters.selectObj) {
        raycaster.setFromCamera( mouse, camera );
        // console.log(raycaster.intersectObjects( eventData.Scene.children[0].children ))
        var picks = raycaster.intersectObjects( scene.children, true );
        console.log('Selected object: ');
        // console.log(picks);
        for ( var i = 0; i < picks.length; i ++ ) {
          if (!picks[i].hasOwnProperty("object")){ continue; }
          
          if (picks[i].object.hasOwnProperty("eventData")){ 
            console.log(picks[i].object.eventData); 
            if (info) {
              var output = '';
              for (var property in picks[i].object.eventData) {
                output += property + ': ' + picks[i].object.eventData[property]+'; <br>';
              }
              _printInfoMessage(output);
            }
            if (lastSelectedObject){
              lastSelectedObject.material = lastSelectedObjectMaterial;
            }
            lastSelectedObject = picks[i].object;
            lastSelectedObjectMaterial = picks[i].object.material;
            picks[i].object.material = clickedmaterial;          
          }
        }
      }     
    }

    function onDocumentMouseMove( event ) {
      mouse.x = ( event.clientX - windowHalfX ) / 2;
      mouse.y = ( event.clientY - windowHalfY ) / 2;
      console.log('onDocumentMouseMove: camera x/y='+camera.position.x +'/'+camera.position.y+'\t mouseX/Y='+mouseX+'/'+mouseY);
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
      var clipPosition;
      
      // Animation
      // animationSphere += 1;
      // if (animationSphere<1000) _updateEventCollections(eventData["Tracks"], _updateTrack);
      
      // console.log(camera.position)
      
      // For the moment just loop through the obj geometries
      for (var name in objGeometry) {
        if (objGeometry[name].hasOwnProperty('Scene')){
          var children = objGeometry[name].Scene.children;
          for ( var i = 0; i < children.length; i ++ ) {
            var current = children[ i ].material;
            if (Array.isArray(current)) {
              for (var j = 0; j<current.length; j++){
                _updateClipPlane(current[j], clipPosition);
              }
            } else {
              _updateClipPlane(current, clipPosition);
            }
          }
        }
      }

      stats.update();
      renderer.render( scene, camera );

    }
    
     function _updateClipPlane(current, clipPosition) {
			for ( var j = 0; j < current.clippingPlanes.length; j ++ ) {
				var plane = current.clippingPlanes[ j ];
         // console.log(plane)
         // plane.constant = ( 149 * plane.constant + guiParameters.clipPosition ) / 150;
         if      (j===0) clipPosition = guiParameters.xClipPosition;
         else if (j===1) clipPosition = guiParameters.yClipPosition;
         else if (j===2) clipPosition = guiParameters.zClipPosition;
         plane.constant = clipPosition ;
			}
     }

    EventDisplay.animate = function() {
      // console('animate');
      requestAnimationFrame( EventDisplay.animate );
      _render();
    };
    
    /// Set default configuration values
    function Configuration(){
      // Menu configuration
      this.xClipPosition = 1200;
      this.yClipPosition = 1200;
      this.zClipPosition = 4000;
      this.eventFileUploader = 'offbydefault';
      this.geomFileUploader = 'offbydefault';
      this.allowShowAxes = true;
    }
    
    EventDisplay.getDefaultConfiguration = function(){
      return new Configuration();
    };
    
    EventDisplay.init = function(configuration){
      if (typeof(configuration) === 'undefined') {
        console.log('No configuration set, so using default.');
        configuration = new Configuration();
      }
      console.log('Init called with the following configuration:');
      console.log(configuration);
      _init( configuration );   
    };
    
    EventDisplay.buildGeometryFromJSON = function(detgeometry, showsurfaces, showvolumes){
      _buildGeometryFromJSON(detgeometry, showsurfaces, showvolumes);
    };
    
    EventDisplay.buildGeometryFromParameters = function(parameters){
      _buildGeometryFromParameters(parameters);
    };
    
    EventDisplay.buildEventDataFromJSON = function(event){
      _buildEventDataFromJSON(event);
    };
    
    EventDisplay.loadGeomFromObj = function(objectname, name, colour, doublesided){
      _loadGeomFromObj(objectname, name, colour, doublesided);
    };

    EventDisplay.setPresetViews = function(views){
      _setPresetViews(views);
    }
    
    return EventDisplay;
  }
  
  if(typeof(EventDisplay) === 'undefined'){
    console.log('EventDisplay not yet known - defining and adding to window.');
    window.EventDisplay = define_EventDisplay();
  }
  else{
    console.log("EventDisplay already defined.");
  }

})(THREE, Stats, window);
