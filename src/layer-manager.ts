import { Layer } from "./layer";
import { NucleusJSON, FiberJSON } from "./markers";

export type result = {
  [layerid:string] : {
    nuclei: {
      nucleiIn: [number, number][];
      nucleiOut: [number, number][];
    }
    fibers: {
      [fiberID:string]:
      {
        fiberPath : [number, number][];
        fiberArea : number;
      }
    }
  }
};

export type data = {
  title: string;
  data: data_data
};

type data_data =  {
  [imageId: string]: {
    nameImage: string;
    dataUrlBase64: string;
    FiberData: FiberJSON[];
    NucleiData: NucleusJSON[];
  };
};

/**
 * LayerManager class is responsible for managing interactions with multiple layers and their associated canvases.
 * @class LayerManager
 */
export class LayerManager {
  private mappedLayers: Map<string, Layer>;
  private activeLayer: Layer | undefined;
  private checkboxedlayers: Set<Layer>;
  constructor() {
    this.mappedLayers = new Map<string,Layer>();
    this.checkboxedlayers = new Set<Layer>();
    this.activeLayer = undefined;

    this.selectAllCardsEventListener();
    this.deleteCheckedCardsEventListener();
    this.initializeWrapperEventListeners();
    this.channelEventListeners();
    this.indicatorsEventListeners();
  }
  /**
   * Private method to add a click event listener to the "Select All" checkbox for cards.
   * @private
   * @function selectAllCardsEventListener
   * @memberof LayerManager
   * @returns {void}
   */
  private selectAllCardsEventListener() {
    const selectAllcheckBox = document.getElementById(
      "selectAllCheckbox"
    ) as HTMLInputElement;

    selectAllcheckBox.addEventListener("click", () => {
      this.mappedLayers.forEach((value: Layer) => {
        const checkbox = value.cardElement
          .getHtmlCard()
          .querySelector(".card-checkbox") as HTMLInputElement;
        if (selectAllcheckBox.checked) {
          checkbox.checked = true;
          this.checkboxedlayers.add(value);
        } else {
          checkbox.checked = false;
          this.checkboxedlayers.delete(value);
        }
      });
    });
  }
  /**
   * Private method to add a click event listener to the "Delete All" button for cards.
   * @private
   * @function deleteCheckedCardsEventListener
   * @memberof LayerManager
   * @returns {void}
   */
  private deleteCheckedCardsEventListener() {
    const deleteButton = document.getElementById(
      "removeAllButton"
    ) as HTMLButtonElement;

    deleteButton.addEventListener("click", () => {
      this.checkboxedlayers.forEach((entry: Layer) => {
        entry.canvasElement.deleteHTMLCanvas();
        entry.cardElement.deleteHtmlCard();
        this.mappedLayers.delete(entry.getId());
      });
      this.checkboxedlayers.clear();
    });
  }
  /**
   * Private method to initialize event listeners for canvas interactions.
   * @private
   * @function initializeWrapperEventListeners
   * @memberof LayerManager
   * @returns {void}
   */
  private initializeWrapperEventListeners() {
    const wrapper = document.getElementById(
      "canvas_container"
    ) as HTMLDivElement;

    wrapper.addEventListener("mousedown", this.mouseDownHandler);
    wrapper.addEventListener("mousemove", this.mouseMoveHandler);
    wrapper.addEventListener("mouseup", this.mouseUpHandler);
    wrapper.addEventListener("mouseleave", this.mouseUpHandler);
    wrapper.addEventListener("wheel", this.mouseWheelHandler);
    wrapper.addEventListener("click", this.mouseClickHandler);
    wrapper.addEventListener("contextmenu", this.mouseClickHandler);
  }

  private mouseClickHandler = (e: MouseEvent) => {
    if (this.activeLayer) {
      this.activeLayer.canvasElement.canvasTransform.mouseClickHandler(e);
    }
  };

  private mouseWheelHandler = (e: WheelEvent) => {
    if (this.activeLayer) {
      this.activeLayer.canvasElement.canvasTransform.mouseWheelHandler(e);
    }
  };

  private mouseUpHandler = (e: MouseEvent) => {
    if (this.activeLayer) {
      this.activeLayer.canvasElement.canvasTransform.mouseUpHandler(e);
    }
  };

  private mouseMoveHandler = (e: MouseEvent) => {
    if (this.activeLayer) {
      this.activeLayer.canvasElement.canvasTransform.mouseMoveHandler(e);
    }
  };

