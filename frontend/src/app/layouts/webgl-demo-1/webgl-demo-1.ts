import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { mat4, vec3 } from 'gl-matrix';

import { ResourceManager } from '../../engine/webgl/resource/resource-manager';
import { MeshResource } from '../../engine/webgl/resource/mesh-resource';
import { Node } from '../../engine/webgl/engine-core/node';
import { ShaderResource } from '../../engine/webgl/resource/shader-resource';
import { Camera } from '../../engine/webgl/engine-core/camera';
import { PointLight } from '../../engine/webgl/engine-core/point-light';
import { flattenJSON } from 'three/src/animation/AnimationUtils.js';

@Component({
  selector: 'app-webgl-demo-1',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="width:100%; height:100vh; overflow:hidden;">
      <canvas #canvas width="1000" height="700"></canvas>
    </div>
  `
})
export class WebglSceneComponent implements AfterViewInit {

  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  async ngAfterViewInit() {

    const canvas = this.canvas.nativeElement;
    const gl = canvas.getContext('webgl2');

    if (!gl) {
      console.error("WebGL2 no soportado");
      return;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE); // AJUSTAR NORMALES DE LOS MODELOS PARA ACTIVAR!!
    //gl.enable(gl.CULL_FACE);
    //gl.frontFace(gl.CW);

    // shader
    const shader = new ShaderResource(gl, "basic");
    await shader.loadFile('assets/shaders/basic.vert', 'vertex');
    await shader.loadFile('assets/shaders/basic.frag', 'fragment');
    shader.buildProgram();

    // resource manager
    const resourceManager = new ResourceManager();
    const meshResource = await resourceManager.getResource(
      '../../../../../storage/vital_pro.glb',
      () => new MeshResource('vital_pro', gl)
    );

    const meshes = meshResource.getMeshes();

    // secene graph
    const root = new Node();
    
    // camera 
    const camera = new Camera();
    const cameraNode = new Node();
    cameraNode.setTranslation(0, 2, 5);
    camera.setPerspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
    cameraNode.setEntity(camera);
    root.addChild(cameraNode);

    // light 
    const light = new PointLight();
    light.setIntensity(vec3.fromValues(1.0, 1.0, 1.0));
    const lightNode = new Node();
    lightNode.setEntity(light);
    lightNode.setTranslation(3, 5, 3);
    root.addChild(lightNode);

    // meshes
    const meshNode = new Node();
    root.addChild(meshNode);

    //let num = 1;

    for (let mesh of meshes) {
      const node = new Node();
      node.setEntity(mesh);
      //root.addChild(node);
      meshNode.addChild(node);
      //console.log("Mesh added to scene:" + num + " - " + mesh);
      //num++;
    }



    // centrar un poco

    //meshNode.setTranslation(0, -1, -5);
    //root.addChild(meshNode);

    // render loop
    const render = () => {

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.1, 0.1, 0.1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      shader.use();

      // Actualizar la cámara para que mire al origen desde su posición
      // hacer lookAt en draw del render?? <- por hacer

      // const cameraPosition = vec3.fromValues(0, 2, 5);
      // const identity = mat4.create();
      // const cameraMatrix = mat4.create();
      // mat4.translate(cameraMatrix, identity, cameraPosition);
      // camera.lookAt(cameraMatrix, vec3.fromValues(0, 0, 0));

      root.traverse(shader);

      requestAnimationFrame(render);
    };

    render();
  }
}
