export enum InputType {
	Number,
	Currency,
	Percent
}
export enum MatchType {
	HundredPercentUpTo3PlusFiftyPercentUpTo5,
	HundredPercentUpTo4,
	FiftyPercentUpTo6,
	HundredPercentUpTo6,
	NoMatch
}
export interface MortalityConfig {
	age: number;
	maleDeathProbability: number;
	maleLifeExpectancy: number;
	femaleDeathProbability: number;
	femaleLifeExpectancy: number;
}
export interface AssetClassConfig {
	ClassId: number,
	ClassName: string;
	AnnualReturn: number;
	StandardDeviation: number;
}
export interface AssetClassCorrelationConfig {
	ClassId1: number,
	ClassId2: number,
	AssetCorrelation: number;
}
export interface GlidePathConfig {
	YearsToRetirement: number,
	ClassId: number;
	ClassAllocation: number;
}

export interface Configuration {
	configuration: {
		inflation: number;
		salaryGrowthRate: number;
		annuityInterestRate: number;
		mortality: MortalityConfig[];
		assetClasses: AssetClassConfig[];
		assetCorrelation: AssetClassCorrelationConfig[];
		glidePath: GlidePathConfig[];
	}
}

export interface GlidePathAllocation {
	years: number;
	LargeCap: number;
	SmallCap: number;
	International: number;
	Bonds: number;
	Cash: number;
}
export interface MortalityByAge {
	deathProbability: number,
	lifeExpectancy: number
}
export interface MortalityRates {
	male: MortalityByAge[];
	female: MortalityByAge[];
}
export interface AssetClass {
	id: number;
	name: string;
	mean: number;
	stdev: number;
}
export interface Investor {
	balance: number;
	salary: number;
	savingsPercent: number;
	age: number;
	yearsUntilRetirement: number;
	matchType: MatchType;
	annuitizedPercent: number;
}
export interface Assumptions {
	inflation: number,
	salaryGrowthRate: number,
	annuityInterestRate: number,
	indexesById: number[];
	glidePath: number[][];
	mortality: MortalityRates;
	assetClasses: AssetClass[];
	means: number[];
	stdevs: number[];
	correlations: number[][];
	matrixSquareRoot: number[][];
}
export interface SimulationResults {
	medianAnnualRetirementIncome: number;
	medianAnnualRetirementIncomeWithDia: number;
	minAnnualRetirementIncome: number;
	maxAnnualRetirementIncome: number;
	annualRetirementIncomeHistogram: number[];
	annualRetirementIncomeWithDiaHistogram: number[];
	duration: number;
	bins: number;
	annualRetirementIncomeCdf: number[];
	annualRetirementIncomeWithDiaCdf: number[];
}
export interface WorkerMessage {
	message: string;
	progress?: number;
	simulationResults?: SimulationResults;
}
export interface Point {
	x: number;
	y: number;
}
