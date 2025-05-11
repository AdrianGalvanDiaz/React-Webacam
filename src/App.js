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
  const [availableResolutions, setAvailableResolutions] = useState([
    { width: 640, height: 480, label: "VGA (640x480)" },
    { width: 1280, height: 720, label: "HD (1280x720)" },
    { width: 1920, height: 1080, label: "Full HD (1920x1080)" },
    { width: 3840, height: 2160, label: "4K (3840x2160)" }
  ]);
  const [selectedResolution, setSelectedResolution] = useState(availableResolutions[2]); // Iniciar con Full HD
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
  
  // Copia de los datos para la edición
  const [editedData, setEditedData] = useState({...predictionData});
  
  // Estados para el flujo de revisión campo por campo
  const [isReviewingFields, setIsReviewingFields] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [reviewedFields, setReviewedFields] = useState(new Set());
  const [isEditingCurrentField, setIsEditingCurrentField] = useState(false);
  
  // Lista de campos en el orden que queremos revisar (excluyendo ID)
  const fieldOrder = [
    'nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno',
    'calle', 'numero_ext', 'numero_int', 'colonia', 'codigo_postal', 
    'municipio', 'estado'
  ];

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
    // Simular que enviamos la imagen al modelo de IA y obtenemos resultados
    // En una aplicación real, aquí harías una llamada a la API
    // Después de capturar, iremos a la página de resultados
    setCurrentPage('resultado');
    setIsReviewingFields(true); // Iniciar el flujo de revisión
  }, [webcamRef, setImgSrc]);

  // Función para regresar a tomar la foto
  const retakePhoto = () => {
    setImgSrc(null);
    setIsSaved(false);
    setIsReviewingFields(false);
    setCurrentFieldIndex(0);
    setReviewedFields(new Set());
    setCurrentPage('captura');
  };

  // Funciones para el flujo de revisión campo por campo
  const handleFieldCheck = () => {
    if (isEditingCurrentField) {
      // Si estaba editando, guardar los cambios
      setPredictionData(prevData => ({
        ...prevData,
        [fieldOrder[currentFieldIndex]]: editedData[fieldOrder[currentFieldIndex]]
      }));
      setIsEditingCurrentField(false);
    }
    
    // Marcar el campo como revisado
    const newReviewedFields = new Set(reviewedFields);
    newReviewedFields.add(fieldOrder[currentFieldIndex]);
    setReviewedFields(newReviewedFields);
    
    // Pasar al siguiente campo
    if (currentFieldIndex < fieldOrder.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    } else {
      // Si llegamos al final, terminar la revisión
      setIsReviewingFields(false);
      setIsSaved(true);
    }
  };

  const handleFieldEdit = () => {
    // Copiar todos los datos actuales a editedData, igual que handleEdit
    setEditedData({...predictionData});
    setIsEditingCurrentField(true);
  };

  // Manejar la tecla Enter
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && isReviewingFields) {
        e.preventDefault();
        handleFieldCheck();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isReviewingFields, currentFieldIndex, isEditingCurrentField]);

  // Manejar cambios en los campos editables durante la revisión
  const handleFieldChange = (e) => {
    const { value } = e.target;
    const currentField = fieldOrder[currentFieldIndex];
    setEditedData({
      ...editedData,
      [currentField]: value
    });
  };

  // Funciones para manejar la edición de datos
  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({...predictionData});
    // Al entrar en edición, resetear el estado de guardado
    setIsSaved(false);
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

  // Renderizar la página de captura
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
    </div>
  );

  // Renderizar la página de resultados con el nuevo layout
  const renderResultPage = () => (
    <div className={`result-page ${isReviewingFields ? 'reviewing' : ''}`}>
      <h1>Revisa que los datos sean correctos!</h1>
      
      {/* Overlay gris si estamos en modo revisión */}
      {isReviewingFields && <div className="review-overlay"></div>}
      
      <div className="result-container">
        <div className="data-section">
          <h2>Datos Detectados</h2>
          <h3 className="id-title">{predictionData.id}</h3>
          
          {/* Contenedor de datos en dos columnas */}
          <div className="json-display">
            {/* Contenedor de dos columnas para el resto de campos */}
            <div className="json-grid">
              {fieldOrder.map((key, index) => {
                const value = predictionData[key];
                const isCurrentField = isReviewingFields && currentFieldIndex === index;
                const isReviewed = reviewedFields.has(key);
                
                return (
                  <div 
                    className={`json-field ${isCurrentField ? 'current-field' : ''} ${isReviewed ? 'reviewed-field' : ''}`} 
                    key={key}
                  >
                    <span className="json-key">{key.replace(/_/g, ' ')}:</span>
                    {isCurrentField && isEditingCurrentField ? (
                      <input
                        type="text"
                        name={key}
                        value={editedData[key]}
                        onChange={handleFieldChange}
                        className="json-input"
                        autoFocus
                      />
                    ) : isEditing && !isReviewingFields ? (
                      <input
                        type="text"
                        name={key}
                        value={editedData[key]}
                        onChange={handleInputChange}
                        className="json-input"
                      />
                    ) : (
                      <span className="json-value">
                        {value}
                        {isReviewed && <span className="check-indicator">✓</span>}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Botones de acción fuera del contenedor JSON */}
          {!isReviewingFields && (
            <div className="data-actions">
              {/* El botón Editar SIEMPRE está presente */}
              {!isEditing && (
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
          )}
        </div>
        
        <div className="image-section" style={{ position: 'relative', zIndex: isReviewingFields ? 1000 : 1 }}>
          <h2>Imagen Capturada</h2>
          {imgSrc && (
            <img src={imgSrc} alt="Captura de webcam" className="result-img" />
          )}
        </div>
      </div>
      
      {/* Botones de navegación */}
      {!isReviewingFields && (
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
      )}
      
      {/* Botones de revisión campo por campo */}
      {isReviewingFields && (
        <div className="review-controls">
          <div className="review-progress">
            Campo {currentFieldIndex + 1} de {fieldOrder.length}: {fieldOrder[currentFieldIndex].replace(/_/g, ' ')}
          </div>
          <div className="review-progress"> 
            Podrás editar los campos al terminar!
          </div>
          <div className="review-buttons">
            <button onClick={handleFieldEdit} className="btn btn-edit-field" disabled={isEditingCurrentField}>
              <span>✏️</span> Editar
            </button>
            <button onClick={handleFieldCheck} className="btn btn-check-field">
              <span>✓</span> Check {isEditingCurrentField && '(Guardar)'}
            </button>
          </div>
          <div className="review-instruction">
            Presiona Enter o haz clic en ✓ para continuar
          </div>
        </div>
      )}
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