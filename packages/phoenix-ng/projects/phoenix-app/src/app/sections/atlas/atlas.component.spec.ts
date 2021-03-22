import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtlasComponent } from './atlas.component';
import { AppModule } from '../../../app/app.module';

describe('AtlasComponent', () => {
  let component: AtlasComponent;
  let fixture: ComponentFixture<AtlasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AtlasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test if three.js is initialized
  it('should initialize three.js canvas', () => {
    component.ngOnInit();
    expect(document.getElementById('three-canvas')).toBeTruthy();
  });
});
