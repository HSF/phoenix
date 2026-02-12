import { Object3D, Vector3 } from 'three';
import { GUI } from 'dat.gui';
import { Cut } from '../lib/models/cut.model';
import { PhoenixMenuNode } from '../managers/ui-manager/phoenix-menu/phoenix-menu-node';
import { PhoenixObjects } from './objects/phoenix-objects';

/** Describes how to load a single physics object type. */
export interface ObjectTypeConfig {
  /** Key in eventData (e.g. 'Tracks', 'Jets'). */
  typeName: string;
  /** Builds one Three.js object from params. */
  getObject: (params: any, typeName?: string) => Object3D;
  /** If true, pass the whole collection at once instead of per-object. */
  concatonateObjs?: boolean;
  /** Default cut definitions for this type. */
  cuts?: Cut[];
  /** Scale UI config — if set, a scale slider is added. */
  scaleConfig?: {
    /** Config key for dat.GUI. */
    key: string;
    /** Display label. */
    label: string;
    /** Scene manager scale method name. */
    scaleMethod: string;
    /** Axis to scale along. */
    scaleAxis?: string;
  };
  /** Completely custom UI extension (used by MissingEnergy). */
  extendUI?: (
    typeFolder: GUI,
    typeFolderPM: PhoenixMenuNode,
    scaleChildObjects: (typeName: string, value: number) => void,
  ) => void;
  /** Custom pre-processing for event data before addObjectType. */
  preprocessData?: (data: any) => any;
}

/** Returns default configs for all built-in Phoenix object types. */
export function getDefaultObjectTypeConfigs(): ObjectTypeConfig[] {
  const pi = parseFloat(Math.PI.toFixed(2));

  return [
    {
      typeName: 'Tracks',
      getObject: PhoenixObjects.getTrack,
      cuts: [
        new Cut('phi', -pi, pi, 0.01),
        new Cut('eta', -4, 4, 0.1),
        new Cut('chi2', 0, 100),
        new Cut('dof', 0, 100),
        new Cut('pT', 0, 50000, 0.1),
        new Cut('z0', -30, 30, 0.1),
        new Cut('d0', -30, 30, 0.1),
      ],
    },
    {
      typeName: 'Jets',
      getObject: PhoenixObjects.getJet,
      cuts: [
        new Cut('phi', -pi, pi, 0.01),
        new Cut('eta', -5.0, 5.0, 0.1),
        new Cut('energy', 0, 600000, 100),
      ],
      scaleConfig: {
        key: 'jetsScale',
        label: 'Jets Scale',
        scaleMethod: 'scaleJets',
      },
    },
    {
      typeName: 'Hits',
      getObject: PhoenixObjects.getHits,
      concatonateObjs: true,
    },
    {
      typeName: 'CaloClusters',
      getObject: (params: any) => PhoenixObjects.getCluster(params),
      cuts: [
        new Cut('phi', -pi, pi, 0.01),
        new Cut('eta', -5.0, 5.0, 0.1),
        new Cut('energy', 0, 10000),
      ],
      scaleConfig: {
        key: 'caloClustersScale',
        label: 'CaloClusters Scale',
        scaleMethod: 'scaleChildObjects',
        scaleAxis: 'z',
      },
    },
    {
      typeName: 'CaloCells',
      getObject: PhoenixObjects.getCaloCell,
      cuts: [
        new Cut('phi', -pi, pi, 0.01),
        new Cut('eta', -5.0, 5.0, 0.1),
        new Cut('energy', 0, 10000),
      ],
      scaleConfig: {
        key: 'caloCellsScale',
        label: 'CaloCells Scale',
        scaleMethod: 'scaleChildObjects',
        scaleAxis: 'z',
      },
    },
    {
      typeName: 'PlanarCaloCells',
      getObject: PhoenixObjects.getPlanarCaloCell,
      cuts: [new Cut('energy', 0, 10000)],
      scaleConfig: {
        key: 'planarCaloCellsScale',
        label: 'PlanarCaloCells Scale',
        scaleMethod: 'scaleChildObjects',
        scaleAxis: 'z',
      },
      preprocessData: (data: any) => {
        // Flatten { collectionName: { plane, cells } } into { collectionName: cells[] }
        const collections: { [key: string]: any } = {};
        for (const collectionName in data) {
          const collection = data[collectionName];
          const plane = collection['plane'];
          const unitVector = new Vector3(...plane.slice(0, 3)).normalize();
          collection['cells'].forEach(
            (cell: any) =>
              (cell['plane'] = [...unitVector.toArray(), plane[3]]),
          );
          collections[collectionName] = collection['cells'];
        }
        return collections;
      },
    },
    {
      typeName: 'IrregularCaloCells',
      getObject: PhoenixObjects.getIrregularCaloCell,
      cuts: [new Cut('layer', 0, 10), new Cut('energy', 0, 10000)],
      scaleConfig: {
        key: 'IrregularCaloCellsScale',
        label: 'IrregularCaloCells Scale',
        scaleMethod: 'scaleChildObjects',
        scaleAxis: 'z',
      },
    },
    // Compound types — getObject is set to null here; PhoenixLoader
    // binds its own getCompoundTrack / getCompoundCluster at runtime
    {
      typeName: 'Muons',
      getObject: null,
      cuts: [
        new Cut('phi', -pi, pi, 0.01),
        new Cut('eta', -4, 4, 0.1),
        new Cut('energy', 0, 10000),
        new Cut('pT', 0, 50000),
      ],
    },
    {
      typeName: 'Photons',
      getObject: null,
      cuts: [
        new Cut('phi', -pi, pi, 0.01),
        new Cut('eta', -4, 4, 0.1),
        new Cut('energy', 0, 10000),
        new Cut('pT', 0, 50000),
      ],
    },
    {
      typeName: 'Electrons',
      getObject: null,
      cuts: [
        new Cut('phi', -pi, pi, 0.01),
        new Cut('eta', -4, 4, 0.1),
        new Cut('energy', 0, 10000),
        new Cut('pT', 0, 50000),
      ],
    },
    {
      typeName: 'Vertices',
      getObject: PhoenixObjects.getVertex,
      cuts: [new Cut('vertexType', 0, 5)],
      scaleConfig: {
        key: 'verticesScale',
        label: 'Vertices Scale',
        scaleMethod: 'scaleChildObjects',
      },
    },
    {
      typeName: 'MissingEnergy',
      getObject: PhoenixObjects.getMissingEnergy,
      cuts: [],
      extendUI: (typeFolder, typeFolderPM, scaleChildObjects) => {
        const scaleMET = (value: number) => {
          scaleChildObjects('MissingEnergy', value);
        };
        if (typeFolder) {
          const sizeMenu = typeFolder
            .add({ jetsScale: 100 }, 'jetsScale', 1, 200)
            .name('Size (%)');
          sizeMenu.onChange(scaleMET);
        }
        if (typeFolderPM) {
          typeFolderPM.addConfig({
            type: 'slider',
            label: 'Size (%)',
            value: 100,
            min: 1,
            max: 200,
            allowCustomValue: true,
            onChange: scaleMET,
          });
        }
      },
    },
  ];
}
