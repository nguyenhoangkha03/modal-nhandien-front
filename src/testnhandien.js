// import React, { useRef, useEffect, useState } from "react";
// import * as faceapi from "face-api.js";
// import axios from "axios";
// import "../src/test.css";

// const FaceRecognition = () => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [detectedName, setDetectedName] = useState("Unknown");

//   useEffect(() => {
//     const loadModels = async () => {
//       await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
//       await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
//       await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

//       startVideo();
//     };

//     const startVideo = () => {
//       navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
//         videoRef.current.srcObject = stream;
//       });
//     };

//     loadModels();
//   }, []);

//   const handleVideoPlay = async () => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     const displaySize = { width: video.width, height: video.height };
//     faceapi.matchDimensions(canvas, displaySize);
  
//     setInterval(async () => {
//       const detections = await faceapi
//         .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
//         .withFaceLandmarks()
//         .withFaceDescriptor();
  
//       const context = canvas.getContext("2d");
//       context.clearRect(0, 0, displaySize.width, displaySize.height);
  
//       if (detections) {
//         const resizedDetections = faceapi.resizeResults(detections, displaySize);
//         faceapi.draw.drawDetections(canvas, resizedDetections);
//         faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  
//         // Chụp ảnh từ video và gửi lên backend
//         const canvasCapture = document.createElement("canvas");
//         const ctx = canvasCapture.getContext("2d");
//         canvasCapture.width = video.videoWidth;
//         canvasCapture.height = video.videoHeight;
//         ctx.drawImage(video, 0, 0, canvasCapture.width, canvasCapture.height);
  
//         canvasCapture.toBlob(async (blob) => {
//           const formData = new FormData();
//           formData.append("image", blob, "face.jpg");
  
//           try {
//             const response = await axios.post("http://localhost:5001/detect-face", formData);
//             const name = response.data.name || "Unknown";
            
//             setDetectedName(name); // Cập nhật state
  
//             // Hiển thị tên trên bounding box
//             context.fillStyle = "red";
//             context.font = "20px Arial";
//             context.fillText(
//               name, // Dùng `name` mới nhất thay vì `detectedName`
//               resizedDetections.detection.box.x,
//               resizedDetections.detection.box.y - 10
//             );
//           } catch (error) {
//             console.error("Error detecting face:", error);
//             setDetectedName("Unknown");
//           }
//         }, "image/jpeg");
//       } else {
//         setDetectedName("Unknown");
//       }
//     }, 2000);
//   };    

//   return (
//     <div style={{ position: "relative" }}>
//       <video ref={videoRef} width="720" height="560" autoPlay onPlay={handleVideoPlay} className="rounded-lg shadow-lg w-80 h-60" />
//       <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0 }} />
//       <h2>Detected: {detectedName}</h2>
//     </div>
//   );
// };

// export default FaceRecognition;

import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import "../src/test.css";

const FaceRecognition = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detectedName, setDetectedName] = useState("Unknown");
  const ws = useRef(null);  // WebSocket instance
  let lastSentTime = 0;

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

      startVideo();
      setupWebSocket();
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        videoRef.current.srcObject = stream;
      });
    };

    const setupWebSocket = () => {
      ws.current = new WebSocket("ws://localhost:5001");

      ws.current.onopen = () => console.log("WebSocket connected");
      ws.current.onmessage = (event) => {
        const response = JSON.parse(event.data);
        setDetectedName(response.name || "Unknown");
      };

      ws.current.onerror = (error) => console.error("WebSocket Error:", error);
      ws.current.onclose = () => console.log("WebSocket disconnected");
    };

    loadModels();
  }, []);

  const detectFace = async () => {
    const now = Date.now();
    if (now - lastSentTime < 500) {  // Chỉ gửi mỗi 500ms để tránh quá tải
      requestAnimationFrame(detectFace);
      return;
    }
    lastSentTime = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };

    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, displaySize.width, displaySize.height);

    if (detections) {
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const box = resizedDetections.detection.box;

      // Vẽ bounding box
      context.strokeStyle = "red";
      context.lineWidth = 2;
      context.strokeRect(box.x, box.y, box.width, box.height);

      // Vẽ landmarks
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      // Chụp ảnh từ video và gửi lên WebSocket
      canvas.toBlob((blob) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          const reader = new FileReader();
          reader.readAsArrayBuffer(blob);
          reader.onloadend = () => ws.current.send(reader.result);
        }
      }, "image/jpeg", 0.6);  // Giảm chất lượng ảnh để gửi nhanh hơn
    } else {
      setDetectedName("Unknown");
    }

    requestAnimationFrame(detectFace);
  };

  const handleVideoPlay = () => {
    requestAnimationFrame(detectFace);
  };

  return (
    <div style={{ position: "relative" }}>
      <video ref={videoRef} width="720" height="560" autoPlay onPlay={handleVideoPlay} className="rounded-lg shadow-lg w-80 h-60" />
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0 }} />
      <h2>Detected: {detectedName}</h2>
    </div>
  );
};

export default FaceRecognition;
