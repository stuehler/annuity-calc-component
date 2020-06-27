import { Component, OnInit, Input, ViewChild, ElementRef, HostListener } from '@angular/core';
import { createSplinePathFromPoints } from '../../utils/spline';
import { easeInOutQuad, formatCurrency, formatNumber } from '../../utils/utils';

const ANIMATION_DURATION = 700;

@Component({
  selector: 'app-cdf-chart',
  templateUrl: './cdf-chart.component.html',
  styleUrls: ['./cdf-chart.component.scss']
})
export class CdfChartComponent implements OnInit {


  _chartProperties: any;
  _svgWidth: number;
  _svgHeight: number;

  _animationStart: number;

  _annualRetirementIncomeWithDiaCdfStart: number[];
  _annualRetirementIncomeWithDiaCdfTarget: number[];
  _annualRetirementIncomeWithDiaCdfCurrent: number[];

  _annualRetirementIncomeCdfStart: number[];
  _annualRetirementIncomeCdfTarget: number[];
  _annualRetirementIncomeCdfCurrent: number[];

  _cdfArraysInitialized: boolean = false;

  @Input() annualRetirementIncomeWithDiaCdf: number[];
  @Input() annualRetirementIncomeCdf: number[];
  @Input() minAnnualRetirementIncome: number;
  @Input() maxAnnualRetirementIncome: number;
  @Input() bins: number;

  @ViewChild('chart')
  chart: ElementRef;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges() {

    if ((this.annualRetirementIncomeWithDiaCdf === undefined) || (this.annualRetirementIncomeCdf === undefined) || (this.bins === undefined)) {
      console.log("Error: missing data!")
      return;
    }

    if (this._cdfArraysInitialized === false) {

      // initialize the Cdf arrays

      this._cdfArraysInitialized = true;

      this._annualRetirementIncomeWithDiaCdfStart = Array(this.bins).fill(0);
      this._annualRetirementIncomeWithDiaCdfTarget = Array(this.bins).fill(0);
      this._annualRetirementIncomeWithDiaCdfCurrent = Array(this.bins).fill(0);
    
      this._annualRetirementIncomeCdfStart = Array(this.bins).fill(0);
      this._annualRetirementIncomeCdfTarget = Array(this.bins).fill(0);
      this._annualRetirementIncomeCdfCurrent = Array(this.bins).fill(0);
    }

    // copy current bins into starting bins

    this._annualRetirementIncomeWithDiaCdfStart = [...this._annualRetirementIncomeWithDiaCdfCurrent];
    this._annualRetirementIncomeCdfStart = [...this._annualRetirementIncomeCdfCurrent];

    // copy new bins into target bins
    
    this._annualRetirementIncomeWithDiaCdfTarget = [...this.annualRetirementIncomeWithDiaCdf];
    this._annualRetirementIncomeCdfTarget = [...this.annualRetirementIncomeCdf];

    this._animationStart = (new Date()).getTime();
    window.requestAnimationFrame(this.animate.bind(this));

  }  

  ngAfterViewInit() {
    this.setChartDimensions()
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.setChartDimensions();
    this._chartProperties = this.updateChart();
  }

  setChartDimensions() {
    let rect = (<HTMLElement>this.chart.nativeElement).getBoundingClientRect();
    this._svgWidth = rect.width;
    this._svgHeight = rect.height;
  }

  animate() {
      const now = (new Date()).getTime();
      const percent = Math.min(1, Math.max(0, (now - this._animationStart) / ANIMATION_DURATION));
      const easedPercent = easeInOutQuad(percent);

      const annualRetirementIncomeWithDiaCdfCurrent = [];
      const annualRetirementIncomeCdfCurrent = [];

      for (let i = 0; i < this.bins; i ++) {
        annualRetirementIncomeWithDiaCdfCurrent[i] = this.interpolate(this._annualRetirementIncomeWithDiaCdfStart[i], this._annualRetirementIncomeWithDiaCdfTarget[i], easedPercent);
        annualRetirementIncomeCdfCurrent[i] = this.interpolate(this._annualRetirementIncomeCdfStart[i], this._annualRetirementIncomeCdfTarget[i], easedPercent);
      }

      this._annualRetirementIncomeWithDiaCdfCurrent = [...annualRetirementIncomeWithDiaCdfCurrent];
      this._annualRetirementIncomeCdfCurrent = [...annualRetirementIncomeCdfCurrent];

      this._chartProperties = this.updateChart();

      if (percent < 1) {
        window.requestAnimationFrame(this.animate.bind(this));
      }

  }

  interpolate(start:number, target:number, percent:number): number {
    return start + (target - start) * percent;
  }

