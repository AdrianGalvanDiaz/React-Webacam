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
        <div className="capture-page-camera-active">
          <div className="camera-capture-header">
            <a href="#" onClick={(e) => { e.preventDefault(); setIsCameraEnabled(false); }} style={{color: 'var(--primary-blue)', textDecoration: 'underline'}}>
              Regresar
            </a>
              <h2 className="step-title">Paso 2: Captura</h2>
            <p className="step-description">
              Coloca la identificación del cliente en el escáner con los datos y fotografía hacia abajo. Haz click en el botón "Tomar foto"
            </p>
            <span className="help-link" onClick={() => setShowHelpPopup(true)}>
              ¿Cómo se debería ver la identificación?
            </span>
          </div>
          
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
          <div className="camera-controls-redesigned">
            <button 
              onClick={() => setIsCameraEnabled(false)} 
              className="btn btn-secondary"
              disabled={uploading}
            >
              Cambiar cámara
            </button>
            <button 
              onClick={capture} 
              className="btn"
              disabled={uploading}
            >
              {uploading ? 'Subiendo...' : 'Tomar foto'}
            </button>
          </div>
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
            <h3>Guía de posicionamiento</h3>
            
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '30px 20px',
              margin: '20px 0',
              textAlign: 'center',
              border: '1px solid #333'
            }}>
              <img 
                src="/credencial-votar.png" 
                alt="Guía de colocación de INE" 
                style={{
                  maxWidth: '280px',
                  height: 'auto',
                  border: '2px solid #4CAF50',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}
              />              
              <p style={{color: '#4CAF50', fontSize: '14px', fontWeight: '600', margin: '8px 0'}}>
                ✓ Posición correcta
              </p>
              <p style={{color: '#ffffff', fontSize: '13px', margin: '5px 0'}}>
                Datos y foto hacia abajo, documento completamente visible
              </p>
            </div>

            <div style={{marginTop: '20px'}}>
              <h4 style={{fontSize: '16px', marginBottom: '15px', color: 'var(--dark-gray)'}}>
                Antes de capturar, verifica:
              </h4>
              <ol style={{margin: '0', paddingLeft: '20px', lineHeight: '1.6'}}>
                <li style={{marginBottom: '10px', color: 'var(--text-gray)'}}>
                  <strong>Cámara seleccionada:</strong> Debe ser la correcta del escáner
                </li>
                <li style={{marginBottom: '10px', color: 'var(--text-gray)'}}>
                  <strong>Documento visible:</strong> Toda la INE debe aparecer en pantalla
                </li>
                <li style={{marginBottom: '10px', color: 'var(--text-gray)'}}>
                  <strong>Texto legible:</strong> Todos los caracteres se ven claros y nítidos
                </li>
              </ol>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CapturePage;