import {WebGLRenderer} from 'three';

export class RendererManager {
  //MEMBERS
  //private _activeRenderer: WebGLRenderer;

  private _mainRenderer: WebGLRenderer;
  private _overlayRenderer: WebGLRenderer;
  private _renderers: WebGLRenderer[];
  private _fixedOverlay: boolean;


  //CONSTRUCTOR
  constructor() {
    //this._activeRenderer = null;

    this._mainRenderer = null;
    this._overlayRenderer = null;
    this._renderers = [];
  }


  //SET/GET
  /*set activeControls(renderer: WebGLRenderer){
      this._activeRenderer = renderer;
  }*/
  set mainRenderer(renderer: WebGLRenderer) {
    this._mainRenderer = renderer;
  }

  set overlayRenderer(renderer: WebGLRenderer) {
    this._overlayRenderer = renderer;
  }

  set renderers(renderers: WebGLRenderer[]) {
    this._renderers = renderers;
  }

  /*get activeControls(): WebGLRenderer{
      return this._activeRenderer;
  }*/
  get mainRenderer(): WebGLRenderer {
    return this._mainRenderer;
  }

  get overlayRenderer(): WebGLRenderer {
    return this._overlayRenderer;
  }

  get renderers(): WebGLRenderer[] {
    return this._renderers;
  }


  //FUNCTIONS
  public addRenderer(renderer: WebGLRenderer) {
    if (!this.containsObject(renderer, this._renderers)) {
      this._renderers.push(renderer);
    }
  }

  public removeControls(renderer: WebGLRenderer): void {
    let index: number = this._renderers.indexOf(renderer);
    if (index > -1) {
      this._renderers.splice(index, 1);
    }
  }

  public swapRenderers(rendererA: WebGLRenderer, rendererB: WebGLRenderer): void {
    let temp: WebGLRenderer = rendererA;
    rendererA = rendererB;
    rendererB = temp;
  }

  private containsObject(obj: WebGLRenderer, list: WebGLRenderer[]): boolean {
    for (let i = 0; i < list.length; i++) {
      if (list[i] === obj) {
        return true;
      }
    }

    return false;
  }

  public setLocalClippingEnabled(value: boolean): void {
    for (let i: number = 0; i < this._renderers.length; i++) {
      this._renderers[i].localClippingEnabled = value;
    }
  }

  isFixedOverlay(): boolean {
    return this._fixedOverlay;
  }

  setFixOverlay(value: boolean) {
    this._fixedOverlay = value;
  }
}
