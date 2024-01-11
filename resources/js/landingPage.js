const millisecondsPerDay = 1000 * 3600 * 24;

let prolificIdEntered = false;
let historyDataEntered = false;

let outputData = {};

const prolificIdInputField = document.getElementById("prolificIdInput");

function isValidProlificID(text) {
    const matches = text.match(/[A-Za-z0-9]/g);
    return matches ? matches.length == 24 : false;
}

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

document.getElementById('submitButton').onclick = async (event) => {
    event.target.classList.add("is-loading");
    const url = "https://q5mrwzyq1e.execute-api.us-east-2.amazonaws.com/deployed";

    const postBodyJson = {
        prolificId: document.getElementById("prolificIdInput").value.match(/[A-Za-z0-9]/g).join(""),
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
            if(response.ok) {
                return response.json()
            } else {
                throw new Error();
            }
        })
        .then(data => {
            if(data.statusCode == 200) {
                document.getElementById('formSection').style.display = 'none';
                document.getElementById('thankYouSection').style.display = 'block';

                const studyPhase = document.querySelector('meta[name="studyPhase"]').getAttribute('data-value');

                if(studyPhase == "initial") {
                    window.open("https://app.prolific.com/submissions/complete?cc=CYX953F7", '_blank');
                } else {
                    // Update with redirect completion for followup task in Prolific
                    window.open("https://app.prolific.com/submissions/complete?cc=CIZ8YPGD", '_blank');
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

prolificIdInput.onkeyup = (event) => {
    prolificIdEntered = isValidProlificID(event.target.value);
    updateSubmitButton();
};

const searchEnginesMetadata = {
    Google: {
        getIsSerpPage: function (url) {
            return url.match(/(?:^(?:https?):\/\/(?:www\.)?google\.com(?::[0-9]+)?\/search(?:\/\?|\?))/i);
        },
        searchQueryParameters: [ "q", "query" ],
    },
    DuckDuckGo: {
        getIsSerpPage: function (url) {
            if(url.match(/(?:^(?:https?):\/\/(?:www\.)?duckduckgo\.com)/i)) {
                return !!getQueryVariable(url, "q");
            }
            return false;
        },
        searchQueryParameters: [ "q" ],
    },
    Bing: {
        getIsSerpPage: function (url) {
            return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?bing\.com(?::[0-9]+)?\/search(?:\/\?|\?))/i);
        },
        searchQueryParameters: [ "q" ],
    },
    Yahoo: {
        getIsSerpPage: function (url) {
            return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?search\.yahoo\.com(?::[0-9]+)?\/search(?:\/\?|\?|\/;_ylt|;_ylt))/i);
        },
        searchQueryParameters: [ "p", "q", "query" ],
    },
    Ecosia: {
        getIsSerpPage: function (url) {
            return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?ecosia\.org(?::[0-9]+)?\/search(?:\/\?|\?))/i);
        },
        searchQueryParameters: [ "q" ],
    },
    Ask: {
        getIsSerpPage: function (url) {
            return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?ask\.com(?::[0-9]+)?\/web(?:\/\?|\?))/i);
        },
        searchQueryParameters: [ "q", "query" ],
    },
    Baidu: {
        getIsSerpPage: function (url) {
            return url.match(/(?:^(?:https?):\/\/(?:www\.)?baidu\.com(?::[0-9]+)?\/s(?:\/\?|\?))/i);
        },
        searchQueryParameters: [ "wd", "word" ],
    },
    Brave: {
        getIsSerpPage: function (url) {
            return !!url.match(/(?:^(?:https?):\/\/(?:www\.)?search\.brave\.com(?::[0-9]+)?\/search(?:\/\?|\?))/i);
        },
        searchQueryParameters: [ "q" ],
    },
}

function getSerpQuery(url, engine) {
    try {
        if(!url || !engine) {
            return null;
        }

        // Get the possible search query parameters for the engine.
        const searchQueryParameters = searchEnginesMetadata[ engine ].searchQueryParameters;

        // If any of the search query parameters are in the URL, return the query.
        for(const parameter of searchQueryParameters) {
            const query = getQueryVariable(url, parameter);
            if(query) {
                return query;
            }
        }

        // For DuckDuckGo, the search parameter can be specified in the pathname.
        // eg. https://duckduckgo.com/Example?ia=web
        if(engine === "DuckDuckGo") {
            const pathname = (new URL(url)).pathname
            const pathnameSplit = pathname.split("/")
            if(pathnameSplit.length === 2 && pathnameSplit[ 1 ]) {
                const query = decodeURIComponent(pathnameSplit[ 1 ].replace(/_/g, " "))
                if(query) {
                    return query;
                }
            }
        }
        return "";
    } catch(error) {
        return null;
    }

}

