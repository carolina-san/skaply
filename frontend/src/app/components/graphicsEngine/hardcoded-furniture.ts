import { EngineFacade, RenderableObject, Vector3, GeometryConfig, MaterialConfig } from '../../engine/interfaces';

export interface AssemblyPart {
    object: RenderableObject;
    startPosition: Vector3;
    targetPosition: Vector3;
    appearStep: number;
    joinStep: number;
    name: string;
    description: string;
    arrow?: RenderableObject;
}

export function createHardcodedFurniture(engine: EngineFacade): { parts: AssemblyPart[], totalSteps: number, stepDescriptions: string[] } {
    const parts: AssemblyPart[] = [];
    const woodMaterial: MaterialConfig = { type: 'standard', color: 0xEAE0D5, roughness: 0.8, metalness: 0.1 };
    const screwMaterial: MaterialConfig = { type: 'standard', color: 0x374151, roughness: 0.4, metalness: 0.9 };
    const holeMaterial: MaterialConfig = { type: 'standard', color: 0x4F4A45, roughness: 0.9 };
    const dowelArgs = [0.03, 0.03, 0.2, 8];
    let step = 0;

    const stepDescriptions = [
        "Paso 1: Prepara los tacos inferiores.",
        "Paso 2: Inserta los tacos en la base.",
        "Paso 3: Prepara los paneles laterales.",
        "Paso 4: Une los paneles laterales a la base.",
        "Paso 5: Prepara el panel trasero.",
        "Paso 6: Desliza el panel trasero en su sitio.",
        "Paso 7: Prepara los tacos superiores.",
        "Paso 8: Inserta los tacos en los paneles laterales.",
        "Paso 9: Prepara el panel superior y los tornillos.",
        "Paso 10: Fija el panel superior con los tornillos."
    ];

    // Helper functions within the scope
    const createPart = (
        object: RenderableObject,
        startPos: Vector3,
        targetPos: Vector3,
        appearStep: number,
        joinStep: number,
        name: string,
        description: string
    ): AssemblyPart => {
        object.setPosition(startPos.x, startPos.y, startPos.z);
        object.castShadow = true;
        object.receiveShadow = true;
        engine.addToScene(object);
        return { object, startPosition: startPos, targetPosition: targetPos, appearStep, joinStep, name, description };
    };

    const createSidePanelWithHoles = (dowelHolePositions: { z: number }[], screwHolePositions: { z: number }[]): RenderableObject => {
        const group = engine.createGroup();

        const panelMesh = engine.createMesh({ type: 'box', args: [0.1, 2, 2] }, woodMaterial);
        group.add(panelMesh);

        const holeGeo: GeometryConfig = { type: 'cylinder', args: [0.035, 0.035, 0.12, 12] };
        dowelHolePositions.forEach(p => {
            const bottomHole = engine.createMesh(holeGeo, holeMaterial);
            bottomHole.setPosition(0, -0.94, p.z);
            bottomHole.setRotation(0, 0, Math.PI / 2);
            group.add(bottomHole);

            const topHole = engine.createMesh(holeGeo, holeMaterial);
            topHole.setPosition(0, 0.94, p.z);
            topHole.setRotation(0, 0, Math.PI / 2);
            group.add(topHole);
        });

        const pilotHoleGeo: GeometryConfig = { type: 'cylinder', args: [0.045, 0.045, 0.1, 12] };
        screwHolePositions.forEach(p => {
            const pilotHole = engine.createMesh(pilotHoleGeo, holeMaterial);
            pilotHole.setPosition(0, 0.95, p.z);
            group.add(pilotHole);
        });

        return group;
    };

    const createTopPanelWithHoles = (dowelHolePositions: { x: number, y: number, z: number }[], screwHolePositions: { x: number, z: number }[]): RenderableObject => {
        const group = engine.createGroup();
        const panelMesh = engine.createMesh({ type: 'box', args: [2.2, 0.1, 2.2] }, woodMaterial);
        group.add(panelMesh);

        const dowelHoleGeo: GeometryConfig = { type: 'cylinder', args: [0.035, 0.035, 0.12, 12] };
        dowelHolePositions.forEach(p => {
            const holeMesh = engine.createMesh(dowelHoleGeo, holeMaterial);
            holeMesh.setPosition(p.x, 0, p.z);
            group.add(holeMesh);
        });

        const screwHoleGeo: GeometryConfig = { type: 'cylinder', args: [0.045, 0.045, 0.12, 12] };
        screwHolePositions.forEach(p => {
            const holeMesh = engine.createMesh(screwHoleGeo, holeMaterial);
            holeMesh.setPosition(p.x, 0, p.z);
            group.add(holeMesh);
        });

        return group;
    };


    const baseMesh = engine.createMesh({ type: 'box', args: [2, 0.1, 2] }, woodMaterial);
    parts.push(createPart(baseMesh, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 0, 0, 'Panel Base', 'Panel inferior de madera (100x100x2cm)'));

    const baseDowelPositions = [{ x: 0.9, z: -0.9 }, { x: -0.9, z: -0.9 }, { x: 0.9, z: 0.9 }, { x: -0.9, z: 0.9 }];
    const holeGeo: GeometryConfig = { type: 'cylinder', args: [0.035, 0.035, 0.12, 12] };

    baseDowelPositions.forEach(p => {
        const holeMesh = engine.createMesh(holeGeo, holeMaterial);
        holeMesh.setPosition(p.x, 0.04, p.z);
        baseMesh.add(holeMesh);

        const dowelMesh = engine.createMesh({ type: 'cylinder', args: dowelArgs }, woodMaterial);
        const partDowel = createPart(dowelMesh, { x: p.x, y: 0.5, z: p.z }, { x: p.x, y: 0.15, z: p.z }, step, step + 1, 'Tarugo de Madera', 'Cilindro de madera de haya (Ø6x30mm)');
        partDowel.arrow = engine.createArrowHelper({ x: 0, y: -1, z: 0 }, { x: 0, y: -0.2, z: 0 }, 0.3, 0x00ffff);
        partDowel.object.add(partDowel.arrow);
        parts.push(partDowel);
    });
    step += 2;

    const sidePanelDowelHolePositions = [{ z: 0.9 }, { z: -0.9 }];
    const screwPositions = [{ x: 0.95, z: 0.8 }, { x: -0.95, z: 0.8 }, { x: 0.95, z: -0.8 }, { x: -0.95, z: -0.8 }];
    const sidePanelScrewHolePositions = screwPositions.map(p => ({ z: p.z })).filter((value, index, self) => self.findIndex(v => v.z === value.z) === index);

    const rightPanel = createSidePanelWithHoles(sidePanelDowelHolePositions, sidePanelScrewHolePositions);
    const partRight = createPart(rightPanel, { x: 1.5, y: 1.05, z: 0 }, { x: 0.95, y: 1.05, z: 0 }, step, step + 1, 'Panel Lateral Derecho', 'Panel lateral de madera (100x100x5cm)');
    partRight.arrow = engine.createArrowHelper({ x: -1, y: 0, z: 0 }, { x: 0.4, y: 0, z: 0 }, 0.35, 0x00ffff);
    partRight.object.add(partRight.arrow);
    parts.push(partRight);

    const leftPanel = createSidePanelWithHoles(sidePanelDowelHolePositions, sidePanelScrewHolePositions);
    const partLeft = createPart(leftPanel, { x: -1.5, y: 1.05, z: 0 }, { x: -0.95, y: 1.05, z: 0 }, step, step + 1, 'Panel Lateral Izquierdo', 'Panel lateral de madera (100x100x5cm)');
    partLeft.arrow = engine.createArrowHelper({ x: 1, y: 0, z: 0 }, { x: -0.4, y: 0, z: 0 }, 0.35, 0x00ffff);
    partLeft.object.add(partLeft.arrow);
    parts.push(partLeft);
    step += 2;

    const backPanelMesh = engine.createMesh({ type: 'box', args: [1.8, 2, 0.1] }, woodMaterial);
    const partBack = createPart(backPanelMesh, { x: 0, y: 1.05, z: -1.5 }, { x: 0, y: 1.05, z: -0.95 }, step, step + 1, 'Panel Trasero', 'Panel fino de contrachapado (90x100cm)');
    partBack.arrow = engine.createArrowHelper({ x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -0.4 }, 0.35, 0x00ffff);
    partBack.object.add(partBack.arrow);
    parts.push(partBack);
    step += 2;

    const topDowelPositions = [
        { x: 0.95, y: 2.05, z: 0.9 }, { x: 0.95, y: 2.05, z: -0.9 },
        { x: -0.95, y: 2.05, z: 0.9 }, { x: -0.95, y: 2.05, z: -0.9 }
    ];
    topDowelPositions.forEach(p => {
        const dowelMesh = engine.createMesh({ type: 'cylinder', args: dowelArgs }, woodMaterial);
        const partDowel = createPart(dowelMesh, { x: p.x, y: p.y + 0.5, z: p.z }, { x: p.x, y: p.y, z: p.z }, step, step + 1, 'Tarugo de Madera Superior', 'Cilindro de madera de haya (Ø6x30mm)');
        partDowel.arrow = engine.createArrowHelper({ x: 0, y: -1, z: 0 }, { x: 0, y: -0.2, z: 0 }, 0.3, 0x00ffff);
        partDowel.object.add(partDowel.arrow);
        parts.push(partDowel);
    });
    step += 2;

    const topPanel = createTopPanelWithHoles(topDowelPositions, screwPositions);
    const partTop = createPart(topPanel, { x: 0, y: 2.8, z: 0 }, { x: 0, y: 2.1, z: 0 }, step, step + 1, 'Panel Superior', 'Panel superior de madera (110x110x2cm)');
    partTop.arrow = engine.createArrowHelper({ x: 0, y: -1, z: 0 }, { x: 0, y: -0.2, z: 0 }, 0.6, 0x00ffff);
    partTop.object.add(partTop.arrow);
    parts.push(partTop);

    const screwGeoArgs = [0.04, 0.04, 0.3, 12];
    screwPositions.forEach(p => {
        const screwMesh = engine.createMesh({ type: 'cylinder', args: screwGeoArgs }, screwMaterial);
        const partScrew = createPart(screwMesh, { x: p.x, y: 2.8, z: p.z }, { x: p.x, y: 2.0, z: p.z }, step, step + 1, 'Tornillo de Montaje', 'Tornillo de acero (Ø8x40mm)');
        partScrew.arrow = engine.createArrowHelper({ x: 0, y: -1, z: 0 }, { x: 0, y: -0.25, z: 0 }, 0.4, 0x00ffff);
        partScrew.object.add(partScrew.arrow);
        parts.push(partScrew);
    });
    step += 2;

    return { parts, totalSteps: step, stepDescriptions };
}
