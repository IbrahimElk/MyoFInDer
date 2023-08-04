import { writeBinaryFile,readBinaryFile, BaseDirectory} from '@tauri-apps/api/fs';

import { invoke } from "@tauri-apps/api/tauri";
import { FileTable } from "./fileTable";
import { data } from './fileTable';
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
      if(!event.target){
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
type result = {
  nucleiIn: [number, number][];
  nucleiOut: [number, number][];
  fiber: [number, number][];
};

const processImagesButton = document.getElementById(
  "processImagesButton"
) as HTMLInputElement;

processImagesButton.addEventListener("click", async () => {  
  const files = FILETABLE.getProcessingFiles();
  const serialisedFiles = JSON.stringify(files);
  const arrObj:result = await invoke("send_and_receive",{
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
  const path = FILETABLE.getPathToSave();

  // Convert DATA JSON to binary
  const encoder = new TextEncoder();
  const jsonData = JSON.stringify(DATA);
  const binaryData = encoder.encode(jsonData);

  writeBinaryFile(path,binaryData)
  
  //TODO: also write the images along with an excel sheet. 

});



// --------------------------------------------------------------------------------------
// LOADING DATA AND IMAGES.
// --------------------------------------------------------------------------------------
const loadProjectButton = document.getElementById(
  "loadProjectButton"
) as HTMLInputElement;
//TODO: this path chosen by the user.!!
const chosenPath = "path";

loadProjectButton.addEventListener("click", async () => {
  const loadedBinary = await readBinaryFile(chosenPath)

  // Convert binary to DATA JSON 
  const decoder = new TextDecoder();
  const jsonData = decoder.decode(loadedBinary);
  const DATA:data = JSON.parse(jsonData);

  const FILETABLE = new FileTable(DATA.title, chosenPath);
  FILETABLE.loadProject(DATA.data);

});








window.addEventListener("contextmenu", (e) => e.preventDefault());
