import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';

export class FileNode {
  name: string;
  url: string;
  children: { [key: string]: FileNode };

  constructor(name?: string) {
    this.name = name;
  }
}

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.scss'],
})
export class FileExplorerComponent implements OnChanges {
  @Input() rootFileNode: FileNode;
  @Output() onFileSelect: EventEmitter<string> = new EventEmitter<string>();

  treeControl = new NestedTreeControl<FileNode>(
    this.getSortedChildren.bind(this)
  );
  dataSource = new MatTreeNestedDataSource<FileNode>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes.rootFileNode?.currentValue) {
      this.dataSource.data = this.getSortedChildren(
        changes.rootFileNode.currentValue
      );
    }
  }

  hasChildren = (_: number, node: FileNode) =>
    !!node.children && Object.keys(node.children).length > 0;

  onSelect(url: string) {
    this.onFileSelect.emit(url);
  }

  /**
   * Sort the FileNode's children with folders before files.
   * @param node FileNode whose children are to be sorted.
   * @returns An array of sorted FileNodes.
   */
  getSortedChildren(node: FileNode): FileNode[] {
    if (!node.children) {
      return [];
    }

    return Object.values(node.children).sort((a, b) =>
      !a.url && b.url ? -1 : 1
    );
  }
}
