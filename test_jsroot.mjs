import { openFile } from 'jsroot';

async function test() {
  console.log("Testing jsroot with PHYSLITE file...\n");
  
  try {
    console.log("Test 1: Opening file...");
    const file = await openFile('sample.root');
    console.log("✅ File opened successfully!\n");

    console.log("Test 2: Reading CollectionTree...");
    const tree = await file.readObject('CollectionTree');
    console.log("✅ Tree read successfully!");
    console.log(`   Total events: ${tree.fEntries}\n`);

    console.log("Test 3: Reading branches...");
    const branches = tree.fBranches.arr.map(b => b.fName);
    console.log("✅ Branches readable!");
    console.log("   Sample:", branches.slice(0, 5));

  } catch (err) {
    console.log("❌ FAILED");
    console.log("   Error:", err.message);
  }
}

test();