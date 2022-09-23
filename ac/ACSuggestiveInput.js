'use strict';

class ACSuggestiveInput extends ACTextInput
{
	constructor(parentNode, params)
	{
		super(parentNode);
		
		this.internalValue = '';
		
		this.dataList = AC.create('DATALIST', this);
		//this.dataList.id = 'name' in params ? params.name + '_options' : 'ACSuggestiveInputOptions';
		this.dataList.id = DB.generateGUID();
		//console.log(this.dataList.id);
		this.inputBox.setAttribute('list', this.dataList.id);
		this.inputBox.addEventListener('change', this.checkValue.bind(this));
		
		for (var key in params) {
			this[key] = params[key];
		}
		
		this.addEventListener('auxclick', evt => {
			console.log(this.value, this.displayString);
		});
		
		if (this.searchQuery && this.keyField && this.searchField) {
			DB.query(this.searchQuery, rows => {
				this.dataList.clear();
				for (var row of rows) {
					var o = AC.create('option', this.dataList);
					o.value = row[this.searchField];
					o.textContent = row[this.searchField];
				}
			});
		}
	}
	
	get value()
	{
		return Number(this.internalValue);
	}
	
	set value(value)
	{
		this.internalValue = value;
	}
	
	get displayString()
	{
		return this.inputBox.value;
	}
	
	set displayString(string)
	{
		this.inputBox.value = string;
	}
	
	checkValue(evt)
	{
		if (this.title) this.title = '';
		//console.log('emptying value');
		this.value = '';
		if (!this.checkQuery || !this.keyField || !this.searchField) return;
		
		DB.query(this.checkQuery + ' ' + encodeURIComponent(this.displayString), record => {
			this.value = record[this.keyField];
			this.displayString = record[this.searchField];
			//console.log(this.value, this.displayString);
			if (this.titleField) this.title = record[this.titleField] || '';
		}, () => {
			//this.value = this.displayString = '';
		});
	}
}

window.customElements.define('ac-suggestiveinput', ACSuggestiveInput);