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
  setDevices,
  showHelpPopup,
  setShowHelpPopup,
  renderResolutionInfo
}) => {
  return (
    <div className={`capture-page ${!isCameraEnabled ? 'initial-screen' : ''}`}>
      <h1>Coppel Captura</h1>
      
{/* Botón para listar dispositivos */}
      {!isCameraEnabled && devices.length === 0 && (
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
        </div>
      )}

      {!isCameraEnabled && devices.length > 0 && (
        <div className="capture-page-device-selection">
          <div className="device-selection-header">
            <a href="#" onClick={(e) => { e.preventDefault(); setDevices([]); }} style={{color: 'var(--primary-blue)', textDecoration: 'underline'}}>
              Regresar
            </a>
            <h2 className="step-title">Paso 1: Selección de dispositivo</h2>
            <p className="step-description">
              Selecciona la cámara para escanear el documento. El nombre de la cámara debería aparecer como "LGT - WEBCAM X"
            </p>
            <span className="help-link" onClick={() => setShowHelpPopup(true)}>
              No veo la cámara
            </span>
          </div>
          
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
      {/* Popup de ayuda */}
      {showHelpPopup && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }} onClick={() => setShowHelpPopup(false)}></div>
          
          <div className="help-popup">
            <button className="close-btn" onClick={() => setShowHelpPopup(false)}>
              ×
            </button>
            <h3>¿No encuentras tu cámara?</h3>
            <ol>
              <li>Verifica que tu cámara esté conectada correctamente</li>
              <li>Asegúrate de que no esté siendo usada por otra aplicación</li>
              <li>Intenta desconectar y volver a conectar el cable USB</li>
              <li>Si el problema persiste, contacta al departamento de TI</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
};

export default CapturePage;