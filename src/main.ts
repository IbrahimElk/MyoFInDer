import { CardCanvasTable } from "./cardCanvasTable";

window.addEventListener("contextmenu", (e) => e.preventDefault());
const FILETABLE = new CardCanvasTable();

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

// FIXME:
// in rust prolly. 
//   processImagesButton.addEventListener("click", () => {
//     // we need to know which images to execute.
//   });
//   saveAsButton.addEventListener("click", () => {
//     // saves the result to excel
//   });

