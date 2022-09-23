'use strict';

class ACBrowseInput extends ACInput
{
	constructor(parentNode)
	{
		super(parentNode);
		
		this.classList.add('input-group');
		
		this.inputBox = AC.create('input', this);
		this.inputBox.type = 'text';
		this.inputBox.classList.add('form-control', 'input-sm');
		
		this.inputBox.onkeypress = evt => {
			if (evt.keyCode == 13) this.dispatchEvent(new CustomEvent('enter', {
				detail: {}
			}));
			if (evt.ctrlKey && evt.code == 'KeyB') this.search();/*this.dispatchEvent(new CustomEvent('browse', {
				detail: {}
			}));*/
		}
		
		this.inputBox.onblur = evt => {
			this.dispatchEvent(new CustomEvent('focusout', {
				detail: {}
			}));
		}
		
		this.inputBox.addEventListener('change', evt => {
			this.value = null;
			//console.log('resetting value to null');
			if (this.verificationQuery) DB.query(this.verificationQuery + ' ' + encodeURIComponent(this.displayString), info => {
				this.value = info[this.searchKeyField];
				this.displayString = info[this.searchField];
				//console.log('setting value to ' + this.value);
			}, () => {
				this.displayString = '';
			});
		});
		
		var span = AC.create('span', this);
		span.classList.add('input-group-btn');
		var searchBtn = AC.create('a', span);
		searchBtn.classList.add('btn', 'btn-sm', 'btn-default');
		searchBtn.textContent = '🔍';//'…';
		searchBtn.style.fontFamily = 'Segoe UI Symbol';
		searchBtn.style.fontSize = '18px';
		searchBtn.style.padding = '1px 5px 0px 5px';
		searchBtn.style.borderRadius = '0';
		
		/*searchBtn.onclick = evt => {
			this.dispatchEvent(new CustomEvent('browse', {
				detail: {}
			}));
		}*/
		
		searchBtn.addEventListener('click', this.search.bind(this));
	}
	
	get displayString()
	{
		return this.inputBox.value;
	}
	
	set displayString(value)
	{
		this.inputBox.value = value;
	}
	
	get value()
	{
		return this.internalValue;
	}
	
	set value(value)
	{
		this.internalValue = value;
	}
	
	focus()
	{
		this.inputBox.focus();
	}
	
	search()
	{
		console.log(this.value, this.displayString);
		if (!this.query) {
			alert('Unable to search due to missing query.');
			return;
		}
		
		DB.query(this.query, rows => {
			var browser = new ACBrowseDialog(document.body);
			browser.setTitle(this.searchTitle || this.query);
			browser.searchFieldIndex = 0;
			browser.setHeadings(this.headings);
			
			rows.forEach(row => {
				var id = null;
				if (this.searchKeyField) id = row[this.searchKeyField];
				if (this.hideSearchKey) delete row[this.searchKeyField];
				var searchID = row[this.searchField];
				var item = browser.addItem(row, searchID);
				item.value = id;
				item.onclick = evt => {
					this.displayString = row[this.searchField];
					this.value = item.value;
					browser.close();
					this.focus();
				};
			});
			
			browser.addEventListener('close', evt => {
				this.focus();
			});
			
			browser.display();
			browser.focus();
		});
	}
}

window.customElements.define('ac-browseinput', ACBrowseInput);