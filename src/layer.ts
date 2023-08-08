import { CanvasInteraction,MyCustomEvent } from "./canvas-interaction";

/**
 * Layer class represents a layer containing a canvas and a card on which an image with markers (nuclei and fibers) can be displayed.
 * @class Layer
 */
export class Layer {
  private id: number;
  private static counter: number = 0;

  public canvasElement: CanvasEntry;
  public cardElement: CardEntry;

  /**
   * Creates an instance of the Layer class.
   * @constructor
   * @param {HTMLImageElement} htmlImage - The image element to be displayed on the canvas.
   * @param {string} nameOfImage - The name or identifier for the image to be used on the card.
   */
  constructor(htmlImage: HTMLImageElement, nameOfImage: string) {
    this.id = Layer.counter;
    this.canvasElement = new CanvasEntry(htmlImage, Layer.counter);
    this.cardElement = new CardEntry(nameOfImage, Layer.counter);
    this.canvasToCardInteraction();
    Layer.counter++;
  }
  /**
   * Private method that handles the interaction between the canvas and the card when markers are added to the canvas.
   * @private
   * @function canvasToCardInteraction
   * @memberof Layer
   * @returns {void}
   */
  private canvasToCardInteraction() {
  this.canvasElement.getHtmlCanvas().addEventListener("markerAdded", (event:Event) => {
    const customEvent = event as CustomEvent<MyCustomEvent>;
    const data = customEvent.detail;
    console.log(data);
    this.cardElement.changeHtmlCard(data.ratio, data.fiberRatio, data.positive, data.total);
  });
  }
  /**
   * Get the unique identifier of this layer as a string.
   * @public
   * @function getId
   * @memberof Layer
   * @returns {string} - The unique identifier of the layer.
   */
  public getId() {
    return `${this.id}`;
  }
  /**
   * Convert the layer data to JSON format.
   * @public
   * @function toJSON
   * @memberof Layer
   * @returns {Object} - The JSON representation of the layer data.
   */
  public toJSON() {
    return {
      FiberData: this.canvasElement.canvasTransform.getFibers().fibers,
      NucleiData: this.canvasElement.canvasTransform.getNuclei().nuclei,
    };
  }
}
/**
 * CanvasEntry class represents the canvas element and its interaction for a single layer.
 * @class CanvasEntry
 */
class CanvasEntry {
  private htmlCanvas: HTMLCanvasElement;
  private id: number;
  private img: HTMLImageElement;

  public canvasTransform: CanvasInteraction;

  /**
   * Creates an instance of the CanvasEntry class.
   * @constructor
   * @param {HTMLImageElement} img - The image element to be displayed on the canvas.
   * @param {number} id - The unique identifier for this CanvasEntry instance.
   */
  constructor(img: HTMLImageElement, id: number) {
    this.id = id;
    this.img = img;
    this.htmlCanvas = this.createHTMLCanvas();
    this.canvasTransform = new CanvasInteraction(this.htmlCanvas, img, id);
  }

  /**
   * Get the HTML image element associated with this CanvasEntry instance.
   * @public
   * @function getHTMLImage
   * @memberof CanvasEntry
   * @returns {HTMLImageElement} - The image element associated with the canvas.
   */
  public getHTMLImage(): HTMLImageElement {
    return this.img;
  }

  /**
   * Create a new HTML canvas element for this CanvasEntry instance and append it to the canvas container.
   * @private
   * @function createHTMLCanvas
   * @memberof CanvasEntry
   * @returns {HTMLCanvasElement} - The newly created HTML canvas element.
   */
  private createHTMLCanvas(): HTMLCanvasElement {
    const canvasContainer = document.getElementById(
      "canvas_container"
    ) as HTMLDivElement;
    const canvas = document.createElement("canvas") as HTMLCanvasElement;

    canvas.id = `canvas:${this.id}`;
    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;
    canvasContainer.appendChild(canvas);
    return canvas;
  }

