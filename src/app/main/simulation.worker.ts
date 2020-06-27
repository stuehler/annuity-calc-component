/// <reference lib="webworker" />

import { Configuration, GlidePathConfig, MortalityConfig, MortalityRates, AssetClassConfig, AssetClass, AssetClassCorrelationConfig, Assumptions, Investor, WorkerMessage, SimulationResults } from '../model/model';
import * as P from '../utils/probability';
import * as F from '../utils/financial';

import { quickSort, round, calculateMedian } from '../utils/utils';

const TRIALS: number = 10000;
const BINS: number = 50;
const LIFE_EXPECTANCY_THRESHOLD: number = 0.75
const OUTLIERS = 0.95;

const ASSUMPTIONS: Assumptions = {
	inflation: null,
	salaryGrowthRate: null,
	annuityInterestRate: null,
	indexesById: null,
	glidePath: null,
	mortality: null,
	assetClasses: null,
	means: null,
	stdevs: null,
	correlations: null,
	matrixSquareRoot: null
}

let MAX_YEARS_FROM_RETIREMENT: number = 0;
let MAX_YEARS_IN_RETIREMENT: number = 0;

addEventListener('message', messageHandler);

function messageHandler(message: MessageEvent) {
	let command: string = message.data.command;
	if (command !== undefined) {
		switch (command) {
			case "load config":
				loadConfig(message.data.config);
				break;
			case "simulate":
				runSimulation(message.data.investor);
				break;
			default:
				console.log("Error: unrecognized worker command: " + command);
		}
	} else {
		console.log("data.command is undefined");
	}
}
function loadConfig(config: Configuration) {
	"use strict";

	let
		i: number,
		l: number;

	ASSUMPTIONS.inflation = config.configuration.inflation;
	ASSUMPTIONS.salaryGrowthRate = config.configuration.salaryGrowthRate;
	ASSUMPTIONS.annuityInterestRate = config.configuration.annuityInterestRate;

	ASSUMPTIONS.assetClasses = parseAssetClasses(config.configuration.assetClasses);

	ASSUMPTIONS.means = [];
	ASSUMPTIONS.stdevs = [];
	ASSUMPTIONS.indexesById = [];

	for (i = 0, l = ASSUMPTIONS.assetClasses.length; i < l; i++) {
		ASSUMPTIONS.means.push(ASSUMPTIONS.assetClasses[i].mean);
		ASSUMPTIONS.stdevs.push(ASSUMPTIONS.assetClasses[i].stdev);
		ASSUMPTIONS.indexesById[ASSUMPTIONS.assetClasses[i].id] = i;
	}

	ASSUMPTIONS.correlations = parseCorrelations(config.configuration.assetCorrelation, ASSUMPTIONS.indexesById);
	ASSUMPTIONS.matrixSquareRoot = P.matrix_sqrt(ASSUMPTIONS.correlations);

	ASSUMPTIONS.glidePath = parseGlidePath(config.configuration.glidePath, ASSUMPTIONS.indexesById);
	ASSUMPTIONS.mortality = parseMortalityRates(config.configuration.mortality);

	postWorkerMessage("config parsed");
}
function parseCorrelations(data: AssetClassCorrelationConfig[], indexesById: number[]): number[][] {
	"use strict";

	let
		i: number,
		id1: number,
		id2: number,
		index1: number,
		index2: number,
		correlation: number,
		o: AssetClassCorrelationConfig;

	const l = data.length;
	const correlations: number[][] = [];

	for (i = 0; i < l; i++) {
		o = data[i];
		id1 = o.ClassId1;
		id2 = o.ClassId2;
		correlation = o.AssetCorrelation;
		index1 = indexesById[id1];
		index2 = indexesById[id2];

		if (correlations[index1] === undefined) {
			correlations[index1] = [];
		}
		correlations[index1][index2] = correlation;
	}
	return correlations;
}
function parseAssetClasses(data: AssetClassConfig[]): AssetClass[] {
	"use strict";

	let
		id: number,
		name: string,
		mean: number,
		stdev: number,
		i: number,
		assetClass: AssetClass;

	const l = data.length;

	const assetClasses: AssetClass[] = [];

	for (i = 0; i < l; i++) {
		id = data[i].ClassId;
		name = data[i].ClassName;
		mean = round(data[i].AnnualReturn / 100);
		stdev = round(data[i].StandardDeviation / 100);
		assetClass = {
			id: id,
			name: name,
			mean: mean,
			stdev: stdev
		}
		assetClasses.push(assetClass);
	}

	return assetClasses;


}
function parseMortalityRates(data: MortalityConfig[]): MortalityRates {
	"use strict";

	let
		i: number,
		age: number,
		p: number;

	const l = data.length;

	const mortalityRates: MortalityRates = {
		male: [],
		female: []
	};

	for (i = 0; i < l; i++) {
		age = data[i].age;
		mortalityRates.male[age] = {
			deathProbability: data[i].maleDeathProbability,
			lifeExpectancy: data[i].maleLifeExpectancy
		}
		mortalityRates.female[age] = {
			deathProbability: data[i].femaleDeathProbability,
			lifeExpectancy: data[i].femaleLifeExpectancy
		}
	}

	return mortalityRates;
}
function parseGlidePath(data: GlidePathConfig[], indexesById: number[]): number[][] {
	"use strict";

	let
		i: number,
		j: number,
		years: number,
		value: number,
		min: number,
		max: number,
		id: number,
		total: number;


	const glidePath: number[][] = [];
	const l = data.length;

	min = 0;
	max = 0;

	for (i = 0; i < l; i++) {
		years = data[i].YearsToRetirement;
		min = Math.min(years, min);
		max = Math.max(years, max);
		if (glidePath[years] === undefined) {
			glidePath[years] = [0, 0, 0, 0, 0];
		}
		value = data[i].ClassAllocation;
		id = data[i].ClassId;

		glidePath[years][indexesById[id]] = value;
	}

	// ensure that allocatioms sum to 1

	for (i = min; i <= max; i++) {
		total = 0;
		for (j = 0; j < 5; j++) {
			total += glidePath[i][j];
		}
		for (j = 0; j < 5; j++) {
			glidePath[i][j] = round(glidePath[i][j] / total);
		}
	}

	MAX_YEARS_FROM_RETIREMENT = max;
	MAX_YEARS_IN_RETIREMENT = -min;

	return glidePath;

}
function runSimulation(investor: Investor) {
	"use strict";

	let
		i: number,
		trial: number,
		startTime: number,
		yearsUntilRetirement: number,
		yearsInRetirement: number,
		monthlyReturn: number,
		salary: number,
		balance: number,
		monthlySavings: number,
		monthlySpending: number,
		annualSpendingPV: number,
		totalSpendingPV: number,
		allocation: number[],
		lifespan: number,
		year: number,
		annualRetirementIncome: number,
		annualRetirementIncomeWithDia: number,
		month: number,
		monthsInRetirement: number,
		monthsDeferred: number,
		random: number,
		premium: number,
		pvOfDiaPayments: number,
		totalMonthlyIncomeFromDIA: number,
		lifeExpectancy: number,
		trialsWithoutDia: number[],
		trialsWithDia: number[],
		income: number,
		bin: number,
		annualRetirementIncomeIndex: number,
		annualRetirementIncomeWithDiaIndex: number;

	startTime = performance.now();

	// const l: number = ASSUMPTIONS.assetClasses.length;

	const accumulationYears: number = investor.yearsUntilRetirement;
	const accumulationMonths = accumulationYears * 12;

	// const assetClasses: number = ASSUMPTIONS.assetClasses.length;

	const retirementAge: number = investor.age + investor.yearsUntilRetirement;

	const annuitizedPercent = investor.annuitizedPercent / 100;
	const savingsRate = investor.savingsPercent / 100;

	// calculate total DIA income

	lifeExpectancy = getLifeExpectancyWithThreshold(investor.age, LIFE_EXPECTANCY_THRESHOLD);

	const monthlyAnnuityInterestRate: number = Math.pow(1 + ASSUMPTIONS.annuityInterestRate, 1 / 12) - 1;

	totalMonthlyIncomeFromDIA = 0;

	monthsDeferred = accumulationYears * 12;

	// contribute a percent of the investor's current balance to the DIA

	premium = investor.balance * annuitizedPercent;
	monthsInRetirement = Math.round(Math.max(1, (lifeExpectancy - retirementAge)) * 12);

	console.log("lifeExpectancy: " + lifeExpectancy + " monthsInRetirement: " + monthsInRetirement);

	pvOfDiaPayments = getPvOfDiaPayments(premium, monthsDeferred, monthsInRetirement, accumulationMonths, monthlyAnnuityInterestRate);

	totalMonthlyIncomeFromDIA += pvOfDiaPayments;

	console.log("Monthly income from DIA of first premium: " + totalMonthlyIncomeFromDIA);

	// contribute a percent of each of the investor's contributions to the DIA

	salary = investor.salary;

	for (month = 0; month < accumulationMonths; month++) {
		premium = (salary / 12) * savingsRate * annuitizedPercent;
		monthsDeferred = accumulationMonths - month - 1;
		pvOfDiaPayments = getPvOfDiaPayments(premium, monthsDeferred, monthsInRetirement, accumulationMonths, monthlyAnnuityInterestRate);
		totalMonthlyIncomeFromDIA += pvOfDiaPayments;
		if (month % 12 === 11) {
			salary *= (1 + ASSUMPTIONS.salaryGrowthRate)
		}
	}

	console.log("Annual income from DIA: " + (totalMonthlyIncomeFromDIA * 12));

	trialsWithoutDia = [];
	trialsWithDia = [];

	for (trial = 0; trial < TRIALS; trial++) {

		// accumulation

		balance = investor.balance;
		salary = investor.salary;

		for (year = 0; year < accumulationYears; year++) {
			yearsUntilRetirement = Math.min(MAX_YEARS_FROM_RETIREMENT, accumulationYears - year);
			allocation = ASSUMPTIONS.glidePath[yearsUntilRetirement];
			monthlyReturn = getMonthlyReturn(allocation);
			monthlySavings = (salary / 12) * savingsRate;
			balance = F.FV(monthlyReturn, 12, -monthlySavings, -balance);
			salary *= (1 + ASSUMPTIONS.salaryGrowthRate);
		}

		// lifespan

		lifespan = retirementAge;
		do {
			lifespan++;
		} while (ASSUMPTIONS.mortality.female[lifespan].deathProbability < Math.random());

		// retirement

		yearsInRetirement = (lifespan - retirementAge);

		totalSpendingPV = 0;

		for (year = 0; year < yearsInRetirement; year++) {
			allocation = ASSUMPTIONS.glidePath[-Math.min(year, MAX_YEARS_IN_RETIREMENT)];
			monthlyReturn = getMonthlyReturn(allocation);
			monthlySpending = F.PMT(monthlyReturn, (yearsInRetirement - year) * 12, balance, 0);
			annualSpendingPV = F.PV(ASSUMPTIONS.inflation, accumulationYears + year, 0, monthlySpending * 12);
			totalSpendingPV += annualSpendingPV;
			balance = F.FV(monthlyReturn, 12, -monthlySpending, -balance);
		}

		// add a trivial bit of randomness to ensure unique numbers to aid sorting algorithm

		random = ((Math.random() - 0.5) / 10000);

		annualRetirementIncome = totalSpendingPV / yearsInRetirement;

		trialsWithoutDia.push(annualRetirementIncome + random);

		random = ((Math.random() - 0.5) / 10000);

		annualRetirementIncomeWithDia = annualRetirementIncome * (1 - annuitizedPercent) + totalMonthlyIncomeFromDIA * 12;

		trialsWithDia.push(annualRetirementIncomeWithDia + random);


		if (trial % (TRIALS / 50) === 0) {
			postWorkerMessage("simulation progress", round(trial / TRIALS));
		}

	}

	quickSort(trialsWithoutDia, 0, TRIALS - 1, TRIALS);
	quickSort(trialsWithDia, 0, TRIALS - 1, TRIALS);

	// Trim outliers

	const lowerIndex = 0;
	const upperIndex = Math.floor(TRIALS * OUTLIERS);

	trialsWithoutDia.splice(upperIndex);
	trialsWithDia.splice(upperIndex);

	const retainedTrials = trialsWithoutDia.length;


	// Median results

	const medianAnnualRetirementIncome = calculateMedian(trialsWithoutDia);
	const medianAnnualRetirementIncomeWithDia = calculateMedian(trialsWithDia);


	const minAnnualRetirementIncome: number = Math.min(trialsWithoutDia[lowerIndex], trialsWithDia[lowerIndex]);
	const maxAnnualRetirementIncome: number = Math.max(trialsWithoutDia[retainedTrials - 1], trialsWithDia[retainedTrials - 1]);
	const range: number = maxAnnualRetirementIncome - minAnnualRetirementIncome;
	const increment = range / (BINS - 1);

	console.log("minAnnualRetirementIncome: " + minAnnualRetirementIncome);
	console.log("minRemaxAnnualRetirementIncomesult: " + maxAnnualRetirementIncome);

	for (i = 9000; i < retainedTrials; i++) {
		console.log(i, trialsWithDia[i]);
	}


	// Historgram

	const annualRetirementIncomeHistogram: number[] = Array(BINS).fill(0);
	const annualRetirementIncomeWithDiaHistogram: number[] = Array(BINS).fill(0);

	for (i = lowerIndex; i <= upperIndex; i++) {
		bin = Math.floor((trialsWithoutDia[i] - minAnnualRetirementIncome) / increment);
		annualRetirementIncomeHistogram[bin]++;

		bin = Math.floor((trialsWithDia[i] - minAnnualRetirementIncome) / increment);
		annualRetirementIncomeWithDiaHistogram[bin]++;
	}

	for (i = 0; i < BINS; i ++) { 
	  console.log(i, minAnnualRetirementIncome + i * increment, annualRetirementIncomeHistogram[i], annualRetirementIncomeWithDiaHistogram[i]);
	}


	// CDF

	const annualRetirementIncomeCdf: number[] = Array(BINS).fill(0);
	const annualRetirementIncomeWithDiaCdf: number[] = Array(BINS).fill(0);

	const incrmemnt = (maxAnnualRetirementIncome - minAnnualRetirementIncome) / (BINS - 1);

	annualRetirementIncomeIndex = 0;
	annualRetirementIncomeWithDiaIndex = 0;

	console.log("\n\nCDF");

	for (i = 0; i < BINS - 1; i ++) {
		income = minAnnualRetirementIncome + i * incrmemnt;
		while (trialsWithoutDia[annualRetirementIncomeIndex] < income) {
			annualRetirementIncomeIndex ++;
		}
		annualRetirementIncomeCdf[i] = (retainedTrials - annualRetirementIncomeIndex) / retainedTrials;

		while (trialsWithDia[annualRetirementIncomeWithDiaIndex] < income) {
			annualRetirementIncomeWithDiaIndex ++;
		}

		let below1 = below(trialsWithDia, income);
		console.log("income: " + income + " annualRetirementIncomeWithDiaIndex: " + annualRetirementIncomeWithDiaIndex + " below1: " + below1);

		annualRetirementIncomeWithDiaCdf[i] = (retainedTrials - annualRetirementIncomeWithDiaIndex) / retainedTrials;

	}


	for (i = 0; i < BINS - 1; i ++) {
		income = (minAnnualRetirementIncome + i * incrmemnt);
		console.log("income: " + income + " annualRetirementIncomeCdf[i]: " + annualRetirementIncomeCdf[i] + " annualRetirementIncomeWithDiaCdf[i]: " + annualRetirementIncomeWithDiaCdf[i]);
	}


	const simulationResults: SimulationResults = {
		medianAnnualRetirementIncome: medianAnnualRetirementIncome,
		medianAnnualRetirementIncomeWithDia: medianAnnualRetirementIncomeWithDia,
		minAnnualRetirementIncome: minAnnualRetirementIncome,
		maxAnnualRetirementIncome: maxAnnualRetirementIncome,
		annualRetirementIncomeHistogram: annualRetirementIncomeHistogram,
		annualRetirementIncomeWithDiaHistogram: annualRetirementIncomeWithDiaHistogram,
		duration: (performance.now() - startTime),
		bins: BINS,
		annualRetirementIncomeCdf: annualRetirementIncomeCdf,
		annualRetirementIncomeWithDiaCdf: annualRetirementIncomeWithDiaCdf
	}

	postWorkerMessage("simulation complete", undefined, simulationResults);

}
function below(array: number[], value: number): number {
	let below = 0;
	for (let i = 0, l = array.length; i < l; i ++) {
		if (array[i] < value) {
			below ++;
		}
	}
	return below;
}
function postWorkerMessage(message, progress?: number, simulationResults?: SimulationResults) {
	const workerMessage: WorkerMessage = {
		message: message
	}
	if (progress !== undefined) {
		workerMessage.progress = progress;
	}
	if (simulationResults !== undefined) {
		workerMessage.simulationResults = simulationResults;
	}
	postMessage(workerMessage);
}
function getMonthlyReturn(allocation: number[]): number {
	let
		i: number,
		assetClassReturn: number,
		annualReturn: number = 0;

	// generate random probabilities that fit correlation matrix

	const probabilities = P.corand(ASSUMPTIONS.matrixSquareRoot);

	const l = probabilities.length;

	for (i = 0; i < l; i++) {
		assetClassReturn = P.normInv(probabilities[i], ASSUMPTIONS.means[i], ASSUMPTIONS.stdevs[i]);
		annualReturn += assetClassReturn * allocation[i];
	}

	return Math.pow(1 + annualReturn, 1 / 12) - 1;
}
function getPvOfDiaPayments(premium: number, monthsDeferred: number, numberOfAnnuityPayments: number, monthsFromToday: number, monthlyAnnuityInterestRate: number): number {
	const fvPremium: number = F.FV(monthlyAnnuityInterestRate, monthsDeferred, 0, -premium);
	const annuityPmt: number = F.PMT(monthlyAnnuityInterestRate, numberOfAnnuityPayments, -fvPremium);
	const pvAnnuityPmt: number = F.PV(monthlyAnnuityInterestRate, monthsFromToday, 0, -annuityPmt);

	return pvAnnuityPmt;
}
function getLifeExpectancy(age: number): number {

	return age + (ASSUMPTIONS.mortality.male[age].lifeExpectancy + ASSUMPTIONS.mortality.female[age].lifeExpectancy) / 2;
}
function getLifeExpectancyWithThreshold(age: number, percentile: number): number {
	let deathProbability: number;
	let survivalProbability: number = 1;
	do {
		age++;
		deathProbability = (ASSUMPTIONS.mortality.male[age].deathProbability + ASSUMPTIONS.mortality.female[age].deathProbability) / 2;
		survivalProbability *= (1 - deathProbability);
	} while (survivalProbability > (1 - percentile));
	return age;
}

