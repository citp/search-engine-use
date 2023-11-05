const millisecondsPerDay = 1000 * 3600 * 24;

let prolificIdEntered = false;
let historyDataEntered = false;

function getQueryVariable(url, parameter) {
    const urlObject = new URL(url);
    return urlObject.searchParams.get(parameter);
}

function updateSubmitButton() {
    if(prolificIdEntered && historyDataEntered) {
        document.getElementById('submitButton').disabled = false;
    } else {
        document.getElementById('submitButton').disabled = true;
    }
}

document.getElementById('continueButton').onclick = () => {
    document.getElementById('infoSection').style.display = 'none';
    document.getElementById('formSection').style.display = 'block';
};

document.getElementById('submitButton').onclick = () => {
    document.getElementById('formSection').style.display = 'none';
    document.getElementById('thankYouSection').style.display = 'block';
};

document.getElementById("copyExtensionUrlButton").onclick = () => {
    navigator.clipboard.writeText(document.getElementById('extensionUrlTextField').value);
    document.getElementById('tooltip').innerHTML = 'Copied!';
};

document.getElementById("copyExtensionUrlButton").onmouseout = () => {
    document.getElementById('tooltip').innerHTML = 'Copy to clipboard';
};

document.getElementById("prolificIdInput").onkeyup = (event) => {
    prolificIdEntered = !!event.target.value;
    updateSubmitButton();
};

const searchEnginesMetadata = {
    Google: function (url) {
        return url.match(/(?:^(?:https?):\/\/(?:www\.)?google\.com(?::[0-9]+)?\/search(?:\/\?|\?))/i);
    },
    DuckDuckGo: function (url) {
        if(url.match(/(?:^(?:https?):\/\/(?:www\.)?duckduckgo\.com)/i)) {
            return !!getQueryVariable(url, "q");
        }
        return false;
    },
    Bing: function (url) {
        return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?bing\.com(?::[0-9]+)?\/search(?:\/\?|\?))/i);
    },
    Yahoo: function (url) {
        return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?search\.yahoo\.com(?::[0-9]+)?\/search(?:\/\?|\?|\/;_ylt|;_ylt))/i);
    },
    Ecosia: function (url) {
        return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?ecosia\.org(?::[0-9]+)?\/search(?:\/\?|\?))/i);
    },
    Ask: function (url) {
        return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?ask\.com(?::[0-9]+)?\/web(?:\/\?|\?))/i);
    },
    Baidu: function (url) {
        return url.match(/(?:^(?:https?):\/\/(?:www\.)?baidu\.com(?::[0-9]+)?\/s(?:\/\?|\?))/i);
    },
    Brave: function (url) {
        return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?search\.brave\.com(?::[0-9]+)?\/search(?:\/\?|\?))/i);
    },
}

function roundToNearestHour(timestamp) {
    let date = new Date(timestamp);

    // Get the minutes
    let minutes = date.getMinutes();

    // Clear the minutes and seconds (and milliseconds)
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    // Determine whether to round up or down
    if(minutes > 30) {
        date.setHours(date.getHours() + 1);
    }

    return date.getTime();
}

if(window.FileList && window.File) {
    document.getElementById('fileInput').addEventListener('change', event => {
        const file = event.target.files[ 0 ];

        document.getElementById("fileName").innerHTML = file.name;

        // Ensure file name is history.json?
        // Might cause issues if they are downloading to same directory on second try
        // if(file.name != 'history.json') {

        // }

        const reader = new FileReader();

        reader.onload = function (event) {
            const historyJson = JSON.parse(event.target.result);

            const searchUseData = [];
            for(let historyItem of historyJson) {
                for(let searchEngine in searchEnginesMetadata) {
                    if(searchEnginesMetadata[ searchEngine ](historyItem.url)) {
                        searchUseData.push(
                            {
                                searchEngine: searchEngine,
                                timestamp: roundToNearestHour(historyItem.visitTime),
                                transition: historyItem.transition,
                            }
                        );
                    }
                }
            }

            const browserUseData = [];
            for(let daysBack = 0; daysBack < 30; daysBack++) {
                const filteredHistoryForDay = historyJson.filter((historyItem) =>
                    Math.floor((Date.now() - historyItem.visitTime) / millisecondsPerDay) == daysBack
                );

                browserUseData.push(
                    {
                        numDaysBack: daysBack,
                        numWebpages: filteredHistoryForDay.length,
                        numUniqueWebpages:
                            [ ...new Set(filteredHistoryForDay.map(historyItem => historyItem.url.split("#")[ 0 ])) ].length,
                        numDomains: 0,
                        numUniqueDomains:
                            [ ...new Set(filteredHistoryForDay.map(historyItem => (new URL(historyItem.url)).hostname)) ].length,
                    }
                );
            }

            const outputData = {
                currentTime: roundToNearestHour(Date.now()),
                timezoneOffset: new Date().getTimezoneOffset(),
                searchUseData: searchUseData,
                browserUseData: browserUseData,
            }

            console.log(outputData)

            document.getElementById('dataVisual').innerHTML = JSON.stringify(outputData, null, 2);

            historyDataEntered = true;
            updateSubmitButton();
        }

        reader.readAsText(file);
    });
}
