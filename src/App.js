import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import './App.css';

function App() {
  // Estado para la navegación
  const [currentPage, setCurrentPage] = useState('captura'); // 'captura' o 'resultado'
  
  // Estados de la cámara
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [resolution, setResolution] = useState({ width: 0, height: 0 });
  
  // Nuevo estado para el status de resolución
  const [resolutionStatus, setResolutionStatus] = useState('checking'); // 'good', 'suboptimal', 'checking'
  
  // Lista de resoluciones en orden descendente (de mejor a peor)
  const [availableResolutions] = useState([
    { width: 1920, height: 1080, label: "Full HD (1920x1080)" },
    { width: 1280, height: 720, label: "HD (1280x720)" },
    { width: 640, height: 480, label: "VGA (640x480)" }
  ]);
  
  // Iniciar con la resolución Full HD por defecto
  const [selectedResolution, setSelectedResolution] = useState({ width: 1920, height: 1080, label: "Full HD (1920x1080)" });
  
  const webcamRef = useRef(null);
  
  // Estados para la página de resultados
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [predictionData, setPredictionData] = useState({
    id: `ID-${Date.now()}`,
    nombre: "ADRIAN",
    segundo_nombre: "",
    apellido_paterno: "GALVAN",
    apellido_materno: "DIAZ",
    direccion1: "CERRO EL NABO 312",
    direccion2: "COLPRIVADA JURIQUILLA 76226",
    direccion3: "QUERETARO, QRO",
    calle: "CERRO EL NABO",
    numero_ext: "312",
    numero_int: "",
    colonia: "COLPRIVADA JURIQUILLA",
    codigo_postal: "76226",
    municipio: "QUERETARO",
    estado: "QRO"
  });

  // Función para capturar imagen con Canvas a resolución completa
  const captureWithCanvas = () => {
    const video = webcamRef.current.video;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
  
    // Usar la resolución nativa del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    console.log(`Capturando imagen: ${canvas.width}x${canvas.height}`);
  
    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
    // Convertir a base64
    const imageSrc = canvas.toDataURL('image/png');
    
    return imageSrc;
  };
  
  // Copia de los datos para la edición
  const [editedData, setEditedData] = useState({...predictionData});

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

  // Nueva función para intentar diferentes resoluciones
  const tryNextResolution = useCallback(async (currentResolutionIndex = 0) => {
    if (currentResolutionIndex >= availableResolutions.length) {
      console.error('No se pudo establecer ninguna resolución');
      return;
    }

    const targetResolution = availableResolutions[currentResolutionIndex];
    
    try {
      // Intentar obtener el stream con la resolución específica
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDeviceId,
          width: { ideal: targetResolution.width },
          height: { ideal: targetResolution.height }
        }
      });
      
      // Si llegamos aquí, el stream se obtuvo exitosamente
      setSelectedResolution(targetResolution);
      
      // Verificar si es la resolución óptima (1920x1080)
      if (targetResolution.width === 1920 && targetResolution.height === 1080) {
        setResolutionStatus('good');
      } else {
        setResolutionStatus('suboptimal');
      }
      
      // Detener el stream de prueba (react-webcam manejará el stream real)
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.log(`No se pudo establecer ${targetResolution.label}, intentando siguiente...`);
      // Intentar con la siguiente resolución
      tryNextResolution(currentResolutionIndex + 1);
    }
  }, [selectedDeviceId, availableResolutions]);

  // Seleccionar un dispositivo y habilitar la cámara
  const enableCamera = (deviceId) => {
    setSelectedDeviceId(deviceId);
    setIsCameraEnabled(true);
    setResolutionStatus('checking');
    
    // Iniciar el proceso de búsqueda de resolución óptima
    setTimeout(() => {
      tryNextResolution(0);
    }, 100);
  };

  // Capturar imagen
  const capture = useCallback(() => {
    const imageSrc = captureWithCanvas();
    setImgSrc(imageSrc);
    // Simular que enviamos la imagen al modelo de IA y obtenemos resultados
    // En una aplicación real, aquí harías una llamada a la API
    // Después de capturar, iremos a la página de resultados
    setCurrentPage('resultado');
  }, [webcamRef, setImgSrc]);

  // Función para regresar a tomar la foto
  const retakePhoto = () => {
    setImgSrc(null);
    setIsSaved(false);
    setCurrentPage('captura');
  };

  // Funciones para manejar la edición de datos
  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({...predictionData});
  };

  const handleDoneEditing = () => {
    setIsEditing(false);
    setPredictionData({...editedData});
  };

  const handleSave = () => {
    setIsSaved(true);
    // Aquí iría el código para enviar los datos al servidor
    console.log("Datos guardados:", predictionData);
  };

  const handleContinue = () => {
    // Aquí iría la lógica para continuar al siguiente paso
    alert("Continuando al siguiente paso...");
  };

  // Manejar cambios en los campos editables
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData({
      ...editedData,
      [name]: value
    });
  };

  // Actualizar efecto para detectar cuando la resolución real esté disponible
  useEffect(() => {
    if (isCameraEnabled && webcamRef.current && webcamRef.current.video) {
      const checkVideoReady = setInterval(() => {
        const video = webcamRef.current.video;
        if (video.readyState === 4) {
          const actualWidth = video.videoWidth;
          const actualHeight = video.videoHeight;
          
          setResolution({
            width: actualWidth,
            height: actualHeight
          });
          
          // Verificar si la resolución real coincide con la esperada
          if (actualWidth === 1920 && actualHeight === 1080) {
            setResolutionStatus('good');
          } else {
            setResolutionStatus('suboptimal');
          }
          
          clearInterval(checkVideoReady);
        }
      }, 100);

      return () => clearInterval(checkVideoReady);
    }
  }, [isCameraEnabled, webcamRef]);

  // Función para renderizar la información de resolución
  const renderResolutionInfo = () => {
    if (resolution.width > 0) {
      return (
        <div className="resolution-info">
          {resolution.width} x {resolution.height}
          
          {resolutionStatus === 'good' && (
            <div className="resolution-check">
              <span className="check-icon">✓</span> ¡Todo bien!
            </div>
          )}
          
          {resolutionStatus === 'suboptimal' && (
            <div className="resolution-warning">
              ⚠️ Resolución no óptima
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  // Renderizar la página de captura (sin botones de resolución)
  const renderCapturePage = () => (
    <div className="capture-page">
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
                width: { ideal: selectedResolution.width },
                height: { ideal: selectedResolution.height }
              }}
              className="webcam"
            />
            
            {/* Mostrar la información de resolución actualizada */}
            {renderResolutionInfo()}
          </div>
          
          {/* Controles principales */}
          <div className="camera-controls">
            <button onClick={capture} className="btn">Tomar foto</button>
            <button onClick={() => setIsCameraEnabled(false)} className="btn">
              Cambiar cámara
            </button>
          </div>
          
          {/* Ya no renderizamos los botones de resolución */}
        </div>
      )}
    </div>
  );

  // Renderizar la página de resultados con el nuevo layout
  const renderResultPage = () => (
    <div className="result-page">
      <h1>Revisa que los datos sean correctos!</h1>
      
      <div className="result-container">
        <div className="data-section">
          <h2>Datos Detectados</h2>
          
          {/* Contenedor de datos en dos columnas */}
          <div className="json-display">
            {/* ID como elemento especial */}
            <div className="json-field id-field">
              <span className="json-key">ID:</span>
              <span className="json-value">{predictionData.id}</span>
            </div>
            
            {/* Contenedor de dos columnas para el resto de campos */}
            <div className="json-grid">
              {Object.entries(predictionData).map(([key, value]) => {
                if (key === 'id') return null;
                
                return (
                  <div className="json-field" key={key}>
                    <span className="json-key">{key.replace(/_/g, ' ')}:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        name={key}
                        value={editedData[key]}
                        onChange={handleInputChange}
                        className="json-input"
                      />
                    ) : (
                      <span className="json-value">{value}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Botones de acción fuera del contenedor JSON */}
          <div className="data-actions">
            {!isEditing && !isSaved && (
              <button onClick={handleEdit} className="btn btn-edit">
                Editar
              </button>
            )}
            
            {isEditing && (
              <button onClick={handleDoneEditing} className="btn btn-done">
                Listo!
              </button>
            )}
            
            {!isEditing && (
              <button 
                onClick={handleSave} 
                className="btn btn-save"
                disabled={isSaved}>
                Salvar
              </button>
            )}
          </div>
        </div>
        
        <div className="image-section">
          <h2>Imagen Capturada</h2>
          {imgSrc && (
            <img src={imgSrc} alt="Captura de webcam" className="result-img" />
          )}
        </div>
      </div>
      
      {/* Botones de navegación */}
      <div className="navigation-buttons">
        <button onClick={retakePhoto} className="btn btn-retake">
          Repetir Foto
        </button>
        
        <button 
          onClick={handleContinue} 
          className="btn btn-continue"
          disabled={!isSaved}>
          Continuar
        </button>
      </div>
    </div>
  );

  // Renderizar la página correspondiente según el estado
  return (
    <div className="App">
      {currentPage === 'captura' ? renderCapturePage() : renderResultPage()}
    </div>
  );
}

export default App;