const defaultParams = {
    flipHorizontal: true,
    maxNumBoxes: 5,
    iouThreshold: 0.2,
    scoreThreshold: 0.6,
    bboxLineWidth: "2",
    fontSize: 17,
};

const statusLabel = document.getElementById("statusLabel")
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
let model = null;
let popped = false;
let centerPositions = []

function getPopcatLims() {
    const popcat = document.getElementById("popcat")
    const popcatXlim = canvas.getBoundingClientRect().width -  popcat.getBoundingClientRect().width
    const popcatYlim = canvas.getBoundingClientRect().height - popcat.getBoundingClientRect().height
    return [popcatXlim, popcatYlim]
}

async function adjustImage() {
    const popcat = document.getElementById('popcat');
    const content = document.getElementById("content")
    const canvasPositions = canvas.getBoundingClientRect()
    const contentPositions = content.getBoundingClientRect()
    popcat.style.cssText = `
    position: absolute;
    bottom: ${contentPositions.bottom-canvasPositions.bottom}px;
    right: ${contentPositions.right-canvasPositions.right}px;
    height: ${canvasPositions.height/3}px
    `
    popcat.classList.remove("d-none")
}

function getPredictionsCenterPositions(predictions) {
    const predictionsCenterPositions = []
    for (let i=0; i<predictions.length; i++) {
        predictionsCenterPositions.push([predictions[i].bbox[0]+predictions[i].bbox[2]/2, predictions[i].bbox[1]+predictions[i].bbox[3]/2])
    }
    return predictionsCenterPositions
}

function popTheCat(popcat, popcatLims, centerPositions) {
    if (centerPositions.length === 0 && popped === true) {
        popcat.src = 'img/popcat_shut.png'
        popped = false
        return
    }
    if (centerPositions.every(centerPosition => centerPosition[0] < popcatLims[0] && centerPosition[1] < popcatLims[1] && popped === true)) {
        // console.log(centerPositions, popcatLims)
        popcat.src = 'img/popcat_shut.png'
        popped = false
        return
    }
    for (let i=0; i<centerPositions.length; i++) {
        if (centerPositions[i][0] > popcatLims[0] && centerPositions[i][1] > popcatLims[1] && popped === false) {
            popcat.src = 'img/popcat_open.png'
            popped = true
            return
        }
    }
}

async function runHandtrack() {
    async function testrunDetection() {
        let predictions = await model.detect(video);
        predictions = predictions.filter(item => item.label !== 'face');
        await model.renderPredictions(predictions, canvas, context, video);
    }

    async function runDetection() {
        let predictions = await model.detect(video);
        predictions = predictions.filter(item => item.label !== 'face');
        // console.log(predictions)
        await model.renderPredictions(predictions, canvas, context, video);
        let centerPositions = getPredictionsCenterPositions(predictions)
        if (popcat !== null) {
            popTheCat(popcat, popcatLims, centerPositions)
        }
        requestAnimationFrame(runDetection);
    }


    await handTrack.startVideo(video);
    await testrunDetection();
    await adjustImage();
    const popcatLims = getPopcatLims();
    await runDetection();
}

handTrack.load(defaultParams).then(lmodel => {
    statusLabel.style.display = "none"
    model = lmodel
    runHandtrack();
});

