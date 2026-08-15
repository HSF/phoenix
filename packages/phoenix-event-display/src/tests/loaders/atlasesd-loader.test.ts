/**
 * @jest-environment jsdom
 */
import { ATLASESDLoader } from '../../loaders/atlasesd-loader';
import { openFile } from 'jsroot';
import { treeProcess } from 'jsroot/tree';

/** Build a fake CollectionTree with the given top-level branch names. */
const makeTree = (branchNames: string[], entries = 1) => ({
  fEntries: entries,
  fBranches: { arr: branchNames.map((fName) => ({ fName })) },
});

/** Make `openFile` return a file whose CollectionTree has these branches. */
const mockFile = (tree: any) =>
  (openFile as jest.Mock).mockResolvedValue({
    readObject: jest.fn().mockResolvedValue(tree),
  });

/** Make treeProcess seed the selector with one entry's aux stores. */
const mockEntry = (stores: { [key: string]: any }) =>
  (treeProcess as jest.Mock).mockImplementation(
    async (_tree: any, selector: any) => {
      selector.tgtobj = stores;
      selector.Process(0);
    },
  );

const TRACK_BRANCH =
  'xAOD::TrackParticleAuxContainer_v5_InDetTrackParticlesAux.';
const EVENTINFO_BRANCH = 'xAOD::EventAuxInfo_v3_EventInfoAux.';

const eventInfoStore = { runNumber: 484754, eventNumber: 968132624 };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ATLASESDLoader branch resolution', () => {
  it('resolves class-prefixed static aux branches', async () => {
    mockFile(
      makeTree([
        TRACK_BRANCH,
        'xAOD::VertexAuxContainer_v1_PrimaryVerticesAux.',
        EVENTINFO_BRANCH,
      ]),
    );
    mockEntry({
      esd__InDetTrackParticles: {
        phi: [0.5],
        theta: [1.2],
        qOverP: [0.001],
        d0: [1],
        z0: [2],
      },
      esd__PrimaryVertices: { x: [0], y: [0], z: [10] },
      esd__EventInfo: eventInfoStore,
    });

    const events = await new ATLASESDLoader().getEventData('file.root');
    const event = events['Event 968132624'];

    expect(event['run number']).toBe(484754);
    expect(event['Tracks']['InDetTrackParticles']).toHaveLength(1);
    expect(event['Vertices']['PrimaryVertices']).toHaveLength(1);
  });

  it('ignores AuxDyn decoration branches and POOL T/P collections', async () => {
    const tree = makeTree([
      TRACK_BRANCH,
      'xAOD::TrackParticleAuxContainer_v5_InDetTrackParticlesAuxDyn.TRTdEdx',
      'Trk::TrackCollection_tlp7_CombinedInDetTracks',
      'DataVector<xAOD::TrackParticle_v1>_InDetTrackParticles',
      EVENTINFO_BRANCH,
    ]);
    mockFile(tree);
    mockEntry({
      esd__InDetTrackParticles: { phi: [0.5], theta: [1.2], qOverP: [0.001] },
      esd__EventInfo: eventInfoStore,
    });

    const loader = new ATLASESDLoader();
    await loader.getEventData('file.root');

    const selector = (treeProcess as jest.Mock).mock.calls[0][1];
    expect(selector.branches.map((b: any) => b.branch)).toEqual([
      TRACK_BRANCH,
      EVENTINFO_BRANCH,
    ]);
  });

  it('does not confuse containers that are suffixes of other containers', async () => {
    // Only the exact container is wanted; MSOnly... and LRT... must not match.
    mockFile(
      makeTree([
        'xAOD::TrackParticleAuxContainer_v5_MSOnlyExtrapolatedMuonTrackParticlesAux.',
        'xAOD::CaloClusterAuxContainer_v2_LRTegammaClustersAux.',
        'xAOD::CaloClusterAuxContainer_v2_egammaClustersAux.',
        EVENTINFO_BRANCH,
      ]),
    );
    mockEntry({
      esd__egammaClusters: { calE: [1], calEta: [0], calPhi: [0] },
      esd__EventInfo: eventInfoStore,
    });

    const loader = new ATLASESDLoader();
    await loader.getEventData('file.root');

    const selector = (treeProcess as jest.Mock).mock.calls[0][1];
    expect(selector.branches.map((b: any) => b.branch)).toEqual([
      'xAOD::CaloClusterAuxContainer_v2_egammaClustersAux.',
      EVENTINFO_BRANCH,
    ]);
  });

  it('accepts a container written with a different aux version', async () => {
    mockFile(
      makeTree([
        'xAOD::TrackParticleAuxContainer_v9_InDetTrackParticlesAux.',
        EVENTINFO_BRANCH,
      ]),
    );
    mockEntry({
      esd__InDetTrackParticles: { phi: [0.5], theta: [1.2], qOverP: [0.001] },
      esd__EventInfo: eventInfoStore,
    });

    const events = await new ATLASESDLoader().getEventData('file.root');
    expect(
      events['Event 968132624']['Tracks']['InDetTrackParticles'],
    ).toHaveLength(1);
  });

  it('throws when no readable aux container is present', async () => {
    mockFile(makeTree(['Trk::TrackCollection_tlp7_CombinedInDetTracks']));

    await expect(
      new ATLASESDLoader().getEventData('file.root'),
    ).rejects.toThrow(/No readable xAOD auxiliary containers/);
  });

  it('reports a decompression failure as an actionable message', async () => {
    (openFile as jest.Mock).mockRejectedValue(new Error('corrupted input'));

    await expect(
      new ATLASESDLoader().getEventData('file.root'),
    ).rejects.toThrow(/jsroot cannot decode multi-chunk LZMA2/);
  });
});

