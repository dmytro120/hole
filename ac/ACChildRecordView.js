'use strict';

class ACChildRecordView extends ACControl
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
		
		var table = AC.create('table', tableContainer);
		table.classList.add('table');
		
		this.tbody = AC.create('tbody', table);
	}
	
	setTitle(title)
	{
		this.header.textContent = title;
		this.header.style.display = 'block';
	}
	
	addRow()
	{
		var row = AC.create('tr', this.tbody);
		row.classList.add('unbreakable');
		return row;
	}
	
	setHeadings(headings)
	{
		var row = this.addRow();
		for (let heading of headings) {
			var th = AC.create('th', row);
			th.textContent = heading;
		}
	}
	
	addCell()
	{
		var row = this.tbody.lastChild || this.addRow();
		var td = AC.create('td', row);
		td.isEmpty = true;
		td.addEventListener('DOMNodeInserted', evt => {
			if (td.isEmpty) {
				td.firstChild.addEventListener('enter', this.onEnter.bind(this));
				this.controls.push(td.firstChild);
				td.isEmpty = false;
			}
		});
		return td;
	}
	
	onEnter(evt)
	{
		var control = evt.srcElement;
		
		if (control.parentNode.nextSibling && control.parentNode.nextSibling.firstChild) {
			var target = control.parentNode.nextSibling.firstChild;
			target.focus();
		} else if (control.parentNode.parentNode.nextSibling && control.parentNode.parentNode.nextSibling.firstChild && control.parentNode.parentNode.nextSibling.firstChild.firstChild) {
			control.parentNode.parentNode.nextSibling.firstChild.firstChild.focus();
		}
	}
}

window.customElements.define('ac-childrecordview', ACChildRecordView);