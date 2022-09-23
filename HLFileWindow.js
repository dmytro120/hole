'use strict';

class HLFileWindow extends ACController
{
	constructor(rootNode, params)
	{
		super(rootNode);
		if (params && 'isMobile' in params) this.isMobile = params.isMobile;
		
		this.grid = new ACFlexGrid(this.rootNode, { rowHeights:['10px', 'auto', '48px'], colWidths:['100%'] });
		
		this.container = new ACStaticCell(this.grid.cell(1,0));
		this.container.style.height = '100%';
		this.container.style.overflow = 'auto';
		
		this.loadBar = AC.create('img');
		this.loadBar.src = 'rsrc/fountain-pending.png';
		this.loadBar.style.display = 'block';
		this.loadBar.style.margin = '0 auto';
		
		this.relativePath = '';
		
		this.grid.cell(2,0).style.borderTop = '1px solid rgb(221, 221, 221)';
		this.grid.cell(2,0).style.backgroundColor = '#f8f8f8';
		
		var form = AC.create('form', this.grid.cell(2,0));
		form.method = 'POST';
		form.enctype = 'multipart/form-data';
		form.style.height = '100%';
		
		this.maxSizeCell = new ACStaticCell(form);
		this.maxSizeCell.style.margin = '12px';
		this.maxSizeCell.style.fontWeight = 'bold';
		this.maxSizeCell.style.display = 'inline-block';
		DB.query('File maxUploadSize', rows => {
			this.maxSizeCell.textContent = 'upload_max_filesize: ' + rows.maxFileSize;
		});
		
		this.fileInput = AC.create('input', form);
		this.fileInput.type = 'file';
		this.fileInput.style.margin = '12px auto';
		this.fileInput.style.backgroundColor = '#eee';
		this.fileInput.style.display = 'inline-block';
		
		this.upButton = AC.create('button', form);
		this.upButton.type = 'submit';
		this.upButton.role = 'button';
		this.upButton.textContent = 'upload';
		this.upButton.style.margin = '0px 6px';
		
		this.abortButton = AC.create('button', form);
		this.abortButton.textContent = 'abort';
		this.abortButton.disabled = true;
		this.abortButton.style.margin = '0px 6px';
		this.abortButton.addEventListener('click', this.abort.bind(this));
		
		form.addEventListener('submit', this.upload.bind(this));
		
		this.logContainer = new ACStaticCell(form);
		this.logContainer.style.whiteSpace = 'pre';
		this.logContainer.style.fontSize = 'large';
		this.logContainer.style.display = 'inline-block';
		this.logContainer.style.lineHeight = '100%';
		this.logContainer.style.margin = '0px 12px';
		
		this.progressBar = new ACProgressBar(form);
		this.progressBar.style.width = '30%';
		this.progressBar.style.margin = '12px';
		this.progressBar.style.float = 'right';
		
		// DnD upload
		this.container.addEventListener('dragover', e => {
			e.preventDefault();
		});
		this.container.addEventListener('drop', e => {
			//console.log('drop toplevel');
			e.preventDefault();
			if (e.dataTransfer.files) {
				//console.log(e.dataTransfer.files);
				this.fileInput.files = e.dataTransfer.files;
				this.upload(e);
			}
		});
	}
	
	onAttached()
	{
		this.rootNode.appendChild(this.grid);
		this.container.appendChild(this.loadBar);
		this.listFiles(this.relativePath);
		if (this.storedScrollTop) this.container.scrollTop = this.storedScrollTop;
	}
	
