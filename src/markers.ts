// Define a type for the JSON representation of Nucleus
export type NucleusJSON = {
  Xpos: number;
  Ypos: number;
  id: number;
  type: number;
};
export type FiberJSON = {
  fiberPath: [number, number][];
  id: number;
};
/**
 * Class holding the data associated with a single nucleus.
 * type == 0, nucleus inside fiber
 * type == 1, nucleus outside fiber
 */
export class Nucleus {
  private Xpos: number;
  private Ypos: number;
  private id: number;
  private type: number;
  private idImage: number;
  private static counter = 0;
  constructor(Xpos: number, Ypos: number, type: number,idImage:number) {
    this.Xpos = Xpos;
    this.Ypos = Ypos;
    this.id = Nucleus.counter;
    this.idImage = idImage;
    this.type = type;
    Nucleus.counter++;
  }
  getXpos() {
    return this.Xpos;
  }
  getYpos() {
    return this.Ypos;
  }
  getType(): number {
    return this.type;
  }
  getId() {
    return this.id;
  }
  getImageId() {
    return this.idImage;
  }
  getRadius(): any {
    return 5;
  }
  getColor(): string {
    if (this.type === 0) {
      return `rgb(${255},${0},${0})`;
    } else {
      // for now, we have only 2 types.
      return `rgb(${250},${218},${94})`;
    }
  }

  toJSON():NucleusJSON{
    return {
        id: this.getId(),
        Xpos: this.getXpos(),
        Ypos: this.getYpos(),
        type: this.getType(),
        // idImage : this.getImageId()
        // radius: this.getRadius(),
        // color: this.getColor(),
    }
  }
}
/**
 * Class associated with multiple Nucleus instanes.
 */
export class Nuclei {
  private nuclei: Nucleus[];

  constructor(nuclei: Nucleus[] = []) {
    this.nuclei = nuclei;
  }

  //nuc is immutable, no represenation exposure.
  public append(nuc: Nucleus): void {
    this.nuclei.push(nuc);
  }

  public remove(nuc: Nucleus): void {
    const index = this.nuclei.indexOf(nuc);
    if (index !== -1) {
      this.nuclei.splice(index, 1);
    } else {
      throw new Error("No matching nucleus to delete");
    }
  }

  public reset(): void {
    this.nuclei = [];
  }

  public getNucleiInCount(): number {
    return this.nuclei.filter((nuc) => nuc.getType() === 0).length;
  }

  public getNucleiOutCount(): number {
    return this.nuclei.filter((nuc) => nuc.getType() === 1).length;
  }

  public [Symbol.iterator](): IterableIterator<Nucleus> {
    return this.nuclei.values();
  }

  public getLength(): number {
    return this.nuclei.length;
  }

  public toJSON(): { nuclei: NucleusJSON[] } {
    const my_nuclei: { nuclei: NucleusJSON[] } = {
      nuclei: []
    };
    
    this.nuclei.forEach((nuc) => {
      my_nuclei.nuclei.push(nuc.toJSON());
    });
    return my_nuclei;
  };
}

/**
 * Class holding the data associated with a single fiber.
 */
export class Fiber {
  private id: number;
  position: [number, number][] = [];
  private idImage:number;
  private static counter = 0;
  constructor( position: [number, number][], idImage: number) {
    this.id = Fiber.counter;
    this.idImage = idImage;
    this.position = position;
    Fiber.counter++;
  }

  public toJSON():FiberJSON{
    return {
      fiberPath : this.position,
      id:this.id,
      // idImage: this.idImage
    }
  }
}

//TODO: iets dat niet wordt gedaan in de officiele applicatie is de fibers fillen met lichte kleur ofzo.
/**
 * Class associated with multiple Fiber instacnes.
 */
export class Fibers {
  // The ratio of fiber area over the total image area.
  ratio: number;
  fibers: Fiber[];

  constructor() {
    this.ratio = 0;
    this.fibers = [];
  }

  public append(fib: Fiber): void {
    this.fibers.push(fib);
  }

  public remove(fib: Fiber): void {
    const index = this.fibers.indexOf(fib);
    if (index !== -1) {
      this.fibers.splice(index, 1);
    } else {
      throw new Error("No matching fiber to delete");
    }
  }

  public reset(): void {
    this.fibers = [];
    this.ratio = 0;
  }

  [Symbol.iterator](): IterableIterator<Fiber> {
    return this.fibers[Symbol.iterator]();
  }

  public getLength(): number {
    return this.fibers.length;
  }

  public toJSON(): {fibers: FiberJSON[]} {
    const my_fibers:  {fibers: FiberJSON[]} = {
      fibers: [],
    };
    this.fibers.forEach((fib)=>{
      my_fibers.fibers.push(fib.toJSON())
    })
    return my_fibers;
  }
}
