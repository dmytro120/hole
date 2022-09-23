'use strict';

class ACKeyValueView extends ACControl
{
	constructor(parentNode, params = {})
	{
		super(parentNode);
		this.controls = [];
		
		this.header = new ACStaticCell(this);
		this.header.classList.add('header');
		this.header.style.display = 'none';
		if ('caption' in params) this.setTitle(params.caption);
		
		var tableContainer = new ACStaticCell(this);
		tableContainer.classList.add('table-container');
		if ('columns' in params) tableContainer.style.columnCount = params.columns; 
		
		var table = AC.create('table', tableContainer);
		table.classList.add('table');
		
		this.tbody = AC.create('tbody', table);
	}
	
	setTitle(title)
	{
		this.header.textContent = title;
		this.header.style.display = 'block';
	}
	
	addField(key)
	{
		var row = AC.create('tr', this.tbody);
		row.classList.add('unbreakable');
		
		var th = AC.create('th', row);
		th.textContent = key;
		
		var td = AC.create('td', row);
		td.isEmpty = true;
		td.addEventListener('DOMNodeInserted', evt => {
			if (td.isEmpty) {
				td.firstChild.addEventListener('enter', this.onEnter.bind(this));
				td.firstChild.addEventListener('change', evt => {
					td.firstChild.hasChanged = 'true';
				});
				this.controls.push(td.firstChild);
				td.isEmpty = false;
			}
		});
		td.linkOut = this.linkOut.bind(this, th);
		
		return td;
	}
	
	onEnter(evt)
	{
		var control = evt.srcElement;
		
		var nextContainer = control.parentNode.parentNode.nextSibling;
		if (nextContainer) {
			var next = nextContainer.firstChild.nextSibling.firstChild;
			if (next.nodeName == 'DIV') next = next.firstChild;
			next.focus();
		}
	}
	
	linkOut(td, fn)
	{
		td.textContent += ' ';
		var span = AC.create('span', td);
		span.classList.add('glyphicon', 'glyphicon-new-window');
		span.style.cursor = 'pointer';
		td.addEventListener('click', fn);
	}
	
	getChanges()
	{
		var item = {};
		for (var c = 0; c < this.controls.length; c++) {
			var control = this.controls[c];
			if (control.hasChanged) {
				item[control.name] = control.value
				/*switch (control.type) {
					case 'checkbox': 
						item[control.name] = control.checked;
					break;
					case 'int':
						item[control.name] = parseInt(control.value);
					break;
					default:
						item[control.name] = control.value;
					break;
				}*/
			}
		}
		return item;
	}
}

window.customElements.define('ac-keyvalueview', ACKeyValueView);