  private mouseDownHandler = (e: MouseEvent) => {
    if (this.activeLayer) {
      this.activeLayer.canvasElement.canvasTransform.mouseDownHandler(e);
    }
  };
  /**
   * Private method to add event listeners for channel checkboxes.
   * @private
   * @function channelEventListeners
   * @memberof LayerManager
   * @returns {void}
   */
  private channelEventListeners() {
    const blueCheckbox = document.getElementById(
      "blueCheckbox"
    ) as HTMLInputElement;
    const greenCheckbox = document.getElementById(
      "greenCheckbox"
    ) as HTMLInputElement;
    const redCheckbox = document.getElementById(
      "redCheckbox"
    ) as HTMLInputElement;

    const checkboxes = {
      red: true,
      green: true,
      blue: true,
    };
    //default
    redCheckbox.checked = checkboxes.red;
    greenCheckbox.checked = checkboxes.green;
    blueCheckbox.checked = checkboxes.blue;

    // Add event listeners to the checkboxes
    blueCheckbox.addEventListener("change", () => {
      checkboxes.blue = blueCheckbox.checked;
      this.onChannelCheckboxChange(checkboxes);
    });

    greenCheckbox.addEventListener("change", () => {
      checkboxes.green = greenCheckbox.checked;
      this.onChannelCheckboxChange(checkboxes);
    });

    redCheckbox.addEventListener("change", () => {
      checkboxes.red = redCheckbox.checked;
      this.onChannelCheckboxChange(checkboxes);
    });
  }

  private onChannelCheckboxChange = (obj: {
    red: boolean;
    green: boolean;
    blue: boolean;
  }) => {
    // Update the canvas settings for all the entries
    this.mappedLayers.forEach((entry) => {
      entry.canvasElement.canvasTransform.updateChannels(
        obj.red,
        obj.green,
        obj.blue
      );
    });
    if (this.activeLayer) {
      this.activeLayer.canvasElement.canvasTransform.drawImageWithMarkers();
    }
  };
  /**
   * Private method to add event listeners for indicators checkboxes (nuclei and fibers).
   * @private
   * @function indicatorsEventListeners
   * @memberof LayerManager
   * @returns {void}
   */
  private indicatorsEventListeners() {
    const nucleiCheckbox = document.getElementById(
      "nucleiCheckbox"
    ) as HTMLInputElement;
    const fibersCheckbox = document.getElementById(
      "fibersCheckbox"
    ) as HTMLInputElement;

    nucleiCheckbox.checked = true;
    fibersCheckbox.checked = true;

    nucleiCheckbox.addEventListener("change", () => {
      this.mappedLayers.forEach((entry) => {
        entry.canvasElement.canvasTransform.showNuclei(nucleiCheckbox.checked);
        if (this.activeLayer) {
          this.activeLayer.canvasElement.canvasTransform.drawImageWithMarkers();
        }
      });
    });
    fibersCheckbox.addEventListener("change", () => {
      this.mappedLayers.forEach((entry) => {
        entry.canvasElement.canvasTransform.showFibers(fibersCheckbox.checked);
        if (this.activeLayer) {
          this.activeLayer.canvasElement.canvasTransform.drawImageWithMarkers();
        }
      });
    });
  }

  /**
   * Public method to add a new layer card to the LayerManager.
   * @public
   * @function addCard
   * @memberof LayerManager
   * @param {string} name - The name or identifier associated with the layer.
   * @param {string} location - The location of the image for the layer.
   * @returns {Promise<Layer>} - A promise that resolves with the newly added Layer object.
   */
  public async addCard(name: string, location: string):  Promise<Layer>{
    return new Promise((resolve, reject) =>{
    const img = new Image();
    img.src = location;
    img.addEventListener("load", () => {
      const newLayer = new Layer(img, name);
      if (this.mappedLayers.size === 0) {
        this.activeLayer = newLayer;
        this.activeLayer.canvasElement.canvasTransform.drawImageWithMarkers();
      }
      this.mappedLayers.set(newLayer.getId(),newLayer)
      this.initialiseDeleteCardEventListener(newLayer);
      this.initialiseCheckingBoxEventListener(newLayer);
      this.initialiseSelectCardEventListener(newLayer);
      resolve(newLayer); 
    });
    img.addEventListener("error", (error) => {
      reject(error); 
    });
    });
  }

