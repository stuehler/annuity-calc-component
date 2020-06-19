import { Component, OnInit, OnChanges, SimpleChange, Input, Output, EventEmitter } from '@angular/core';
import { fixNumericInput, formatCurrency, formatNumber, formatPercent } from '../../utils/utils';
import { InputType } from '../../model/model';

@Component({
  selector: 'app-label-input-group',
  templateUrl: './label-input-group.component.html',
  styleUrls: ['./label-input-group.component.scss']
})
export class LabelInputGroupComponent implements OnInit {

  @Output() inputChanged = new EventEmitter();

  @Input() label: string;
  @Input() value: number = 0;
  @Input() field: string;
  @Input() inputType: InputType = InputType.Number;
  @Input() min: number = 0;
  @Input() max: number = 999999999;
  @Input() maxlength: number = 7;
  @Input() placeholder: string;

  _formattedValue: string;

  constructor() { }

  ngOnInit(): void {
    this._formattedValue = this.formatValue(this.value, this.inputType);
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    if (changes.value !== undefined) {
      this._formattedValue = this.formatValue(this.value, this.inputType);
    }
  }

  formatValue(value, inputType) {
    switch (inputType) {
      case InputType.Currency:
        return formatCurrency(value);
      case InputType.Percent:
        return formatPercent(value);
      case InputType.Number:
        return formatNumber(value);
      default:
        return formatNumber(value);
    }

  }

  onEnterKey(input: HTMLInputElement) {
    input.blur();
  }
  onInputFocus(input: HTMLInputElement) {
    input.value = this.value.toString();
    input.select();
  }  

  onInputBlur(input: HTMLInputElement) {
    const fixedValue = fixNumericInput(input.value, true);
    if (fixedValue === null) {
      input.value = this._formattedValue;
    } else {
      const constrainedValue = Math.max(this.min, Math.min(this.max, fixedValue));
      if (constrainedValue !== this.value) {
        this.inputChanged.emit({
          field: this.field,
          value: constrainedValue
        });
      } else {
        input.value = this._formattedValue;
      }
    }
  }
}
