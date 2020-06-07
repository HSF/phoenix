import { Component, OnInit } from '@angular/core';
import { TracerMenuItemComponent } from './tracer-menu-item/tracer-menu-item.component';

@Component({
  selector: 'app-tracer-menu',
  templateUrl: './tracer-menu.component.html',
  styleUrls: ['./tracer-menu.component.scss']
})
export class TracerMenuComponent implements OnInit {

  rootNode = {
    name: 'Atlas Detector',
    geometryId: 'AtlasDetector',
    children: [
      {
        name: 'Magnet systems',
        geometryId: 'MagnetSys',
        children: [
          {
            name: 'Toroids',
            geometryId: 'Toroids'
          },
          {
            name: 'Barrel',
            geometryId: 'Barrel'
          },
          {
            name: 'EndCap',
            geometryId: 'EndCap'
          }
        ]
      },
      {
        name: 'Inner detector',
        geometryId: 'MagnetSys',
        children: [
          {
            name: 'Pixel',
            geometryId: 'Pixel',
          },
          {
            name: 'SCT',
            geometryId: 'SCT'
          },
          {
            name: 'TRT',
            geometryId: 'TRT'
          }

        ]
      }
    ]
  };

  constructor() { }

  ngOnInit(): void {
  }

}
