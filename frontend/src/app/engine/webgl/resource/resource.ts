export abstract class Resource {

    protected name: string; // eliminar en version segura

    constructor(name: string) {
        this.name = name;
    }

    // constructor(protected readonly name: string) {} // version segura

    // GETTERS

    getName(): string {
        return this.name;
    }

    // SETTERS

    setName(name: string) { // eliminar en version segura
        this.name = name;
    }

    // LOADFILE

    abstract loadFile(url: string): Promise<void>;
}