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

    // ---------- SHADER ----------
    const shader = new ShaderResource(gl, "basic");

    await shader.loadFile('assets/shaders/basic.vert', 'vertex');
    await shader.loadFile('assets/shaders/basic.frag', 'fragment');
    shader.buildProgram();

    // ---------- RESOURCE MANAGER ----------
    const resourceManager = new ResourceManager();

    const meshResource = await resourceManager.getResource(
      'assets/storage/vital_pro.glb',
      () => new MeshResource('vital_pro', gl)
    );

    //const mesh = meshResource.getMesh();
    const meshes = meshResource.getMeshes();

    // ---------- SCENE GRAPH ----------
    const root = new Node();
    const meshNode = new Node();
    //meshNode.setEntity(mesh);
    for (let mesh of meshes) {
      const node = new Node();
      node.setEntity(mesh);
      root.addChild(node);
    }

    // centrar un poco
    meshNode.setTranslation(0, -1, -5);

    root.addChild(meshNode);

    const identity = mat4.create();

    // ---------- CAMERA ----------
    const view = mat4.create();
    const projection = mat4.create();

    mat4.lookAt(view, vec3.fromValues(0, 2, 5), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
    mat4.perspective(projection, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);

    // ---------- RENDER LOOP ----------
    const render = () => {

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.1, 0.1, 0.1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      shader.use();

      shader.setMat4("uViewMatrix", view);
      shader.setMat4("uProjectionMatrix", projection);
      shader.setVec3("uLightPosition", vec3.fromValues(3, 5, 3));
      shader.setVec3("uLightColor", vec3.fromValues(1.0, 1.0, 1.0));
      shader.setVec3("uViewPosition", vec3.fromValues(0, 2, 5));

      root.traverse(identity, shader);

      requestAnimationFrame(render);
    };

    render();
  }
}
