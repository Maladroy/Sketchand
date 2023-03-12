import React, { useEffect, useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import Webcam from 'react-webcam';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { MediaPipeHandsModelConfig } from '@tensorflow-models/hand-pose-detection/dist/mediapipe/types';
import {
  HandDetector,
  SupportedModels,
} from '@tensorflow-models/hand-pose-detection';

// Register WebGL backend.
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

export const Hand = () => {
  const [model, setModel] = useState<SupportedModels>();
  const [detector, setDetector] = useState<HandDetector>();
  const [isPermitted, setIsPermitted] = useState(true);
  const [predictions, setPredictions] = useState<any[]>();
  const webcamRef = React.useRef(null);

  const [videoWidth, setVideoWidth] = useState(960);
  const [videoHeight, setVideoHeight] = useState(640);

  const videoConstraints = {
    height: 1080 / 2,
    width: 1920 / 2,
    facingMode: 'environment',
  };

  async function loadModel() {
    try {
      const detectorConfig = {
        runtime: 'mediapipe',
        modelType: 'lite',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands', //node module model files are not missing some definitions
      };

      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detector = await handPoseDetection.createDetector(
        model,
        detectorConfig as MediaPipeHandsModelConfig
      );

      setModel(model);
      setDetector(detector);
      console.log('set loaded Model');
    } catch (err) {
      console.log(err);
      console.log('failed load model');
    }
  }

  // return detected hand predictions
  // this run every 15ms, should I be worried?
  async function predict(detector: HandDetector) {
    setTimeout(() => {
      detector.estimateHands(webcamRef.current.video).then(hands => {
        setPredictions(hands);
        predict(detector);
      });
    }, 15);
  }

  // render predictions on screen
  async function renderPredictions() {
    let cnvs = document.getElementById('handVisual') as HTMLCanvasElement;
    let ctx = cnvs.getContext('2d');
    ctx.clearRect(0, 0, cnvs.width, cnvs.height);

    if (!predictions || !predictions.length) return;

    predictions.every(prediction => {
      if (prediction.score < 0.85) return false;
      prediction.keypoints.forEach(kp => {
        let fillColor = 'coral';
        if (kp.name == 'wrist') {
          fillColor = 'crimson';
        }

        ctx.beginPath();
        ctx.fillStyle = fillColor;
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });

      return true;
    });
  }

  // read keypoints position and word it out
  // this will be either manual labour intensive or a waste of time if there's no better method to identify and map into the dictionary
  async function basicPoseReader() {
    if (!predictions || !predictions.length) return;
    let basicDict = {
      wrist: null,
      thumb_tip: null,
      index_finger_mcp: null,
      index_finger_tip: null,
      middle_finger_mcp: null,
      middle_finger_tip: null,
      ring_finger_mcp: null,
      ring_finger_tip: null,
      pinky_finger_mcp: null,
      pinky_finger_tip: null,
    };

    //* To detect the letter "A" in the vietnamese national sign language alphabet there's 2 conditition needs to be met.
    //* A: All finger_tip must be close to finger_mcp. Meaning the hand must be closed.
    //* B: Wrist X coord must always be larger than Thumb_tip X coord
    //* And the difference between Wrist Y coord and Thumb_tip Y must not exceed certain amount
    //* This does not account for hand rotation as the model only support 2D Coordinates
    //* This is too impractical to apply and scale up

    //How about Orthogonal rectangle method.

    predictions.every(prediction => {
      if (prediction.score < 0.85) return false;
      prediction.keypoints.forEach(kp => {
        if (Object.keys(basicDict).includes(kp.name)) basicDict[kp.name] = kp;
      });
      return true;
    });

    function difference(target1: any, target2: any) {
      let { x: x1, y: y1 } = target1;
      let { x: x2, y: y2 } = target2;

      return Math.abs(x1 + y1 - (x2 + y2));
    }

    function isLetterA() {
      //difference between each finger's MP Joint and tip, low difference means the finger is likely folded.
      let indexDiff =
        difference(basicDict.index_finger_mcp, basicDict.index_finger_tip) < 80;
      let middleDiff =
        difference(basicDict.middle_finger_mcp, basicDict.middle_finger_tip) <
        80;
      let ringDiff =
        difference(basicDict.ring_finger_mcp, basicDict.ring_finger_tip) < 80;
      let pinkyDiff =
        difference(basicDict.pinky_finger_mcp, basicDict.pinky_finger_tip) < 80;
      let pinkyToWristDiff =
        difference(basicDict.pinky_finger_tip, basicDict.wrist) < 200;

      let wristThumbY = basicDict.wrist.y - basicDict.thumb_tip.y > 150;
      console.log(
        indexDiff,
        middleDiff,
        ringDiff,
        pinkyDiff,
        pinkyToWristDiff,
        wristThumbY
      );
      if (
        indexDiff &&
        middleDiff &&
        ringDiff &&
        pinkyDiff &&
        pinkyToWristDiff &&
        wristThumbY
      )
        return true;

      return false;
    }

    console.log(isLetterA());
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack
  function toggleCam() {
    const stream = webcamRef.current.video.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach(track => (track.enabled = isPermitted));
    // webcamRef.current.video.srcObject = null;
    setIsPermitted(prev => !prev);
  }

  // Only run when the camera has permission
  useEffect(() => {
    if (detector?.estimateHands) predict(detector);
  }, [detector]);

  useEffect(() => {
    renderPredictions();
    basicPoseReader();
  }, [predictions]);

  return (
    <div className="w-screen h-screen">
      <button
        style={{
          color: 'white',
          backgroundColor: 'blueviolet',
          width: '80%',
          maxWidth: '250px',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        onClick={toggleCam}
      >
        Start Detect
      </button>
      <div style={{ position: 'absolute', left: '100px', top: '100px' }}>
        <Webcam
          audio={false}
          id="video"
          // mirrored={true}
          ref={webcamRef}
          videoConstraints={videoConstraints}
          onUserMedia={loadModel}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: '100px',
          top: '100px',
          zIndex: '9999',
        }}
      >
        <canvas
          id="handVisual"
          width={videoWidth}
          height={videoHeight}
          style={{ backgroundColor: 'transparent' }}
        />
      </div>
    </div>
  );
};
