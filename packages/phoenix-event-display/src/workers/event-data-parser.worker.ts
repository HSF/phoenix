/**
 * Web Worker for parsing event data off the main thread.
 * Handles both JSON (deep clone/transfer) and JiveXML (DOMParser) parsing.
 * Three.js object creation must still happen on the main thread.
 */

export type WorkerRequest =
  | { type: 'json'; payload: string }
  | { type: 'jivexml'; payload: string };

export type WorkerResponse =
  | { type: 'json'; result: any }
  | { type: 'jivexml'; result: any }
  | { type: 'error'; message: string };

addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  try {
    const { type, payload } = event.data;

    if (type === 'json') {
      const result = JSON.parse(payload);
      postMessage({ type: 'json', result } satisfies WorkerResponse);
    } else if (type === 'jivexml') {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(payload, 'text/xml');
      const firstEvent = xmlDoc.getElementsByTagName('Event')[0];

      if (!firstEvent) {
        throw new Error('No <Event> element found in JiveXML');
      }

      // Extract all raw numeric/string arrays from XML here so the main
      // thread only receives plain data — no DOM objects cross the boundary.
      const result = extractJiveXMLData(firstEvent);
      postMessage({ type: 'jivexml', result } satisfies WorkerResponse);
    }
  } catch (err: any) {
    postMessage({
      type: 'error',
      message: err?.message ?? String(err),
    } satisfies WorkerResponse);
  }
});

function getNumbers(el: Element, tag: string): number[] {
  const nodes = el.getElementsByTagName(tag);
  if (!nodes.length) return [];
  return nodes[0].innerHTML
    .replace(/\r\n|\n|\r/gm, ' ')
    .trim()
    .split(' ')
    .map(Number);
}

function getStrings(el: Element, tag: string): string[] {
  const nodes = el.getElementsByTagName(tag);
  if (!nodes.length) return [];
  return nodes[0].innerHTML
    .replace(/\r\n|\n|\r/gm, ' ')
    .trim()
    .split(' ')
    .map(String);
}

/**
 * Extracts all raw data arrays from the JiveXML DOM into plain objects.
 * This mirrors the structure consumed by JiveXMLLoader methods, but as
 * serialisable data rather than live DOM nodes.
 */
