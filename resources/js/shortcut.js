const treatmentCondition = parseInt((new URLSearchParams(window.location.search)).get("TC"), 10);
const prolificId = (new URLSearchParams(window.location.search)).get("PROLIFIC_PID");
const originalDefault = (new URLSearchParams(window.location.search)).get("ORIGINAL_DEFAULT");

function setConditionalValues() {
    const conditionalInfoText = document.getElementById("conditional-info-text");
    if (treatmentCondition == 15) {
        conditionalInfoText.innerHTML = "For the next step in this study, you will set the default search engine on this iPhone."
    } else {
        conditionalInfoText.innerHTML = "For the next step in this study, you will select the default search engine on this iPhone. <strong>You may choose any of the search engines that are listed as options, regardless of if you are using that search engine as your current default.</strong>"
    }

    const conditionalInstructionText = document.getElementById("conditional-instruction-text");
    if (treatmentCondition == 15) {
        conditionalInstructionText.innerHTML = "set DuckDuckGo as"
    } else {
        conditionalInstructionText.innerHTML = "prompt you to select"
    }

    const installShortcutLink = document.getElementById("install-shortcut-link");
    if (treatmentCondition != 15) {
        installShortcutLink.href = `https://www.icloud.com/shortcuts/524aaaf540344d398168c1b26bffb533`
    } else {
        installShortcutLink.href = `https://www.icloud.com/shortcuts/a09c4b4520ea4d9bb01b7d33aad65a68`
    }

    const runShortcutLink = document.getElementById("run-shortcut-link");
    if (treatmentCondition != 15) {
        runShortcutLink.href = `shortcuts://run-shortcut?name=Select%20Default%20Search%20Engine&input=text&text=${prolificId},${treatmentCondition},${originalDefault}`
    } else {
        runShortcutLink.href = `shortcuts://run-shortcut?name=Set%20Default%20Search%20Engine&input=text&text=${prolificId},15,${originalDefault}`
    }
}
setConditionalValues();

document.getElementById('continueButton').onclick = () => {
    document.getElementById('infoSection').style.display = 'none';
    document.getElementById('instructionSection').style.display = 'block';
};