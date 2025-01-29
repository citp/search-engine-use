const millisecondsPerDay = 1000 * 3600 * 24;

let historyDataEntered = false;

let outputData = {};

const changedDefault = (new URLSearchParams(window.location.search)).get('CHANGED_DEFAULT');

let changedDefaultKey = changedDefault;
if (changedDefaultKey == "Ask.com") {
    changedDefaultKey = "Ask";
} else if (changedDefaultKey == "Yahoo!") {
    changedDefaultKey = "Yahoo";
}

window.addEventListener('pageshow', function (event) {
    document.getElementById('fileInput').value = '';
});

function unescapeCSV(csvLine) {
    let fields = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < csvLine.length; i++) {
        const char = csvLine[i];

        if (char === '"') {
            if (inQuotes && csvLine[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(field);
            field = '';
        } else {
            field += char;
        }
    }

    fields.push(field); // Add the last field

    return fields.map(f => f.startsWith('"') && f.endsWith('"') ? f.slice(1, -1).trim() : f.trim());
}

function csvToArrayOfObjects(csvData) {
    let lines = csvData.split("\n").filter(line => line.trim() !== '');
    let headers = unescapeCSV(lines[0]);
    let result = lines.slice(1).map(line => {
        let obj = {};
        let values = unescapeCSV(line);

        headers.forEach((header, index) => {
            obj[header] = values[index];
        });

        return obj;
    });

    return result;
}


function getQueryVariable(url, parameter) {
    const urlObject = new URL(url);
    return urlObject.searchParams.get(parameter);
}

document.getElementById('continueButton').onclick = () => {
    document.getElementById('infoSection').style.display = 'none';
    document.getElementById('formSection').style.display = 'block';
};

document.getElementById('submitButton').onclick = async (event) => {
    event.target.classList.add("is-loading");
    const url = "https://q5mrwzyq1e.execute-api.us-east-2.amazonaws.com/deployed";

    const postBodyJson = {
        prolificId: (new URLSearchParams(window.location.search)).get("PROLIFIC_PID"),
        studyPhase: document.querySelector('meta[name="studyPhase"]').getAttribute('data-value'),
        historyData: outputData,
    }

    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postBodyJson)
    })
        .then(response => {
            if (response.ok) {
                return response.json()
            } else {
                throw new Error();
            }
        })
        .then(data => {
            if (data.statusCode == 200) {
                document.getElementById('formSection').style.display = 'none';
                document.getElementById('thankYouSection').style.display = 'block';

                const studyPhase = document.querySelector('meta[name="studyPhase"]').getAttribute('data-value');

                if (studyPhase == "initial") {
                    window.open("https://app.prolific.com/submissions/complete?cc=C58MQPWX", '_blank');
                } else {
                    window.open("https://app.prolific.com/submissions/complete?cc=C1JEBN0S", '_blank');
                }
            } else {
                throw new Error();
            }

        }).catch(() => {
            document.getElementById('submit-error').classList.add("error-message", "is-active");
        });

    event.target.classList.remove("is-loading")
};

document.getElementById("copyExtensionUrlButton").onclick = () => {
    navigator.clipboard.writeText(document.getElementById('extensionUrlTextField').value);
    document.getElementById('tooltip').innerHTML = 'Copied!';
};

document.getElementById("copyExtensionUrlButton").onmouseout = () => {
    document.getElementById('tooltip').innerHTML = 'Copy to clipboard';
};

