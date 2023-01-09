# Geometry tips and tips

This guide is intended to provide some tips on creating an experimental geometry for use within Phoenix.

At the time of writing, the threejs recommended geometry format is gltf (GL Transmission Format) or glb (the binary version of gltf). See this [threejs documentation](https://threejs.org/docs/#manual/en/introduction/Loading-3D-models) for details. 

One big advantage of gltf/glb is Phoenix can use the embedded GLTF scenes to populate the geometry menu. So rather than having a lot of separate files for the different parts of an experiment, and then adding them individually to the top level scene and UI one-by-one e.g.:
```typescript
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/barrel.gltf',
      'Barrel',
      'Inner Detector',
      1000
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/end-cap.gltf',
      'Endcap',
      'Inner Detector',
      1000
    );
```

you can instead load _one_ file, and Phoenix will loop over the internal structure and create the appropriate geometry UI entries. See the LHCB interactive example for how this works in practice (specifically, [lhcb.component.ts](lhcb.component.ts) is where the geometry is loaded).

# Creating gltf/glb content
## Blender
[Blender](https://www.blender.org) is an incredibly powerful _free_ tool to create 3D content. It also has an comprehensive set of importers and exporters (including an gltf exporter, obviously) meaning you can load content from almost any format and save it as compressed glb. It also understands scenes (see the Blender [documentation](https://docs.blender.org/manual/en/latest/scene_layout/scene/introduction.html) for more), so you can load many different geometry files, put them in their own scenes and export, and then Phoenix will fill the geometry UI menu for you as described above.

* **N.B.** When exporting content from Blender it is very important that you remember to [Apply](https://docs.blender.org/manual/en/latest/scene_layout/object/editing/apply.html) all transformations - otherwise you can be in the situation that your geometry looks perfect inside Blender, but is the wrong size/rotation when viewed in Phoenix.

## From ROOT or GDML
Read [this guide](convert-gdml-to-gltf.md) for how to convert from gdml or ROOT to gltf.

## Converting gltf to glb

Converting a gltf to glb, especially compressed glb, can lead to huge reductions in size (see [#530](https://github.com/HSF/phoenix/pull/530) for an example).

The recommended way to do this is with the [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline) command line tool e.g.:
```
gltf-pipeline -i LHCb.gltf -o LHCb.glb -d
```