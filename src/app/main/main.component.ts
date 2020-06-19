import { Component, OnInit } from '@angular/core';

import { DataService } from '../services/data.service';
import { MatchType, Investor, WorkerMessage, SimulationResults } from '../model/model';

interface InvestorDetailEvent {
	field: string;
	value: number;
}

@Component({
	selector: 'app-main',
	templateUrl: './main.component.html',
	styleUrls: ['./main.component.scss']
})

export class MainComponent implements OnInit {

	investor: Investor = {
		balance: 50000,
		salary: 40000,
		savingsPercent: 5,
		age: 40,
		yearsUntilRetirement: 25,
		matchType: MatchType.HundredPercentUpTo3PlusFiftyPercentUpTo5,
		annuitizedPercent: 20
	}
	simulationResults: SimulationResults;

	simulationComplete: boolean = false;
	simulationRunning: boolean = false;
	simulationProgress: number = 100;
	configLoaded: boolean = false;
	loading: boolean = false;

	// balance: number = 50000;
	// salary: number = 40000;
	// savingsPercent: number = 3;
	// age: number = 40;
	// yearsUntilRetirement: number = 25;
	// matchType: MatchType = MatchType.HundredPercentUpTo3PlusFiftyPercentUpTo5;
	// annuitizedPercent: number = 10;

	worker: Worker;

	constructor(
		private dataService: DataService
	) { }

	ngOnInit(): void {
		this.worker = this.createWebWorker();
		this.getConfiguration();
	}

	createWebWorker() {
		let worker: Worker;
		if (typeof Worker !== 'undefined') {
			console.log("create new Worker!");
			worker = new Worker('src/app/main/simulation.worker', { type: 'module' });
			// worker = new Worker('calculations.worker', { type: 'module' });
			// worker = new Worker('./calculations.worker', { type: 'module' });
			// worker = new Worker('../workers/calculations.worker', { type: 'module' });
			// worker = new Worker('../../assets/workers/calculations.worker', { type: 'module' });
			worker.onmessage = this.webWorkerMessageHandler.bind(this);
		} else {
			console.log("Error: Web Workers are not supported in this environment.");
		}
		return worker;
	}

	webWorkerMessageHandler(messageEvent: MessageEvent) {
		const workerMessage: WorkerMessage = messageEvent.data;
		switch (workerMessage.message) {
			case "config parsed":
				console.log("Config parsed");
				break;
			case "simulation progress":
				// console.log("Simulation progress: " + workerMessage.progress);
				this.simulationProgress = Math.round(workerMessage.progress * 100);
				break;
			case "simulation complete":
				console.log(`simulation complete - elapsed: ${workerMessage.simulationResults.duration} ms.`);
				this.simulationComplete = true;
				this.simulationRunning = false;
				this.simulationProgress = 100;
				this.simulationResults = { ...workerMessage.simulationResults }
				console.log(this.simulationResults);
				break;
		}
	}

	getConfiguration() {
		this.loading = true;
		this.dataService.getConfiguration()
			.subscribe(data => {
				this.worker.postMessage({
					command: "load config",
					config: data
				});
				this.loading = false;
				this.configLoaded = true;
			})
	}

	onInvestorDetailChanged(investorDetailEvent: InvestorDetailEvent) {
		const field = investorDetailEvent.field;
		const value = investorDetailEvent.value;
		switch (field) {
			case "balance":
				if (value !== this.investor.balance) {
					this.investor.balance = value;
				}
				break;
			case "salary":
				if (value !== this.investor.salary) {
					this.investor.salary = value;
				}
				break;
			case "savingsPercent":
				if (value !== this.investor.savingsPercent) {
					this.investor.savingsPercent = value;
				}
				break;
			case "age":
				if (value !== this.investor.age) {
					this.investor.age = value;
				}
				break;
			case "yearsUntilRetirement":
				if (value !== this.investor.yearsUntilRetirement) {
					this.investor.yearsUntilRetirement = value;
				}
				break;
			case "matchType":
				if (value !== this.investor.matchType) {
					this.investor.matchType = value;
				}
				break;
			case "annuitizedPercent":
				if (value !== this.investor.annuitizedPercent) {
					this.investor.annuitizedPercent = value;
				}
				break;
		}
	}
	onSimulateButtonClicked(evt: MouseEvent) {
		this.simulationRunning = true;
		this.simulationProgress = 0;
		setTimeout(() => {
			this.worker.postMessage({
				command: "simulate",
				investor: this.investor
			})
		}, 200);
	}


}