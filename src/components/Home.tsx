import { useEffect, useState, useRef } from 'react';
import { diff, isLargest } from '../helpers';
import Webcam from 'react-webcam';
import { DrawCanvas } from './DrawCanvas';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { MediaPipeHandsModelConfig } from '@tensorflow-models/hand-pose-detection/dist/mediapipe/types';
import {
  HandDetector,
  SupportedModels,
} from '@tensorflow-models/hand-pose-detection';
import { Loading } from './Loading';
import { HandContext } from '../context';

// Register WebGL backend.
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// I DON'T KNOW WHAT I DID BUT EVERYTIME I TRIED TO REFACTOR IT, EVERYTHING BREAKS.

export const Home = () => {
  const [model, setModel] = useState<SupportedModels>();
  const [detector, setDetector] = useState<HandDetector>();
  const [isPermitted, setIsPermitted] = useState(true);
  const [predictions, setPredictions] = useState<handPoseDetection.Hand[]>();
  const [toolType, setToolType] = useState('draw');
  const [handCoords, setHandCoords] = useState({ x: 0, y: 0, type: 'default' });
  const [loading, setLoading] = useState(true);

  const webcamRef = useRef(null);
  const iconRef = useRef(null);
  const [videoWidth, setVideoWidth] = useState(window.innerWidth);
  const [videoHeight, setVideoHeight] = useState(window.innerHeight);

  const videoConstraints = {
    height: videoHeight,
    width: videoWidth,
    facingMode: 'environment',
  };

  async function loadModel() {
    try {
      const detectorConfig = {
        runtime: 'mediapipe',
        modelType: 'full',
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
  // this run every 10ms, should I be worried?
  function predict(detector: HandDetector) {
    setTimeout(() => {
      detector.estimateHands(webcamRef.current.video).then(hands => {
        setPredictions(hands);
        predict(detector);
      });
    }, 5);
  }

  // render predictions on screen
  function renderPredictions() {
    if (!predictions || !predictions.length) return;

    const icon = iconRef.current as unknown as HTMLElement;
    const offset = -150;

    predictions.every(prediction => {
      if (prediction.score < 0.85) return false;

      const coords: { x: Array<number>; y: Array<number> } = { x: [], y: [] };
      // this checks for Y handCoords of other fingers, uses for eraser.
      const yFlag: Array<number> = [];

      prediction.keypoints.forEach((kp: handPoseDetection.Keypoint) => {
        if (kp.name == 'thumb_tip' || kp.name == 'index_finger_tip') {
          coords.x.push(kp.x);
          coords.y.push(kp.y);
        }

        if (
          [
            'pinky_finger_tip',
            'middle_finger_tip',
            'ring_finger_tip',
            'index_finger_tip',
          ].includes(kp.name as string)
        ) {
          yFlag.push(kp.y);
        }
      });

      setHandCoords({
        x: videoWidth + offset - coords.x[0],
        y: coords.y[0],
        type: 'default',
      });

      icon!.style.left = `${handCoords.x}px`;
      icon!.style.top = `${handCoords.y}px`;

      //change icon
      if (diff(coords.x, coords.y) <= 50 && isLargest(coords.y[0], yFlag)) {
        setToolType('redo');
      } else if (diff(coords.x, coords.y) <= 50) {
        setToolType('draw');
      } else if (isLargest(coords.y[0], yFlag)) {
        setToolType('erase');
      } else {
        setToolType('default');
      }

      setHandCoords(prevCoords => ({ ...prevCoords, type: toolType }));

      return true;
    });
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack
  function toggleCam() {
    const stream = webcamRef.current!.video.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach(track => (track.enabled = isPermitted));
    webcamRef.current.video.srcObject = null;
    setIsPermitted(prev => !prev);
  }

  // Only run when the camera has permission
  useEffect(() => {
    if (detector?.estimateHands) {
      setLoading(false);
      predict(detector);
    }
  }, [detector]);

  useEffect(() => {
    renderPredictions();
  }, [predictions]);

  return (
    <HandContext.Provider value={{ handCoords, setHandCoords }}>
      <div>
        {!loading && (
          <div>
            <nav className="h-screen w-20 bg-white fixed top-0 left-0 z-50">
              <ul className="flex items-center flex-col justify-start h-1/2 gap-10">
                <li>
                  <div ref={iconRef} className="z-50 absolute left-6 top-5">
                    <i
                      className={`${
                        toolType === 'draw'
                          ? 'fa-pencil'
                          : toolType === 'erase'
                          ? 'fa-eraser'
                          : toolType === 'redo'
                          ? 'fa-rotate-right'
                          : 'fa-eye'
                      } fa-solid fa-2xl`}
                    ></i>
                  </div>
                </li>
                <li className="p-5 hover:bg-slate-200 transition-colors mt-5 hover:text-lime-600">
                  <i className="fa-solid fa-palette fa-2xl"></i>
                </li>
                <li></li>
                <li></li>
              </ul>
            </nav>
            <div className="h-screen w-20 bg-white fixed top-0 right-0 z-50"></div>
          </div>
        )}

        {loading ? (
          <Loading loading={loading} />
        ) : (
          <DrawCanvas width={videoWidth} height={videoHeight}></DrawCanvas>
        )}

        <div>
          <Webcam
            className="h-screen mx-auto"
            videoConstraints={videoConstraints}
            audio={false}
            id="video"
            mirrored={true}
            ref={webcamRef}
            onUserMedia={loadModel}
          />
        </div>
      </div>
    </HandContext.Provider>
  );
};