describe('ATLASESDLoader skip reporting', () => {
  it('summarises skipped objects and collections on the console', async () => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});

    mockFile(
      makeTree([
        TRACK_BRANCH,
        'xAOD::MuonAuxContainer_v5_MuonsAux.',
        EVENTINFO_BRANCH,
      ]),
    );
    mockEntry({
      esd__InDetTrackParticles: {
        // second track has qOverP 0, third has theta out of range
        phi: [0.5, 0.5, 0.5],
        theta: [1.2, 1.2, 0],
        qOverP: [0.001, 0, 0.001],
      },
      esd__Muons: { pt: [], eta: [], phi: [] },
      esd__EventInfo: eventInfoStore,
    });

    await new ATLASESDLoader({
      containers: ['InDetTrackParticles', 'Muons', 'AntiKt4EMPFlowJets'],
    }).getEventData('file.root');

    const calls = info.mock.calls;
    const summary = calls[calls.length - 1][0] as string;

    // The headline must not claim events were skipped: none were. Two
    // collections came back empty, in the one event that was read.
    expect(summary).toContain(
      'read 2 collection(s) from 1 event(s); skipped 2 object(s), ' +
        '1 collection(s) unavailable, 1 collection(s) empty',
    );
    expect(summary).not.toContain('skipped 1 event');
    expect(summary).toContain(
      'InDetTrackParticles — zero or non-finite qOverP: 1 object(s)',
    );
    expect(summary).toContain(
      'InDetTrackParticles — theta outside (0, pi): 1 object(s)',
    );
    // Present but empty, versus not in the file at all — different reasons.
    expect(summary).toContain('Muons — empty: 1/1 events');
    expect(summary).toContain('AntiKt4EMPFlowJets — not present in this file');

    info.mockRestore();
  });

  it('says so explicitly when nothing was skipped', async () => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});

    mockFile(makeTree([TRACK_BRANCH, EVENTINFO_BRANCH]));
    mockEntry({
      esd__InDetTrackParticles: { phi: [0.5], theta: [1.2], qOverP: [0.001] },
      esd__EventInfo: eventInfoStore,
    });

    await new ATLASESDLoader({
      containers: ['InDetTrackParticles'],
    }).getEventData('file.root');

    const calls = info.mock.calls;
    expect(calls[calls.length - 1][0]).toContain('nothing skipped');

    info.mockRestore();
  });
});

