import { ImageLayer } from "./imageLayer";
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

type data_data =  {
  [imageId: string]: {
    nameImage: string;
    dataUrlBase64: string;
    FiberData: FiberJSON[];
    NucleiData: NucleusJSON[];
  };
};
export type data = {
  title: string;
  data: {
    [imageId: string]: {
      nameImage: string;
      dataUrlBase64: string;
      FiberData: FiberJSON[];
      NucleiData: NucleusJSON[];
    };
  };
};
export class FileTable {
  // private layers: Set<ImageLayer>;
  private mappedLayers: Map<string, ImageLayer>;
  private activeLayer: ImageLayer | undefined;
  private checkboxedlayers: Set<ImageLayer>;
  private title: string;
  private pathToSave:string;
  constructor(projectName: string, pathToSaveFile:string) {
    // this.layers = new Set<ImageLayer>();
    this.mappedLayers = new Map<string,ImageLayer>();
    this.checkboxedlayers = new Set<ImageLayer>();
    this.activeLayer = undefined;
    this.title = projectName;
    this.pathToSave = pathToSaveFile;

    this.selectAllCardsEventListener();
    this.deleteCheckedCardsEventListener();
    this.initializeWrapperEventListeners();
    this.channelEventListeners();
    this.indicatorsEventListeners();
  }

  private selectAllCardsEventListener() {
    const selectAllcheckBox = document.getElementById(
      "selectAllCheckbox"
    ) as HTMLInputElement;

    selectAllcheckBox.addEventListener("click", () => {
      this.mappedLayers.forEach((value: ImageLayer) => {
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

  private deleteCheckedCardsEventListener() {
    const deleteButton = document.getElementById(
      "removeAllButton"
    ) as HTMLButtonElement;

    deleteButton.addEventListener("click", () => {
      this.checkboxedlayers.forEach((entry: ImageLayer) => {
        entry.canvasElement.deleteHTMLCanvas();
        entry.cardElement.deleteHtmlCard();
        this.mappedLayers.delete(entry.getId());
      });
      this.checkboxedlayers.clear();
    });
  }

  //TODO: make it possible to drag image whilst crossing canvas to sidebar.
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

  public async addCard(name: string, location: string):  Promise<ImageLayer>{
    return new Promise((resolve, reject) =>{
    const img = new Image();
    img.src = location;
    img.addEventListener("load", () => {
      const newLayer = new ImageLayer(img, name);
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

  private initialiseDeleteCardEventListener(entry: ImageLayer) {
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

  private initialiseCheckingBoxEventListener(entry: ImageLayer) {
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

  private initialiseSelectCardEventListener(entry: ImageLayer) {
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

  public drawProcessesFiles(result: result) {
    for (const layerId in result) {
      const layer = this.mappedLayers.get(layerId);
      if(!layer){
        continue ;
      }
      for (const marker of result[layerId].nuclei.nucleiIn){
        layer.canvasElement.canvasTransform.addMarker(marker[0],marker[1],0);
      }

      for (const marker of result[layerId].nuclei.nucleiOut){
        layer.canvasElement.canvasTransform.addMarker(marker[0],marker[1],1);
      }
      for (const fiberID in result[layerId].fibers){
        const fiberObj = result[layerId].fibers[fiberID]
        layer.canvasElement.canvasTransform.addFiber(fiberObj.fiberPath,fiberObj.fiberArea);
      }
    }
  }

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

  public getSavingData():data {
    const SAVE_DATA:data = {
      title: this.title,
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

  public getPathToSave():string{
    return this.pathToSave;
  }

  public async loadProject(data:data_data) {
    for (const imageID in data){
      const imageData = data[imageID]
      const newlayer: ImageLayer = await this.addCard(imageData.nameImage,imageData.dataUrlBase64);
      this.loadingMarkers(newlayer,imageData.NucleiData);
      this.loadingFibers(newlayer, imageData.FiberData);
    }
  }

  private loadingMarkers(layer:ImageLayer,nucs : NucleusJSON[]){
    for (const marker of nucs){
      layer.canvasElement.canvasTransform.addMarker(marker.Xpos,marker.Ypos,marker.type);
    }
  }
  private loadingFibers(layer : ImageLayer, fibs : FiberJSON[]){
    for (const pointer of fibs){
      layer.canvasElement.canvasTransform.addFiber(pointer.fiberPath,pointer.area);
    }
  }


}