  /**
   * Get the HTML canvas element associated with this CanvasEntry instance.
   * @public
   * @function getHtmlCanvas
   * @memberof CanvasEntry
   * @returns {HTMLCanvasElement} - The HTML canvas element associated with this CanvasEntry instance.
   */
  public getHtmlCanvas(): HTMLCanvasElement {
    return this.htmlCanvas;
  }

  /**
   * Delete the HTML canvas element associated with this CanvasEntry instance.
   * @public
   * @function deleteHTMLCanvas
   * @memberof CanvasEntry
   * @returns {void}
   */
  public deleteHTMLCanvas() {
    const canvas = document.getElementById(
      `canvas:${this.id}`
    ) as HTMLCanvasElement;
    canvas.remove();
  }
  /**
   * Convert the CanvasEntry data to JSON format.
   * @public
   * @function toJSON
   * @memberof CanvasEntry
   * @returns {Object} - The JSON representation of the CanvasEntry data.
   */
  public toJSON() {
    return {
      FiberData: this.canvasTransform.getFibers().fibers,
      NucleiData: this.canvasTransform.getNuclei().nuclei,
    };
  }
}

/**
 * CardEntry class represents a card element displaying information for a single layer.
 * @class CardEntry
 */
class CardEntry {
  private name: string;
  private ratio: string;
  private fibreArea: number;
  private positive: number;
  private total: number;
  private id: number;
  private card: HTMLElement;

  /**
   * Creates an instance of the CardEntry class.
   * @constructor
   * @param {string} name - The name or identifier associated with the card.
   * @param {number} id - The unique identifier for this card element.
   */
  constructor(name: string, id: number) {
    this.name = name;
    this.ratio = "N/A";
    this.fibreArea = 0;
    this.positive = 0;
    this.total = 0;
    this.id = id;

    this.card = this.createHtmlCard();
  }
  /**
   * Private method that creates the card element with its content.
   * @private
   * @function createHtmlCard
   * @memberof CardEntry
   * @returns {HTMLDivElement} - The newly created card element.
   */
  private createHtmlCard(): HTMLDivElement {
    const cardContainer = document.getElementById(
      "card-container"
    ) as HTMLDivElement;
    const cardDiv = document.createElement("div");
    const cardTitleDiv = document.createElement("div");
    const cardInfoDiv = document.createElement("div");
    const totalItemDiv = this.createCardInfoItem("Total", `${this.total}`, "total");
    const positiveItemDiv = this.createCardInfoItem(
      "Positive",
      `${this.positive}`, "positive"
    );
    const ratioItemDiv = this.createCardInfoItem("Ratio", `${this.ratio}`, "ratio");
    const fiberAreaItemDiv = this.createCardInfoItem(
      "Fiber Area",
      `${this.fibreArea}`, "area"
    );
    const checkboxInput = document.createElement("input");
    const deleteButtonDiv = document.createElement("button");

    // Set classes
    cardDiv.id = `card:${this.id}`;
    cardDiv.className = "card";
    cardTitleDiv.className = "card-title";
    cardInfoDiv.className = "card-info";
    checkboxInput.type = "checkbox";
    checkboxInput.className = "card-checkbox";
    deleteButtonDiv.className = "delete-button";

    // Set content
    cardTitleDiv.textContent = `${this.name}`;
    deleteButtonDiv.textContent = "X";

    // Append elements
    cardDiv.appendChild(cardTitleDiv);
    cardInfoDiv.appendChild(totalItemDiv);
    cardInfoDiv.appendChild(positiveItemDiv);
    cardInfoDiv.appendChild(ratioItemDiv);
    cardInfoDiv.appendChild(fiberAreaItemDiv);
    cardDiv.appendChild(cardInfoDiv);
    cardDiv.appendChild(checkboxInput);
    cardDiv.appendChild(deleteButtonDiv);
    cardContainer.appendChild(cardDiv);
    return cardDiv;
  }
  /**
   * Private method that creates an item for the card info section.
   * @private
   * @function createCardInfoItem
   * @memberof CardEntry
   * @param {string} label - The label for the card info item.
   * @param {string} value - The value for the card info item.
   * @returns {HTMLElement} - The newly created card info item element.
   */
  private createCardInfoItem(label: string, value: string, id:string): HTMLElement {
    const itemDiv = document.createElement("div");
    const labelElement = document.createElement("label");
    const valueElement = document.createElement("span");
    itemDiv.id = id;
    labelElement.textContent = label;
    valueElement.textContent = value;

    itemDiv.className = "card-info-item";
    itemDiv.appendChild(labelElement);
    itemDiv.appendChild(valueElement);

    return itemDiv;
  }
  /**
   * Get the card element associated with this CardEntry instance.
   * @public
   * @function getHtmlCard
   * @memberof CardEntry
   * @returns {HTMLElement} - The card element associated with this CardEntry instance.
   */
  public getHtmlCard(): HTMLElement {
    return this.card;
  }
  /**
   * Delete the card element associated with this CardEntry instance.
   * @public
   * @function deleteHtmlCard
   * @memberof CardEntry
   * @returns {void}
   */
  public deleteHtmlCard() {
    const cardDiv = document.getElementById(
      `card:${this.id}`
    ) as HTMLDivElement;
    cardDiv.remove();
  }
  /**
   * Get the name or identifier associated with the card.
   * @public
   * @function getName
   * @memberof CardEntry
   * @returns {string} - The name or identifier associated with the card.
   */
  public getName() {
    return this.name;
  }

