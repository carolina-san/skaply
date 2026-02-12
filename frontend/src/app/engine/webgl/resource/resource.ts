export abstract class Resource {

    protected name: string;

    constructor(name: string) {
        this.name = name;
    }

    // GETTERS

    getName(): string {
        return this.name;
    }

    // SETTERS

    setName(name: string) {
        this.name = name;
    }

    // LOADFILE

    abstract loadFile(url: string): Promise<void>;
}