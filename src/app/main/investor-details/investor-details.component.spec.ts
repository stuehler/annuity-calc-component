import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestorDetailsComponent } from './investor-details.component';

describe('InvestorDetailsComponent', () => {
  let component: InvestorDetailsComponent;
  let fixture: ComponentFixture<InvestorDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvestorDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvestorDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
