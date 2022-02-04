import { Component, Input } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';

export class FileNode {
  name: string;
  url: string;
  children: { [key: string]: FileNode };
}

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.scss'],
})
export class FileExplorerComponent {
  @Input() data: FileNode;
  @Input() onFileSelect: (url: string) => void;

  treeControl = new NestedTreeControl<FileNode>((node) =>
    Object.values(node.children)
  );
  dataSource = new MatTreeNestedDataSource<FileNode>();

  constructor() {
    this.dataSource.data = [this.data];
  }

  hasChild = (_: number, node: FileNode) =>
    !!node.children && Object.keys(node.children).length > 0;
}
