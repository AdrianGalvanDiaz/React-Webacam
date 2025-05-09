import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import './App.css';

function App() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [resolution, setResolution] = useState({ width: 0, height: 0 });
  const [availableResolutions, setAvailableResolutions] = useState([
    { width: 640, height: 480, label: "VGA (640x480)" },
    { width: 1280, height: 720, label: "HD (1280x720)" },
    { width: 1920, height: 1080, label: "Full HD (1920x1080)" },
    { width: 3840, height: 2160, label: "4K (3840x2160)" }
  ]);
  const [selectedResolution, setSelectedResolution] = useState(availableResolutions[2]); // Iniciar con Full HD
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

  // Cambiar a la resolución seleccionada
  const changeResolution = (resolution) => {
    setSelectedResolution(resolution);
  };

  // Verificar si la resolución es adecuada (1080p o mayor)
  const isResolutionGood = () => {
    return resolution.height >= 1080 || (resolution.width >= 1920 && resolution.height >= 1080);
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

  // Obtener la resolución de la cámara
  useEffect(() => {
    if (isCameraEnabled && webcamRef.current && webcamRef.current.video) {
      // Crear un observador para detectar cuando el video esté listo
      const checkVideoReady = setInterval(() => {
        const video = webcamRef.current.video;
        if (video.readyState === 4) { // HAVE_ENOUGH_DATA - El video está listo
          setResolution({
            width: video.videoWidth,
            height: video.videoHeight
          });
          clearInterval(checkVideoReady);
        }
      }, 100);

      return () => clearInterval(checkVideoReady);
    }
  }, [isCameraEnabled, webcamRef, selectedResolution]);

  return (
    <div className="App">
      <h1>Coppel Captura</h1>
      
      {/* Botón para listar dispositivos */}
      {!isCameraEnabled && (
        <div className="devices-container">
          <button onClick={loadDevices} className="btn">
            Haz una nueva captura
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
          <div className="webcam-wrapper">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/png"
              videoConstraints={{
                deviceId: selectedDeviceId,
                width: selectedResolution.width,
                height: selectedResolution.height
              }}
              className="webcam"
            />
            
            {/* Mostrar la resolución */}
            {resolution.width > 0 && (
              <div className="resolution-info">
                {resolution.width} x {resolution.height}
                
                {/* Indicador de resolución adecuada */}
                {isResolutionGood() && (
                  <div className="resolution-check">
                    <span className="check-icon">✓</span> ¡Todo bien!
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Controles principales */}
          <div className="camera-controls">
            <button onClick={capture} className="btn">Tomar foto</button>
            <button onClick={() => setIsCameraEnabled(false)} className="btn">
              Cambiar cámara
            </button>
          </div>
          
          {/* Botones de resolución */}
          <div className="resolution-buttons">
            {availableResolutions.map((res, index) => (
              <button 
                key={index} 
                onClick={() => changeResolution(res)} 
                className={`btn btn-resolution ${selectedResolution.width === res.width && selectedResolution.height === res.height ? 'btn-resolution-active' : ''}`}>
                {res.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Imagen capturada */}
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