  /**
   * Get the ratio value displayed on the card.
   * @public
   * @function getRatio
   * @memberof CardEntry
   * @returns {string} - The ratio value displayed on the card.
   */
  public getRatio(){
    return this.ratio;
  }
  /**
   * Get the fiber area value displayed on the card.
   * @public
   * @function getFibreArea
   * @memberof CardEntry
   * @returns {number} - The fiber area value displayed on the card.
   */
  public getFibreArea(){
    return this.ratio;
  }
  /**
   * Get the positive value displayed on the card.
   * @public
   * @function getPositive
   * @memberof CardEntry
   * @returns {string} - The positive value displayed on the card.
   */
  public getPositive(){
    return `${this.positive}`;
  }
  /**
   * Get the total value displayed on the card.
   * @public
   * @function getTotal
   * @memberof CardEntry
   * @returns {string} - The total value displayed on the card.
   */
  public getTotal() {
    return `${this.total}`;
  }

  /**
   * Change the content of the card element with updated information.
   * @public
   * @function changeHtmlCard
   * @memberof CardEntry
   * @param {number} ratio - The updated ratio value.
   * @param {number} fibreArea - The updated fiber area value.
   * @param {number} positive - The updated positive value.
   * @param {number} total - The updated total value.
   * @returns {void}
   */
  public changeHtmlCard(
    ratio: number,
    fibreArea: number,
    positive: number,
    total: number
  ) {

    this.total = total;
    this.fibreArea = fibreArea;
    this.positive = positive;
    this.ratio = ratio >0 ? `${ratio}` : "NA";

    const cardContainer = document.getElementById(
      "card-container"
    ) as HTMLDivElement;
    const card = cardContainer.querySelector(`#card\\:${this.id}`);
    console.log(card);
    if (!card) {
      return;
    }

    const totalValue = card.querySelector("#total")?.querySelector("span");
    const positiveValue = card.querySelector("#positive")?.querySelector("span");
    const ratioValue = card.querySelector("#ratio")?.querySelector("span");
    const fiberAreaValue = card.querySelector("#area")?.querySelector("span");
    if (totalValue && positiveValue && ratioValue && fiberAreaValue) {
      totalValue.textContent = total.toString();
      positiveValue.textContent = positive.toString();
      ratioValue.textContent = `${ratio}`;
      fiberAreaValue.textContent = `${fibreArea}`;
    }
  }
  /**
   * Convert the CardEntry data to JSON format.
   * @public
   * @function toJSON
   * @memberof CardEntry
   * @returns {Object} - The JSON representation of the CardEntry data.
   */
  public toJSON() {
    return {
      //  cardData:  this.card.getInfo(),
    };
  }
}

