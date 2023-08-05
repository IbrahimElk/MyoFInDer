import {
  writeBinaryFile,
  readBinaryFile,
  createDir,
  writeFile,
} from "@tauri-apps/api/fs";
import {
  join
} from "@tauri-apps/api/path";
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
  await writeBinaryFile(path+"projectName.bin", binaryData);
  await extractAndSaveImages(DATA, path+"images/");
  await writeFile(path+"projectName.csv",FILETABLE.getCSV())
});

async function extractAndSaveImages(saveData: data, folderPath: string) {
  // Create the "images" folder if it doesn't exist
  await createDir(folderPath);

  // Loop through the data object and extract image data
  for (const imageId in saveData.data) {
    const imageData = saveData.data[imageId];
    const { nameImage, dataUrlBase64 } = imageData;

    // Convert base64 string to binary
    const base64Data = dataUrlBase64.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Buffer.from(base64Data, "base64");

    // Determine file extension based on dataUrlBase64 content type
    const extension = dataUrlBase64.split("/")[1].split(";")[0];

    // Write the binary data to the "images" folder
    const imagePath = await join(folderPath, `${nameImage}.${extension}`);
    await writeBinaryFile(imagePath, binaryData);
  }
}

// --------------------------------------------------------------------------------------
// LOADING DATA AND IMAGES.
// --------------------------------------------------------------------------------------

const loadProjectButton = document.getElementById(
  "loadProjectButton"
) as HTMLInputElement;
//TODO: this path chosen by the user.!!
const chosenPath = "path";

loadProjectButton.addEventListener("click", async () => {
  const loadedBinary = await readBinaryFile(chosenPath);

  // Convert binary to DATA JSON
  const decoder = new TextDecoder();
  const jsonData = decoder.decode(loadedBinary);
  const DATA: data = JSON.parse(jsonData);

  const FILETABLE = new FileTable(DATA.title, chosenPath);
  FILETABLE.loadProject(DATA.data);
});

window.addEventListener("contextmenu", (e) => e.preventDefault());