const searchEnginesMetadata = {
    Google: {
        getIsSerpPage: function (url) {
            return url.match(/(?:^(?:https?):\/\/(?:www\.)?google\.com(?::[0-9]+)?\/search(?:\/\?|\?))/i);
        },
        searchQueryParameters: ["q", "query"],
    },
    DuckDuckGo: {
        getIsSerpPage: function (url) {
            if (url.match(/(?:^(?:https?):\/\/(?:www\.)?duckduckgo\.com)/i)) {
                return !!getQueryVariable(url, "q");
            }
            return false;
        },
        searchQueryParameters: ["q"],
    },
    Bing: {
        getIsSerpPage: function (url) {
            return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?bing\.com(?::[0-9]+)?\/search(?:\/\?|\?))/i);
        },
        searchQueryParameters: ["q"],
    },
    Yahoo: {
        getIsSerpPage: function (url) {
            return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?search\.yahoo\.com(?::[0-9]+)?\/search(?:\/\?|\?|\/;_ylt|;_ylt))/i);
        },
        searchQueryParameters: ["p", "q", "query"],
    },
    Ecosia: {
        getIsSerpPage: function (url) {
            return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?ecosia\.org(?::[0-9]+)?\/search(?:\/\?|\?))/i);
        },
        searchQueryParameters: ["q"],
    },
    Ask: {
        getIsSerpPage: function (url) {
            return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?ask\.com(?::[0-9]+)?\/web(?:\/\?|\?))/i);
        },
        searchQueryParameters: ["q", "query"],
    },
    Baidu: {
        getIsSerpPage: function (url) {
            return url.match(/(?:^(?:https?):\/\/(?:www\.)?baidu\.com(?::[0-9]+)?\/s(?:\/\?|\?))/i);
        },
        searchQueryParameters: ["wd", "word"],
    },
    Brave: {
        getIsSerpPage: function (url) {
            return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?search\.brave\.com(?::[0-9]+)?\/search(?:\/\?|\?))/i);
        },
        searchQueryParameters: ["q"],
    },
}

function getSerpQuery(url, engine) {
    try {
        if (!url || !engine) {
            return null;
        }

        // Get the possible search query parameters for the engine.
        const searchQueryParameters = searchEnginesMetadata[engine].searchQueryParameters;

        // If any of the search query parameters are in the URL, return the query.
        for (const parameter of searchQueryParameters) {
            const query = getQueryVariable(url, parameter);
            if (query) {
                return query;
            }
        }

        // For DuckDuckGo, the search parameter can be specified in the pathname.
        // eg. https://duckduckgo.com/Example?ia=web
        if (engine === "DuckDuckGo") {
            const pathname = (new URL(url)).pathname
            const pathnameSplit = pathname.split("/")
            if (pathnameSplit.length === 2 && pathnameSplit[1]) {
                const query = decodeURIComponent(pathnameSplit[1].replace(/_/g, " "))
                if (query) {
                    return query;
                }
            }
        }
        return "";
    } catch (error) {
        return null;
    }

}

