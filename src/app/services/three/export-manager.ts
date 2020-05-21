import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';
import { Scene, Object3D, Group } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

/**
 * Manager for managing event display's export related functionality.
 */
export class ExportManager {

    /**
     * Constructor for the export manager.
     */
    constructor() {
    }

    /**
     * Exports scene to OBJ file format.
     * @param scene The scene to be exported.
     */
    public exportSceneToOBJ(scene: Scene) {
        // Instantiate a exporter
        const exporter = new OBJExporter();
        const result = exporter.parse(scene);
        this.saveString(result, 'phoenix-obj.obj');
    }

    /**
     * Exports scene as phoenix format, allowing to load it later and recover the saved configuration.
     * @param scene The scene to be exported.
     * @param eventData Currently loaded event data.
     * @param geometries Currently loaded geometries.
     */
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

    /**
     * Save the configuration of the currently loaded scene including event data and geometries.
     * @param eventData Curently loaded event data.
     * @param geometries Currently loaded geometries.
     */
    private saveSceneConfig(eventData: Object3D, geometries: Object3D) {
        const eventDataConfig = this.saveEventDataConfiguration(eventData);
        const geometriesConfig = this.saveGeometriesConfiguration(geometries);
        const sceneConfig = { eventData: eventDataConfig, geometries: geometriesConfig };
        return sceneConfig;
    }

    /**
     * Save the configuration of the currently loaded event data.
     * @param eventData Currently loaded event data.
     */
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

    /**
     * Save the configuration of the currently loaded geometries.
     * @param geometries Currently loaded geometries.
     */
    private saveGeometriesConfiguration(geometries: Object3D) {
        const geometriesConfig = [];
        geometries.children.forEach((object) => {
            if (object.name !== 'EventData') {
                geometriesConfig.push(object.name);
            }
        });
        return geometriesConfig;
    }

    /**
     * Save string in the file and download it.
     * @param text Text to be stored.
     * @param filename Name of the file.
     */
    private saveString(text: string, filename: string) {
        this.save(new Blob([text], { type: 'text/plain' }), filename);
    }

    /**
     * Create a temporary link and download/save the data (blob) in a file.
     * @param blob Blob containing exported data.
     * @param filename Name of the export file..
     */
    private save(blob: Blob, filename: string) {
        const link = document.createElement('a');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

}
