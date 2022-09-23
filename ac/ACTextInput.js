'use strict';

class ACTextInput extends ACInput
{
	constructor(parentNode, params = {})
	{
		super(parentNode);
		this.style.display = 'block';
		
		this.inputBox = AC.create('input', this);
		if ('password' in params && params.password == true)
			this.inputBox.type = 'password';
		else
			this.inputBox.type = 'text';
		this.inputBox.classList.add('form-control', 'input-sm');
		
		this.enableEditor = params.enableEditor || false;
		
		this.inputBox.onkeypress = evt => {
			if (evt.keyCode == 13) this.dispatchEvent(new CustomEvent('enter', {
				detail: {}
			}));
		}
		
		// Fix for glitch where spacebar triggers to parent element
		this.inputBox.addEventListener('keyup', evt => {
			if (evt.key == ' ') {
				evt.stopPropagation();
				evt.preventDefault();
			}
		});
		
		this.inputBox.addEventListener('dblclick', this.edit.bind(this));
		
		this.inputBox.onblur = evt => {
			this.dispatchEvent(new CustomEvent('blur', {
				detail: {}
			}));
		}
	}
	
	get value()
	{
		return this.inputBox.value.replace(/\u23CE/gm, '\r\n');;
	}
	
	set value(value)
	{
		this.inputBox.value = value.replace(/(\r\n|\n|\r)/gm, '⏎');
	}
	
	get placeholder()
	{
		return this.inputBox.placeholder;
	}
	
	set placeholder(value)
	{
		this.inputBox.placeholder = value;
	}
	
	focus()
	{
		this.inputBox.focus();
	}
	
	blur()
	{
		this.inputBox.blur();
	}
	
	select()
	{
		this.inputBox.setSelectionRange(0, this.inputBox.value.length);
	}
	
	edit(evt)
	{
		if (!this.enableEditor) return;
		
		var modal = new ACModal(document.body);
		modal.addHeader({ title: 'ACTextInput value', closeButton: true });
		
		var contentCell = modal.addSection();
		contentCell.style.height = '400px';
		
		var footerCell = modal.addFooter();
		
		var editor = AC.create('textarea', contentCell);
		editor.classList.add('form-control', 'input-sm');
		editor.style.height = '100%';
		editor.value = this.value;
		
		modal.addEventListener('close', evt => {
			this.value = editor.value;
			this.focus();
		});
		
		modal.display();
		editor.focus();
	}
}

window.customElements.define('ac-textinput', ACTextInput);