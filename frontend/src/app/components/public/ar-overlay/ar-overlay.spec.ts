import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArOverlay } from './ar-overlay';

describe('ArOverlay', () => {
  let component: ArOverlay;
  let fixture: ComponentFixture<ArOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArOverlay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArOverlay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
