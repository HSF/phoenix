# Convert GDML Geometry to ROOT and GLTF

Phoenix does not support GDML or ROOT geometry natively. However these can be converted easily to GLTF format supported by Phoenix.
The idea is to convert GDML to ROOT first if needed and then ROOT to GLTF using the dedicated [Root to GLTF exported](https://github.com/HSF/root_cern-To_gltf-Exporter)

## Convert GDML to ROOT 

Root is a C++ Data Analysis Framework. One needs to install it first locally by heading into Root's 👉 [Documentation](https://root.cern/install/) and following the steps listed over there. 

Once that is done, one can write a simple C++ function to convert the GDML geometry into ROOT format :

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

> Verify that the .root file is extracted properly. 

One can visualize the .root file itself to be sure that it was extracted properly. Just load it in the [ROOT geometry display](https://root.cern/js/latest/), right click on the top level node and Draw all.


## Concert ROOT to GLTF

[Root to GLTF exported](https://github.com/HSF/root_cern-To_gltf-Exporter) is the tool to use here. Documentation is provided in the project README.

The tool allows to :
  * convert your geometry to GLTF
  * simplify your geometry by dropping parts/details you do not want to keep
  * split your geometry into subparts and map them to entries in the phoenix menu
  * set the default visibility and transparency of each part
