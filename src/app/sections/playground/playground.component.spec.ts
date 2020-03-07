import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { PlaygroundComponent } from './playground.component';
import { AttributePipe } from '../../services/extras/attribute.pipe';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AppModule } from 'src/app/app.module';

describe('PlaygroundComponent', () => {
  let component: PlaygroundComponent;
  let fixture: ComponentFixture<PlaygroundComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule, HttpClientModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