document.getElementById('fileInput').addEventListener('change', event => {
    const file = event.target.files[0];
    document.getElementById("fileName").innerHTML = file.name;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            document.getElementById("file-error-message").classList.remove("is-active");
            document.getElementById("fileInputDiv").classList.remove("is-danger");

            let historyArray = null;

            const studyPhase = document.querySelector('meta[name="studyPhase"]').getAttribute('data-value');
            historyArray = JSON.parse(event.target.result);

            historyArray.forEach(obj => {
                obj.visitTime = Math.floor(obj.visitTime / 1000) * 1000;
            });

            if (studyPhase == "initial") {
                const daysBetweenFirstAndLastHistoryItem = (historyArray[0].visitTime - historyArray[historyArray.length - 1].visitTime) / millisecondsPerDay;
                if (daysBetweenFirstAndLastHistoryItem < 10) {
                    window.location.href = "https://app.prolific.com/submissions/complete?cc=C12WFWOM";
                    return;
                }

                // Check if the participant conducted the test of their changed default
                const filteredHistoryForCheckingTest = historyArray.filter((historyItem) =>
                    (Date.now() - historyItem.visitTime) / (1000 * 60) <= 15
                );

                let userConductedTest = false;
                for (let historyItem of filteredHistoryForCheckingTest) {
                    if (searchEnginesMetadata[changedDefaultKey].getIsSerpPage(historyItem.url) &&
                        historyItem.transition == "generated") {
                        userConductedTest = true;
                    }
                }

                if (!userConductedTest) {
                    historyDataEntered = false;
                    document.getElementById('submitButton').disabled = true;

                    document.getElementById("fileInputDiv").classList.add("is-danger");
                    document.getElementById('dataVisual').innerHTML = ""
                    return;
                }
            }

            const searchUseData = [];

            const queryToIdMap = new Map();
            let idCounter = 0;

            const filteredHistoryForPeriod = historyArray.filter((historyItem) =>
                (Date.now() - historyItem.visitTime) / millisecondsPerDay <= 30
            );

            // Dict to convert visitCount to which visit a history entry is for a URL
            // If a URL was visited 3 times, the visitCount is 3 for all instances
            const realVisitCounts = {};

            for (let historyItem of filteredHistoryForPeriod) {
                for (let searchEngine in searchEnginesMetadata) {
                    if (searchEnginesMetadata[searchEngine].getIsSerpPage(historyItem.url)) {

                        let queryId = -1;
                        try {
                            const query = getSerpQuery(historyItem.url, searchEngine);
                            if (query == null) {
                                queryId = -1;
                            } else {
                                if (!queryToIdMap.has(query)) {
                                    queryToIdMap.set(query, idCounter++);
                                }
                                queryId = queryToIdMap.get(query)
                            }
                        } catch (error) {
                            queryId = -1;
                        }

                        const queryParameterKeys = (() => {
                            try {
                                return Array.from(new URL(historyItem.url).searchParams.keys());
                            } catch {
                                return [];
                            }
                        })();






                        if (!(historyItem.url in realVisitCounts)) {
                            realVisitCounts[historyItem.url] = historyItem.visitCount;
                        }

                        const previouslyConductedSearch = (() => {
                            try {
                                if (historyItem.transition == "reload") {
                                    return true;
                                } else {
                                    return realVisitCounts[historyItem.url] > 1;
                                }
                            } catch {
                                return false;
                            }
                        })();

                        if (historyItem.transition != "reload") {
                            realVisitCounts[historyItem.url] -= 1;
                        }




                        searchUseData.push(
                            {
                                searchEngine: searchEngine,
                                timestamp: historyItem.visitTime,
                                transition: historyItem.transition,
                                queryId: queryId,
                                previouslyConductedSearch,
                                queryParameterKeys,
                                isLocal: historyItem.isLocal,
                            }
                        );
                    }
                }
            }

            const browserUseData = [];
            for (let daysBack = 0; daysBack < 30; daysBack++) {
                const filteredHistoryForDay = historyArray.filter((historyItem) =>
                    Math.floor((Date.now() - historyItem.visitTime) / millisecondsPerDay) == daysBack
                );

                browserUseData.push(
                    {
                        numDaysBack: daysBack,
                        numWebpages: filteredHistoryForDay.length,
                        numUniqueWebpagesWithoutFragmentIdentifiers:
                            [...new Set(filteredHistoryForDay.map(historyItem => historyItem.url.split("#")[0]))].length,
                        numUniqueWebpagesWithoutQueryParameters:
                            [...new Set(filteredHistoryForDay.map(historyItem => historyItem.url.split("?")[0]))].length,
                        numUniqueDomains:
                            [...new Set(filteredHistoryForDay.map(historyItem => (new URL(historyItem.url)).hostname.split('.').slice(-2).join('.')))].length,
                        numUniqueAbsoluteDomains:
                            [...new Set(filteredHistoryForDay.map(historyItem => (new URL(historyItem.url)).hostname))].length,
                    }
                );
            }

            outputData = {
                currentTime: Date.now(),
                timezoneOffset: new Date().getTimezoneOffset(),
                searchUseData: searchUseData,
                browserUseData: browserUseData,
            }

            document.getElementById('dataVisual').innerHTML = JSON.stringify(outputData, null, 2);

            historyDataEntered = true;
        }
        catch (error) {
            historyDataEntered = false;
            document.getElementById("file-error-message").classList.add("is-active");
            document.getElementById("fileInputDiv").classList.add("is-danger");

            document.getElementById('dataVisual').innerHTML = ""
        }

        if (historyDataEntered) {
            document.getElementById('submitButton').disabled = false;
        } else {
            document.getElementById('submitButton').disabled = true;
        }
    }
    reader.readAsText(file);
});
