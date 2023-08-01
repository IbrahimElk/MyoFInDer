import { FileTable } from "./fileTable";

window.addEventListener("contextmenu", (e) => e.preventDefault());
const FILETABLE = new FileTable();

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


// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------

// import { invoke } from "@tauri-apps/api/tauri";

// let greetInputEl: HTMLInputElement | null;
// let greetMsgEl: HTMLElement | null;

// async function greet() {
//   if (greetMsgEl && greetInputEl) {
//     // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
//     greetMsgEl.textContent = await invoke("greet", {
//       name: greetInputEl.value,
//     });
//   }
// }

// window.addEventListener("DOMContentLoaded", () => {
//   greetInputEl = document.querySelector("#greet-input");
//   greetMsgEl = document.querySelector("#greet-msg");
//   document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
//     e.preventDefault();
//     greet();
//   });
// });