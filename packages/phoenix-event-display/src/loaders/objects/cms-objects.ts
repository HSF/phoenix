import { Object3D, Vector3, Geometry, Face3, Group, Mesh, MeshBasicMaterial, EdgesGeometry, LineBasicMaterial, DoubleSide, LineSegments, BufferGeometry } from "three";
import { EVENT_DATA_TYPE_COLORS } from "../../helpers/constants";

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
    let faces = [];
    let backs = [];

    for (const param of Object.keys(muonChamberParams)) {
      if (param.startsWith('front')) {
        faces.push(
          new Vector3().fromArray(muonChamberParams[param])
        );
      } else if (param.startsWith('back')) {
        backs.push(
          new Vector3().fromArray(muonChamberParams[param])
        );
      }
    }

    let box = new Geometry();
    box.vertices = faces.concat(backs);

    // front
    box.faces.push(new Face3(0, 1, 2));
    box.faces.push(new Face3(2, 3, 0));

    // back
    box.faces.push(new Face3(4, 5, 6));
    box.faces.push(new Face3(6, 7, 4));

    // top
    box.faces.push(new Face3(4, 5, 1));
    box.faces.push(new Face3(1, 0, 4));

    // bottom
    box.faces.push(new Face3(7, 6, 2));
    box.faces.push(new Face3(2, 3, 7));

    // left
    box.faces.push(new Face3(0, 3, 7));
    box.faces.push(new Face3(7, 4, 0));

    // right
    box.faces.push(new Face3(1, 5, 6));
    box.faces.push(new Face3(6, 2, 1));

    box.computeFaceNormals();
    box.computeVertexNormals();

    const boxBuffer = new BufferGeometry().fromGeometry(box);

    const boxObject = new Mesh(boxBuffer, new MeshBasicMaterial({
      color: EVENT_DATA_TYPE_COLORS['MuonChambers'],
      transparent: true,
      opacity: 0.1,
      side: DoubleSide
    }));

    boxObject.userData = Object.assign({}, muonChamberParams);
    boxObject.name = 'MuonChamber';

    // These are the lines along the box edges

    const boxEdges = new EdgesGeometry(boxBuffer);
    const lineBoxObject = new LineSegments(boxEdges, new LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7
    }));

    const muonChamber = new Group();
    muonChamber.add(boxObject);
    muonChamber.add(lineBoxObject);

    muonChamberParams.uuid = boxObject.uuid;

    return muonChamber;
  }
}
