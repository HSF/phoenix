import {
  Component,
  EventEmitter,
  Input,
  type OnChanges,
  Output,
  type SimpleChanges,
} from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';

export class FileNode {
  name: string;
  url: string;
  nocache: boolean;
  children: { [key: string]: FileNode };

  constructor(name?: string) {
    this.name = name;
    this.nocache = false;
  }
}
export class FileEvent {
  url: string;
  nocache: boolean;
  constructor(url: string, nocache: boolean) {
    this.url = url;
    this.nocache = nocache;
  }
}

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.scss'],
})
export class FileExplorerComponent implements OnChanges {
  @Input() rootFileNode: FileNode;
  @Output() onFileSelect: EventEmitter<FileEvent> =
    new EventEmitter<FileEvent>();

  treeControl = new NestedTreeControl<FileNode>(
    this.getSortedChildren.bind(this),
  );
  dataSource = new MatTreeNestedDataSource<FileNode>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes.rootFileNode?.currentValue) {
      this.dataSource.data = this.getSortedChildren(
        changes.rootFileNode.currentValue,
      );
    }
  }

  hasChildren = (_: number, node: FileNode) =>
    !!node.children && Object.keys(node.children).length > 0;

  onSelect(url: string, nocache: boolean) {
    this.onFileSelect.emit(new FileEvent(url, nocache));
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
      !a.url && b.url ? -1 : 1,
    );
  }
}
