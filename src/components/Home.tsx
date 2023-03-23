import { useEffect, useState, useRef } from 'react';
import { diff, isLargest } from '../helpers';
import Webcam from 'react-webcam';
import { DrawCanvas } from './DrawCanvas';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { MediaPipeHandsModelConfig } from '@tensorflow-models/hand-pose-detection/dist/mediapipe/types';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import {
  HandDetector,
  SupportedModels,
} from '@tensorflow-models/hand-pose-detection';
import { Loading } from './Loading';
import { HandContext } from '../context';

tfjsWasm.setWasmPaths(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`
);

// Register WebGL backend.
import * as mpHands from '@mediapipe/hands';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// I DON'T KNOW WHAT I DID BUT EVERYTIME I TRIED TO REFACTOR IT, EVERYTHING BREAKS.

export const Home = () => {
  const [model, setModel] = useState<SupportedModels>();
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [detector, setDetector] = useState<HandDetector>();
  const [predictions, setPredictions] = useState<handPoseDetection.Hand[]>();
  const [toolType, setToolType] = useState('draw');
  const [handCoords, setHandCoords] = useState({ x: 0, y: 0, type: 'default' });
  const [loading, setLoading] = useState(true);

  const webcamRef = useRef(null);
  const bufferRef = useRef(null);
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
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${mpHands.VERSION}`,
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
      detector.estimateHands((webcamRef.current as any).video).then(hands => {
        setPredictions(hands);
        predict(detector);
      });
    }, 10);
  }

  // render predictions on screen
  function renderPredictions() {
    if (!predictions || !predictions.length) return;

    const icon = iconRef.current;
    const offset = -150;

    predictions.every(prediction => {
      if (prediction.score <= 0.85) return false;

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

      // stabilize hand coords
      setHandCoords(prev => {
        //reduce jittering by offseting updates
        let jitter = 4;
        let { x, y } = prev;

        if (Math.abs(prev.x - (videoWidth + offset - coords.x[0])) >= jitter) {
          x = videoWidth + offset - coords.x[0];
        }
        if (Math.abs(prev.y - coords.y[0]) >= jitter) {
          y = coords.y[0];
        }
        return {
          x,
          y,
          type: 'default',
        };
      });

      (icon! as HTMLElement).style.left = `${handCoords.x}px`;
      (icon! as HTMLElement).style.top = `${handCoords.y}px`;

      //change icon
      if (diff(coords.x, coords.y) <= 70 && isLargest(coords.y[0], yFlag)) {
        setToolType('redo');
      } else if (diff(coords.x, coords.y) <= 70) {
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
  // function toggleCam() {
  //   const stream = (webcamRef.current as any)!.video.srcObject;
  //   const tracks = stream.getTracks();

  //   tracks.forEach(track => (track.enabled = isPermitted));
  //   (webcamRef.current as any).video.srcObject = null;
  //   setIsPermitted(prev => !prev);
  // }

  useEffect(() => {
    if (detector?.estimateHands) {
      setLoading(false);
      predict(detector);
    }
  }, [detector]);

  useEffect(() => {
    renderPredictions();
  }, [predictions]);

  useEffect(() => {
    if (toolType === 'draw') {
      const timer = setTimeout(() => {
        setIsBuffering(true);
      }, 750);

      return () => {
        setIsBuffering(false);
        clearTimeout(timer);
      };
    }
  }, [toolType]);

  return (
    //@ts-ignore
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
                    {isBuffering && (
                      <div
                        ref={bufferRef}
                        className="progress-bar w-1.5 h-8 bg-lime-500 absolute -top-1 -left-3"
                      ></div>
                    )}
                  </div>
                </li>
                <li className="p-5 hover:bg-slate-200 transition-colors mt-12 hover:text-lime-600">
                  <i className="fa-solid fa-palette fa-2xl"></i>
                </li>
                <li className="p-5 hover:bg-slate-200 transition-colors hover:text-lime-600">
                  <i className="fa-solid fa-fill-drip fa-2xl"></i>
                </li>
                <li className="p-5 hover:bg-slate-200 transition-colors hover:text-lime-600">
                  <i className="fa-solid fa-paintbrush fa-2xl"></i>
                </li>
              </ul>
            </nav>
            <div className="h-screen w-20 bg-white fixed top-0 right-0 z-50"></div>
          </div>
        )}

        {loading ? (
          <Loading loading={loading} />
        ) : (
          <DrawCanvas
            width={videoWidth}
            height={videoHeight}
            isBuffering={isBuffering}
          ></DrawCanvas>
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
