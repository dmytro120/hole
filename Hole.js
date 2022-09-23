'use strict';

class Hole
{
	constructor(rootNode)
	{
		this.rootNode = rootNode || document.body;
		
		this.name = document.title = 'Hole';
		this.version = '1.0.0';
		this.loggedInState = null;
		
		this.grid = new ACFlexGrid(this.rootNode);
		this.grid.setLayout(['70px', 'auto'], ['100%']);
		
		this.mainCell = this.grid.cell(1,0);
		this.mainCell.style.verticalAlign = 'middle';
		
		// Is Mobile Browser
		this.isMobile = false;
		let userAgent = navigator.userAgent||navigator.vendor||window.opera;
		if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0,4))) this.isMobile = true;
		
		this.tb = new ACToolBar(this.grid.cell(0,0), { type: 'primary' });
		this.tb.classList.add('ls-modebar');
		this.tb.setStyle(ST_BORDER_BOTTOM);
		this.tb.setRadio(true);
		DB.query('Gate sessionInfo', info => {
			this.setSessionState(info.isLoggedIn);
		});
		
		var captionCtrl = this.tb.setCaption(this.name.toLowerCase());
		captionCtrl.style.fontFamily = 'FuturaO';
		captionCtrl.addEventListener('click', e => {
			this.settings();
		});
		
		this.activeMode = null;
		this.modes = {};
		
		this.drawAtom();
		
		document.addEventListener('keydown', evt => {
			if ((evt.metaKey || evt.ctrlKey) && evt.key != 'Control') {
				var doPropagate = false;
				switch(evt.key) {
					case 'Enter': this.onAppCommand.call(this, 'enter'); break;
					case 'd': this.onAppCommand.call(this, 'eof'); break;
					case 'l': this.onAppCommand.call(this, 'layout'); break;
					case 'm': this.onAppCommand.call(this, 'move'); break;
					case 'n': this.onAppCommand.call(this, 'new'); break;
					case 'o': this.onAppCommand.call(this, 'open'); break;
					case 'p': this.onAppCommand.call(this, 'print'); break;
					case 's': this.onAppCommand.call(this, 'save'); break;
					default: doPropagate = true;
				}
				if (!doPropagate) evt.preventDefault();
			}
		}, false);
		
		window.onbeforeunload = e => {
			if (this.activeMode && this.activeMode.onDetached) this.activeMode.onDetached.call(this.activeMode);
		};
	}
	
	drawAtom()
	{
		var p = AC.create('p', this.mainCell);
		p.style.fontSize = '288pt';
		p.style.textAlign = 'center';
		p.style.color = '#ddd';
		p.textContent = '⚛'; //this.name + ' ' + this.version;
		p.style.userSelect = 'none';
	}
	
	setSessionState(isLoggedIn)
	{
		this.tb.clearItems();
		if (isLoggedIn) {
			this.loggedInState = true;
			this.tb.setItems([
				{caption: 'Files', icon: 'files-w.png', action: this.initMode.bind(this, HLFileWindow), dataset: {mode: 'HLFileWindow'} }/*,
				{caption: 'Upload', icon: 'upload-w.png', action: this.initMode.bind(this, HLUpWindow), dataset: {mode: 'HLUpWindow'} }*/
			]);
			this.initMode(HLFileWindow, {fromCode: true});
		} else {
			this.loggedInState = false;
			this.tb.setItems([
				{caption: 'Log In', icon: 'login-w.png', action: this.initMode.bind(this, HLLoginWindow), dataset: {mode: 'HLLoginWindow'} }
			]);
			this.initMode(HLLoginWindow, {fromCode: true});
			this.activeMode.addEventListener('loginSucceeded', evt => {
				this.setMode();
				delete this.modes['HLLoginWindow'];
				this.setSessionState(true);
			});
		}
	}
	
	onAppCommand(command)
	{
		if (this.activeMode && this.activeMode.onAppCommand) this.activeMode.onAppCommand(command);
	}
	
	initMode(modeClass, params)
	{
		var mode = this.modes[modeClass.name];	
		if (!mode) {
			mode = this.modes[modeClass.name] = new modeClass(this.mainCell, {isMobile: this.isMobile});
			mode.addEventListener('quit', evt => {
				this.deleteModeByClassName(modeClass.name);
			});
		}
		this.setMode(mode, params);
	}
	
	setMode(mode, params)
	{
		if (mode == this.activeMode) {
			return;
		}
		
		if (this.activeMode && this.activeMode.onDetached) this.activeMode.onDetached.call(this.activeMode);
		
		if (!mode) {
			this.activeMode = null;
			this.mainCell.clear();
			this.drawAtom();
			this.tb.setActiveItem();
			return;
		}
		
		this.mainCell.clear();
		
		this.activeMode = mode;
		
		if (params && 'fromCode' in params && params.fromCode) {
			var toolbarItem = this.tb.querySelector('li[data-mode^="'+mode.constructor.name+'"]');
			if (toolbarItem) this.tb.setActiveItem(toolbarItem);
		}
		
		//this.mainCell.appendChild(mode);
		var modeAttachedFn = mode.onAttached;
		if (modeAttachedFn) modeAttachedFn.call(mode, params);
	}
	
	deleteModeByClassName(className)
	{
		var mode = this.modes[className];
		if (this.activeMode == mode) this.setMode();
		delete this.modes[className];
	}
	
	settings()
	{
		// Basic Modal Setup with header, content cell, and footer
		var modal = new ACModal(document.body);
		
		var header = modal.addHeader();
		header.style.padding = '0';
		header.style.borderBottom = '0';
		
		var contentCell = modal.addSection();
		
		var footer = modal.addSection();
		footer.style.padding = '0';
		
		// Radio Bar
		var radioBar = new ACToolBar(header, { type: 'primary' });
		radioBar.setStyle(ST_BORDER_BOTTOM);
		radioBar.setRadio(true);
		
		// Modes Sheet
		var modesSheet = new ACStaticCell(contentCell);
		var lastActiveSheet = modesSheet;
		
		var modeBtn = radioBar.addItem({
			caption: 'Modes', icon: 'switch.png', targetNode: modesSheet, action: e => footer.style.display = 'block'
		});
		
		var notice = new ACStaticCell(modesSheet);
		notice.textContent = 'No modes instantiated';
		
		if (Object.keys(this.modes).length > 0) {
			notice.style.display = 'none';
			var lb = new ACListBox(modesSheet);
			for (var className in this.modes) {
				var li = lb.addItem(className, className);
				li.targetMode = this.modes[className];
				li.ondblclick = event => {
					this.setMode(event.target.targetMode, {fromCode: true});
					modal.close();
				};
			}
		}
		
		var modesToolbar = new ACToolBar(footer, { type: 'secondary' });
		modesToolbar.setStyle(ST_BORDER_BOTTOM);
		modesToolbar.style.borderTop = '1px solid #ddd';
		
		modesToolbar.addItem({
			caption: 'None', icon: 'sweep.png', action: evt => {
				this.setMode(null, {fromCode: true});
				modal.close();
			}
		});
		
		modesToolbar.addItem({
			caption: 'Destroy', icon: 'bin.png', action: evt => {
				if (!lb) return;
				var si = lb.getSelectedItem();
				if (si) {
					this.deleteModeByClassName(si.dataset.id);
					si.remove();
					if (lb.itemCount() < 1) {
						notice.style.display = 'block';
					}
				}
			}
		});
		
		modesToolbar.addItem({
			caption: 'Go To', icon: 'goto.png', action: evt => {
				if (!lb) return;
				var si = lb.getSelectedItem();
				if (si) {
					this.setMode(si.targetMode, {fromCode: true});
					modal.close();
				}
			} 
		});
		
		// LDBC Sheet
		var ldbcSheet = new ACStaticCell(contentCell);
		ldbcSheet.style.display = 'none';
		var aboutBtn = radioBar.addItem({
			caption: 'DB', icon: 'db.png', targetNode: ldbcSheet, action: e => footer.style.display = 'none'
		});
		var hostCtrl = new ACTextInput(ldbcSheet);
		hostCtrl.style.marginBottom = '12px';
		var buttonContainer = new ACStaticCell(ldbcSheet);
		var remoteBtn = AC.create('button', buttonContainer);
		remoteBtn.classList.add('btn', 'btn-default', 'btn-sm');
		remoteBtn.style.marginRight = '12px';
		remoteBtn.textContent = 'Remote';
		remoteBtn.onclick = () => hostCtrl.value = DB.defaultHost(false);
		var localBtn = AC.create('button', buttonContainer);
		localBtn.classList.add('btn', 'btn-default', 'btn-sm');
		localBtn.textContent = 'Local';
		localBtn.onclick = () => hostCtrl.value = DB.defaultHost(true);
		hostCtrl.value = DB.host;
		
		// Session Sheet
		var sessionSheet = new ACStaticCell(contentCell);
		sessionSheet.style.display = 'none';
		var aboutBtn = radioBar.addItem({
			caption: 'Session', icon: 'user.png', targetNode: sessionSheet, action: e => footer.style.display = 'none'
		});
		
		var buttonContainer2 = new ACStaticCell(sessionSheet);
		var logOutBtn = AC.create('button', buttonContainer2);
		logOutBtn.classList.add('btn', 'btn-default', 'btn-sm');
		logOutBtn.style.marginRight = '12px';
		logOutBtn.textContent = 'Log Out';
		logOutBtn.onclick = () => {
			modal.close();
			this.logOut();
		}
		
		// About Sheet
		var aboutSheet = new ACStaticCell(contentCell);
		aboutSheet.style.display = 'none';
		var aboutBtn = radioBar.addItem({
			caption: 'About', icon: 'info.png', targetNode: aboutSheet, action: e => footer.style.display = 'none'
		});
		
		var hCell = new ACStaticCell(aboutSheet);
		hCell.textContent = this.name + ' ' + this.version;
		hCell.style.fontSize = 'x-large';
		
		var infoCell = new ACStaticCell(aboutSheet);
		infoCell.textContent = 'Remote file management interface';
		
		var a = AC.create('a', aboutSheet);
		a.target = '_blank';
		a.href = a.textContent = 'http://malikov.us/';
		
		// Set First Sheet Active
		var activeItem = radioBar.firstChild.children[this.lastPreferenceItemID || 0];
		radioBar.setActiveItem(activeItem);
		if (activeItem.firstChild.action) activeItem.firstChild.action();
		modal.addEventListener('close', e => {
			for (var i = 0; i < radioBar.firstChild.children.length; i++) {
				if (radioBar.firstChild.children[i].classList.contains('active')) {
					this.lastPreferenceItemID = i;
					break;
				}
			}
			DB.setHost(hostCtrl.value);
		});
		
		modal.display();
	}
	
	logOut()
	{
		if (this.loggedInState === true) DB.query('Gate logout', info => {
			this.setSessionState(false);
			if ('msg' in info) alert(info.msg);
		});
	}
	
	quit()
	{
		//document.body.clear();
	}
	
	restart()
	{
		document.body.clear();
		new Hole();
	}
}

















