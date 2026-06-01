import { openFile, TSelector, treeProcess } from 'jsroot';

async function test() {
  const file = await openFile('sample.root');
  const tree = await file.readObject('CollectionTree');
  
  console.log("Tree found, entries:", tree.fEntries);
  console.log("Testing treeProcess approach...\n");

  const data = {
    jetPt:  [],
    jetEta: [],
    jetPhi: []
  };

  // Create selector class
  class MySelector extends TSelector {
    constructor() {
      super();
      this.addBranch('AnalysisJetsAuxDyn.pt');
      this.addBranch('AnalysisJetsAuxDyn.eta');
      this.addBranch('AnalysisJetsAuxDyn.phi');
    }

    Process() {
      data.jetPt.push(this.tgtobj['AnalysisJetsAuxDyn.pt']);
      data.jetEta.push(this.tgtobj['AnalysisJetsAuxDyn.eta']);
      data.jetPhi.push(this.tgtobj['AnalysisJetsAuxDyn.phi']);
    }
  }

  try {
    // Process only first 5 events
    await treeProcess(tree, new MySelector(), { numentries: 5 });
    
    console.log("✅ Data read successfully!");
    console.log("Jet pt  (5 events):", data.jetPt);
    console.log("Jet eta (5 events):", data.jetEta);
    console.log("Jet phi (5 events):", data.jetPhi);

  } catch(e) {
    console.log("❌ Failed:", e.message);
  }
}

test();