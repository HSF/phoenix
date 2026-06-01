import { openFile } from 'jsroot';

async function test() {
  const file = await openFile('sample.root');
  const tree = await file.readObject('CollectionTree');

  console.log("Testing actual data reading...\n");

  // Test reading Jets (most reliable collection)
  try {
    console.log("Reading Jet pt...");
    const jetPt = await tree.readBranch('AnalysisJetsAuxDyn.pt');
    console.log("✅ Jet pt values (first 3 events):", jetPt.slice(0,3));
  } catch(e) {
    console.log("❌ Jet pt failed:", e.message);
  }

  // Test reading Electrons
  try {
    console.log("\nReading Electron eta...");
    const elEta = await tree.readBranch('AnalysisElectronsAuxDyn.eta');
    console.log("✅ Electron eta values:", elEta.slice(0,3));
  } catch(e) {
    console.log("❌ Electron eta failed:", e.message);
  }

  // Test reading MET
  try {
    console.log("\nReading MET mpx...");
    const metMpx = await tree.readBranch('MET_Core_AnalysisMETAuxDyn.mpx');
    console.log("✅ MET mpx values:", metMpx.slice(0,3));
  } catch(e) {
    console.log("❌ MET failed:", e.message);
  }

  // Test reading Vertices
  try {
    console.log("\nReading Primary Vertex z...");
    const vtxZ = await tree.readBranch('PrimaryVerticesAuxDyn.z');
    console.log("✅ Vertex z values:", vtxZ.slice(0,3));
  } catch(e) {
    console.log("❌ Vertex z failed:", e.message);
  }
}

test();