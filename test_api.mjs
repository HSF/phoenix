import { openFile } from 'jsroot';

async function test() {
  const file = await openFile('sample.root');
  const tree = await file.readObject('CollectionTree');
  
  // Print all available methods on the tree object
  console.log("Tree object keys:");
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(tree)));
  
  console.log("\nTree direct keys:");
  console.log(Object.keys(tree).slice(0, 20));
}

test();