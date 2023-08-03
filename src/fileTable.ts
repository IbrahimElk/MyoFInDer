import { ImageLayer } from "./imageLayer";

export class FileTable {
  private layers: Set<ImageLayer>;
  private activeLayer: ImageLayer | undefined;
  private checkboxedlayers: Set<ImageLayer>;
  private title:string;
  constructor(projectName:string) {
    this.layers = new Set<ImageLayer>();
    this.checkboxedlayers = new Set<ImageLayer>();
    this.activeLayer = undefined;
    this.title = projectName;

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
      this.layers.forEach((entry: ImageLayer) => {
        const checkbox = entry.cardElement
          .getHtmlCard()
          .querySelector(".card-checkbox") as HTMLInputElement;
        if (selectAllcheckBox.checked) {
          checkbox.checked = true;
          this.checkboxedlayers.add(entry);
        } else {
          checkbox.checked = false;
          this.checkboxedlayers.delete(entry);
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
        this.layers.delete(entry);
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
    this.layers.forEach((entry) => {
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
      this.layers.forEach((entry) => {
        entry.canvasElement.canvasTransform.showNuclei(nucleiCheckbox.checked);
        if (this.activeLayer) {
          this.activeLayer.canvasElement.canvasTransform.drawImageWithMarkers();
        }
      });
    });
    fibersCheckbox.addEventListener("change", () => {
      this.layers.forEach((entry) => {
        entry.canvasElement.canvasTransform.showFibers(fibersCheckbox.checked);
        if (this.activeLayer) {
          this.activeLayer.canvasElement.canvasTransform.drawImageWithMarkers();
        }
      });
    });
  }

  public addCard(name: string, location: string): void {
    const img = new Image();
    img.src = location;
    img.addEventListener("load", () => {
      const newLayer = new ImageLayer(img, name);
      if (this.layers.size === 0) {
        this.activeLayer = newLayer;
        this.activeLayer.canvasElement.canvasTransform.drawImageWithMarkers();
      }
      this.layers.add(newLayer);
      this.initialiseDeleteCardEventListener(newLayer);
      this.initialiseCheckingBoxEventListener(newLayer);
      this.initialiseSelectCardEventListener(newLayer);
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
        this.layers.delete(entry);
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
  
  // FIXME: is na processing steeds zelfde checkboxedLayers, wss , dus bij getToProcessFiles, checkboxedLayers kopieren naar nieuwe variable. 
  public drawProcessesFiles(result: {
    nucleiIn: [number, number][];
    nucleiOut: [number, number][];
    fiber: [number, number][];
  }) {
    this.checkboxedlayers.forEach((layer)=>{
      for (const [x,y] of result.nucleiIn) {
        layer.canvasElement.canvasTransform.addMarker(x,y,0)//TODO: change type correctly
      }
    })
    this.checkboxedlayers.forEach((layer)=>{
      for (const [x,y] of result.nucleiOut) {
        layer.canvasElement.canvasTransform.addMarker(x,y,1)//TODO: change type correctly
      }
    })
    this.checkboxedlayers.forEach((layer)=>{
        layer.canvasElement.canvasTransform.addFiber(result.fiber)
    })
  }

  public getToProcessFiles() {
    const allLayersImages: {
      [key: string]: { arr: Uint8ClampedArray; width: number; height: number };
    } = {};
    this.checkboxedlayers.forEach((layer) => {
      const imgData: ImageData =
        layer.canvasElement.canvasTransform.getImageData();
      const oneDimArray = imgData.data;
      const width = imgData.width;
      const height = imgData.height;
      allLayersImages[layer.getId()] = {
        arr: oneDimArray,
        width: width,
        height: height,
      }; // in python met numpy reshape veranderen.
    });
    return allLayersImages;
  }

  // FIXME:
  public getToSaveData() {
    const SAVE_DATA:{title:string,data:Array<{}>} = {
      title: this.title,
      data: []
    }
    this.layers.forEach((layer)=>{
      SAVE_DATA.data.push(layer.toJSON());
    })
    return SAVE_DATA;
  }
}
