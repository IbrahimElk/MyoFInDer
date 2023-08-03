import { invoke } from "@tauri-apps/api/tauri";
import { FileTable } from "./fileTable";

const FILETABLE = new FileTable("my_project");

// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
const loadImagesButton = document.getElementById(
  "loadImagesButton"
) as HTMLInputElement;

loadImagesButton.addEventListener("change", () => {
  const files = loadImagesButton.files;
  if (files === null || files.length === 0) {
    return;
  }
  
  for (const file of files) {

    FILETABLE.addCard(file.name, URL.createObjectURL(file));
  }
});
// --------------------------------------------------------------------------------------
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
  const files = FILETABLE.getToProcessFiles();
  const timestampInSeconds = Date.now() ;
  const serialisedFiles = JSON.stringify("files");
  const time = Date.now() - timestampInSeconds;
  console.log(time);
  const arrObj:result = await invoke("send_and_receive",{
    input: serialisedFiles,
  });
  console.log(arrObj)
  FILETABLE.drawProcessesFiles(arrObj);
});

// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
const saveAsButton = document.getElementById(
  "saveAsButton"
) as HTMLInputElement;

saveAsButton.addEventListener("click", async () => {
  const DATA = FILETABLE.getToSaveData();
  await invoke("save", {
    files : DATA
  });
});

window.addEventListener("contextmenu", (e) => e.preventDefault());
