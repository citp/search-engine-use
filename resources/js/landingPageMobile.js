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
const originalDefault = (new URLSearchParams(window.location.search)).get("ORIGINAL_DEFAULT");

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
                if (treatmentCondition >= 12 && treatmentCondition <= 15) {
                    window.location.href = `http://search-engine-use.cs.princeton.edu/shortcut?PROLIFIC_PID=${prolificId}&ORIGINAL_DEFAULT=${originalDefault}&TC=${treatmentCondition}`;
                } else {
                    window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_9RfCPe3l0Zxl30O?PROLIFIC_PID=${prolificId}`;
                }
            } else {
                throw new Error();
            }
        }).catch(() => {
            document.getElementById('submit-error').classList.add("is-active");
        });

    event.target.classList.remove("is-loading")
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

document.getElementById('fileInput').addEventListener('change', async event => {
    try {
        const file = event.target.files[0];
        document.getElementById("fileName").innerHTML = file.name;

        document.getElementById("file-error-message").classList.remove("is-active");
        document.getElementById("file-error-message-special").classList.remove("is-active");
        document.getElementById("fileInputDiv").classList.remove("is-danger");

        const zipFile = await JSZip.loadAsync(file);

        let jsonFiles = [];
        // Loop through all files in the zip
        for (const fileName of Object.keys(zipFile.files)) {
            if (fileName.includes("History") && fileName.endsWith(".json")) {
                const fileData = await zipFile.file(fileName).async("string");
                try {
                    const json = JSON.parse(fileData);
                    jsonFiles.push(json);
                } catch (err) {
                }
            }
        }

        const historyArray = jsonFiles.flatMap(file =>
            file.history.map(entry => ({
                ...entry,
                visitTime: Math.floor(entry.time_usec / 1000) // convert µs → ms
            }))
        ).sort((a, b) => b.visitTime - a.visitTime);

        // In the initial phase, reject if less than 10 days of history
        if (studyPhase == "initial") {
            const daysBetweenFirstAndLastHistoryItem = (historyArray[0].visitTime - historyArray[historyArray.length - 1].visitTime) / millisecondsPerDay;
            if (daysBetweenFirstAndLastHistoryItem < 10) {
                window.location.href = "https://app.prolific.com/submissions/complete?cc=C1OIROZ1";
                return;
            }
        }

        // Check if the participant conducted the test of their changed default.
        if (studyPhase == "initial" && ((treatmentCondition >= 8 && treatmentCondition <= 11))) {
            const filteredHistoryForCheckingTest = historyArray.filter((historyItem) =>
                ((Date.now() - historyItem.visitTime) / (1000 * 60) <= 15)
            );

            if (filteredHistoryForCheckingTest.length < 1) {
                historyDataEntered = false;
                document.getElementById('submitButton').disabled = true;

                document.getElementById("file-error-message-special").innerHTML = `We were not able to confirm that you have tried out ${changedDefault}. Please run a web search in a new tab using the Safari address bar. You may use any search query that you choose. This search should run with ${changedDefault}. If your search still runs with a search engine that is different from ${changedDefault}, please return to your iPhone's settings <b>(Settings <img src="../resources/images/Apple settings logo.png" alt="" style="height: 1em !important; width: 1em !important;"> > Search > Search Engine)</b>, confirm that the default search engine is set to ${changedDefault}, and then in a new tab run another search from the Safari address bar. Once complete, repeat the steps above to generate an updated ZIP file and upload the newly generated file.`
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

            searchUseData.push(
                {
                    searchEngine: searchEngine,
                    timestamp: historyItem.visitTime,
                    transition: "unknown",
                    queryId: queryId,
                    previousSearchCount: historyItem.visit_count,
                    queryParameters,
                    serpOriginPageVisits: [],
                }
            );


        }

        const browserUseData = [];
        for (let daysBack = 0; daysBack < 30; daysBack++) {
            const filteredHistoryForDay = historyArray.filter((historyItem) =>
                Math.floor((Date.now() - historyItem.visitTime) / millisecondsPerDay) == daysBack
            );

            const visitsWebpages = filteredHistoryForDay.map(webpage => webpage.visit_count)

            const visitsUniqueWebpagesWithoutFragmentIdentifiers = Array.from(
                filteredHistoryForDay.reduce((map, entry) => {
                    const baseUrlObject = new URL(entry.url);
                    baseUrlObject.hash = "";
                    const baseUrl = baseUrlObject.toString(); // strip fragment
                    map.set(baseUrl, (map.get(baseUrl) || 0) + entry.visit_count);
                    return map;
                }, new Map()).values()
            );

            const visitsUniqueWebpagesWithoutQueryParameters = Array.from(
                filteredHistoryForDay.reduce((map, entry) => {
                    const baseUrlObject = new URL(entry.url);
                    const baseUrl = baseUrlObject.origin + baseUrlObject.pathname; // strip query parameters
                    map.set(baseUrl, (map.get(baseUrl) || 0) + entry.visit_count);
                    return map;
                }, new Map()).values()
            );

            const visitsUniqueDomains = Array.from(
                filteredHistoryForDay.reduce((map, entry) => {
                    const baseUrlObject = new URL(entry.url);
                    const baseUrl = baseUrlObject.hostname.split('.').slice(-2).join('.'); // get domain
                    map.set(baseUrl, (map.get(baseUrl) || 0) + entry.visit_count);
                    return map;
                }, new Map()).values()
            );

            const visitsUniqueAbsoluteDomains = Array.from(
                filteredHistoryForDay.reduce((map, entry) => {
                    const baseUrlObject = new URL(entry.url);
                    const baseUrl = baseUrlObject.hostname; // get absolute domain
                    map.set(baseUrl, (map.get(baseUrl) || 0) + entry.visit_count);
                    return map;
                }, new Map()).values()
            );

            browserUseData.push(
                {
                    numDaysBack: daysBack,
                    visitsWebpages,
                    visitsUniqueWebpagesWithoutFragmentIdentifiers,
                    visitsUniqueWebpagesWithoutQueryParameters,
                    visitsUniqueDomains,
                    visitsUniqueAbsoluteDomains,
                }
            );
        }

        outputData = {
            currentTime: Date.now(),
            timezoneOffset: new Date().getTimezoneOffset(),
            browserVersion: jsonFiles[0]?.metadata?.browser_version || null,
            historyDataExportTime: jsonFiles[0]?.metadata?.export_time_usec ?
                Math.floor(jsonFiles[0]?.metadata?.export_time_usec / 1000) : null,
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
});
