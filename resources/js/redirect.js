getBrowserIsChromeOrEdgeDesktop = () => {
    try {
        // User-Agent Client Hints: supported in Chrome and Edge (not Safari/Firefox)
        if (navigator.userAgentData) {
            const { mobile, brands } = navigator.userAgentData;
            const isDesktop = !mobile;
            const isChromeOrEdge = brands.some(({ brand }) =>
                brand == "Google Chrome" || brand == "Microsoft Edge"
            );
            return isDesktop && isChromeOrEdge;
        }
    } catch (error) {
        // fall through to fallback
    }
    return false;
}

function getIOSVersion() {
    const ua = navigator.userAgent;

    // Match iOS pattern
    const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);

    if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        const patch = parseInt(match[3] || 0, 10);

        return { major, minor, patch };
    }
    return null; // Not iOS
}

getBrowserIsSafariMobileVersion = (treatmentCondition) => {
    try {
        const userAgent = navigator.userAgent;

        if (userAgent.match(/iPad/i)) {
            return false;
        }
        if (!!userAgent.match(/CriOS/i) || !!userAgent.match(/Brave/i) || !!userAgent.match(/Ddg/i) || !!userAgent.match(/FxiOS/i) || !!userAgent.match(/EdgiOS/i)) {
            return false;
        }

        if (!!userAgent.match(/WebKit/i) && !!userAgent.match(/iPhone/i)) {
            if (getIOSVersion()['major'] >= 18) {
                if (treatmentCondition >= 12 && getIOSVersion()['minor'] >= 4) {
                    return true;
                }
                if (treatmentCondition < 12 && getIOSVersion()['minor'] >= 2) {
                    return true;
                }
            }
            return false;
        } else {
            return false;
        }

    } catch (error) {
        // Do nothing
    }
    return false;
}

// 'initial' or 'followup'
const studyPhase = (new URLSearchParams(window.location.search)).get("STUDY_PHASE");
const treatmentCondition = parseInt((new URLSearchParams(window.location.search)).get("TC"), 10);
const prolificId = (new URLSearchParams(window.location.search)).get("PROLIFIC_PID");

(async () => {
    try {
        if (studyPhase == "initial") {
            const previousTreatmentCondition = localStorage.getItem("searchEngineUseStudyTreatmentCondition");

            // const alreadyCompletedIdsResponse = await fetch('../resources/data/prolific_ids_already_participated.txt');
            // const alreadyCompletedIdsText = await alreadyCompletedIdsResponse.text();
            // const alreadyCompletedIds = alreadyCompletedIdsText.trim().split("\n");

            // if (alreadyCompletedIds.includes(prolificId)) {
            //     window.location.href = "https://app.prolific.com/submissions/complete?cc=CZQ6R4A5";
            // } else
            if (previousTreatmentCondition &&
                (previousTreatmentCondition != treatmentCondition) &&
                !(treatmentCondition <= 6 && previousTreatmentCondition >= 7)) {
                window.location.href = "https://app.prolific.com/submissions/complete?cc=CZQ6R4A5";
            } else {
                localStorage.setItem("searchEngineUseStudyTreatmentCondition", treatmentCondition);

                if ((treatmentCondition <= 6 && !getBrowserIsChromeOrEdgeDesktop()) || (treatmentCondition >= 7 && !getBrowserIsSafariMobileVersion(treatmentCondition))) {
                    const url = "https://n97rmes9xl.execute-api.us-east-2.amazonaws.com/deployed";
                    await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            "studyPhase": studyPhase,
                            "prolificId": prolificId,
                            "treatmentCondition": treatmentCondition,
                            "studyPhase": studyPhase,
                        })
                    });
                    // Incompatible device return code
                    window.location.href = "https://app.prolific.com/submissions/complete?cc=CZQ6R4A5";
                } else {
                    if (treatmentCondition == 2) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_6zExHRCvSOQ5BOe?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 3) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_1C9a3Izhmj0e1dY?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 4) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_1B6UUgkYR5wDcFg?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 5) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_0kCHNZ75pQGAhvg?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 6) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_0Pd0UczlVVdGRUi?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 7) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_3Xbb1tCAmt8iY7k?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 8) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_cS9JvLHpCqC5kGi?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 9) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_eWmbCMJmHg3ZcX4?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 10) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_bQIBq4toCpJ2X1Y?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 11) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_06by0ICd7H2MZxk?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 12) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_cDgJG6vIueTJoqi?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 13) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_8iH3gSbHLEq3ZfE?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 14) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_b1Nnm4y652pCmnY?PROLIFIC_PID=${prolificId}`;
                    } else if (treatmentCondition == 15) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_e8uJJohSMHshzh4?PROLIFIC_PID=${prolificId}`;
                    } else {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_1KTxzOxRQgjm8aa?PROLIFIC_PID=${prolificId}`;
                    }
                }
            }
        } else {
            if ((treatmentCondition <= 6 && !getBrowserIsChromeOrEdgeDesktop()) || (treatmentCondition >= 7 && !getBrowserIsSafariMobileVersion(treatmentCondition))) {
                const url = "https://n97rmes9xl.execute-api.us-east-2.amazonaws.com/deployed";
                await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "studyPhase": studyPhase,
                        "prolificId": prolificId,
                        "treatmentCondition": treatmentCondition,
                        "studyPhase": studyPhase,
                    })
                });
                // Incompatible device return code
                window.location.href = "https://app.prolific.com/submissions/complete?cc=CZQ6R4A5";
            } else {
                const initialData = await fetch('../resources/data/redirect_data.json').then(res => res.json());
                const row = initialData.find(d => d["Participant ID"] === prolificId);

                if (row) {
                    if (treatmentCondition >= 7) {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_d0j48IRyrPFRIvc?PROLIFIC_PID=${prolificId}&INITIAL_ORIGINAL=${row['Initial Original']}&INITIAL_CHANGED=${row['Initial Changed']}&TC=${row['Treatment Condition']}`;
                    } else {
                        window.location.href = `https://princetonsurvey.az1.qualtrics.com/jfe/form/SV_cHiAEfOPDhNw7lQ?PROLIFIC_PID=${prolificId}&INITIAL_ORIGINAL=${row['Initial Original']}&INITIAL_CHANGED=${row['Initial Changed']}&TC=${row['Treatment Condition']}`;
                    }
                } else {
                    // Incompatible device return code
                    window.location.href = "https://app.prolific.com/submissions/complete?cc=CZQ6R4A5";
                }
            }
        }
    } catch (error) {
        // Incompatible device return code
        window.location.href = "https://app.prolific.com/submissions/complete?cc=CZQ6R4A5";
    }
})();
