# Convert GDML Geometry to ROOT and GLTF

## Introduction

It seems that a need has arose to convert GDML geometry files to a particular file format that describes a geometry,
that can be supported and visualized properly by Phoenix. 
Hopefully by following the steps bellow you will be able to achieve it. 
Please do open an [issue](https://github.com/HSF/phoenix/issues) in case of problems, where friendly folks can try and help. 

### Convert GDML to ROOT 

Root will server as a middleman for our purpose. 
Root is a C++ Data Analysis Framework. One needs to install it first locally by heading into Root's 👉 [Documentation](https://root.cern/install/) and following the steps listed over there. 

Once that is done, one can write a simple C++ function that will loop over the contents of the GDML file and with the help of some of the ROOT's Framework methods it will output a proper .root file with the name specified, which we will later on use to convert it into GLTF format and visualize it into Phoenix. 

The following C++ code works and serves for the above mentioned purpose. In case of problems please do open an issue and someone will try and help! 

```c++
void gdml_to_root_export() 
{
    // Loading the library and geometry
    gSystem->Load("libGeom");
    TGeoManager::Import("./path_of_your_gdml_file.gdml");
    gGeoManager->SetVisLevel(4); /// the number here can be changed based on the depth of the visibility level of your gdml file and the detail that you want to visualize it. 

    // Export the geometry
    gGeoManager->Export("filename.root");
}
```

> Keep in mind that in order for the above function to work, you should have installed the C++ ROOT Framework on your machine. 

Compiling and running the above code should result in outputting the .root file from your .gdml input. 

#### Verify that the .root file is extracted properly. 

One can visualize the .root file itself to be sure that it was extracted properly. 
We'll provide 2 tools one can use here and one of them is Phoenix itself.

> But why convert to .gltf since Phoenix supports .root visualization? 

.root visualization will result into a poor visualization image and also not that great of performance. Also another good reason to not stick with .root is that one can not split the .root file itself into multiple sub-parts / sub-geometries thus eliminating one of the core functionalities of Phoenix into geometry visualization. 