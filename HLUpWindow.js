'use strict';

class HLUpWindow extends ACController
{
	constructor(rootNode)
	{
		super(rootNode);
		
		this.container = new ACStaticCell(this.rootNode);
		this.container.style.width = '400px';
		this.container.style.height = '100%';
		this.container.style.margin = '0 auto';
		this.container.style.textAlign = 'center';
		this.container.style.overflow = 'auto';
		
		this.maxSizeCell = new ACStaticCell(this.container);
		this.maxSizeCell.style.margin = '12px auto';
		this.maxSizeCell.style.fontWeight = 'bold';
		DB.query('File maxUploadSize', rows => {
			this.maxSizeCell.textContent = 'upload_max_filesize: ' + rows.maxFileSize;
		});
		
		var form = AC.create('form', this.container);
		form.method = 'POST';
		form.enctype = 'multipart/form-data';
		
		this.fileInput = AC.create('input', form);
		this.fileInput.type = 'file';
		this.fileInput.style.margin = '12px auto';
		this.fileInput.style.backgroundColor = '#eee';
		
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
		
		this.progressBar = new ACStaticCell(this.container);
		this.progressBar.style.width = '100%';
		this.progressBar.style.height = '24px';
		this.progressBar.style.backgroundColor = '#eee';
		this.progressBar.style.margin = '12px auto';
		
		this.progressBarLeader = new ACStaticCell(this.progressBar);
		this.progressBarLeader.style.width = '0';
		this.progressBarLeader.style.height = '24px';
		
		this.logContainer = new ACStaticCell(this.container);
		this.logContainer.style.whiteSpace = 'pre';
		this.logContainer.style.fontSize = 'x-large';
	}
	
	onAttached()
	{
		this.rootNode.appendChild(this.container);
	}
	
	upload(evt)
	{
		evt.preventDefault();

		if (this.fileInput.files.length < 1) {
			return;
		}
		
		var formData = new FormData();
		formData.append('file', this.fileInput.files[0]);
		
		this.xhr = DB.postWithParams('File upload', formData, {
			uploadListeners: {
				loadstart: this.startTransfer.bind(this),
				progress: this.updateProgress.bind(this),
				loadend: this.completeTransfer.bind(this)
			},
			okFn: info => {
				//console.log('info', info);
			}, 
			failFn: this.setFailUI.bind(this)
		});
	}
	
	startTransfer(e)
	{
		this.upButton.disabled = true;
		this.abortButton.disabled = false;
		this.progressBarLeader.style.backgroundColor = '#4CAF50';
	}
	
	updateProgress(e)
	{
		var done = e.position || e.loaded, total = e.totalSize || e.total;
		//console.log('xhr.upload progress: ' + done + ' / ' + total + ' = ' + (Math.floor(done/total*1000)/10) + '%');
		
		let percentDone = (Math.floor(done/total*1000)/10) + '%';
		this.progressBarLeader.style.width = percentDone;
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
		this.progressBarLeader.style.backgroundColor = 'red';
	}
	
	completeTransfer(e)
	{
		this.fileInput.value = '';
		this.upButton.disabled = false;
		this.abortButton.disabled = true;
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