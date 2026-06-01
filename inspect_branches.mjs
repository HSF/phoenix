import { openFile } from 'jsroot';

async function inspect() {
  const file = await openFile('sample.root');
  const tree = await file.readObject('CollectionTree');
  
  const branches = tree.fBranches.arr.map(b => b.fName);
  
  console.log(`Total branches: ${branches.length}\n`);
  
  // Group by collection
  const collections = {};
  for (const b of branches) {
    const prefix = b.split('_')[0].replace('Aux.','');
    collections[prefix] = collections[prefix] || [];
    collections[prefix].push(b);
  }
  
  for (const [col, fields] of Object.entries(collections).sort()) {
    console.log(`\n[ ${col} ]`);
    fields.forEach(f => console.log(`  ${f}`));
  }
}

inspect();