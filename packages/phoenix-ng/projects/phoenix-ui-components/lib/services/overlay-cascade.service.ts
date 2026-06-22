import { Injectable } from '@angular/core';
import { GlobalPositionStrategy, Overlay } from '@angular/cdk/overlay';

@Injectable({
  providedIn: 'root',
})
export class OverlayCascadeService {
  private cascadeCount = 0;
  private topOffset = 130;
  private leftOffset = 15;
  private step = 40;

  constructor(private overlay: Overlay) {}

  public getCascadePositionStrategy(): GlobalPositionStrategy {
    const strategy = this.overlay
      .position()
      .global()
      .top(`${this.topOffset + this.cascadeCount * this.step}px`)
      .left(`${this.leftOffset + this.cascadeCount * this.step}px`);

    this.cascadeCount++;
    return strategy;
  }
}
