import { Component, OnInit, Input, ViewChild, ElementRef, HostListener } from '@angular/core';
import { createSplinePathFromPoints } from '../../utils/spline';
import { easeInOutQuad, formatCurrency, formatNumber, intersect } from '../../utils/utils';
import { Point } from '../../model/model';

const ANIMATION_DURATION = 700;


@Component({
  selector: 'app-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.scss']
})
export class HistogramComponent implements OnInit {

  _chartProperties: any;
  _svgWidth: number;
  _svgHeight: number;

  _animationStart: number;

  _annualRetirementIncomeWithDiaHistogramStart: number[];
  _annualRetirementIncomeWithDiaHistogramTarget: number[];
  _annualRetirementIncomeWithDiaHistogramCurrent: number[];

  _annualRetirementIncomeHistogramStart: number[];
  _annualRetirementIncomeHistogramTarget: number[];
  _annualRetirementIncomeHistogramCurrent: number[];

  _initialMax: number;

  _histogramArraysInitialized: boolean = false;


  @Input() annualRetirementIncomeWithDiaHistogram: number[];
  @Input() annualRetirementIncomeHistogram: number[];
  @Input() medianAnnualRetirementIncomeWithDia: number;
  @Input() medianAnnualRetirementIncome: number;
  @Input() minAnnualRetirementIncome: number;
  @Input() maxAnnualRetirementIncome: number;
  @Input() bins: number;


  @ViewChild('chart')
  chart: ElementRef;

  constructor() { }

  ngOnChanges() {

    if ((this.annualRetirementIncomeWithDiaHistogram === undefined) || (this.annualRetirementIncomeHistogram === undefined) || (this.bins === undefined)) {
      console.log("Error: missing data!")
      return;
    }

    if (this._histogramArraysInitialized === false) {

      // initialize the histogram arrays

      this._histogramArraysInitialized = true;

      this._annualRetirementIncomeWithDiaHistogramStart = Array(this.bins).fill(0);
      this._annualRetirementIncomeWithDiaHistogramTarget = Array(this.bins).fill(0);
      this._annualRetirementIncomeWithDiaHistogramCurrent = Array(this.bins).fill(0);
    
      this._annualRetirementIncomeHistogramStart = Array(this.bins).fill(0);
      this._annualRetirementIncomeHistogramTarget = Array(this.bins).fill(0);
      this._annualRetirementIncomeHistogramCurrent = Array(this.bins).fill(0);
    }

    // copy current bins into starting bins

    this._annualRetirementIncomeWithDiaHistogramStart = [...this._annualRetirementIncomeWithDiaHistogramCurrent];
    this._annualRetirementIncomeHistogramStart = [...this._annualRetirementIncomeHistogramCurrent];

    // copy new bins into target bins
    
    this._annualRetirementIncomeWithDiaHistogramTarget = [...this.annualRetirementIncomeWithDiaHistogram];
    this._annualRetirementIncomeHistogramTarget = [...this.annualRetirementIncomeHistogram];

    // for the first run, since we're staring with no curve, pre-set the maximum
    // (this will allow the curve to appear to grow...)

    if (this._initialMax === undefined) {
      this._initialMax = Math.max(...this._annualRetirementIncomeWithDiaHistogramTarget, ...this._annualRetirementIncomeHistogramTarget);
    } else {
      this._initialMax = 0;
    }

    this._animationStart = (new Date()).getTime();
    window.requestAnimationFrame(this.animate.bind(this));


  }


  ngOnInit(): void {
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

      const annualRetirementIncomeWithDiaHistogramCurrent = [];
      const annualRetirementIncomeHistogramCurrent = [];

      for (let i = 0; i < this.bins; i ++) {
        annualRetirementIncomeWithDiaHistogramCurrent[i] = this.interpolate(this._annualRetirementIncomeWithDiaHistogramStart[i], this._annualRetirementIncomeWithDiaHistogramTarget[i], easedPercent);
        annualRetirementIncomeHistogramCurrent[i] = this.interpolate(this._annualRetirementIncomeHistogramStart[i], this._annualRetirementIncomeHistogramTarget[i], easedPercent);
      }

      this._annualRetirementIncomeWithDiaHistogramCurrent = [...annualRetirementIncomeWithDiaHistogramCurrent];
      this._annualRetirementIncomeHistogramCurrent = [...annualRetirementIncomeHistogramCurrent];

      this._chartProperties = this.updateChart();

      if (percent < 1) {
        window.requestAnimationFrame(this.animate.bind(this));
      }

  }

  interpolate(start:number, target:number, percent:number): number {
    return start + (target - start) * percent;
  }


