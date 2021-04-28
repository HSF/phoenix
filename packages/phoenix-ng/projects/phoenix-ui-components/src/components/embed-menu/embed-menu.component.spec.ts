import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmbedMenuComponent } from './embed-menu.component';

describe('EmbedMenuComponent', () => {
  let component: EmbedMenuComponent;
  let fixture: ComponentFixture<EmbedMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmbedMenuComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmbedMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