	listFiles(relativePath)
	{
		DB.query('File listing' + (relativePath ? ' ' + encodeURIComponent(relativePath) : ''), records => {
			this.container.clear();
			this.grid.cell(0,0).clear();
			
			if (records.length < 1) {
				let noticeBar = new ACStaticCell(this.container);
				noticeBar.textContent = 'no files in target directory';
				noticeBar.classList.add('alert', 'alert-warning');
				noticeBar.style.textAlign = 'center';
			}
			
			let table, tbody, row, cell;
			
			// Table & Tbody
			table = AC.create('table');
			table.classList.add('table', 'table-hover');
			tbody = AC.create('tbody', table);
			
			// Empty Table
			if (records.length < 1) {
				return table;
			}
			
			// Header Row
			/*row = AC.create('tr', tbody);
			AC.create('th', row);
			AC.create('th', row);*/
			let keys = Object.keys(records[0]);
			/*for (let key of keys) {
				cell = AC.create('th', row);
				cell.textContent = key;
			}*/
			
			// Records
			var counter = 1;
			for (let record of records) {
				row = AC.create('tr', tbody);
				row.tabIndex = counter;
				row.dataset.type = record.type;
				row.dataset.name = record.name;
				row.addEventListener('dblclick', this.openFile.bind(this, row));
				
				// DnD move files
				row.draggable = 'true';
				row.addEventListener('dragover', e => {
					if (record.type == 'd') e.preventDefault();
				});
				row.addEventListener('dragstart', e => {
					e.dataTransfer.effectAllowed = 'move';
				});
				if (record.type == 'd') row.addEventListener('dragenter', e => {
					let targetElement = e.srcElement;
					if (targetElement.tagName == 'TD') targetElement = targetElement.parentElement;
					targetElement.focus();
				});
				if (record.type == 'd') row.addEventListener('dragleave', e => {
					let targetElement = e.srcElement;
					if (targetElement.tagName == 'TD') targetElement = targetElement.parentElement;
					targetElement.blur();
				});
				if (record.type == 'd') row.addEventListener('drop', e => {
					//console.log('drop into dir');
					let targetElement = e.srcElement;
					if (targetElement.tagName == 'TD') targetElement = targetElement.parentElement;
					this.dropTargetDir = targetElement.dataset.name;
					//e.stopPropagation();
					e.preventDefault();
				});
				row.addEventListener('dragend', e => {
					let targetElement = e.srcElement;
					if (targetElement.tagName == 'TD') targetElement = targetElement.parentElement;
					if (this.dropTargetDir) this.moveFile(targetElement, record.name, this.dropTargetDir);
					this.dropTargetDir = null;
				});
				
				// Context Menu
				row.contextMenu = {
					'open': this.openFile.bind(this, row),
					'view raw': this.viewRaw.bind(this, row),
					'rename': this.renameFile.bind(this, row),
					'remove': this.removeFile.bind(this, row)
				};
				row.contextMenuScrollDismisser = this.container;
				row.addEventListener('contextmenu', ACContextMenu.open);
				
				// Icon
				cell = AC.create('td', row);
				cell = AC.create('td', row);
				cell.style.backgroundImage = 'url(rsrc/16x16/' + (record.type == 'd' ? 'dir.png' : HLFileWindowTools.iconForFile(record.name)) + ')';
				cell.style.backgroundRepeat = 'no-repeat';
				cell.style.backgroundPosition = 'center';
				
				for (let key of keys) {
					if (key == 'type') continue;
					if (this.isMobile) {
						if (key == 'ts' || key == 'size') continue;
					}
					cell = AC.create('td', row);
					cell.textContent = record[key];
					if (this.isMobile) {
						cell.style.lineHeight = '48px';
					}
				}
				
				counter++;
			}
			
			this.container.appendChild(table);
			this.drawTableHeader();
		}, err => {
			this.container.clear();
			this.grid.cell(0,0).clear();
			
			let errorBar = new ACStaticCell(this.container);
			errorBar.textContent = err;
			errorBar.classList.add('alert', 'alert-danger');
			errorBar.style.whiteSpace = 'pre';
		});
	}
	
	drawTableHeader()
	{
		this.grid.cell(0,0).style.backgroundColor = '#f8f8f8';
		this.grid.cell(0,0).style.borderBottom = '1px solid rgb(221, 221, 221)';
		
		var table = AC.create('table', this.grid.cell(0,0));
		table.classList.add('table');
		table.style.marginBottom = '0';
		
		var tbody = AC.create('tbody', table);
		var row = AC.create('tr', tbody);
		//AC.create('th', row);
		//AC.create('th', row);
		
		var headings = !this.isMobile ? ['', '', 'name', 'timestamp', 'size'] : ['', '', 'name'];
		/*var th;
		for (let heading of headings) {
			th = AC.create('th', row);
			th.textContent = heading;
		}*/
		var headingIndex = 0;
		
		var originalHeaderRow = this.container.firstChild.firstChild.firstChild;
		for (let th of originalHeaderRow.children) {
			let width = th.getBoundingClientRect().width;
			let newCell = AC.create('th', row);
			newCell.textContent = headings[headingIndex];
			newCell.style.width = width.toString() + 'px';
			headingIndex++;
		}
		//originalHeaderRow.style.display = 'none';
		
		// Add padding cell to account for scrollbar in filetable
		var fileTable = this.container.firstChild;
		let fileTableWidth = fileTable.getBoundingClientRect().width;
		let headerTableWidth = table.getBoundingClientRect().width;
		let difference = headerTableWidth - fileTableWidth;
		//console.log(difference);
		if (difference > 0) {
			let newCell = AC.create('th', row);
			newCell.style.width = difference.toString() + 'px';
		}
	}
	
	openFile(row)
	{
		let td = row.children[2];
		let baseName = td.textContent;
		if (row.dataset.type == 'f') {
			window.open('contents/' + this.relativePath + baseName + '?' + Date.now().toString(), '_blank');
		} else {
			if (baseName != '..') this.relativePath += baseName + '/';
			else {
				let lastSlashPos = this.relativePath.slice(0, -1).lastIndexOf('/');
				if (lastSlashPos != -1) this.relativePath = this.relativePath.slice(0, lastSlashPos + 1);
				else this.relativePath = '';
			}
			this.listFiles(this.relativePath);
		}
	}
	
