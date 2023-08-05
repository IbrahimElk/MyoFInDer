import {
  writeBinaryFile,
  readBinaryFile,
  createDir,
  writeFile,
  BaseDirectory,
  exists
} from "@tauri-apps/api/fs";
// import {
//   join
// } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";
import { FileTable, result } from "./fileTable";
import { data } from "./fileTable";



const FILETABLE = new FileTable("my_project", "path/to/save/file");

// --------------------------------------------------------------------------------------
// LOADING IMAGES
// --------------------------------------------------------------------------------------

const fileReader = new FileReader();

const loadImagesButton = document.getElementById(
  "loadImagesButton"
) as HTMLInputElement;

loadImagesButton.addEventListener("change", () => {
  const files = loadImagesButton.files;
  if (files === null || files.length === 0) {
    return;
  }
  for (const file of files) {
    fileReader.readAsDataURL(file); // when done reading, fires "load" event.
    fileReader.addEventListener("load", (event) => {
      if (!event.target) {
        return;
      }
      const dataURL = event.target.result as string; // because we are reading as base64 string
      FILETABLE.addCard(file.name, dataURL);
    });
  }
});

// --------------------------------------------------------------------------------------
// PROCESSING IMAGES.
// --------------------------------------------------------------------------------------
const processImagesButton = document.getElementById(
  "processImagesButton"
) as HTMLInputElement;

processImagesButton.addEventListener("click", async () => {
  const files = FILETABLE.getProcessingFiles();
  const serialisedFiles = JSON.stringify(files);
  const arrObj: result = await invoke("send_and_receive", {
    input: serialisedFiles,
  });
  FILETABLE.drawProcessesFiles(arrObj);
});

// --------------------------------------------------------------------------------------
// SAVING DATA AND IMAGES.
// --------------------------------------------------------------------------------------
const saveAsButton = document.getElementById(
  "saveAsButton"
) as HTMLInputElement;

saveAsButton.addEventListener("click", async () => {
  const DATA = FILETABLE.getSavingData();
  const path = FILETABLE.getPathToSave();//FIXME: kdenk via html, dan krijg je de pad. 
  // Convert DATA JSON to binary
  const jsonData = JSON.stringify(DATA);
  const encoder = new TextEncoder();
  const binaryData = encoder.encode(jsonData);
  // vb. const path = '/path/to/your/folder/';
  const existing = await exists('projectName', { dir: BaseDirectory.Desktop });
  if(!existing){
    await createDir("projectName",{ dir: BaseDirectory.Desktop });
  }
  await writeFile("projectName/project.csv",FILETABLE.getCSV(),{ dir: BaseDirectory.Desktop });
  await writeBinaryFile("projectName/project.bin", binaryData,{ dir: BaseDirectory.Desktop } );
  await extractAndSaveImages("projectName/images/",DATA);
});

async function extractAndSaveImages(folderPath: string, saveData:data) {
  // Create the "images" folder if it doesn't exist
  const existing = await exists(folderPath, { dir: BaseDirectory.Desktop });
  if(!existing){
    await createDir(folderPath,{ dir: BaseDirectory.Desktop });
  }
  // Loop through the data object and extract image data
  for (const imageId in saveData.data) {
    const imageData = saveData.data[imageId];
    const { nameImage, dataUrlBase64 } = imageData;

    // Convert base64 string to binary
    const base64Data = dataUrlBase64.replace(/^data:image\/\w+;base64,/, "");
    // Decode the base64 data into binary format
    const binaryString = atob(base64Data);

    // Create a Uint8Array from the binary string
    const length = binaryString.length;
    const binaryArray = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      binaryArray[i] = binaryString.charCodeAt(i);
    }

    await writeBinaryFile(folderPath+nameImage, binaryArray, { dir: BaseDirectory.Desktop});
  }
}

// --------------------------------------------------------------------------------------
// LOADING DATA AND IMAGES.
// --------------------------------------------------------------------------------------

const loadProjectButton = document.getElementById(
  "loadProjectButton"
) as HTMLInputElement;
//TODO: this path chosen by the user.!!

loadProjectButton.addEventListener("click", async () => {
  const chosenPath = "path";
  const loadedBinary = await readBinaryFile(chosenPath);

  // Convert binary to DATA JSON
  const decoder = new TextDecoder();
  const jsonData = decoder.decode(loadedBinary);
  const DATA: data = JSON.parse(jsonData);

  const FILETABLE = new FileTable(DATA.title, chosenPath);
  FILETABLE.loadProject(DATA.data);
});

window.addEventListener("contextmenu", (e) => e.preventDefault());