function extractJiveXMLData(firstEvent: Element) {
  const attr = (name: string) => firstEvent.getAttribute(name);

  const result: any = {
    eventNumber: attr('eventNumber'),
    runNumber: attr('runNumber'),
    lumiBlock: attr('lumiBlock'),
    time: attr('dateTime'),
    collections: {} as Record<string, any>,
  };

  // Helper to collect all elements of a tag into raw data bags
  const collectAll = (tag: string) =>
    Array.from(firstEvent.getElementsByTagName(tag));

  // --- Tracks ---
  result.tracks = collectAll('Track').map((col) => ({
    storeGateKey: col.getAttribute('storeGateKey'),
    count: Number(col.getAttribute('count')),
    numPolyline: getNumbers(col, 'numPolyline'),
    polylineX: getNumbers(col, 'polylineX'),
    polylineY: getNumbers(col, 'polylineY'),
    polylineZ: getNumbers(col, 'polylineZ'),
    chi2: getNumbers(col, 'chi2'),
    numDoF: getNumbers(col, 'numDoF'),
    pt: getNumbers(col, 'pt'),
    d0: getNumbers(col, 'd0'),
    z0: getNumbers(col, 'z0'),
    phi0: getNumbers(col, 'phi0'),
    cotTheta: getNumbers(col, 'cotTheta'),
    hits: getNumbers(col, 'hits'),
    numHits: getNumbers(col, 'numHits'),
    trackAuthor: getNumbers(col, 'trackAuthor'),
  }));

  // --- Jets ---
  result.jets = collectAll('Jet').map((col) => ({
    storeGateKey: col.getAttribute('storeGateKey'),
    count: Number(col.getAttribute('count')),
    phi: getNumbers(col, 'phi'),
    eta: getNumbers(col, 'eta'),
    energy: getNumbers(col, 'energy'),
    coneR: getNumbers(col, 'coneR'),
  }));

  // --- CaloClusters ---
  result.caloClusters = collectAll('Cluster').map((col) => ({
    storeGateKey: col.getAttribute('storeGateKey'),
    count: Number(col.getAttribute('count')),
    phi: getNumbers(col, 'phi'),
    eta: getNumbers(col, 'eta'),
    et: getNumbers(col, 'et'),
  }));

  // --- PixelClusters ---
  const pixEls = firstEvent.getElementsByTagName('PixCluster');
  if (pixEls.length) {
    const el = pixEls[0];
    result.pixelClusters = {
      count: Number(el.getAttribute('count')),
      id: getNumbers(el, 'id'),
      x0: getNumbers(el, 'x0'),
      y0: getNumbers(el, 'y0'),
      z0: getNumbers(el, 'z0'),
      eloss: getNumbers(el, 'eloss'),
    };
  }

  // --- SCT ---
  const sctEls = firstEvent.getElementsByTagName('STC');
  if (sctEls.length) {
    const el = sctEls[0];
    result.sctClusters = {
      count: Number(el.getAttribute('count')),
      id: getNumbers(el, 'id'),
      phiModule: getNumbers(el, 'phiModule'),
      side: getNumbers(el, 'side'),
      x0: getNumbers(el, 'x0'),
      y0: getNumbers(el, 'y0'),
      z0: getNumbers(el, 'z0'),
    };
  }

  // --- TRT ---
  const trtEls = firstEvent.getElementsByTagName('TRT');
  if (trtEls.length) {
    const el = trtEls[0];
    result.trt = {
      count: Number(el.getAttribute('count')),
      driftR: getNumbers(el, 'driftR'),
      id: getNumbers(el, 'id'),
      noise: getNumbers(el, 'noise'),
      phi: getNumbers(el, 'phi'),
      rhoz: getNumbers(el, 'rhoz'),
      sub: getNumbers(el, 'sub'),
      threshold: getNumbers(el, 'threshold'),
      timeOverThreshold: getNumbers(el, 'timeOverThreshold'),
    };
  }

  // --- Muon PRDs: MDT, TGC, CSCD, MM, STGC, RPC ---
  for (const name of ['MDT', 'TGC', 'CSCD', 'MM', 'STGC', 'RPC']) {
    const els = firstEvent.getElementsByTagName(name);
    if (!els.length) continue;
    const el = els[0];
    result[`muonPRD_${name}`] = {
      count: Number(el.getAttribute('count')),
      x: getNumbers(el, 'x'),
      y: getNumbers(el, 'y'),
      z: getNumbers(el, 'z'),
      length: getNumbers(el, 'length'),
      width: getNumbers(el, 'width'),
      id: getNumbers(el, 'id'),
      identifier: getStrings(el, 'identifier'),
    };
  }

  // --- CaloCells: LAr, HEC, Tile ---
  for (const name of ['LAr', 'HEC', 'Tile']) {
    const els = firstEvent.getElementsByTagName(name);
    if (!els.length) continue;
    const el = els[0];
    result[`caloCells_${name}`] = {
      count: Number(el.getAttribute('count')),
      eta: getNumbers(el, 'eta'),
      phi: getNumbers(el, 'phi'),
      channel: getNumbers(el, 'channel'),
      energy: getNumbers(el, 'energy'),
      id: getNumbers(el, 'id'),
      slot: getStrings(el, 'slot'),
    };
  }

  // --- Vertices ---
  result.vertices = collectAll('RVx').map((col) => ({
    storeGateKey: col.getAttribute('storeGateKey'),
    count: Number(col.getAttribute('count')),
    x: getNumbers(col, 'x'),
    y: getNumbers(col, 'y'),
    z: getNumbers(col, 'z'),
    chi2: getNumbers(col, 'chi2'),
    primVxCand: getNumbers(col, 'primVxCand'),
    vertexType: getNumbers(col, 'vertexType'),
    numTracks: getNumbers(col, 'numTracks'),
    sgkey: getStrings(col, 'sgkey'),
    tracks: getNumbers(col, 'tracks'),
  }));

  // --- Muons ---
  result.muons = collectAll('Muon').map((col) => ({
    storeGateKey: col.getAttribute('storeGateKey'),
    count: Number(col.getAttribute('count')),
    chi2: getNumbers(col, 'chi2'),
    energy: getNumbers(col, 'energy'),
    eta: getNumbers(col, 'eta'),
    phi: getNumbers(col, 'phi'),
    pt: getNumbers(col, 'pt'),
    pdgId: getNumbers(col, 'pdgId'),
  }));

  // --- Electrons ---
  result.electrons = collectAll('Electron').map((col) => ({
    storeGateKey: col.getAttribute('storeGateKey'),
    count: Number(col.getAttribute('count')),
    author: getStrings(col, 'author'),
    energy: getNumbers(col, 'energy'),
    eta: getNumbers(col, 'eta'),
    phi: getNumbers(col, 'phi'),
    pt: getNumbers(col, 'pt'),
    pdgId: getNumbers(col, 'pdgId'),
  }));

  // --- Photons ---
  result.photons = collectAll('Photon').map((col) => ({
    storeGateKey: col.getAttribute('storeGateKey'),
    count: Number(col.getAttribute('count')),
    author: getStrings(col, 'author'),
    energy: getNumbers(col, 'energy'),
    eta: getNumbers(col, 'eta'),
    phi: getNumbers(col, 'phi'),
    pt: getNumbers(col, 'pt'),
  }));

  // --- MissingEnergy ---
  result.missingEnergy = collectAll('ETMis').map((col) => ({
    storeGateKey: col.getAttribute('storeGateKey'),
    count: Number(col.getAttribute('count')),
    et: getStrings(col, 'et'),
    etx: getNumbers(col, 'etx'),
    ety: getNumbers(col, 'ety'),
  }));

  return result;
}
