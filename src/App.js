import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import './App.css';

function App() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const webcamRef = useRef(null);

  // Función para obtener los dispositivos disponibles
  const handleDevices = useCallback(
    mediaDevices => {
      // Filtrar solo videoinputs (webcams)
      const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
      setDevices(videoDevices);
    },
    [setDevices]
  );

  // Cargar la lista de dispositivos
  const loadDevices = () => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  };

  // Seleccionar un dispositivo y habilitar la cámara
  const enableCamera = (deviceId) => {
    setSelectedDeviceId(deviceId);
    setIsCameraEnabled(true);
  };

  // Capturar imagen
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  }, [webcamRef, setImgSrc]);

  // Guardar la imagen
  const saveImage = () => {
    if (!imgSrc) return;
    
    // Crear un elemento <a> para descargar la imagen
    const link = document.createElement('a');
    link.href = imgSrc;
    link.download = `photo-${new Date().toISOString()}.png`;
    link.click();
  };

  return (
    <div className="App">
      <h1>Aplicación de Webcam</h1>
      
      {/* Botón para listar dispositivos */}
      {!isCameraEnabled && (
        <div className="devices-container">
          <button onClick={loadDevices} className="btn">
            Listar dispositivos disponibles
          </button>
          
          <div className="device-list">
            {devices.map((device, key) => (
              <div key={key} className="device-item">
                <span>{device.label || `Dispositivo ${key + 1}`}</span>
                <button onClick={() => enableCamera(device.deviceId)} className="btn">
                  Seleccionar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cámara */}
      {isCameraEnabled && (
        <div className="camera-container">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/png"
            videoConstraints={{
              deviceId: selectedDeviceId
            }}
            className="webcam"
          />
          
          <div className="camera-controls">
            <button onClick={capture} className="btn">Tomar foto</button>
            <button onClick={() => setIsCameraEnabled(false)} className="btn">
              Cambiar cámara
            </button>
          </div>
        </div>
      )}

      {/* Imagen capturada a*/}
      {imgSrc && (
        <div className="result-container">
          <h2>Foto capturada:</h2>
          <img src={imgSrc} alt="Captura de webcam" className="captured-img" />
          <div className="result-controls">
            <button onClick={saveImage} className="btn">Guardar imagen</button>
            <button onClick={() => setImgSrc(null)} className="btn">Descartar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;