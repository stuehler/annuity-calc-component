/****************************************************************************************************
*****************************************************************************************************

Probability Functions

*****************************************************************************************************
****************************************************************************************************/

export function normInv(p: number, m: number, s: number): number {
	"use strict";
	return m + s * normSInv(p);
};
export function normSInv(p: number): number {
	"use strict";
	let plow: number = 0.02425;
	let phigh: number = 1 - plow;
	let q: number, r: number;
	if (p < plow) {
		q = Math.sqrt(-2 * Math.log(p));
		return (((((-7.784894002430293e-03 * q + -3.223964580411365e-01) * q + -2.400758277161838e+00) * q + -2.549732539343734e+00) * q + 4.374664141464968e+00) * q + 2.938163982698783e+00) / ((((7.784695709041462e-03 * q + 3.224671290700398e-01) * q + 2.445134137142996e+00) * q + 3.754408661907416e+00) * q + 1);
	} else if (phigh < p) {
		q = Math.sqrt(-2 * Math.log(1 - p));
		return -(((((-7.784894002430293e-03 * q + -3.223964580411365e-01) * q + -2.400758277161838e+00) * q + -2.549732539343734e+00) * q + 4.374664141464968e+00) * q + 2.938163982698783e+00) / ((((7.784695709041462e-03 * q + 3.224671290700398e-01) * q + 2.445134137142996e+00) * q + 3.754408661907416e+00) * q + 1);
	} else {
		q = p - 0.5;
		r = q * q;
		return (((((-3.969683028665376e+01 * r + 2.209460984245205e+02) * r + -2.759285104469687e+02) * r + 1.383577518672690e+02) * r + -3.066479806614716e+01) * r + 2.506628277459239e+00) * q / (((((-5.447609879822406e+01 * r + 1.615858368580409e+02) * r + -1.556989798598866e+02) * r + 6.680131188771972e+01) * r + -1.328068155288572e+01) * r + 1);
	}
};
export function normSDist(x: number): number {
	"use strict";
	let neg: boolean = (x < 0);
	x = Math.abs(x);
	let k: number = 1 / (1 + 0.2316419 * x);
	let r: number = 1 - Math.exp(-x * x / 2) / (2.506628274631) * ((((1.330274429 * k - 1.821255978) * k + 1.781477937) * k - 0.356563782) * k + 0.31938153) * k;
	return (neg ? 1 - r : r);
};
export function corand(msqrt: number[][]): number[] {
	"use strict";
	let
		i: number,
		j: number,
		k: number;
	let n: number = msqrt.length;
	let x: number[] = new Array(n);
	let y: number[] = new Array(n);
	let r: number;
	for (i = 1; i <= n - 1; i++) {
		//x[i-1] = normSInv(Math.random());
		r = Math.random();
		//trace ("r: " + r);
		x[i - 1] = normSInv(r);
	}
	//y[n-1] = Math.random();
	r = Math.random();
	//trace ("r: " + r);
	y[n - 1] = r;
	x[n - 1] = normSInv(y[n - 1]);
	for (j = n - 1; j >= 1; j--) {
		y[j - 1] = 0;
		for (k = n; k >= j + 1; k--) {
			y[j - 1] += msqrt[k - 1][j - 1] * x[k - 1];
		}
		y[j - 1] = normSDist(y[j - 1] + msqrt[j - 1][j - 1] * x[j - 1]);
	}
	return y;
};
export function matrix_sqrt(squareArray: number[][]): number[][] {
	"use strict";
	let
		i: number,
		j: number,
		k: number;
	let n: number = squareArray.length;
	let x: number[][] = [];
	for (i = 0; i < n; i++) {
		x[i] = [];
	}
	for (j = n; j >= 1; j--) {
		x[j - 1][j - 1] = squareArray[j - 1][j - 1];
		for (k = n; k >= j + 1; k--) {
			x[k - 1][j - 1] = squareArray[k - 1][j - 1];
			x[j - 1][k - 1] = 0;
			for (i = n; i >= k + 1; i--) {
				x[k - 1][j - 1] -= x[i - 1][j - 1] * x[i - 1][k - 1];
			}
			if (x[k - 1][j - 1] !== 0) {
				x[k - 1][j - 1] /= x[k - 1][k - 1];
			}
			x[j - 1][j - 1] -= Math.pow(x[k - 1][j - 1], 2);
		}
		x[j - 1][j - 1] = Math.pow(x[j - 1][j - 1], 0.5);
	}
	return x;
};