  updateChart() {

    if ((this.annualRetirementIncomeWithDiaHistogram === undefined) || (this.annualRetirementIncomeHistogram === undefined)) {
      return;
    }

    const annualRetirementIncomeWithDiaHistogram = [...this._annualRetirementIncomeWithDiaHistogramCurrent];
    const annualRetirementIncomeHistogram = [...this._annualRetirementIncomeHistogramCurrent];
    const bins = this.bins;

    const padding = 20;
    const xAxisHeight = 25;
    const calloutsHeight = 40;
    const chartTop = padding + calloutsHeight;
    const yAxisWidth = 20;
    const chartLeft = padding + yAxisWidth;

    const chartWidth = this._svgWidth - padding * 2 - yAxisWidth;
    const chartHeight = this._svgHeight - padding * 2 - calloutsHeight - xAxisHeight;
    const maxValue = Math.max(this._initialMax, ...annualRetirementIncomeWithDiaHistogram, ...annualRetirementIncomeHistogram);
    const tickmarkHeight = 7;

    let
      value: number,
      x: number,
      y: number,
      x1: number, x2: number, x3: number, x4: number,
      y1: number, y2: number, y3: number, y4: number,
      labels: number,
      intersection: Point,
      bin: number,
      d: string;

    const pointsForRetirementIncomeWithDiaCurve = [];
    const pointsForRetirementIncomeCurve = [];

    for (bin = 0; bin < bins; bin++) {

      value = annualRetirementIncomeWithDiaHistogram[bin];
      x1 = this.getXForBin(bin, chartLeft, chartWidth, bins);
      y1 = this.getY(value, chartTop, chartHeight, maxValue);
      pointsForRetirementIncomeWithDiaCurve.push([x1, y1]);

      value = annualRetirementIncomeHistogram[bin];
      x3 = x1;
      y3 = this.getY(value, chartTop, chartHeight, maxValue);
      pointsForRetirementIncomeCurve.push([x3, y3]);

      if ((intersection === undefined) && (annualRetirementIncomeWithDiaHistogram[bin] >= annualRetirementIncomeHistogram[bin]) && (annualRetirementIncomeWithDiaHistogram[bin + 1] <= annualRetirementIncomeHistogram[bin + 1])) {

        value = annualRetirementIncomeWithDiaHistogram[bin + 1];
        x2 = this.getXForBin(bin + 1, chartLeft, chartWidth, bins);
        y2 = this.getY(value, chartTop, chartHeight, maxValue);
  
        value = annualRetirementIncomeHistogram[bin + 1];
        x4 = x2;
        y4 = this.getY(value, chartTop, chartHeight, maxValue);

        intersection = intersect(x1, y1, x2, y2, x3, y3, x4, y4);
  
      }


    }

    // close spline;
    x = this.getXForBin(bins - 1, chartLeft, chartWidth, bins);
    y = this.getY(0, chartTop, chartHeight, maxValue);
    const closeSpline = ` L${x},${y} L${this.getXForBin(0, chartLeft, chartWidth, bins)},${y} z`;

    // enclose the area above the spline
    const inverseCloseSpline = ` L${x},${y} L${chartLeft + chartWidth},${chartTop + chartHeight} v${-chartHeight} h${-chartWidth} v${chartHeight} L${this.getXForBin(0, chartLeft, chartWidth, bins)},${y} z`;

    const spline = createSplinePathFromPoints(pointsForRetirementIncomeWithDiaCurve);

    const retirementIncomeWithDiaSpline = spline + closeSpline;
    const retirementIncomeSpline = createSplinePathFromPoints(pointsForRetirementIncomeCurve) + closeSpline

    const inverseRetirementIncomeWithDiaSpline = spline + inverseCloseSpline;

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
    
    // median callouts

    const retirementIncomeWithDiaCallout = {
      x: this.getXForValue(this.medianAnnualRetirementIncomeWithDia, chartLeft, chartWidth, minAnnualRetirementIncome, maxAnnualRetirementIncome),
      y: chartTop + chartHeight,
      value: formatCurrency(this.medianAnnualRetirementIncomeWithDia)
    }

    const retirementIncomeCallout = {
      x: this.getXForValue(this.medianAnnualRetirementIncome, chartLeft, chartWidth, minAnnualRetirementIncome, maxAnnualRetirementIncome),
      y: chartTop + chartHeight,
      value: formatCurrency(this.medianAnnualRetirementIncome)
    }

    // mask properties

    x = this.getXForValue(this.medianAnnualRetirementIncomeWithDia, chartLeft, chartWidth, minAnnualRetirementIncome, maxAnnualRetirementIncome);

    const maskProps = {
      x: x,
      width: (chartLeft + chartWidth - x)
    }

    // y-axis label

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

    x1 = this.halfPixelOffset(padding + 10);
    y1 = this.halfPixelOffset(chartTop);
    x2 = x1;
    y2 = chartTop + chartHeight;

    const arrowLength = 8;
    const arrowWidth = 4;

    const yAxisD = `M${x1},${y1} L${x1 - arrowWidth},${y1 + arrowLength} M${x1},${y1} L${x1 + arrowWidth},${y1 + arrowLength} M${x1},${y1} L${x2},${y2} L${x2 - arrowWidth},${y2 - arrowLength} M${x2},${y2} L${x2 + arrowWidth},${y2 - arrowLength}`;

    // forgone upside callout

    if (intersection !== undefined) {
      x1 = this.halfPixelOffset(intersection.x + 10);
      x2 = this.halfPixelOffset(this.getXForBin(bins - 1, chartLeft, chartWidth, bins) - 10);
      // x2 = this.halfPixelOffset(this.getXForValue(this.maxResultWithoutLoan, chartLeft, chartWidth, minResult, maxResult));
      y = intersection.y - 10;
      d = `M${x1},${y} v-10 H${x2} v10`;
    }
    const potentialUpside = {
      x: (x1 + x2) / 2,
      y: y - 20,
      d: d,
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
      inverseRetirementIncomeWithDiaSpline: inverseRetirementIncomeWithDiaSpline,
      xAxisLabels: xAxisLabels,
      xAxisTickmarks: xAxisTickmarks,
      retirementIncomeWithDiaCallout: retirementIncomeWithDiaCallout,
      retirementIncomeCallout: retirementIncomeCallout,
      maskProps: maskProps,
      lowerYAxisLabel: lowerYAxisLabel,
      upperYAxisLabel: upperYAxisLabel,
      yAxisD: yAxisD,
      potentialUpside: potentialUpside
    }

  }

  orderOfMagnitude(n: number): number {
    var order = Math.floor(Math.log(n) / Math.LN10 + 0.0000000001);
    return Math.pow(10, order);
  }
  getXForBin(bin: number, chartLeftX: number, chartWidth: number, bins: number): number {
    // return chartLeftX + (bin + 0.5) * (chartWidth / bins);
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
