'use strict';

class ACProgressBar extends ACControl
{
	constructor(parentNode)
	{
		super(parentNode);
		this.leader = new ACStaticCell(this);
		this.setProgressPercent('0%');
	}
	
	setLeaderColor(color)
	{
		this.leader.style.backgroundColor = color;
	}
	
	setProgressPercent(percent)
	{
		this.leader.style.width = percent;
	}
}

window.customElements.define('ac-progressbar', ACProgressBar);