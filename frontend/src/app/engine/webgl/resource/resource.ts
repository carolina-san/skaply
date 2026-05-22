export abstract class Resource {

    protected name: string; // remove in safe version

    constructor(name: string) {
        this.name = name;
    }

    // constructor(protected readonly name: string) {} // safe version

    // GETTERS

    getName(): string {
        return this.name;
    }

    // SETTERS

    setName(name: string) { // remove in safe version
        this.name = name;
    }

    // LOAD FILE

    abstract loadFile(url: string): Promise<void>;
}
