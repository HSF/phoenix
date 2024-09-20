/**
 * Save and download file with the given data.
 * @param data String data to save in the file.
 * @param fileName Name of the downloaded file.
 * @param contentType Content type of the file.
 */
export const saveFile = (
  data: string,
  fileName: string,
  contentType: string = 'application/json',
) => {
  const blob = new Blob([data], { type: contentType });
  const tempAnchor = document.createElement('a');
  tempAnchor.style.display = 'none';
  tempAnchor.href = URL.createObjectURL(blob);
  tempAnchor.download = fileName;
  tempAnchor.click();
  tempAnchor.remove();
};

/**
 * Load a file from user by mocking an input element.
 * @param onFileRead Callback when the file is read.
 * @param contentType Content type of the file. Default 'application/json'.
 */
export const loadFile = (
  onFileRead: (data: string) => void,
  contentType: string = 'application/json',
) => {
  // Create a mock input file element and use that to read the file
  const inputFile = document.createElement('input');
  document.body.appendChild(inputFile);
  inputFile.type = 'file';
  inputFile.accept = contentType;
  inputFile.onclick = (e: any) => {
    e.target.value = '';
  };

  inputFile.addEventListener('invalid', (e) => {
    console.log(JSON.stringify(e));
  });

  const fileSelected = (e: any) => {
    const configFile = e.target?.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        onFileRead?.(e.target.result.toString());
      }
      inputFile.remove();
    };
    reader.readAsText(configFile);
  };

  inputFile.oninput = fileSelected;
  // inputFile.onchange = fileSelected;
  inputFile.click();
};
