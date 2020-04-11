import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';
import { Scene, Object3D, Group } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

export class ExportManager {

    constructor() {
    }

    public exportSceneToOBJ(scene: Scene) {
        // Instantiate a exporter
        const exporter = new OBJExporter();
        const result = exporter.parse(scene);
        this.saveString(result, 'phoenix-obj.obj');
    }

    public exportPhoenixScene(scene: Scene, eventData: Object3D, geometries: Object3D) {
        const exporter = new GLTFExporter();

        const sceneConfig = this.saveSceneConfig(eventData, geometries);
        // Parse the input and generate the glTF output
        exporter.parse(
            scene,
            result => {
                const jsonResult = { sceneConfiguration: sceneConfig, scene: result };
                const output = JSON.stringify(jsonResult, null, 2);
                this.saveString(output, 'phoenix-scene.phnx');
            },
            null
        );
    }



    private saveSceneConfig(eventData: Object3D, geometries: Object3D) {
        const eventDataConfig = this.saveEventDataConfiguration(eventData);
        const geometriesConfig = this.saveGeometriesConfiguration(geometries);
        const sceneConfig = { eventData: eventDataConfig, geometries: geometriesConfig };
        return sceneConfig;
    }


    private saveEventDataConfiguration(eventData: any) {
        const eventDataConfig = {};
        for (const objectType of eventData.children) {
            if (objectType.name) {
                eventDataConfig[objectType.name] = [];
                for (const collection of objectType.children) {
                    if (collection.name) {
                        eventDataConfig[objectType.name].push(collection.name);
                    }
                }
            }
        }
        return eventDataConfig;
    }

    private saveGeometriesConfiguration(geometries: Object3D) {
        const geometriesConfig = [];
        geometries.children.forEach((object) => {
            if (object.name !== 'EventData') {
                geometriesConfig.push(object.name);
            }
        });
        return geometriesConfig;
    }


    private saveString(text, filename) {
        this.save(new Blob([text], { type: 'text/plain' }), filename);
    }
    private save(blob, filename) {
        const link = document.createElement('a');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

}