describe('ATLASESDLoader converters', () => {
  const loader = new ATLASESDLoader() as any;

  describe('tracks', () => {
    it('orders dparams as d0, z0, phi, theta, qOverP and names cuts chi2/dof', () => {
      const tracks = loader.convertTracks(
        {
          d0: [1.5],
          z0: [-2.5],
          phi: [0.4],
          theta: [1.0],
          qOverP: [0.002],
          chiSquared: [28.4],
          numberDoF: [21],
        },
        'InDetTrackParticles',
      );

      expect(tracks).toHaveLength(1);
      expect(tracks[0].dparams).toEqual([1.5, -2.5, 0.4, 1.0, 0.002]);
      expect(tracks[0].chi2).toBe(28.4);
      expect(tracks[0].dof).toBe(21);
      expect(tracks[0].pT).toBeCloseTo(Math.sin(1.0) / 0.002, 6);
    });

    it('skips tracks whose parameters would produce NaN, by reason', () => {
      loader.skips.clear();

      const tracks = loader.convertTracks(
        {
          d0: [0, 0, 0, 0, NaN],
          z0: [0, 0, 0, 0, 0],
          phi: [0, 0, 0, 0, 0],
          theta: [1.0, 0, Math.PI, 1.0, 1.0],
          qOverP: [0.002, 0.002, 0.002, 0, 0.002],
        },
        'InDetTrackParticles',
      );

      // Only the first is valid: theta must be strictly inside (0, PI), qOverP
      // must be non-zero, and the perigee parameters must be finite.
      expect(tracks).toHaveLength(1);
      expect(tracks[0].dparams[3]).toBe(1.0);

      const skips = Object.fromEntries(
        [...loader.skips.entries()].map(([k, v]: [string, any]) => [
          k,
          v.count,
        ]),
      );
      expect(skips).toEqual({
        'InDetTrackParticles — theta outside (0, pi)': 2,
        'InDetTrackParticles — zero or non-finite qOverP': 1,
        'InDetTrackParticles — non-finite d0, z0 or phi': 1,
      });
    });
  });

  describe('MET', () => {
    const store = {
      mpx: [10, 20, 30],
      mpy: [-10, -20, -30],
      sumet: [1, 2, 3],
      name: ['RefEle', 'FinalTrk', 'FinalClus'],
    };

    it('selects the preferred term by name, not by index', () => {
      const met = loader.convertMET(store);
      expect(met).toEqual([{ etx: 20, ety: -20, name: 'FinalTrk', sumet: 2 }]);
    });

    it('honours the configured term priority', () => {
      const custom = new ATLASESDLoader({ metTerms: ['FinalClus'] }) as any;
      expect(custom.convertMET(store)[0].name).toBe('FinalClus');
    });

    it('falls back to the first term when none of the preferred ones exist', () => {
      const met = loader.convertMET({ ...store, name: ['RefEle', 'RefJet'] });
      expect(met[0].etx).toBe(10);
    });
  });

  describe('particles', () => {
    it('gives pdgId the sign of the charge, as PhoenixLoader expects', () => {
      // PhoenixLoader.getCompound reads `pdgId > 0` as positive charge, which
      // is the opposite of the PDG convention for leptons.
      const particles = loader.convertParticles(
        { pt: [1000, 1000], eta: [0, 0], phi: [0, 0], charge: [1, -1] },
        13,
      );

      expect(particles[0].pdgId).toBe(13);
      expect(particles[0].charge).toBe(1);
      expect(particles[1].pdgId).toBe(-13);
    });

    it('omits pdgId for neutral particles', () => {
      const particles = loader.convertParticles({
        pt: [1000],
        eta: [0],
        phi: [0],
      });
      expect(particles[0].pdgId).toBeUndefined();
    });

    it('computes energy from pt, eta and mass', () => {
      const [particle] = loader.convertParticles({
        pt: [3],
        eta: [0],
        phi: [0],
        m: [4],
      });
      expect(particle.energy).toBeCloseTo(5, 6);
    });
  });
});
