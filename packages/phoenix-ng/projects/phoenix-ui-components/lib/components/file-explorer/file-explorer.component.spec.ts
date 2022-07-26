import { CdkTreeModule } from '@angular/cdk/tree';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileExplorerComponent, FileNode } from './file-explorer.component';

const getMockFileNode = () => {
  const rootNode = new FileNode('RootNode');
  const parentNode = new FileNode('ParentNode');
  rootNode.children = {
    ParentNode: parentNode,
  };
  parentNode.children = {
    TestChild1: new FileNode('TestChild1'),
    TestChild2: new FileNode('TestChild2'),
  };

  return rootNode;
};

describe('FileExplorerComponent', () => {
  let component: FileExplorerComponent;
  let fixture: ComponentFixture<FileExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileExplorerComponent],
      imports: [CdkTreeModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update dataSource on changes in input', () => {
    const mockFileNode = getMockFileNode();
    const sortedChildren = component.getSortedChildren(mockFileNode);

    expect(component.dataSource.data.length).toBe(0);
    component.ngOnChanges({
      rootFileNode: {
        currentValue: mockFileNode,
        previousValue: undefined,
        firstChange: undefined,
        isFirstChange: () => true,
      },
    });

    expect(component.dataSource.data).toEqual(sortedChildren);
  });

  it('should emit onFileSelect event on selection of file', () => {
    spyOn(component.onFileSelect, 'emit');
    component.onSelect('http://example.com/file.json');
    expect(component.onFileSelect.emit).toHaveBeenCalledWith(
      'http://example.com/file.json'
    );
  });

  it('checks if node has children', () => {
    const testNode = new FileNode('TestNode');
    expect(component.hasChildren(0, testNode)).toBeFalse();

    testNode.children = { TestChild: new FileNode() };
    expect(component.hasChildren(0, testNode)).toBeTrue();
  });
});
