import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CdfChartComponent } from './cdf-chart.component';

describe('CdfChartComponent', () => {
  let component: CdfChartComponent;
  let fixture: ComponentFixture<CdfChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CdfChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CdfChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
