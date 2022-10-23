import JSZip from 'jszip';

/**
 * Read a zip file and return its contents as an object.
 * @param file The file or array buffer to be read.
 * @returns An object with file paths in zip as keys and the files'
 * string contents as values.
 */
export const readZipFile = async (file: File | ArrayBuffer) => {
  const archive = new JSZip();
  const filesWithData: { [fileName: string]: string } = {};

  await archive.loadAsync(file);
  for (const filePath in archive.files) {
    const fileData = await archive.file(filePath).async('string');
    filesWithData[filePath] = fileData;
  }

  return filesWithData;
};