  updateChart() {

    if ((this.annualRetirementIncomeWithDiaCdf === undefined) || (this.annualRetirementIncomeCdf === undefined)) {
      return;
    }

    const annualRetirementIncomeWithDiaCdf = [...this._annualRetirementIncomeWithDiaCdfCurrent];
    const annualRetirementIncomeCdf = [...this._annualRetirementIncomeCdfCurrent];
    const bins = this.bins;

    const padding = 20;
    const xAxisHeight = 25;
    const calloutsHeight = 40;
    const chartTop = padding + calloutsHeight;
    const yAxisWidth = 20;
    const chartLeft = padding + yAxisWidth;

    const chartWidth = this._svgWidth - padding * 2 - yAxisWidth;
    const chartHeight = this._svgHeight - padding * 2 - calloutsHeight - xAxisHeight;
    const maxValue = 1;
    const tickmarkHeight = 7;

    let
      value: number,
      x: number,
      y: number,
      x1: number, x2: number, x3: number, x4: number,
      y1: number, y2: number, y3: number, y4: number,
      labels: number,
      bin: number,
      d: string;

    const pointsForRetirementIncomeWithDiaCurve = [];
    const pointsForRetirementIncomeCurve = [];

    for (bin = 0; bin < bins; bin++) {

      value = annualRetirementIncomeWithDiaCdf[bin];
      x = this.getXForBin(bin, chartLeft, chartWidth, bins);
      y = this.getY(value, chartTop, chartHeight, maxValue);
      pointsForRetirementIncomeWithDiaCurve.push([x, y]);

      value = annualRetirementIncomeCdf[bin];
      y = this.getY(value, chartTop, chartHeight, maxValue);
      pointsForRetirementIncomeCurve.push([x, y]);

    }

    // close spline;
    x = this.getXForBin(bins - 1, chartLeft, chartWidth, bins);
    y = this.getY(0, chartTop, chartHeight, maxValue);
    const closeSpline = ` L${x},${y} L${this.getXForBin(0, chartLeft, chartWidth, bins)},${y} z`;

    const retirementIncomeWithDiaSpline = createSplinePathFromPoints(pointsForRetirementIncomeWithDiaCurve) + closeSpline;
    const retirementIncomeSpline = createSplinePathFromPoints(pointsForRetirementIncomeCurve) + closeSpline

    // x-axis labels and tickmarks

    const minAnnualRetirementIncome = this.minAnnualRetirementIncome;
    const maxAnnualRetirementIncome = this.maxAnnualRetirementIncome;
    const range = maxAnnualRetirementIncome - minAnnualRetirementIncome;
    const widthPerLabel = 100;
    labels = Math.floor(chartWidth / widthPerLabel);
    const increment = range / labels;
    const orderOfMagnitude = this.orderOfMagnitude(increment);
    
    const adjustedIncrement = Math.round(increment / orderOfMagnitude) * orderOfMagnitude;


    const xAxisLabels = [];
    const xAxisTickmarks = [];

    value = Math.ceil(this.minAnnualRetirementIncome / adjustedIncrement) * adjustedIncrement;
    for (value; value < maxAnnualRetirementIncome; value += adjustedIncrement) {
      x = this.getXForValue(value, chartLeft, chartWidth, minAnnualRetirementIncome, maxAnnualRetirementIncome);
      xAxisLabels.push({
        x: x,
        y: chartTop + chartHeight + xAxisHeight,
        label: formatCurrency(value),
      });
      xAxisTickmarks.push({
        x1: this.halfPixelOffset(x),
        x2: this.halfPixelOffset(x),
        y1: this.halfPixelOffset(chartTop + chartHeight),
        y2: this.halfPixelOffset(chartTop + chartHeight + tickmarkHeight)
      });     
    }

    xAxisTickmarks.push({
      x1: this.halfPixelOffset(this.getXForBin(0, chartLeft, chartWidth, bins)),
      x2: this.halfPixelOffset(this.getXForBin(bins - 1, chartLeft, chartWidth, bins)),
      y1: this.halfPixelOffset(chartTop + chartHeight),
      y2: this.halfPixelOffset(chartTop + chartHeight)
    })
    
    // y-axis labels

    x = padding;
    y = chartTop + chartHeight;

    const lowerYAxisLabel = {
      x: x,
      y: y,
      transform: `rotate(-90,${x},${y})`
    }

    y = chartTop;

    const upperYAxisLabel = {
      x: x,
      y: y,
      transform: `rotate(-90,${x},${y})`
    }

    y = chartTop + chartHeight / 2;

    const yAxisTitle = {
      x: x,
      y: y,
      transform: `rotate(-90,${x},${y})`
    }


    // y-axis values 

    // const yAxisLabels = [];
    // for (let i = 1; i <= 4; i ++) {
    //   x = padding;
    //   y = chartTop + chartHeight - i/4 * chartHeight;
    //   yAxisLabels.push({
    //     x: x,
    //     y: this.halfPixelOffset(y),
    //     label: formatNumber(maxValue * i/4, 0) + " days"
    //   });
    // }

    return {
      retirementIncomeWithDiaSpline: retirementIncomeWithDiaSpline,
      retirementIncomeSpline: retirementIncomeSpline,
      xAxisLabels: xAxisLabels,
      xAxisTickmarks: xAxisTickmarks,
      lowerYAxisLabel: lowerYAxisLabel,
      upperYAxisLabel: upperYAxisLabel,
      yAxisTitle: yAxisTitle
    }

  }

  orderOfMagnitude(n: number): number {
    var order = Math.floor(Math.log(n) / Math.LN10 + 0.0000000001);
    return Math.pow(10, order);
  }
  getXForBin(bin: number, chartLeftX: number, chartWidth: number, bins: number): number {
    return chartLeftX + bin * (chartWidth / (bins - 1));
  }
  getXForValue(value: number, chartLeftX: number, chartWidth: number, minAnnualRetirementIncome: number, maxAnnualRetirementIncome: number): number {
    return chartLeftX + (value - minAnnualRetirementIncome) / (maxAnnualRetirementIncome - minAnnualRetirementIncome) * chartWidth;
  }
  getY(value: number, chartTopY: number, chartHeight: number, maxValue: number): number {
    return chartTopY + chartHeight - (value / maxValue * chartHeight);
  }
  halfPixelOffset(n: number): number {
    return Math.floor(n) + 0.5;
  }


}
