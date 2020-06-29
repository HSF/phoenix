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
            name: 'LAr Barrel',
            geometryId: 'LAr Barrel'
          },
          {
            name: 'LAr EC1',
            geometryId: 'LAr EC1'
          },
          {
            name: 'LAr EC2',
            geometryId: 'LAr EC2'
          },
          {
            name: 'Tile Cal',
            geometryId: 'Tile Cal'
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
