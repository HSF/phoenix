import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionsInfoComponent } from './collections-info.component';
import { AppModule } from 'src/app/app.module';

describe('CollectionsInfoComponent', () => {
  let component: CollectionsInfoComponent;
  let fixture: ComponentFixture<CollectionsInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionsInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