	viewRaw(row)
	{
		let td = row.children[2];
		let baseName = td.textContent;
		if (row.dataset.type == 'f') {
			window.open('io/?c=File&m=read&p[]=' + encodeURIComponent(this.relativePath + baseName), '_blank');
		}
	}
	
	renameFile(row)
	{
		let td = row.children[2];
		let originalName = td.textContent;
		td.clear();
		
		let inputBox = new ACTextInput(td);
		inputBox.value = originalName;
		inputBox.select();
		inputBox.focus();
		
		inputBox.addEventListener('blur', e => {
			td.clear();
			td.textContent = originalName; //inputBox.value;
			if (originalName != inputBox.value) {
				DB.query('File rename ' + 
					encodeURIComponent(originalName) + ' ' + 
					encodeURIComponent(inputBox.value) + ' ' + 
					encodeURIComponent(this.relativePath), 
				info => {
					td.textContent = inputBox.value;
				});
			}
		});
		inputBox.addEventListener('keypress', e => {
			if (e.key == 'Enter') inputBox.blur();
			else if (e.key == '/') e.preventDefault();
		});
	}
	
	removeFile(row)
	{
		let td = row.children[2];
		let baseName = td.textContent;
		
		var cmd = row.dataset.type == 'f' ? 'remove' : 'removeDir';
		var msg = row.dataset.type == 'f' ? 
			"File " + baseName + " will be permanently erased.":
			"Directory " + baseName + " will be RECURSIVELY permanently erased.";
		
		if (confirm(msg)) {
			DB.query('File ' + cmd + ' ' + 
				encodeURIComponent(baseName) + ' ' + 
				encodeURIComponent(this.relativePath), 
			info => {
				row.remove();
			});
		}
	}
	
	upload(evt)
	{
		evt.preventDefault();

		if (this.fileInput.files.length < 1) {
			return;
		}
		
		var formData = new FormData();
		formData.append('file', this.fileInput.files[0]);
		
		this.xhr = DB.postWithParams('File upload ' + this.relativePath, formData, {
			uploadListeners: {
				loadstart: this.startTransfer.bind(this),
				progress: this.updateProgress.bind(this),
				loadend: this.completeTransfer.bind(this)
			},
			okFn: info => {
				//console.log('info', info);
				this.listFiles(this.relativePath);
			}, 
			failFn: this.setFailUI.bind(this)
		});
	}
	
	startTransfer(e)
	{
		this.upButton.disabled = true;
		this.abortButton.disabled = false;
		this.progressBar.setLeaderColor('#4CAF50');
	}
	
	updateProgress(e)
	{
		var done = e.position || e.loaded, total = e.totalSize || e.total;
		//console.log('xhr.upload progress: ' + done + ' / ' + total + ' = ' + (Math.floor(done/total*1000)/10) + '%');
		
		let percentDone = (Math.floor(done/total*1000)/10) + '%';
		this.progressBar.setProgressPercent(percentDone);
		this.logContainer.textContent = percentDone;
	}
	
	abort(e)
	{
		e.preventDefault();
		if (this.xhr) {
			this.xhr.abort();
			this.setFailUI();
		}
	}
	
	setFailUI()
	{
		this.upButton.disabled = false;
		this.abortButton.disabled = true;
		this.progressBar.setLeaderColor('red');
	}
	
	completeTransfer(e)
	{
		this.fileInput.value = '';
		this.upButton.disabled = false;
		this.abortButton.disabled = true;
		this.progressBar.setProgressPercent('0%');
		this.logContainer.textContent = '';
	}
	
	moveFile(row, baseName, targetDir)
	{
		if (baseName == targetDir) return;
		if (targetDir == '..') targetDir = '';
		DB.query('File move ' + 
			encodeURIComponent(baseName) + ' ' + 
			encodeURIComponent(targetDir) + ' ' + 
			encodeURIComponent(this.relativePath), 
		info => {
			row.remove();
		});
	}
	
	onDetached()
	{
		this.storedScrollTop = this.container.scrollTop;
	}
	
	onAppCommand(command)
	{
		switch (command) {
			case 'layout': this.listFiles(this.relativePath); break;
			case 'eof': this.exit(); break;
		}
	}
	
	exit()
	{
		this.dispatchEvent('quit');
	}
}

class HLFileWindowTools
{
	static iconForFile(baseName)
	{
		let baseNameBits = baseName.split('.');
		let extension = baseNameBits[baseNameBits.length - 1].toLowerCase();
		
		let knownFileExtensions = ['dll', 'exe', 'jpg', 'js', 'mp4', 'pdf', 'php', 'png', 'rar', 'rtf', 'txt', 'zip'];
		
		return knownFileExtensions.includes(extension) ? extension + '.png' : 'file.png';
	}
}