document.getElementById('fileInput').addEventListener('change', event => {
    const file = event.target.files[ 0 ];
    document.getElementById("fileName").innerHTML = file.name;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const historyJson = JSON.parse(event.target.result);

            const firstHistoryEntry = historyJson[ 0 ];
            if(!("url" in firstHistoryEntry && "visitTime" in firstHistoryEntry && "transition" in firstHistoryEntry)) {
                historyDataEntered = false;
                document.getElementById("file-error-message").classList.add("is-active");
                document.getElementById("fileInputDiv").classList.add("is-danger");
            } else {
                document.getElementById("file-error-message").classList.remove("is-active");
                document.getElementById("fileInputDiv").classList.remove("is-danger");

                const searchUseData = [];

                const queryToIdMap = new Map();
                let idCounter = 0;

                const filteredHistoryForPeriod = historyJson.filter((historyItem) =>
                    (Date.now() - historyItem.visitTime) / millisecondsPerDay <= 30
                );
                for(let historyItem of filteredHistoryForPeriod) {
                    for(let searchEngine in searchEnginesMetadata) {
                        if(searchEnginesMetadata[ searchEngine ].getIsSerpPage(historyItem.url)) {

                            let queryId = -1;
                            try {
                                const query = getSerpQuery(historyItem.url, searchEngine);
                                if(query == null) {
                                    queryId = -1;
                                } else {
                                    if(!queryToIdMap.has(query)) {
                                        queryToIdMap.set(query, idCounter++);
                                    }
                                    queryId = queryToIdMap.get(query)
                                }
                            } catch(error) {
                                queryId = -1;
                            }

                            searchUseData.push(
                                {
                                    searchEngine: searchEngine,
                                    timestamp: historyItem.visitTime,
                                    transition: historyItem.transition,
                                    queryId: queryId,
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
                            numUniqueWebpagesWithoutFragmentIdentifiers:
                                [ ...new Set(filteredHistoryForDay.map(historyItem => historyItem.url.split("#")[ 0 ])) ].length,
                            numUniqueWebpagesWithoutQueryParameters:
                                [ ...new Set(filteredHistoryForDay.map(historyItem => historyItem.url.split("?")[ 0 ])) ].length,
                            numUniqueDomains:
                                [ ...new Set(filteredHistoryForDay.map(historyItem => (new URL(historyItem.url)).hostname.split('.').slice(-2).join('.'))) ].length,
                            numUniqueAbsoluteDomains:
                                [ ...new Set(filteredHistoryForDay.map(historyItem => (new URL(historyItem.url)).hostname)) ].length,
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
        } catch(error) {
            historyDataEntered = false;
            document.getElementById("file-error-message").classList.add("is-active");
            document.getElementById("fileInputDiv").classList.add("is-danger");
        }
        updateSubmitButton();
    }
    reader.readAsText(file);
});

prolificIdInputField.addEventListener(
    "input",
    function (event) {
        validateInFocus(event.target, event.target.nextElementSibling);
    },
    true
);

prolificIdInputField.addEventListener('blur', function (event) {
    validateOutFocus(event.target, event.target.nextElementSibling);
});

function validateInFocus(element, sibling) {
    element.classList.remove("is-danger");
    sibling.classList.remove("error-message");
    if(element.value == "" || element.value == null) {
        sibling.classList.add("input-assist-message", "is-active");
        element.classList.add("is-warning");
    } else if(!isValidProlificID(element.value)) {
        sibling.classList.add("input-assist-message", "is-active");
        element.classList.add("is-warning");
    } else {
        sibling.classList.remove("is-active");
        element.classList.remove("is-warning");
    }
}

function validateOutFocus(element, sibling) {
    element.classList.remove("is-warning");
    if(element.value == "" || element.value == null) {
        sibling.classList.remove("input-assist-message");
        sibling.classList.add("error-message", "is-active");
        element.classList.add("is-danger");
    } else if(!isValidProlificID(element.value)) {
        sibling.classList.remove("input-assist-message");
        sibling.classList.add("error-message", "is-active");
        element.classList.add("is-danger");
    } else {
        sibling.classList.remove("error-message", "is-active");
        element.classList.remove("is-danger");
    }
}
