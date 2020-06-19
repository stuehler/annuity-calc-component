/****************************************************************************************************
*****************************************************************************************************

Probability Functions

*****************************************************************************************************
****************************************************************************************************/

export function PMT(rate:number, nper:number, pv:number, fv: number = 0, type:number = 0): number {

	let
		pmt: number;
	
	if (isNaN(fv) || fv === null || fv === undefined) {
		fv = 0;
	}
	if (isNaN(type) || type === null || type === undefined) {
		type = 0;
	}

	if (rate === 0) {
		pmt = -1 * (fv + pv) / nper;
	} else {
		pmt = (rate * (fv + pv * Math.pow( (1 + rate), nper ) ) ) / ((1 + rate * type) * (1 - Math.pow((1 + rate), nper) ) );
	}

	return pmt;
}

export function FV(rate: number, nper: number, pmt: number = 0, pv: number = 0, type: number = 0): number {

	let
		pow: number,
		fv: number;

	if (isNaN(pmt) || pmt === null || pmt === undefined) {
		pmt = 0;
	}
	if (isNaN(pv) || pv === null || pv === undefined) {
		pv = 0;
	}
	if (isNaN(type) || type === null || type === undefined) {
		type = 0;
	}

	pow = Math.pow(1 + rate, nper);

	if (rate) {
		fv = (pmt * (1 + rate * type) * (1 - pow) / rate) - pv * pow;
	} else {
		fv = -1 * (pv + pmt * nper);
	}

	return fv;
}

export function PV(rate: number, nper: number, pmt: number = 0, fv: number = 0, type: number = 0): number {

	if (isNaN(pmt) || (pmt === null)) {
		pmt = 0;
	}

	if (isNaN(fv) || (pmt === fv)) {
		fv = 0;
	}

	if (isNaN(type) || (type === null) || (type !== 1)) {
		type = 0;
	}


	if (isNaN(rate) || (rate === undefined) || isNaN(nper) || (nper === undefined)) {
		return NaN;
	}

	if (rate === 0) {
		return fv - pmt * nper;
	} else {
		return (-pmt * (1 + rate * type) * ((Math.pow(1 + rate, nper) - 1) / rate) - fv) / Math.pow(1 + rate, nper);
	}

}

export function NPER(rate: number, pmt: number, pv: number, fv: number = 0, type: number = 0): number {

	if (isNaN(fv) || (fv === null)) {
		fv = 0;
	}

	if (isNaN(type) || (type === null) || (type !== 1)) {
		type = 0;
	}

	if (isNaN(rate) || (rate === undefined) || isNaN(pmt) || (pmt === undefined) || isNaN(pv) || (pv === undefined)) {
		return NaN;
	}

	return Math.log((pmt * (1 + rate * type) - fv * rate) / (pv * rate + pmt * (1 + rate * type))) / Math.log(1 + rate);
};