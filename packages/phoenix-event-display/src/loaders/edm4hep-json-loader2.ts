import { PhoenixLoader } from './phoenix-loader';
import { edmPhoenix } from 'src/lib/types/edmPhoenix';
import { edm4hep } from 'src/lib/types/edm4hep';

export class Edm4hepJsonLoader extends PhoenixLoader {
  private rawEventData: any;

  constructor() {
    super();
    this.eventData = {};
  }

  setRawEventData(rawEventData: any) {
    this.rawEventData = rawEventData;
  }

  processEventData(): boolean {
    // Iterate over events
    Object.entries(this.rawEventData).forEach(
      ([eventName, rawEvent]: [string, edm4hep.Event]) => {
        const newEvent: edmPhoenix.Event = {};

        /* Define particle PID based on link
         */
        this.assignPID(rawEvent);
      },
    );
  }

  /** Assign default color to Tracks */
  private assignPID(event: any) {
    let recoParticles = event.ReconstructedParticles
      ?.collection as edm4hep.ReconstructedParticleCollection;

    let mcParticles = event.Particle
      ?.collection as edm4hep.MCParticleCollection;

    // Link collection name and type vary by schema version:
    // - Schema 1 — name: MCRecoAssociations — type: AssociationCollection
    // - Schema 2 — name: MCRecoAssociations or RecoMCLink — type: LinkCollection
    // - Schema 3 — name: RecoMCLink — type: LinkCollection
    const links = (event.MCRecoAssociations ?? event.RecoMCLink)?.collection as
      | edm4hep.AssociationCollection
      | edm4hep.LinkCollection;

    let tracks: any[];
    if ('EFlowTrack' in event) {
      tracks = event['EFlowTrack']['collection'];
    } else {
      return;
    }

    if (!links) return;
    links.forEach((mcRecoAssoc: edm4hep.Association | edm4hep.Link) => {
      const recoIndex =
        typeof mcRecoAssoc['rec'] !== 'undefined'
          ? mcRecoAssoc['rec']['index']
          : mcRecoAssoc['from']['index'];
      const mcIndex =
        typeof mcRecoAssoc['sim'] !== 'undefined'
          ? mcRecoAssoc['sim']['index']
          : mcRecoAssoc['to']['index'];

      const pdgid = mcParticles[mcIndex]['PDG'];
      const trackRefs = recoParticles[recoIndex]['tracks'];

      trackRefs.forEach((trackRef: any) => {
        const track = tracks[trackRef['index']];
        if (Math.abs(pdgid) === 11) {
          track['color'] = '00ff00';
          track['pid'] = 'electron';
        } else if (Math.abs(pdgid) === 22) {
          track['color'] = 'ff0000';
          track['pid'] = 'photon';
        } else if (Math.abs(pdgid) === 211 || Math.abs(pdgid) === 111) {
          track['color'] = 'a52a2a';
          track['pid'] = 'pion';
        } else if (Math.abs(pdgid) === 2212) {
          track['color'] = '778899';
          track['pid'] = 'proton';
        } else if (Math.abs(pdgid) === 321) {
          track['color'] = '5f9ea0';
          track['pid'] = 'kaon';
        } else {
          track['color'] = '0000cd';
          track['pid'] = 'other';
        }
        track['pdgid'] = pdgid;
      });
    });
  }
}
