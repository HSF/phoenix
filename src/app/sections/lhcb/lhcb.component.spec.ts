import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LHCbComponent } from './lhcb.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppModule } from 'src/app/app.module';

describe('LHCbComponent', () => {
  let component: LHCbComponent;
  let fixture: ComponentFixture<LHCbComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LHCbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
