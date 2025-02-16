import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "../src/test.css";
const CameraCapture = ({ valueInput }) => {
  const webcamRef = useRef(null);
  const [images, setImages] = useState([]);



  // Gửi ảnh lên server
  const uploadImage = async (imageSrc) => {
    const blob = await fetch(imageSrc).then((res) => res.blob());
    const formData = new FormData();
    const name = valueInput;
    
    formData.append("image", blob, "snapshot.jpg");
    formData.append("name", name);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Ảnh đã lưu:", response.data.imagePath);
    } catch (error) {
      console.error("Lỗi khi lưu ảnh:", error);
    }
  };

  // Chụp ảnh và gửi lên server
  const capture = async () => {
    if (images.length >= 30) return;
    const imageSrc = webcamRef.current.getScreenshot();
    setImages((prev) => [...prev, imageSrc]);
    await uploadImage(imageSrc);
  };

  // Tự động chụp mỗi 2 giây
  useEffect(() => {
    const interval = setInterval(() => {
      if (images.length < 30) {
        capture();
      } else {
        clearInterval(interval);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [images]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="rounded-lg shadow-lg w-80 h-60 webcam-flip"
      />
    </div>
  );
};

export default CameraCapture;
