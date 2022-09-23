'use strict';

class HLLoginWindow extends ACController
{
	constructor(rootNode, params)
	{
		super(rootNode);
		if (params && 'isMobile' in params) this.isMobile = params.isMobile;
		
		//this.grid = new ACFlexGrid(this.rootNode, { rowHeights:['auto', 'auto'], colWidths:['100%'] });
		this.container = new ACStaticCell(this.rootNode);
		this.container.style.width = !this.isMobile ? '400px' : '100%';
		this.container.style.height = '100%';
		this.container.style.margin = '0 auto';
		this.container.style.textAlign = 'center';
		
		var hCell = new ACStaticCell(this.container);
		hCell.textContent = 'Welcome';
		hCell.style.fontSize = 'xx-large';
		hCell.style.textAlign = 'center';
		hCell.style.paddingTop = '12px';
		hCell.addEventListener('click', () => {
			DB.query('Gate info', rows => {
				console.log(rows);
			});
		});
		
		this.usernameCtrl = new ACTextInput(this.container);
		this.usernameCtrl.placeholder = 'Username';
		this.usernameCtrl.style.margin = '12px';
		
		this.passwordCtrl = new ACTextInput(this.container, { password: true });
		this.passwordCtrl.placeholder = 'Password';
		this.passwordCtrl.style.margin = '12px';
		
		this.loginBtn = AC.create('button', this.container);
		this.loginBtn.classList.add('btn', 'btn-default', 'btn-sm');
		this.loginBtn.textContent = 'Log in';
		this.loginBtn.style.padding = '5px 24px';
		this.loginBtn.onclick = this.logIn.bind(this);
		
		this.usernameCtrl.addEventListener('enter', () => {
			this.passwordCtrl.focus();
		});
		this.passwordCtrl.addEventListener('enter', () => {
			//this.loginBtn.focus();
			this.logIn();
		});
	}
	
	onAttached()
	{
		this.rootNode.appendChild(this.container);
		this.usernameCtrl.focus();
	}
	
	logIn()
	{
		this.loginBtn.disabled = true;
		let info = {
			username: this.usernameCtrl.value,
			password: this.passwordCtrl.value
		}
		DB.post('Gate login', info, rows => {
			console.log(rows);
			this.dispatchEvent('loginSucceeded');
		}, error => {
			alert(error);
			this.usernameCtrl.focus();
		}, () => {
			this.loginBtn.disabled = false;
		});
	}
	
	onAppCommand(command)
	{
		switch (command) {
			case 'eof': this.exit(); break;
		}
	}
	
	exit()
	{
		this.dispatchEvent('quit');
	}
}