import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LHCbComponent } from './lhcb.component';
import { AppModule } from '../../../app/app.module';

describe('LHCbComponent', () => {
  let component: LHCbComponent;
  let fixture: ComponentFixture<LHCbComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LHCbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
