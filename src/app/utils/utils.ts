import { Point } from '../model/model';

export function isNumeric(value: any) {
	if (isNaN(value) || (value === undefined) || (value === null) || (value === "")) {
		return false;
	} else {
		return true;
	}
}

export function formatNumber(n: any, decimalPlaces: number = 0): string {
	if (!isNumeric(n)) {
		return "...";
	}
	return (new Intl.NumberFormat("en-US", {
		minimumFractionDigits: decimalPlaces,
		maximumFractionDigits: decimalPlaces
	})).format(n);

}
export function formatPercent(n: any, decimalPlaces: number = 0): string {
	if (!isNumeric(n)) {
		return "...";
	}
	return formatNumber(n, decimalPlaces) + "%";
}
export function formatNumberAsPercent(n: any, decimalPlaces: number = 0): string {
	return formatPercent(n * 100, decimalPlaces);
}
export function formatCurrency(n: any, decimalPlaces: number = 0): string {
	if (!isNumeric(n)) {
		return "...";
	}
	return (new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: decimalPlaces,
		maximumFractionDigits: decimalPlaces
	})).format(n);
}

export function formatCurrencyReduced(n: any): string {
	if (!isNumeric(n)) {
		return "...";
	}
	let rounded: number = Math.round(n);
	if (rounded < 100000) {
		return formatCurrency(n, 0);
	} else if (rounded < 1000000) {
		return formatCurrency(n / 1000, 0) + "k";
	} else if (rounded < 1000000000) {
		return formatCurrency(n / 1000000, 2) + "m";
	} else {
		return formatCurrency(n / 1000000000, 2) + "b";
	}
}

export function sortNumeric(a: number, b: number): number {
	return a - b;
}
export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat('en-US').format(date);
}
export function fixNumericInput(s: any, int: boolean = false, ifNaN: any = null): number {
	s = s.replace(/[^\d.]/g, '');
	if (!isNumeric(s)) {
		return ifNaN;
	}
	if (int) {
		return parseInt(s, 10);
	} else {
		return parseFloat(s);
	}
}

export function easeOutCubic(p: number): number {
	return (--p) * p * p + 1
}
export function easeInOutQuad(p: number): number {
	return (p < .5) ? 2 * p * p : -1 + (4 - 2 * p) * p
}

export function round(n: number, decimalPlaces: number = 6): number {
	if (isNumeric(n)) {
		return parseFloat(n.toFixed(decimalPlaces));
	}
}

export function calculateMedian(values: number[]): number {
	const middle = values.length / 2
	if ((middle % 1) === 0) {
		return (values[middle] + values[middle - 1]) / 2;
	} else {
		return values[Math.floor(middle)];
	}
}

export function intersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): Point {

	// Check if none of the lines are of length 0
	if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
		return;
	}

	let denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

	// Lines are parallel
	if (denominator === 0) {
		return;
	}

	let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
	let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

	// is the intersection along the segments
	if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
		return;
	}

	// Return a object with the x and y coordinates of the intersection
	let x = x1 + ua * (x2 - x1)
	let y = y1 + ua * (y2 - y1)

	return { x, y }
}


/*
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

Quicksort

-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
*/

export function quickSort(arr: number[], leftPos: number, rightPos: number, arrLength: number) {
	"use strict";

	let
		initialLeftPos: number,
		initialRightPos: number,
		direction: boolean,
		pivot: number;

	initialLeftPos = leftPos;
	initialRightPos = rightPos;
	direction = true;
	pivot = rightPos;
	while ((leftPos - rightPos) < 0) {
		if (direction) {
			if (arr[pivot] < arr[leftPos]) {
				swap(arr, pivot, leftPos);
				pivot = leftPos;
				rightPos--;
				direction = !direction;
			} else {
				leftPos++;
			}
		} else {
			if (arr[pivot] <= arr[rightPos]) {
				rightPos--;
			} else {
				swap(arr, pivot, rightPos);
				leftPos++;
				pivot = rightPos;
				direction = !direction;
			}
		}
	}
	if (pivot - 1 > initialLeftPos) {
		quickSort(arr, initialLeftPos, pivot - 1, arrLength);
	}
	if (pivot + 1 < initialRightPos) {
		quickSort(arr, pivot + 1, initialRightPos, arrLength);
	}
}
function swap(arr: number[], el1: number, el2: number) {
	"use strict";

	var temp = arr[el1];
	arr[el1] = arr[el2];
	arr[el2] = temp;
}
