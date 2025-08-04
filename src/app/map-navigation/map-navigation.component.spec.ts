import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapNavigationComponent } from './map-navigation.component';

describe('MapNavigationComponent', () => {
  let component: MapNavigationComponent;
  let fixture: ComponentFixture<MapNavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapNavigationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
