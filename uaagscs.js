let file = "uaag.json"
let uaagContents = null;
let dbug = !true;
let cont = null;
let toc = null;
let principles = true;
let guidelines = true;
let sc = true;
let notes = true;
let initHl = 3;
let hl = initHl;
let showURL = true;
let refURL = null;
let referenceURL = null;
let liveRegion = null;
let showHideBtn = null;
let sep="|";
let leftPanel = null;

let filters = {
	"principleChk" : null,
	"guidelineChk" : null,
	"summaryChk" : null,
	"successCriterionChk" : null,
	"descriptionChk" : null,
	"levelChk" : null,
	"levelAAAChk" : null,
	"levelAAChk" : null,
	"levelAChk" : null,
	"infoLinkChk" : null,
	"scnotesChk" : null,
	"glnotesChk" : null,
};


function init () {
	if (dbug) console.log ("Initting");
	cont = document.getElementById("cont");
	toc = document.getElementById("toc");
	liveRegion = document.getElementById("liveRegion");
	showHideBtn = document.getElementById("showHideBtn");
	leftPanel = document.getElementById("leftPanel");
	

	let shownTab = 0;
	let thisURL = new URL(document.location);
	let params = thisURL.searchParams;
	let hash = thisURL.hash;
	let hide = null;
	if (params.get("dbug")) {
		if (params.get("dbug") == "true") dbug= true;
	}

	if (params.get("filters")) {
		// Do stuff
		hide = params.get("filters");
		
	} else {
		// Nothing is filtered, therefore, leave everything as it is
	}
	if (dbug) console.log ("Hiding: " + hide + ".");
	
	for (let id in filters) {
		try {
			filters[id] = document.getElementById(id);
			filters[id].addEventListener("change", toggleFilter, false);
			if (hide) {
				if (dbug) console.log (`Should I hide ${id}?`);
				if (id.replace("Chk", "").match(hide)) filters[id].checked = false;
			}
		}
		catch (ex) {
			console.error ("Exception: " + ex.toString())
		}
	}
	if (params.get("selectedTab")) {
		// Do stuff
		shownTab = 1;
	}
	setupTabs(shownTab);

	showHideBtn.addEventListener("click", toggleLeftPanel, false);

	window.addEventListener("popstate", interpretParams, false);
	fetch (file).then(function (resp) {
		if (dbug) console.log ("Got resp.");
		resp.json().then (setUAAG);
	})
	if (dbug) console.log ("Finished Initting");
} // End of init

function toggleLeftPanel () {
	if (showHideBtn.getAttribute("aria-expanded") == "true") {
		// Hide it
		showHideBtn.setAttribute("aria-expanded", "false");
		showHideBtn.innerHTML = showHideBtn.innerHTML.replace("Hide", "Show");
		leftPanel.classList.add("hide");
	} else {
		// Show it
		showHideBtn.setAttribute("aria-expanded", "true");
		showHideBtn.innerHTML = showHideBtn.innerHTML.replace("Show", "Hide");
		leftPanel.classList.remove("hide");
	}
} // End of toggleLeftPanel

function setupTabs(x) {
	// Shamelessly taken from https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/tab_role
	const tabs = document.querySelectorAll('[role="tab"]');
	const tabList = document.querySelector('[role="tablist"]');

	// Add a click event handler to each tab
	tabs.forEach(tab => {
		tab.addEventListener("click", changeTabs);
	});

	// Enable arrow navigation between tabs in the tab list
	let tabFocus = x;
	if (tabFocus !=0) {
		const evt = new Event("click", {"bubbles":true, "cancelable":false});
		tabs[tabFocus].dispatchEvent(evt);
	}

	tabList.addEventListener("keydown", e => {
	// Move right
		if (e.keyCode === 39 || e.keyCode === 37) {
			tabs[tabFocus].setAttribute("tabindex", -1);
			if (e.keyCode === 39) {
				tabFocus++;
				// If we're at the end, go to the start
				if (tabFocus >= tabs.length) tabFocus = 0;
				// Move left
			} else if (e.keyCode === 37) {
				tabFocus--;
				// If we're at the start, move to the end
				if (tabFocus < 0) tabFocus = tabs.length - 1;
			}

			tabs[tabFocus].setAttribute("tabindex", 0);
			tabs[tabFocus].focus();
		}
	});
} // End of setupTabs

