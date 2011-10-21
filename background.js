var domain_pattern = /^https?:\/\/([^\/]+)/;
var domains_map = {};
var script = {
	file: 'enable.js',
	allFrames: true
};

function load() {
	var domains = localStorage.domains;
	if (domains) {
		try {
			domains_map = JSON.parse(statusString);
		} catch (e) {
			domains_map = {};
		}
	}
}
load();

function addDomain(domain) {
	if (!(domain in domains_map)) {
		domains_map[domain] = 1;
		localStorage.domains = JSON.stringify(domains_map);
	}
}

function removeDomain(domain) {
	if (domain in domains_map) {
		delete domains_map[domain];
		localStorage.domains = JSON.stringify(domains_map);
	}
}

function needEnableCopy(url) {
	if (url && url.substr(0, 4) == 'http') {
		var result = domain_pattern.exec(url);
		if (result && result[1] in domains_map) {
			return true;
		}
	}
	return false;
}

chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo) {
	chrome.tabs.get(tabId, function(tab) {
		chrome.browserAction.setIcon({
			path: needEnableCopy(tab.url) ? 'icon19.png' : 'icon19-disable.png',
			tabId: tabId
		});
	});
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete') {
		if (needEnableCopy(changeInfo.url || tab.url)) {
			chrome.tabs.executeScript(null, script);
			chrome.browserAction.setIcon({
				path: 'icon19.png',
				tabId: tab.id
			});
		} else {
			chrome.browserAction.setIcon({
				path: 'icon19-disable.png',
				tabId: tab.id
			});
		}
	}
});


chrome.browserAction.onClicked.addListener(function(tab) {
	var url = tab.url;
	if (url && url.substr(0, 4) == 'http') {
		var result = domain_pattern.exec(url);
		if (result && result[1] in domains_map) {
			removeDomain(result[1]);

			chrome.browserAction.setIcon({
				path: 'icon19-disable.png',
				tabId: tab.id
			});
			return;
		}

		chrome.windows.getAll({populate: true}, function(windows) {
			for (var i = 0; i < windows.length; ++i) {
				var tabs = windows[i].tabs;
				var length = tabs.length;
				for (j = 0; j < length; ++j) {
					chrome.tabs.executeScript(tabs[j].id, script);
				}
			}
		});

		addDomain(result[1]);
	} else {
		chrome.tabs.executeScript(null, script);
	}

	chrome.browserAction.setIcon({
		path: 'icon19.png',
		tabId: tab.id
	});
});