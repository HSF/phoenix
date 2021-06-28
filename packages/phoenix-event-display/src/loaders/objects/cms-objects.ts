import {
  Object3D,
  Group,
  Mesh,
  MeshBasicMaterial,
  EdgesGeometry,
  LineBasicMaterial,
  DoubleSide,
  LineSegments,
  BufferGeometry,
  BufferAttribute,
} from 'three';
import { EVENT_DATA_TYPE_COLORS } from '../../helpers/constants';

/**
 * Physics objects that make up an event in CMS that are not a part of {@link PhoenixObjects}.
 */
export class CMSObjects {
  /**
   * Process the Muon Chamber from the given parameters.
   * and get it as a geometry.
   * @param muonChamberParams Parameters of the Muon Chamber.
   * @returns Muon Chamber object.
   */
  public static getMuonChamber(muonChamberParams: any): Object3D {
    let allFacePositions: number[] = [];

    const addFace3 = (...faces: string[]) => {
      allFacePositions = allFacePositions.concat(
        ...faces.map((face) => muonChamberParams[face])
      );
    };

    // front
    addFace3('front_1', 'front_2', 'front_3');
    addFace3('front_3', 'front_4', 'front_1');

    // back
    addFace3('back_1', 'back_2', 'back_3');
    addFace3('back_3', 'back_4', 'back_1');

    // top
    addFace3('back_1', 'back_2', 'front_2');
    addFace3('front_2', 'front_1', 'back_1');

    // bottom
    addFace3('back_4', 'back_3', 'front_3');
    addFace3('front_3', 'front_4', 'back_4');

    // left
    addFace3('front_1', 'front_4', 'back_4');
    addFace3('back_4', 'back_1', 'front_1');

    // right
    addFace3('front_2', 'back_2', 'back_3');
    addFace3('back_3', 'front_3', 'front_2');

    const boxBuffer = new BufferGeometry();
    boxBuffer.attributes.position = new BufferAttribute(
      new Float32Array(allFacePositions),
      3
    );
    boxBuffer.computeVertexNormals();

    const boxObject = new Mesh(
      boxBuffer,
      new MeshBasicMaterial({
        color: muonChamberParams.color ?? EVENT_DATA_TYPE_COLORS.MuonChambers,
        transparent: true,
        opacity: 0.1,
        side: DoubleSide,
      })
    );

    boxObject.userData = Object.assign({}, muonChamberParams);
    boxObject.name = 'MuonChamber';

    // These are the lines along the box edges

    const boxEdges = new EdgesGeometry(boxBuffer);
    const lineBoxObject = new LineSegments(
      boxEdges,
      new LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
      })
    );

    const muonChamber = new Group();
    muonChamber.add(boxObject);
    muonChamber.add(lineBoxObject);

    muonChamberParams.uuid = boxObject.uuid;

    return muonChamber;
  }
}
