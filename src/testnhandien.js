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



// import React, { useEffect, useRef, useState } from "react";
// import Webcam from "react-webcam";
// import * as faceapi from "face-api.js";

// const FaceRecognition = () => {
//   const webcamRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [name, setName] = useState("Đang nhận diện...");
//   const [modelsLoaded, setModelsLoaded] = useState(false);

//   // Tải các mô hình cần thiết từ thư mục public/models
//   useEffect(() => {
//     const loadModels = async () => {
//       try {
//         await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
//         await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
//         await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
//         setModelsLoaded(true);
//         console.log("Models loaded");
//       } catch (error) {
//         console.error("Error loading models:", error);
//       }
//     };
//     loadModels();
//   }, []);

//   // Vẽ khung nhận diện khuôn mặt lên canvas đặt trên webcam
//   useEffect(() => {
//     if (!modelsLoaded) return;

//     const interval = setInterval(async () => {
//       if (!webcamRef.current || !canvasRef.current) return;

//       const video = webcamRef.current.video;
//       if (video && video.readyState === 4) {
//         // Lấy kích thước thực của video
//         const displaySize = {
//           width: video.videoWidth,
//           height: video.videoHeight,
//         };

//         // Đảm bảo canvas có cùng kích thước với video
//         canvasRef.current.width = displaySize.width;
//         canvasRef.current.height = displaySize.height;

//         // Phát hiện khuôn mặt sử dụng TinyFaceDetector
//         const detections = await faceapi.detectAllFaces(
//           video,
//           new faceapi.TinyFaceDetectorOptions()
//         );
//         const resizedDetections = faceapi.resizeResults(detections, displaySize);

//         // Vẽ lại canvas
//         const ctx = canvasRef.current.getContext("2d");
//         ctx.clearRect(0, 0, displaySize.width, displaySize.height);
//         faceapi.draw.drawDetections(canvasRef.current, resizedDetections, {
//           withScore: false,
//         });
//       }
//     }, 500);

//     return () => clearInterval(interval);
//   }, [modelsLoaded]);

//   // Chụp ảnh từ webcam và gửi lên backend để nhận diện
//   const captureAndSend = async () => {
//     if (!modelsLoaded || !webcamRef.current) return;
  
//     const imageSrc = webcamRef.current.getScreenshot();
//     if (!imageSrc) return;
  
//     try {
//       const blob = await fetch(imageSrc).then((res) => res.blob());
//       const formData = new FormData();
//       formData.append("image", blob, "webcam.jpg");
  
//       const response = await fetch("http://localhost:5001/recognize", {
//         method: "POST",
//         body: formData,
//       });
  
//       if (!response.ok) {
//         // Lấy thông tin lỗi từ phản hồi của server
//         const errorText = await response.text();
//         throw new Error(errorText || "Server error");
//       }
  
//       const data = await response.json();
//       setName(data.match || "Không xác định");
//     } catch (error) {
//       console.error("Lỗi gửi ảnh:", error);
//       setName("Lỗi nhận diện");
//     }
//   };

//   // Tự động chụp và gửi ảnh lên server mỗi giây
//   useEffect(() => {
//     if (!modelsLoaded) return;

//     const interval = setInterval(() => {
//       captureAndSend();
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [modelsLoaded]);

//   return (
//     <div style={{ textAlign: "center" }}>
//       <h1>Nhận diện khuôn mặt</h1>
//       <div style={{ position: "relative", display: "inline-block" }}>
//         <Webcam
//           ref={webcamRef}
//           style={{ width: 640, height: 480 }}
//           screenshotFormat="image/jpeg"
//           videoConstraints={{ width: 640, height: 480 }}
//         />
//         <canvas
//           ref={canvasRef}
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             width: 640,
//             height: 480,
//           }}
//         />
//       </div>
//       <h2>{name}</h2>
//     </div>
//   );
// };

// export default FaceRecognition;



import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import io from 'socket.io-client';

const socket = io('http://localhost:5001');

const FaceRecognition = () => {
  const webcamRef = useRef(null);
  const [name, setName] = useState('Đang nhận diện...');
  const [canCapture, setCanCapture] = useState(true); // Trạng thái kiểm soát việc gửi ảnh

  useEffect(() => {
    // Nhận kết quả từ server
    socket.on('result', (data) => {
      setName(data.match || 'Không xác định');
    });

    // Nhận sự kiện xóa ảnh để chuẩn bị gửi ảnh mới
    socket.on('deleteImage', () => {
      setCanCapture(true); // Cho phép gửi ảnh mới
    });

    return () => {
      socket.off('result');
      socket.off('deleteImage');
    };
  }, []);

  // Gửi ảnh từ webcam qua socket mỗi giây nếu có thể gửi
  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current && canCapture) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          socket.emit('image', imageSrc);
          setCanCapture(false); // Tạm thời dừng gửi ảnh cho đến khi server yêu cầu gửi tiếp
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [canCapture]);

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Nhận diện khuôn mặt</h1>
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ width: 640, height: 480 }}
        style={{ width: 640, height: 480, borderRadius: 10 }}
      />
      <h2>{name}</h2>
    </div>
  );
};

export default FaceRecognition;
