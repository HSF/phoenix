import { openFile, TSelector } from 'jsroot';

async function test() {
  const file = await openFile('sample.root');
  const tree = await file.readObject('CollectionTree');
  
  console.log("Tree found, entries:", tree.fEntries);
  console.log("Testing TSelector approach...\n");

  // Create selector to read specific branches
  const selector = new TSelector();
  
  // Storage for collected data
  const data = {
    jetPt: [],
    jetEta: [],
    jetPhi: []
  };

  // Add branches to read
  selector.addBranch('AnalysisJetsAuxDyn.pt');
  selector.addBranch('AnalysisJetsAuxDyn.eta');
  selector.addBranch('AnalysisJetsAuxDyn.phi');

  // Process function called for each event
  selector.Process = function() {
    const pt  = this.tgtobj['AnalysisJetsAuxDyn.pt'];
    const eta = this.tgtobj['AnalysisJetsAuxDyn.eta'];
    const phi = this.tgtobj['AnalysisJetsAuxDyn.phi'];
    
    data.jetPt.push(pt);
    data.jetEta.push(eta);
    data.jetPhi.push(phi);
  };

  try {
    // Read only first 5 events to test
    await tree.Process(selector, '', 5);
    
    console.log("✅ Data read successfully!");
    console.log("\nJet pt  (5 events):", data.jetPt);
    console.log("Jet eta (5 events):", data.jetEta);
    console.log("Jet phi (5 events):", data.jetPhi);

  } catch(e) {
    console.log("❌ Failed:", e.message);
    console.log("Stack:", e.stack);
  }
}

test();