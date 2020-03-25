import { CMSType } from './types/cmstype';
import { Jet } from './objects/jet';

export class CMSEventDescription {
    public collections: CMSType[] = [
        new Jet('Jets_V1', 'Jets (Reco)', 'Physics', true, { min_et: 10.0 }, { color: 'rgb(100%, 50%, 0%)', opacity: 0.75 }),
        new Jet('PFJets_V1', 'Jets (PF)', 'Physics', true, { min_et: 10.0 }, { color: 'rgb(100%, 50%, 0%)', opacity: 0.6 }),
        new Jet('GenJets_V1', 'Jets (Sim)', 'Physics', true, { min_et: 10.0 }, { color: 'rgb(100%, 75%, 0%)', opacity: 0.8 }),
        new Jet('PATJets_V1', 'Jets (PAT)', 'Physics', true, { min_et: 10.0 }, { color: 'rgb(100%, 100%, 0%)', opacity: 0.3 })
    ];
}
