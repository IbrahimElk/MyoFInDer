import { CanvasInteraction } from "./canvasInteraction";

export class TableEntry {
  private static counter: number = 0;
  public canvasElement: CanvasEntry;
  public cardElement: CardEntry;
  private id:number;
  constructor(htmlImage: HTMLImageElement, nameOfImage: string) {
    this.id = TableEntry.counter;

    this.canvasElement = new CanvasEntry(
      htmlImage,
      TableEntry.counter
    );
    this.cardElement = new CardEntry(
      nameOfImage, 
      TableEntry.counter
    );

    TableEntry.counter++;
  }

  public getId() {
    return this.id;
  }
}

class CanvasEntry {
  private htmlCanvas: HTMLCanvasElement;
  private id: number;

  public canvasTransform: CanvasInteraction;

  constructor(img: HTMLImageElement, id: number) {
    this.id = id;
    this.htmlCanvas = this.createHTMLCanvas();
    this.canvasTransform = new CanvasInteraction(this.htmlCanvas, img);
  }

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

  public getHtmlCanvas(): HTMLCanvasElement {
    return this.htmlCanvas;
  }

  public deleteHTMLCanvas() {
    const canvas = document.getElementById(
      `canvas:${this.id}`
    ) as HTMLCanvasElement;
    canvas.remove();
  }
}

class CardEntry {
  private name: string;
  private ratio: string;
  private fibreArea: number;
  private positive: number;
  private total: number;
  private id: number;
  private card: HTMLElement;

  constructor(name: string, id: number) {
    this.name = name;
    this.ratio = "N/A";
    this.fibreArea = 0;
    this.positive = 0;
    this.total = 0;
    this.id = id;

    this.card = this.createHtmlCard();
  }

  private createHtmlCard(): HTMLDivElement {
    const cardContainer = document.getElementById(
      "card-container"
    ) as HTMLDivElement;
    const cardDiv = document.createElement("div");
    const cardTitleDiv = document.createElement("div");
    const cardInfoDiv = document.createElement("div");
    const totalItemDiv = this.createCardInfoItem("Total:", `${this.total}`);
    const positiveItemDiv = this.createCardInfoItem(
      "Positive:",
      `${this.positive}`
    );
    const ratioItemDiv = this.createCardInfoItem("Ratio:", `${this.ratio}`);
    const fiberAreaItemDiv = this.createCardInfoItem(
      "Fiber Area:",
      `${this.fibreArea}`
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

  private createCardInfoItem(label: string, value: string): HTMLElement {
    const itemDiv = document.createElement("div");
    const labelElement = document.createElement("label");
    const valueElement = document.createElement("span");

    labelElement.textContent = label;
    valueElement.textContent = value;

    itemDiv.className = "card-info-item";
    itemDiv.appendChild(labelElement);
    itemDiv.appendChild(valueElement);

    return itemDiv;
  }

  public getHtmlCard(): HTMLElement {
    return this.card;
  }

  public deleteHtmlCard() {
    const cardDiv = document.getElementById(
      `card:${this.id}`
    ) as HTMLDivElement;
    cardDiv.remove();
  }
}