import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { InputType, MatchType } from '../../model/model';

interface InputChangedEvent {
	value: number;
	field: string;
}

@Component({
	selector: 'app-investor-details',
	templateUrl: './investor-details.component.html',
	styleUrls: ['./investor-details.component.scss']
})
export class InvestorDetailsComponent implements OnInit {

	@Output() investorDetailChanged = new EventEmitter();
	@Output() simulateButtonClicked = new EventEmitter();

	@Input() balance: number = 0;
	@Input() salary: number = 0;
	@Input() savingsPercent: number = 0;
	@Input() age: number = 40;
	@Input() yearsUntilRetirement: number = 30;
	@Input() matchType: MatchType = MatchType.HundredPercentUpTo3PlusFiftyPercentUpTo5;
	@Input() annuitizedPercent: number = 20;
	@Input() disabled: boolean = true;
	@Input() progress: number = 100;

	_currency:InputType = InputType.Currency;
	_percent:InputType = InputType.Percent;
	_number:InputType = InputType.Number;

	_fiftyPercentUpTo6:MatchType = MatchType.FiftyPercentUpTo6;
	_hundredPercentUpTo3PlusFiftyPercentUpTo5:MatchType = MatchType.HundredPercentUpTo3PlusFiftyPercentUpTo5;
	_hundredPercentUpTo4:MatchType = MatchType.HundredPercentUpTo4;
	_hundredPercentUpTo6:MatchType = MatchType.HundredPercentUpTo6;
	_noMatch:MatchType = MatchType.NoMatch;

	constructor() { }

	ngOnInit(): void {
	}

	onInputChanged(evt: InputChangedEvent) {
		const value = evt.value;
		const field = evt.field;
		switch (field) {
			case "balance":
				if (value !== this.balance) {
					this.investorDetailChanged.emit({
						field: field,
						value: value
					});
				}
				break;
			case "savingsPercent":
				if (value !== this.savingsPercent) {
					this.investorDetailChanged.emit({
						field: field,
						value: value
					});
				}
				break;
			case "age":
				if (value !== this.age) {
					this.investorDetailChanged.emit({
						field: field,
						value: value
					});
				}
				break;
			case "yearsUntilRetirement":
				if (value !== this.yearsUntilRetirement) {
					this.investorDetailChanged.emit({
						field: field,
						value: value
					});
				}
				break;
		}
	}
	onRadioButtonChanged(value:MatchType) {
		if (value !== this.matchType) {
			this.investorDetailChanged.emit({
				field: "matchType",
				value: value
			});
		}
	}
	onSelectChanged(value:number) {
		if (value !== this.annuitizedPercent) {
			this.investorDetailChanged.emit({
				field: "annuitizedPercent",
				value: value
			});
		}
	}	
	onButtonClicked() {
		console.log("onButtonClicked");
		this.simulateButtonClicked.emit();
	}
}