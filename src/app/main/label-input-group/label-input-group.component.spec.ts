import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelInputGroupComponent } from './label-input-group.component';

describe('LabelInputGroupComponent', () => {
  let component: LabelInputGroupComponent;
  let fixture: ComponentFixture<LabelInputGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LabelInputGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LabelInputGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
