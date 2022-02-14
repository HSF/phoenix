import { Component, OnInit } from '@angular/core';
import { TreeMenuNode } from './tree-menu-item/tree-menu-item.component';

@Component({
  selector: 'app-tree-menu',
  templateUrl: './tree-menu.component.html',
  styleUrls: ['./tree-menu.component.scss'],
})
export class TreeMenuComponent implements OnInit {
  rootNode: TreeMenuNode = {
    name: 'Atlas Detector',
    geometryId: 'AtlasDetector',
    children: [
      {
        name: 'Magnet systems',
        geometryId: 'MagnetSys',
        children: [
          {
            name: 'Toroids',
            geometryId: 'Toroids',
          },
        ],
      },
      {
        name: 'Calorimeters',
        geometryId: 'CaloSys',
        children: [
          {
            name: 'LAr Barrel',
            geometryId: 'LAr Barrel',
          },
          {
            name: 'LAr EC1',
            geometryId: 'LAr EC1',
          },
          {
            name: 'LAr EC2',
            geometryId: 'LAr EC2',
          },
          {
            name: 'Tile Cal',
            geometryId: 'Tile Cal',
          },
        ],
      },
      {
        name: 'Inner detector',
        geometryId: 'InDetSys',
        children: [
          {
            name: 'Pixel',
            geometryId: 'Pixel',
          },
          {
            name: 'SCT',
            geometryId: 'SCT',
          },
          {
            name: 'TRT',
            geometryId: 'TRT',
          },
        ],
      },
    ],
  };

  constructor() {}

  ngOnInit(): void {}
}