function changeTabs(e) {
	const target = e.target;
	const parent = target.parentNode;
	const grandparent = parent.parentNode;

	// Remove all current selected tabs
	parent.querySelectorAll('[aria-selected="true"]').forEach(t => t.setAttribute("aria-selected", false));

	// Set this tab as selected
	target.setAttribute("aria-selected", true);

	// Hide all tab panels
	grandparent.querySelectorAll('[role="tabpanel"]').forEach(p => p.classList.add("hide"));

	// Show the selected panel
	grandparent.parentNode.querySelector(`#${target.getAttribute("aria-controls")}`).classList.remove("hide");
	setURL();
} // End of changeTabs


function setURL () {
	let url = new URL(document.location);
	let newURL = url.toString().replace(/#.*$/, "");
	newURL = newURL.replace(/\?.*$/, "");
	let selectedTab = (document.getElementById("filtersLink").getAttribute("aria-selected") == "true" ? "selectedTab=filters" : "");
	let params = [];
	for (let id in filters) {
		if (!filters[id].checked) {
			params.push(id.replace("Chk", ""));
			if (id.match(/levelA/)) {
				params[params.length-1] += "$";
			}
		}
	}
	
	if (params.length > 0) {
		newURL += "?filters=" + params.join(sep) + (selectedTab != "" ? "&" + selectedTab : "") + url.hash;
	} else {
		newURL += (selectedTab != "" ? "?" + selectedTab : "") + url.hash;
	}
	history.pushState({}, document.title, newURL);


} // End of setURL


function setTab (name) {

} // End of setTab

function interpretParams () {
	setFilters();
} // End of interpretParams

function setFilters () {
	if (dbug) console.log ("popstate event with url: " + document.location.href);
	let msg = "";
	let hide = null;
	let showing = [];	// hiding and showing are for the aria-live region
	let hiding = [];
	let params = (new URL(document.location)).searchParams;
	if (params.get("filters")) {
		// Do stuff
		hide = params.get("filters");
	} else {
		// Nothing is filtered, therefore, leave everything as it is
	}
	for (let id in filters) {
		if (dbug) console.log ("Checking " + id + ".");
		let chkLbl = document.querySelector("label[for=" + id + "]").textContent;
		if (dbug) console.log (id + ": label (" + chkLbl + ").");
		if (hide) {
			if (id.replace("Chk", "").match(hide)) {
				if (dbug) console.log ("It should be hidden.");
				if (filters[id].checked) {
					hiding.push (chkLbl);
					filters[id].checked = false;
				} else {
					if (dbug) console.log ("Leaving unchecked.");
				}
				//filters[id].checked = (id.replace("Chk", "").match(hide) ? false : true);
			} else {
				if (dbug) console.log ("It should not be hidden.");
				if (!filters[id].checked) {
					showing.push (chkLbl);
					filters[id].checked = true;
				} else {
					if (dbug) console.log ("Leaving checked.");
				}
			}
		} else {
			if (dbug) console.log ("Everything should be checked (unhidden) including " + chkLbl + ".");
			if (!filters[id].checked) {
				if (dbug) console.log ("Checking.");
				showing.push (chkLbl);
				filters[id].checked = true;
			} else {
				if (dbug) console.log ("Leaving as is.");
			}
		}
	}
	if (showing.length > 0 || hiding.length > 0) {
		msg = "";
		if (showing.length > 0) {
			msg = "Showing " + showing.join(", ") + ".";
		}
		if (hiding.length > 0) {
			msg += "Hiding " + hiding.join(", ") + ".";
		}
	} else {
		msg = "Showing everything!";
	}

	liveRegion.textContent = msg;
} // End of setFilters

function setUAAG (uaag) {
	uaagContents = uaag;
	genHTML();
	
	let thisURL = new URL(document.location);
	let hash = thisURL.hash;

	if (hash != "") {
		try {
			let targetElement = document.getElementById(hash.replace(/^#/, ""));
			if (!targetElement.hasAttribute("tabindex")) targetElement.setAttribute("tabindex", "-1");
			if (dbug) console.log ("Setting focus.");
			targetElement.focus();
		}
		catch (ex) {
			console.error("Exception: " + ex.toString());
		}
	}

} // End of set setUAAG

function toggleFilter (e) {
	let chkID = e.target.getAttribute("id");
	let chkClass = chkID.replace("Chk", "");
	let chkLbl = document.querySelector("label[for=" + chkID + "]");
	let msg = [];
	msg.push((filters[chkID].checked ? "Showing " : "Hiding ") + chkLbl.textContent);

	if (chkID == "partChk" || chkID == "principleChk") {
	} else if (chkID == "guidelineChk") {
		filters["glnotesChk"].checked = filters["guidelineChk"].checked;
		filters["summaryChk"].checked = filters["guidelineChk"].checked;
		//msg += ", " + document.querySelector("label[for=glnotesChk]").textContent + ", and " + document.querySelector("label[for=summaryChk]").textContent;
		msg.push(document.querySelector("label[for=glnotesChk]").textContent, document.querySelector("label[for=summaryChk]").textContent);
	} else if (chkID == "successCriterionChk") {
		filters["descriptionChk"].checked = filters["successCriterionChk"].checked;
		filters["levelChk"].checked = filters["successCriterionChk"].checked;
		filters["levelAChk"].checked = filters["successCriterionChk"].checked;
		filters["levelAAChk"].checked = filters["successCriterionChk"].checked;
		filters["levelAAAChk"].checked = filters["successCriterionChk"].checked;
		filters["scnotesChk"].checked = filters["successCriterionChk"].checked;
		msg.push(document.querySelector("label[for=descriptionChk]").textContent, document.querySelector("label[for=levelChk]").textContent, document.querySelector("label[for=scnotesChk]").textContent);
	} else if (chkID == "levelChk") {
		msg.push(document.querySelector("label[for=levelChk]").textContent);
	} else if (chkID.match(/level(WC)?A/)) {	// If a specific level is clicked...
		if (filters[chkID].checked) {		// ...and it's been turned on....
			if (!filters["levelChk"].checked) filters["levelChk"].checked = true;
			msg.push(document.querySelector("label[for=levelChk]").textContent);
		} else {
			// This is just to turn everything off if now all levels are unchecked.  If one gets turned on, we'll deal with that below.
			if (!filters["levelAChk"].checked && !filters["levelAAChk"].checked && !filters["levelAAAChk"].checked) {
				// If no levels are checked, then....well....no SC's should be shown!
				if (filters["levelChk"].checked) {
					filters["levelChk"].checked = false;
					msg.push(document.querySelector("label[for=levelChk]").textContent);
				}
				if (filters["successCriterionChk"].checked) {
					filters["successCriterionChk"].checked = false;
					msg.push(document.querySelector("label[for=successCriterionChk]").textContent);
				}
				if (filters["scnotesChk"].checked) {
					filters["scnotesChk"].checked = false;
					msg.push(document.querySelector("label[for=scnotesChk]").textContent);
				}
				if (filters["descriptionChk"].checked) {
					filters["descriptionChk"].checked = false;
					msg.push(document.querySelector("label[for=descriptionChk]").textContent);
				}

			}
		}
	}
	// If guideline subsections turn on, make sure guidelines are on
	if ((filters["summaryChk"].checked || filters["glnotesChk"].checked) && !filters["guidelineChk"].checked) {
		filters["guidelineChk"].checked = true;
		msg.push (document.querySelector("label[for=guidelineChk]").textContent);
	}

	// If SC subsections turn on, make sure SC is on
	if ((filters["descriptionChk"].checked || filters["levelChk"].checked || filters["scnotesChk"].checked || filters["levelAChk"].checked || filters["levelAAChk"].checked || filters["levelAAAChk"].checked) && !filters["successCriterionChk"].checked) {
		filters["successCriterionChk"].checked = true;
		msg.push(document.querySelector("label[for=successCriterionChk]").textContent);
	}

	/*
	let url = new URL(document.location);
	let newURL = url.toString().replace(/#.*$/, "");
	newURL = newURL.replace(/\?.*$/, "");
	let params = [];
	for (let id in filters) {
		if (!filters[id].checked) {
			params.push(id.replace("Chk", ""));
			if (id.match(/levelA/)) {
				params[params.length-1] += "$";
			}
		}
	}
	if (params.length > 0) {
		newURL += "?filters=" + params.join(sep) + url.hash;
	} else {
		newURL += url.hash
	}
	history.pushState({}, document.title, newURL);
	*/
	setURL();
		
	genHTML();
	if (msg.length > 1) msg[msg.length-1] = "and " + msg[msg.length-1];
	liveRegion.textContent = msg.join(", ") + ".";
} // End of toggleFilter

function genHTML () {
	if (dbug) console.log ("Regening...");
	cont.innerHTML = "";
	toc.innerHTML = "";
	hl = initHl;
	refURL = uaagContents["base_url"];
	referenceURL = uaagContents["reference_base_url"];
	for (let principle in uaagContents.principles) {
		if (principle) {
			createPrinciple(uaagContents.principles[principle], cont, toc);
		}
	}
} // End of genHTML
/*
function createPart (uaagPart, pNode, tocpNode) {
	let partSect = pNode;
	let partOL = tocpNode;
	let partLI = createHTMLElement(document, "li", {"parentNode":partOL});

	if (filters["partChk"].checked) {
		partSect = createHTMLElement(document, "section", {"parentNode":pNode,"class":"partSect", "id":uaagPart["url_fragment"]});
		createHTMLElement(document, "a", {"parentNode": partLI, "href" : "#" + uaagPart["url_fragment"], "textNode" : uaagPart["ref_id"] + " - " + uaagPart["title"]});
	}
	if (!filters["infoLinkChk"].checked && !filters["implementingLinkChk"].checked && filters["partChk"].checked && !filters["guidelineChk"].checked && !filters["successCriterionChk"].checked && !filters["principleChk"].checked) {
		createHTMLElement(document, "p", {"parentNode":partSect, "id" : "", "class":"part bold", "textNode":"Part " + uaagPart["ref_id"] + " - " + uaagPart["title"]});
	} else {
		if (filters["partChk"].checked) {
			createHTMLElement(document, "h" + hl, {"parentNode":partSect, "class":"part", "textNode":"Part " + uaagPart["ref_id"] + " - " + uaagPart["title"]});
			if (filters["infoLinkChk"].checked || filters["implementingLinkChk"].checked) createLinks(partSect, uaagPart["url_fragment"], "Part " + uaagPart["ref_id"]);
			//if (filters["implementingLinkChk"].checked) implementingURL = createHTMLElement (document, "a", {"parentNode":partSect, "href":referenceURL + "#" + uaagPart["url_fragment"], "textNode":"Implementing " + uaagPart["ref_id"], "class":"implementingLink", "target":"_blank", "rel":"noopener noreferrer"});
			//if (filters["infoLinkChk"].checked) createHTMLElement(document, "a", {"parentNode":partSect, "href":refURL + "#" + uaagPart["url_fragment"], "textNode":refURL+"#"+uaagPart["url_fragment"], "class":"infoLink", "target":"_blank", "rel":"noopener noreferrer"});
			partOL = createHTMLElement(document, "ol", {"parentNode":partLI});
			hl++;
		}

		for (let p in uaagPart["principles"]) {
			createPrinciple(uaagPart["principles"][p], partSect, partOL);
		}
		if (filters["partChk"].checked) hl--;
	}
} // End of createPart
*/

function createPrinciple (uaagPrinciple, pNode, tocpNode) {
	let principleSect = pNode;
	let gls = false;
	let principleOL = tocpNode;
	let principleLI = createHTMLElement(document, "li", {"parentNode":principleOL});
	if (filters["principleChk"].checked) {
		principleSect  = createHTMLElement(document, "section", {"parentNode":pNode, "class":"prinicpleSect", "id":uaagPrinciple["url_fragment"]});
		createHTMLElement(document, "a", {"parentNode": principleLI, "href" : "#" + uaagPrinciple["url_fragment"], "textNode" : uaagPrinciple["ref_id"] + " - " + uaagPrinciple["title"]});

	}
	if (!filters["infoLinkChk"].checked && !filters["guidelineChk"].checked && !filters["successCriterionChk"].checked&& filters["principleChk"].checked) {
		createHTMLElement(document, "p", {"parentNode":principleSect, "class":"principle bold", "textNode":"Principle " + uaagPrinciple["ref_id"] + " - " + uaagPrinciple["title"]});
	} else {
		if (filters["principleChk"].checked) {
			createHTMLElement(document, "h" + hl, {"parentNode":principleSect, "class":"principle", "textNode":"Principle " + uaagPrinciple["ref_id"] + " - " + uaagPrinciple["title"]});
			if (filters["infoLinkChk"].checked) createLinks(principleSect, uaagPrinciple["url_fragment"], uaagPrinciple["ref_id"]);
			principleOL = createHTMLElement(document, "ol", {"parentNode":principleLI});
			hl++;
		}
		for (let gl in uaagPrinciple["guidelines"]) {
			let scs = createGuideline(uaagPrinciple["guidelines"][gl], principleSect, principleOL);
			if (!gls && scs) gls = true;
		}
		if (filters["principleChk"].checked) hl--;
		/*
		if (!gls) {
			principleSect.parentNode.removeChild(principleSect);
		}
		*/
	}

} // End of createPrinciple

function createGuideline (uaagGuideline, pNode, tocpNode) {
	let guidelineSect  = pNode;
	let scs = false;
	let guidelineOL = tocpNode;
	let guidelineLI = createHTMLElement(document, "li", {"parentNode":guidelineOL});
	if (filters["guidelineChk"].checked) {
		guidelineSect = createHTMLElement(document, "section", {"parentNode":pNode,"class":"guidelineSect", "id":uaagGuideline["url_fragment"]});
		createHTMLElement(document, "a", {"parentNode": guidelineLI, "href" : "#" + uaagGuideline["url_fragment"], "textNode" : uaagGuideline["ref_id"] + " - " + uaagGuideline["title"]});

	}
	if (!filters["infoLinkChk"].checked && !filters["summaryChk"].checked && !filters["successCriterionChk"].checked && filters["guidelineChk"].checked && (!filters["glnotesChk"].checked || (filters["glnotesChk"].checked && !uaagGuideline["notes"]))) {
		createHTMLElement(document, "p", {"parentNode":guidelineSect, "class":"guideline bold", "textNode":"Guideline " + uaagGuideline["ref_id"] + " - " + uaagGuideline["title"]});
	} else {
		if (filters["guidelineChk"].checked) {
			createHTMLElement(document, "h" + hl, {"parentNode":guidelineSect, "class":"guideline", "textNode":"Guideline " + uaagGuideline["ref_id"] + " - " + uaagGuideline["title"]});
			if (filters["infoLinkChk"].checked) createLinks(guidelineSect, uaagGuideline["url_fragment"], uaagGuideline["ref_id"]);
			if (filters["summaryChk"].checked) {
				let summaryP = createHTMLElement(document, "p", {"parentNode":guidelineSect, "class":"summary"});
				let summaryS = createHTMLElement(document, "strong", {"parentNode":summaryP, "textNode":"Summary: "});
				let summaryT = createHTMLElement(document, "span", {"parentNode":summaryP, "textNode" : uaagGuideline["summary"]});
			}
			if (uaagGuideline["notes"] && filters["glnotesChk"].checked) {
				hl++;
				let guidelineNotesSect = createHTMLElement(document, "section", {"parentNode":guidelineSect, "class":"guidelineNotesSect"});
				let guidelineNotesH = createHTMLElement(document, "h" + hl, {"parentNode":guidelineNotesSect, "textNode":"Notes", "class":"glnotes","id":uaagGuideline["ref_id"]+"H"});
				let guidelineNotesOL = createHTMLElement(document, "ol", {"parentNode":guidelineNotesSect, "class":"guidelineNotes", "aria-labelledby":uaagGuideline["ref_id"]+"H", "class":"glnotes"});
				for (let i = 0; i < uaagGuideline["notes"].length; i++) {
					let glLi = createHTMLElement(document, "li", {"parentNode":guidelineNotesOL, "textNode":uaagGuideline["notes"][i]["content"]});
				}
				hl--;
			}
			guidelineOL = createHTMLElement(document, "ol", {"parentNode":guidelineLI});
			hl++;
		}
		for (let sc in uaagGuideline["success_criteria"]) {
			if (filters["levelAChk"].checked || filters["levelAAChk"].checked || filters["levelAAAChk"].checked) {
				if (uaagGuideline["success_criteria"][sc]["level"] == "A,AA,AAA") {
					if (!scs) scs = true;
					createSuccessCriterion(uaagGuideline["success_criteria"][sc], guidelineSect, guidelineOL);
				} else if (filters["level" + uaagGuideline["success_criteria"][sc]["level"] + "Chk"].checked) {
					if (!scs) scs = true;
					createSuccessCriterion(uaagGuideline["success_criteria"][sc], guidelineSect, guidelineOL);
				}
			}
		}
		if (filters["guidelineChk"].checked) hl--;
		/*
		if (!scs) {
			// This Guideline has no Success Criteria to be shown.  Hide it.
			guidelineSect.parentNode.removeChild(guidelineSect);
		}
		*/
	return scs;
	}
} // End of createGuideline

function createSuccessCriterion (uaagSuccessCriterion, pNode, tocpNode) {
	let successCriterionSect = pNode;	// This may not be necessary here.  But I'm keeping it as per the pattern.
	let scOL = tocpNode;
	let scLI = createHTMLElement(document, "li", {"parentNode":scOL});
	if (filters["successCriterionChk"].checked) {
		successCriterionSect  = createHTMLElement(document, "section", {"parentNode":pNode, "class":"scSect", "id":uaagSuccessCriterion["url_fragment"]});
		createHTMLElement(document, "a", {"parentNode": scLI, "href" : "#" + uaagSuccessCriterion["url_fragment"], "textNode" : uaagSuccessCriterion["ref_id"] + " - " + uaagSuccessCriterion["title"]});
		if (!filters["infoLinkChk"].checked && (!filters["scnotesChk"].checked || !uaagSuccessCriterion["notes"]) && !filters["descriptionChk"].checked && !filters["levelChk"].checked) {
			let successCriterionH = createHTMLElement(document, "p", {"parentNode":successCriterionSect, "class":"successCriterion bold", "textNode":"Success Criterion " + uaagSuccessCriterion["ref_id"] + " - " + uaagSuccessCriterion["title"]});
		} else {
			let successCriterionH = createHTMLElement(document, "h" + hl, {"parentNode":successCriterionSect, "class":"successCriterion", "textNode":"Success Criterion " + uaagSuccessCriterion["ref_id"] + " - " + uaagSuccessCriterion["title"]});
			if (filters["descriptionChk"].checked) {
				let scdescDiv = createHTMLElement(document, "div", {"parentNode":successCriterionSect, "class":"descriptionDiv"});
				let scdesc = createHTMLElement(document, "p", {"parentNode":scdescDiv, "textNode" : uaagSuccessCriterion["description"], "class":"description"});
				if (uaagSuccessCriterion["special_cases"]) {
					let specCaseOL = createHTMLElement(document, "ol", {"parentNode":scdescDiv, "class":"description"});
					for (let i = 0; i < uaagSuccessCriterion["special_cases"].length; i++) {
						let specCaseLI = createHTMLElement(document, "li", {"parentNode":specCaseOL});

						let specCaseTitle = createHTMLElement(document, (uaagSuccessCriterion["special_cases"][i].hasOwnProperty("description") ? "strong" : "span"), {"parentNode":specCaseLI, "textNode":uaagSuccessCriterion["special_cases"][i]["title"]});
						if (uaagSuccessCriterion["special_cases"][i].hasOwnProperty("description")) createHTMLElement(document, "span", {"parentNode":specCaseLI, "textNode":uaagSuccessCriterion["special_cases"][i]["description"]});
					}
				}
			}
			if (filters["levelChk"].checked) createHTMLElement(document, "p", {"parentNode":successCriterionSect, "class":"level", "textNode":"Level " + uaagSuccessCriterion["level"]});
			if (filters["infoLinkChk"].checked) createLinks(successCriterionSect, uaagSuccessCriterion["url_fragment"], uaagSuccessCriterion["ref_id"]);
			if (filters["scnotesChk"].checked && uaagSuccessCriterion["notes"]) {
				hl++;
				let successCriterionNotesSect = createHTMLElement(document, "section", {"parentNode":successCriterionSect, "class":"successCriterionSect"});
				let successCriterionNotesH = createHTMLElement(document, "h" + hl, {"parentNode":successCriterionNotesSect, "textNode":"Notes", "class":"scnotes", "id":uaagSuccessCriterion["ref_id"]+"H"});
				let successCriterionNotesOL = createHTMLElement(document, "ol", {"parentNode":successCriterionNotesSect, "class":"successCriterionNotes", "aria-labelledby":uaagSuccessCriterion["ref_id"]+"H", "class":"scnotes"});
				for (let i = 0; i < uaagSuccessCriterion["notes"].length; i++) {
					createHTMLElement(document, "li", {"parentNode":successCriterionNotesOL, "textNode":uaagSuccessCriterion["notes"][i]["content"]});
				}
				hl--;
			}
		}
	}
} // End of createSuccessCriterion

function createLinks (pNode, urlFragment, ref) {
	//let newUl = createHTMLElement(document, "ul", {"parentNode": pNode, "class":"linkUL"});

	if (filters["infoLinkChk"].checked) {
		let newP =createHTMLElement(document, "p", {"parentNode":pNode});
		createHTMLElement(document, "a", {"parentNode":newP, "href":refURL + "#" + urlFragment, "textNode":"Info on " + ref, "class":"infoLink", "target":"_blank", "rel":"noopener noreferrer"});
	}
	
} // End of createLinks

function createHTMLElement (creator, type, attribs) {
	let thisdbug = (((arguments.length == 4 &&arguments[3] != null && arguments[3] != undefined) || dbug == true) ? true : false);
	//console.log ("createHTMLElement::dbug: " + dbug + " because arguments.length: " + arguments.length + ", and argument[3]: " + arguments[3] + ".");
	if (thisdbug) console.log("nordburg::createHTMLElement " + type + (attribs.hasOwnProperty("id") ? "#" + attribs["id"] : "") + (attribs.hasOwnProperty("textNode") ? " containing " + attribs["textNode"] : "") + ".");
	// From: http://stackoverflow.com/questions/26248599/instanceof-htmlelement-in-iframe-is-not-element-or-object
	let iwin = window.top;
	// idiv instanceof iwin.HTMLElement; // true
	// Check for headings beyond h6
	let hRE = /h(\d+)/g;
	let hLevel = hRE.exec(type);
	if (hLevel) {
		if (hLevel[1] > "6") {
			type= "div";
			attribs["role"] = "heading";
			attribs["aria-level"] = hLevel[1];
		}
	}

	let newEl = creator.createElement(type);
	for (let k in attribs) {
		if (thisdbug) console.log ("Checking attrib " + k + ".");
		if (k == "parentNode" && attribs[k] instanceof iwin.HTMLElement) {
			if (thisdbug) console.log("Dealing with parentnode.");
			if (attribs[k] instanceof HTMLElement) {
				if (thisdbug) console.log("Appending...");
				attribs[k].appendChild(newEl);
			} else if (attribs[k] instanceof String || typeof(attribs[k]) === "string") {
				try {
					if (thisdbug) console.log("Getting, then appending...");
					document.getElementById(attribs[k]).appendChild(newEl);
				}
				catch (er) {
					console.error("Error creating HTML Element: " + er.message + ".");
				}
			}
		} else if (k == "textNode" || k == "nodeText") {
			if (typeof (attribs[k]) == "string") {
				newEl.appendChild(creator.createTextNode(attribs[k]));
			} else if (attribs[k] instanceof iwin.HTMLElement) {
				newEl.appendChild(attribs[k]);
			} else {
				newEl.appendChild(creator.createTextNode(attribs[k].toString()));
			}
		} else {
			newEl.setAttribute(k, attribs[k]);
		}
	}
	return newEl;
} // End of createHTMLElement


init();
