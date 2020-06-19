import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-progress-button',
  templateUrl: './progress-button.component.html',
  styleUrls: ['./progress-button.component.scss']
})
export class ProgressButtonComponent implements OnInit {

	@Output() progressButtonClicked = new EventEmitter();

  @Input() progress: number = 2;
  @Input() disabled: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  onButtonClicked() {
    console.log("Button clicked!");
    this.progressButtonClicked.emit();
  }

}
