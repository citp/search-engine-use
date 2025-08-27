async function detectAdBlock() {
    let adBlockEnabled = false
    const googleAdUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
    try {
        await fetch(new Request(googleAdUrl)).catch(_ => adBlockEnabled = true)
    } catch (e) {
        adBlockEnabled = true;
    } finally {
        return adBlockEnabled;
    }
}


const millisecondsPerDay = 1000 * 3600 * 24;

let historyDataEntered = false;

let outputData = {};

const changedDefault = (new URLSearchParams(window.location.search)).get('CHANGED_DEFAULT');
const prolificId = (new URLSearchParams(window.location.search)).get("PROLIFIC_PID");
const studyPhase = (new URLSearchParams(window.location.search)).get("STUDY_PHASE");
const treatmentCondition = parseInt((new URLSearchParams(window.location.search)).get("TC"), 10);

const queryKeys = new Set(["q", "query", "p", "wd", "word"]);

let changedDefaultKey = changedDefault;
if (changedDefaultKey == "Ask.com") {
    changedDefaultKey = "Ask";
} else if (changedDefaultKey == "Yahoo!") {
    changedDefaultKey = "Yahoo";
}

window.addEventListener('pageshow', function (event) {
    document.getElementById('fileInput').value = '';
});

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
    document.getElementById('submit-error').classList.remove("is-active");

    const url = "https://q5mrwzyq1e.execute-api.us-east-2.amazonaws.com/deployed";

    const postBodyJson = {
        prolificId: prolificId,
        studyPhase: studyPhase,
        treatmentCondition: treatmentCondition,
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
                window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_23rpQ1POFvbm7RQ?PROLIFIC_PID=${prolificId}`;
            } else {
                throw new Error();
            }
        }).catch(() => {
            document.getElementById('submit-error').classList.add("is-active");
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
    reader.onload = async function (event) {
        try {
            document.getElementById("file-error-message").classList.remove("is-active");
            document.getElementById("file-error-message-special").classList.remove("is-active");
            document.getElementById("fileInputDiv").classList.remove("is-danger");

            let historyArray = null;

            historyArray = JSON.parse(event.target.result);

            // In the initial phase, reject if less than 10 days of history
            if (studyPhase == "initial") {
                const daysBetweenFirstAndLastHistoryItem = (historyArray[0].visitTime - historyArray[historyArray.length - 1].visitTime) / millisecondsPerDay;
                if (daysBetweenFirstAndLastHistoryItem < 10) {
                    window.location.href = "https://app.prolific.com/submissions/complete?cc=C1OIROZ1";
                    return;
                }
            }

            // Check if the participant conducted the test of their changed default.
            if (studyPhase == "initial" && ((treatmentCondition >= 2 && treatmentCondition <= 6))) {
                const filteredHistoryForCheckingTest = historyArray.filter((historyItem) =>
                    ((Date.now() - historyItem.visitTime) / (1000 * 60) <= 15) &&
                    (searchEnginesMetadata[changedDefaultKey].getIsSerpPage(historyItem.url)) &&
                    (historyItem.transition == "generated")
                );

                let userConductedTest = false;
                if (treatmentCondition == 6) {
                    userConductedTest = filteredHistoryForCheckingTest.length >= 2;
                } else {
                    userConductedTest = filteredHistoryForCheckingTest.length >= 1;
                }

                if (!userConductedTest) {
                    historyDataEntered = false;
                    document.getElementById('submitButton').disabled = true;

                    if (treatmentCondition == 6) {

                        const userAgent = navigator.userAgent;

                        let ddgInstallLink = "";
                        if ((/edg/i).test(userAgent)) {
                            ddgInstallLink = "https://microsoftedge.microsoft.com/addons/detail/duckduckgo-search-track/caoacbimdbbljakfhgikoodekdnlcgpk";
                        } else {
                            ddgInstallLink = "https://chromewebstore.google.com/detail/duckduckgo-search-tracker/bkdgflcldnnnapblkhphbgpggdiikppg";
                        }
                        document.getElementById("file-error-message-special").innerHTML = `We were not able to confirm that you have installed and activated the DuckDuckGo Search & Tracker Protection web browser extension. Please run two different web searches in a new tab using your web browser's address bar. You may use any search queries that you choose. These searches should run with DuckDuckGo. If either of the searches runs with a search engine that is different from DuckDuckGo, please ensure that the DuckDuckGo Privacy Essentials extension is installed and activated. You can install the extension by clicking <a href="${ddgInstallLink}" target="_blank">here</a>. After installation, return to your web browser's settings, confirm that the extension is toggled on, and then run another two searches from the address bar. Once complete, repeat the steps above to generate an updated JSON file and upload the newly generated file.`

                    } else {
                        document.getElementById("file-error-message-special").innerText = `We were not able to confirm that you have tried out ${changedDefault}. Please run a web search in a new tab using your web browser's address bar. You may use any search query that you choose. This search should run with ${changedDefault}. If your search still runs with a search engine that is different from ${changedDefault}, please return to your web browser's settings, confirm that the default search engine is set to ${changedDefault}, and then in a new tab run another search from your web browser's address bar. Once complete, repeat the steps above to generate an updated JSON file and upload the newly generated file.`
                    }
                    document.getElementById("file-error-message-special").classList.add("is-active");

                    document.getElementById("fileInputDiv").classList.add("is-danger");
                    document.getElementById('dataVisual').innerHTML = ""
                    return;
                }
            }

            if (studyPhase != "initial") {
                const daysSinceMostRecentHistoryEntry = (Date.now() - historyArray[0].visitTime) / millisecondsPerDay;
                if (daysSinceMostRecentHistoryEntry > 10) {
                    historyDataEntered = false;
                    document.getElementById('submitButton').disabled = true;

                    document.getElementById("file-error-message-special").innerText = "It appears you are attempting to upload a version of the history.json file that you downloaded previously. Please ensure you are submitting the most recent version of the history.json file, which you just downloaded."
                    document.getElementById("file-error-message-special").classList.add("is-active");

                    document.getElementById("fileInputDiv").classList.add("is-danger");
                    document.getElementById('dataVisual').innerHTML = ""
                    return;
                }
            }

            const searchUseData = [];

            const queryToIdMap = new Map();
            let nextQueryId = 0;

            const filteredHistoryForPeriod = historyArray.filter((historyItem) =>
                (Date.now() - historyItem.visitTime) / millisecondsPerDay <= 30
            );

            // Dict to convert visitCount to which visit a history entry is for a URL
            // If a URL was visited 3 times, the visitCount is 3 for all instances
            const realVisitCounts = {};

            for (let historyItem of filteredHistoryForPeriod) {
                const [searchEngine, _] =
                    Object.entries(searchEnginesMetadata).find(([_, engine]) =>
                        engine.getIsSerpPage(historyItem.url)
                    ) || [];

                if (!searchEngine) {
                    continue;
                }

                let queryId = -1;
                try {
                    const query = getSerpQuery(historyItem.url, searchEngine);
                    if (query != null) {
                        if (!queryToIdMap.has(query)) {
                            queryToIdMap.set(query, nextQueryId++);
                        }
                        queryId = queryToIdMap.get(query);
                    }
                } catch (error) {
                    queryId = -1;
                }

                const queryParameters = (() => {
                    try {
                        const url = new URL(historyItem.url);
                        const params = new URLSearchParams(url.search);

                        const query = getSerpQuery(historyItem.url, searchEngine);

                        const result = [];
                        for (const [key, value] of params.entries()) {
                            if (value == query || queryKeys.has(key)) {
                                result.push([key, "search-study-hidden"]);
                            } else {
                                result.push([key, value]);
                            }
                        }

                        return result;
                    } catch {
                        return [];
                    }
                })();


                if (!(historyItem.url in realVisitCounts)) {
                    realVisitCounts[historyItem.url] = historyItem.visitCount;
                }

                const previousSearchCount = (() => {
                    try {
                        if (historyItem.transition != "reload") {
                            realVisitCounts[historyItem.url] -= 1;
                        }
                        return realVisitCounts[historyItem.url];
                    } catch {
                        return -1;
                    }
                })();

                searchUseData.push(
                    {
                        searchEngine: searchEngine,
                        timestamp: historyItem.visitTime,
                        transition: historyItem.transition,
                        queryId: queryId,
                        previousSearchCount,
                        queryParameters,
                        isLocal: historyItem.isLocal,
                    }
                );
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
                            [...new Set(filteredHistoryForDay.map(historyItem => historyItem.url.split("?")[0].split("#")[0]))].length,
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
                hasAdBlock: await detectAdBlock()
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
