import { invoke } from "@tauri-apps/api/tauri";
import { open, save,message } from "@tauri-apps/api/dialog";
import { FileTable, result, data } from "./fileTable";

const FILETABLE = new FileTable();
window.addEventListener("contextmenu", (e) => e.preventDefault());

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
  const project_path = await save();
  if(!project_path){
    return;
  }
  const parts = project_path.split("/");
  const lastFolder = parts[parts.length - 1];

  const data:data = FILETABLE.getSavingData();
  data.title = lastFolder;

  await invoke("save", {
    projectPath: project_path, // Corrected argument name here
    csvData: FILETABLE.getCSV(),
    data: data,
  });
});

// --------------------------------------------------------------------------------------
// LOADING DATA AND IMAGES.
// --------------------------------------------------------------------------------------

const loadProjectButton = document.getElementById(
  "loadProjectButton"
) as HTMLInputElement;

loadProjectButton.addEventListener("click", async () => {
  const chosenPath = await open({
    directory: true,
    multiple: false,
  }) as string | null;
  if(!chosenPath) {
    return;
  }
  const parts = chosenPath.split("/");
  const lastFolder = parts[parts.length - 1];
  const fullPath = chosenPath + "/" + lastFolder + ".bin";

  const project:Int8Array = await invoke("load", {fullPath:fullPath});  
  const projectBuffer = new Int8Array(project).buffer; // Convert Int8Array to ArrayBuffer

  if(project.length === 0){
    await message("No .bin file found in the directory.");
    return;
  }
  // Convert binary to DATA JSON
  const decoder = new TextDecoder();
  const jsonData = decoder.decode(projectBuffer);
  const DATA = JSON.parse(jsonData);

  const FILETABLE = new FileTable();
  FILETABLE.loadProject(DATA.data);
});