  private initialiseDeleteCardEventListener(entry: Layer) {
    const deleteButton = entry.cardElement
      .getHtmlCard()
      .querySelector(".delete-button") as HTMLDivElement;

    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const confirmation = window.confirm(
        "Are you sure you want to delete this entry?"
      );
      if (confirmation) {
        // FIXME: change activeCard if activeCard will be deleted.
        entry.cardElement.deleteHtmlCard();
        entry.canvasElement.deleteHTMLCanvas();
        this.mappedLayers.delete(entry.getId());
        this.checkboxedlayers.delete(entry);
      }
    });
  }

  private initialiseCheckingBoxEventListener(entry: Layer) {
    const checkbox = entry.cardElement
      .getHtmlCard()
      .querySelector(".card-checkbox") as HTMLInputElement;

    checkbox.addEventListener("click", (event) => {
      event.stopPropagation();
      if (checkbox.checked) {
        this.checkboxedlayers.add(entry);
      } else {
        this.checkboxedlayers.delete(entry);
      }
    });
  }

  private initialiseSelectCardEventListener(entry: Layer) {
    const card = entry.cardElement.getHtmlCard();

    card.addEventListener("click", () => {
      // if (this.activeLayer && this.activeLayer.getId() === entry.getId()) {
      //   return;
      // }
      if (this.activeLayer) {
        this.activeLayer.cardElement.getHtmlCard().classList.remove("active");
        this.activeLayer.canvasElement.canvasTransform.clearCanvas();
      }
      card.classList.add("active");
      this.activeLayer = entry;
      this.activeLayer.canvasElement.canvasTransform.drawImageWithMarkers();
    });
  }
  /**
   * Public method to draw markers and fibers for each layer based on the provided result data.
   * @public
   * @function drawProcessesFiles
   * @memberof LayerManager
   * @param {result} result - The result data containing nuclei and fibers information for each layer.
   * @returns {void}
   */
  public drawProcessesFiles(result: result) {
    for (const layerId in result) {
      const layer = this.mappedLayers.get(layerId);
      if(!layer){
        continue ;
      }
      layer.canvasElement.canvasTransform.addAllMarkers(result[layerId].nuclei);
      layer.canvasElement.canvasTransform.addAllFibers(result[layerId].fibers);
    }
  }
  /**
   * Public method to get the data of processing files (selected layers).
   * @public
   * @function getProcessingFiles
   * @memberof LayerManager
   * @returns {data_data} - The data of processing files (selected layers).
   */
  public getProcessingFiles() {
    const allLayersImages: {
      [key: string]: string;
    } = {};
    this.checkboxedlayers.forEach((layer) => {
      const imgData = layer.canvasElement.getHTMLImage();
      const dataUrlBase64 = imgData.src;
      allLayersImages[layer.getId()] = dataUrlBase64;
    });
    return allLayersImages;
  }
  /**
   * Public method to get the data in the LayerManager in the format suitable for saving.
   * @public
   * @function getSavingData
   * @memberof LayerManager
   * @returns {data} - The data in the LayerManager in the format suitable for saving.
   */
  public getSavingData():data {
    const SAVE_DATA:data = {
      title: "",
      data: {},
    };
    this.mappedLayers.forEach((layer) => {
      const imgData = layer.canvasElement.getHTMLImage();
      const dataUrlBase64 = imgData.src;
      SAVE_DATA.data[`${layer.getId()}`] = {
        nameImage: layer.cardElement.getName(),
        dataUrlBase64: dataUrlBase64,
        FiberData: layer.canvasElement.canvasTransform.getFibers().fibers,
        NucleiData: layer.canvasElement.canvasTransform.getNuclei().nuclei,
      };
    });
    return SAVE_DATA;
  }
  /**
   * Public method to get the data in CSV format.
   * @public
   * @function getCSV
   * @memberof LayerManager
   * @returns {string} - The data in CSV format.
   */
  public getCSV(){
    var data = [
      ['Image names', 'Total number of nuclei', 'Number of tropomyosin positive nuclei','Fusion index','Fiber area ratio'],
    ];
    this.mappedLayers.forEach((layer) => {
      data.push([
        layer.cardElement.getName(),
        layer.cardElement.getTotal(),
        layer.cardElement.getPositive(),
        layer.cardElement.getRatio(),
        layer.cardElement.getFibreArea(),
      ])
    });
    // Each column is separated by ";" and new line "\n" for next row
    let csvContent = '';
    data.forEach((arr, index)=> {
      const rowString = arr.join(';');
      csvContent += index < data.length ? rowString + '\n' : rowString;
    });
    return csvContent;
  }
  /**
   * Public method to load a project with the provided data.
   * @public
   * @function loadProject
   * @memberof LayerManager
   * @param {data_data} data - The data to load the project.
   * @returns {Promise<void>} - A promise that resolves when the project is loaded.
   */
  public async loadProject(data:data_data) {
    for (const imageID in data){
      const imageData = data[imageID]
      const newlayer: Layer = await this.addCard(imageData.nameImage,imageData.dataUrlBase64);
      this.loadingMarkers(newlayer,imageData.NucleiData);
      this.loadingFibers(newlayer, imageData.FiberData);
    }
  }
  private loadingMarkers(layer:Layer,nucs : NucleusJSON[]){
    for (const marker of nucs){
      layer.canvasElement.canvasTransform.addMarker(marker.Xpos,marker.Ypos,marker.type);
    }
  }
  private loadingFibers(layer : Layer, fibs : FiberJSON[]){
    for (const pointer of fibs){
      layer.canvasElement.canvasTransform.addFiber(pointer.fiberPath,pointer.area);
    }
  }
}
