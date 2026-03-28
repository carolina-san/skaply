import { Resource } from './resource';

export class ResourceManager {

    // map to store loaded resources by name
    private resources: Map<string, Resource> = new Map();

    async getResource<T extends Resource>(name: string, resourceFactory: () => T): Promise<T> {

        // if resource already exists, return it
        if (this.resources.has(name)) {
            console.log(`Resource ${name} already exists`);
            return this.resources.get(name)! as T;
        }

        // otherwise, create it, load it and save it in the map
        const resource = resourceFactory();
        await resource.loadFile(name);
        this.resources.set(name, resource);
        return resource;
    }

    dispose(): void {
        this.resources.forEach(resource => {
            if ((resource as any).dispose) {
                (resource as any).dispose();
            }
        });
        this.resources.clear();
    }
}