import React from 'react';
import Webcam from 'react-webcam';

const CapturePage = ({
  devices,
  isCameraEnabled,
  selectedDeviceId,
  uploading,
  imgSrc,
  uploadProgress,
  uploadError,
  showIdGuide,
  selectedResolution,
  resolution,
  resolutionStatus,
  webcamRef,
  loadDevices,
  enableCamera,
  capture,
  setIsCameraEnabled,
  setShowIdGuide,
  renderResolutionInfo
}) => {
  return (
    <div className={`capture-page ${!isCameraEnabled ? 'initial-screen' : ''}`}>
      <h1>Coppel Captura</h1>
      
      {/* Botón para listar dispositivos */}
      {!isCameraEnabled && (
        <div className="capture-page-initial">
          <h1>Sistema de captura de datos Coppel</h1>
          <p className="subtitle">Captura los datos del cliente escaneando su identificación</p>
          
          <button onClick={loadDevices} className="btn">
            Hacer una nueva captura
          </button>
          
          <img 
            src="/coppel_logo.png" 
            alt="Coppel Logo" 
            className="coppel-logo"
          />
          <p className="coppel-year">Coppel 2025</p>
          
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
            {/* Si está subiendo, mostrar la imagen capturada */}
            {uploading && imgSrc ? (
              <img 
                src={imgSrc} 
                alt="Imagen capturada" 
                className="captured-image"
              />
            ) : (
              <div className="webcam-container">
                {/* Guía de posicionamiento */}
                <div className={`id-guide-container ${showIdGuide ? 'visible' : 'hidden'}`}>
                  <div className="id-guide-overlay">
                    <img 
                      src="/credencial-votar.png" 
                      alt="Guía de colocación" 
                      className="id-guide-image"
                    />
                    <div className="id-guide-text">
                      <p>Coloca tu INE como se muestra</p>
                      <p>Asegúrate que todo el documento sea visible</p>
                    </div>
                  </div>
                </div>
                
                {/* Si no está subiendo, mostrar la webcam */}
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/png"
                  videoConstraints={{
                    deviceId: selectedDeviceId,
                    width: { ideal: selectedResolution.width },
                    height: { ideal: selectedResolution.height }
                  }}
                  className="webcam"
                />
                
                {/* Mostrar la información de resolución si no está subiendo */}
                {!uploading && renderResolutionInfo()}
              </div>
            )}
          </div>

          {/* Indicadores de progreso de upload */}
          {uploading && (
            <div className="upload-progress">
              <p>Subiendo imagen... {uploadProgress}%</p>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="upload-error">
              <p>Error: {uploadError}</p>
            </div>
          )}

          {/* Controles principales */}
          <div className="camera-controls">
            <button 
              onClick={capture} 
              className="btn"
              disabled={uploading}
            >
              {uploading ? 'Subiendo...' : 'Tomar foto'}
            </button>
            <button 
              onClick={() => setIsCameraEnabled(false)} 
              className="btn"
              disabled={uploading}
            >
              Cambiar cámara
            </button>
            <button 
              onClick={() => setShowIdGuide(!showIdGuide)} 
              className="btn btn-guide"
              disabled={uploading}
            >
              {showIdGuide ? 'x' : '?'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapturePage;