import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import './App.css';

function App() {
  const USE_LOCAL_TEST_MODE = true; // Constante global - cambiar a false para usar API real
  // console.log('Modo de prueba local:', USE_LOCAL_TEST_MODE); // Verificación visual en consola

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
    id: '',
    nombre: '',
    segundo_nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    direccion1: '',
    direccion2: '',
    direccion3: '',
    calle: '',
    numero_ext: '',
    numero_int: '',
    colonia: '',
    codigo_postal: '',
    municipio: '',
    estado: ''
  });

  // Estados para el flujo de revisión campo por campo
  const [isReviewingFields, setIsReviewingFields] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [reviewedFields, setReviewedFields] = useState(new Set());
  const [isEditingCurrentField, setIsEditingCurrentField] = useState(false);

  // Agregar este nuevo estado después de los demás estados
  const [copyButtonText, setCopyButtonText] = useState('Copiar');
  const [idCopied, setIdCopied] = useState(false);

  // Agregar este estado con los demás estados de RFC
  const [rfcErrorMessage, setRfcErrorMessage] = useState("El RFC debe contener 12 o 13 caracteres alfanuméricos");
  
  // Lista de campos en el orden que queremos revisar (excluyendo ID)
  const fieldOrder = [
    'nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno',
    'calle', 'numero_ext', 'numero_int', 'colonia', 'codigo_postal', 
    'municipio', 'estado'
  ];

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

    // Estados para el progreso de upload
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  // Estados para los popups de RFC y finalización
  const [showRfcPopup, setShowRfcPopup] = useState(false);
  const [showFinalPopup, setShowFinalPopup] = useState(false);
  const [rfcText, setRfcText] = useState('');
  const [rfcError, setRfcError] = useState(false);
  const [rfcValidated, setRfcValidated] = useState(false);
  
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

  // Función para extraer el resultado correcto de la respuesta
  const extractResultData = (serverResponse) => {
    console.log('=== EXTRAYENDO DATOS DEL SERVIDOR ===');
    console.log('serverResponse completo:', serverResponse);

    // Intentar varias rutas posibles para encontrar los datos
    let resultData = null;

    // Ruta 1: uploadResponse.data
    if (serverResponse && typeof serverResponse === 'object') {
      console.log('Intentando ruta 1: serverResponse directamente');

      // Verificar si los campos están directamente en serverResponse
      if (serverResponse.nombre || serverResponse.apellido_paterno) {
        resultData = serverResponse;
      }
      // Verificar si los campos están en serverResponse.resultado
      else if (serverResponse.resultado && typeof serverResponse.resultado === 'object') {
        console.log('Intentando ruta 2: serverResponse.resultado');

        // Si resultado es un objeto simple con los campos
        if (serverResponse.resultado.nombre || serverResponse.resultado.apellido_paterno) {
          resultData = serverResponse.resultado;
        }
        // Si resultado es un array, tomar el primer elemento
        else if (Array.isArray(serverResponse.resultado) && serverResponse.resultado.length > 0) {
          resultData = serverResponse.resultado[0];
        }
        // Si resultado tiene otro nivel más (Data.resultado)
        else if (serverResponse.resultado.Data && serverResponse.resultado.Data.resultado) {
          console.log('Intentando ruta 3: serverResponse.resultado.Data.resultado');
          resultData = serverResponse.resultado.Data.resultado;
        }
      }
    }

    console.log('Datos extraídos:', resultData);
    return resultData;
  };

// Capturar imagen con funcionalidad de upload
const capture = useCallback(async () => {
  const imageSrc = captureWithCanvas();
  setImgSrc(imageSrc);
  setUploading(true);
  setUploadError(null);
  setUploadProgress(0);

try {
    console.log('=== INICIO DEL PROCESO ===');
    // console.log('Modo de prueba local activado:', USE_LOCAL_TEST_MODE); // Log para depuración
    
    // Simular progreso de carga
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, 300);

    if (USE_LOCAL_TEST_MODE) {
      console.log('*** MODO LOCAL EJECUTÁNDOSE ***'); // Log de confirmación
      // MODO LOCAL: Usar datos dummy
      // console.log('Usando modo de prueba local con datos dummy');
      
      // Simular retraso de red
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Datos dummy
      const dummyData = {
        id: `${Date.now()}`,
        nombre: "AORIAN",
        segundo_nombre: "",
        apellido_paterno: "GALVAN",
        apellido_materno: "DIAZ",
        direccion1: "CCERRO EL NABO 312",
        direccion2: "COL PRIVADA JURIQUILLA 76226",
        direccion3: "QUERETARO, QRO",
        calle: "CCERRO EL NABO",
        numero_ext: "312",
        numero_int: "",
        colonia: "COL PRIVADA JURIQUILLA",
        codigo_postal: "76230",
        municipio: "QUERETARO",
        estado: "QRO"
      };
      
      setPredictionData(dummyData);
      setEditedData(dummyData);
      clearInterval(progressInterval);
      setUploadProgress(100);
    } else {
      console.log('*** MODO API REAL EJECUTÁNDOSE ***'); // Log de confirmación
      // MODO API REAL: Enviar al backend
      console.log('*** EJECUTANDO MODO API REAL ***');
      console.log('1. Imagen capturada, tamaño del data URL:', imageSrc.length);

      // Convertir el data URL a un Blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      console.log('2. Blob creado, tamaño:', blob.size, 'bytes');

      // Crear el FormData
      const formData = new FormData();
      // CAMBIO IMPORTANTE: 'image' -> 'file' para que coincida con FastAPI
      formData.append('file', blob, 'capture.jpg');

      console.log('3. FormData creado con archivo');
      console.log('4. Enviando POST a: http://35.184.12.114:8000/ai/predecir_ine_cpu');

      // Enviar el POST
      const uploadResponse = await axios.post('http://35.184.12.114:8000/ai/predecir_ine_cpu', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          console.log(`5. Progreso del upload: ${percentCompleted}%`);
        }
      });

      console.log('6. Upload exitoso!');
      console.log('   - Status:', uploadResponse.status);
      console.log('   - Data:', JSON.stringify(uploadResponse.data, null, 2));

      // Extraer los datos del resultado usando la función auxiliar
      const resultData = extractResultData(uploadResponse.data);

      if (resultData) {
        // Crear el objeto de predictionData con los campos esperados
        const newPredictionData = {
          id: `${Date.now()}`,
          nombre: resultData.nombre || '',
          segundo_nombre: resultData.segundo_nombre || resultData['segundo nombre'] || '',
          apellido_paterno: resultData.apellido_paterno || '',
          apellido_materno: resultData.apellido_materno || resultData['apellido materno'] || '',
          direccion1: resultData.direccion1 || '',
          direccion2: resultData.direccion2 || '',
          direccion3: resultData.direccion3 || '',
          calle: resultData.calle || '',
          numero_ext: resultData.numero_ext || resultData['numero ext'] || '',
          numero_int: resultData.numero_int || resultData['numero int'] || '',
          colonia: resultData.colonia || '',
          codigo_postal: resultData.codigo_postal || resultData['codigo postal'] || '',
          municipio: resultData.municipio || '',
          estado: resultData.estado || ''
        };

        console.log('Datos procesados para el estado:', newPredictionData);

        setPredictionData(newPredictionData);
        setEditedData(newPredictionData);
      } else {
        console.error('No se pudieron extraer datos válidos de la respuesta');
        setUploadError('No se pudieron extraer datos de la respuesta del servidor');

        // Usar datos por defecto en caso de error
        const defaultData = {
          id: `${Date.now()}`,
          nombre: '',
          segundo_nombre: '',
          apellido_paterno: '',
          apellido_materno: '',
          direccion1: '',
          direccion2: '',
          direccion3: '',
          calle: '',
          numero_ext: '',
          numero_int: '',
          colonia: '',
          codigo_postal: '',
          municipio: '',
          estado: ''
        };
        setPredictionData(defaultData);
        setEditedData(defaultData);
      }
    }

    setUploading(false);

    // Después de capturar, iremos a la página de resultados
    setCurrentPage('resultado');
    setIsReviewingFields(true); // Iniciar el flujo de revisión

  } catch (error) {
    console.error('ERROR EN PROCESO:');
    console.error('   - Mensaje:', error.message);
    if (!USE_LOCAL_TEST_MODE) {
      console.error('   - Response:', error.response?.data);
      console.error('   - Status:', error.response?.status);
      console.error('   - Headers:', error.response?.headers);
    }
    setUploadError(error.message);
    setUploading(false);
  }
}, [webcamRef, setImgSrc, selectedResolution, selectedDeviceId]); // Quitar useLocalTestMode de las dependencias

  // Función para regresar a tomar la foto
  const retakePhoto = () => {
    setImgSrc(null);
    setIsSaved(false);
    setIsReviewingFields(false);
    setCurrentFieldIndex(0);
    setReviewedFields(new Set());
    setCurrentPage('captura');
    // Limpiar estados de upload
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);

    // Resetear predictionData
    setPredictionData({
      id: '',
      nombre: '',
      segundo_nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      direccion1: '',
      direccion2: '',
      direccion3: '',
      calle: '',
      numero_ext: '',
      numero_int: '',
      colonia: '',
      codigo_postal: '',
      municipio: '',
      estado: ''
    });
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
      [currentField]: value.toUpperCase()
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
    // Mostrar el popup de RFC en lugar de mostrar un alert
    setShowRfcPopup(true);
  };

  // Manejar cambios en los campos editables
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData({
      ...editedData,
      [name]: value.toUpperCase()
    });
  };

  // Modificar la función handleRfcChange:
  const handleRfcChange = (e) => {
    // Convertir a mayúsculas
    const uppercaseValue = e.target.value.toUpperCase();
    setRfcText(uppercaseValue);
    // Resetear error si el usuario está escribiendo
    if (rfcError) setRfcError(false);
  };

// Reemplazar la función validateRfc con esta:
const validateRfc = () => {
  // Verificar longitud (12 o 13 caracteres)
  if (rfcText.length !== 12 && rfcText.length !== 13) {
    setRfcError(true);
    return;
  }
  
  if (USE_LOCAL_TEST_MODE) {
    // En modo local, validar solo con un RFC específico
    if (rfcText === "GADA021008F35") {
      setRfcValidated(true);
      setRfcError(false);
    } else {
      setRfcError(true);
      // Mostrar mensaje personalizado para RFC no válido
      setRfcErrorMessage("RFC no válido");
    }
  } else {
    // En modo real, solo validamos la longitud por ahora
    // Aquí iría la validación con el backend
    setRfcValidated(true);
    setRfcError(false);
  }
};

// Continuar después de validar RFC
const continueAfterRfc = () => {
  setShowRfcPopup(false);
  setIdCopied(false); // Añadir esta línea
  
  if (USE_LOCAL_TEST_MODE) {
    console.log("Modo local: Mostrando popup final con datos dummy");
    // Mostrar popup final
    setShowFinalPopup(true);
  } else {
    // Aquí iría la integración con el backend para validar el RFC
    console.log("En modo real: Aquí se implementará la validación con el backend");
    // Por ahora, solo mostramos el popup final
    setShowFinalPopup(true);
  }
};

// Cerrar el popup final y regresar a la pantalla inicial
// Reemplazar la función closeAndReset
const closeAndReset = () => {
  // Verificar si se ha copiado el ID
  if (!idCopied) {
    // Mostrar una confirmación si no se ha copiado
    if (!window.confirm('No has copiado el ID. ¿Estás seguro que deseas continuar sin copiar el ID?')) {
      return; // Si el usuario cancela, no continuar
    }
  }
  
  
  setShowFinalPopup(false);
  // Resetear estados pero sin activar la cámara
  setCurrentPage('captura');
  setIsCameraEnabled(false);
  setImgSrc(null);
  setIsSaved(false);
  setIsReviewingFields(false);
  setCurrentFieldIndex(0);
  setReviewedFields(new Set());
  setRfcText('');
  setRfcValidated(false);
  setRfcError(false);
  setCopyButtonText('Copiar');
  setIdCopied(false); // Resetear el estado de copiado
};

// Nueva función para regresar a la pantalla de resultados
const backToResults = () => {
  setShowFinalPopup(false);
  // No reiniciamos todos los estados, solo cerramos el popup
};

// Nueva función para iniciar una nueva captura desde el popup
const startNewCapture = () => {
  setShowFinalPopup(false); // Primero cerrar el popup
  retakePhoto(); // Luego llamar a la función existente para reiniciar el proceso
};

// Reemplazar la función copyIdToClipboard con esta:
const copyIdToClipboard = () => {
  navigator.clipboard.writeText(predictionData.id)
    .then(() => {
      console.log('ID copiado al portapapeles');
      setCopyButtonText('Copiado!');
      setIdCopied(true); // Actualizar el estado cuando el ID es copiado
      // Opcional: volver al texto original después de un tiempo
      setTimeout(() => setCopyButtonText('Copiar'), 3000);
    })
    .catch(err => {
      console.error('Error al copiar: ', err);
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
            {/* Si está subiendo, mostrar la imagen capturada */}
            {uploading && imgSrc ? (
              <img 
                src={imgSrc} 
                alt="Imagen capturada" 
                className="captured-image"
              />
            ) : (
              /* Si no está subiendo, mostrar la webcam */
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
            )}
            
            {/* Mostrar la información de resolución si no está subiendo */}
            {!uploading && renderResolutionInfo()}
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
                        value={typeof editedData[key] === 'string' ? editedData[key] : String(editedData[key] || '')}
                        onChange={handleInputChange}
                        className="json-input"
                      />
                    ) : (
                      <span className="json-value">
                        {typeof value === 'string' ? value : String(value || '')}
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

  // Popup de validación de RFC
const renderRfcPopup = () => (
  <div className="popup-overlay" style={{ display: showRfcPopup ? 'flex' : 'none' }}>
    <div className="popup-content">
      <h2>Captura y valida el RFC del cliente</h2>
      
      <div className="rfc-input-container">
        <input
          type="text"
          value={rfcText}
          onChange={handleRfcChange}
          placeholder="Ingresa el RFC"
          className={`rfc-input ${rfcText.length > 0 && (rfcText.length < 12 || rfcText.length > 13) ? 'rfc-input-error' : ''} ${(rfcText.length === 12 || rfcText.length === 13) ? 'rfc-input-valid' : ''}`}
          style={{ 
            color: 'black' // El texto siempre negro
          }}
          autoCapitalize="characters"
          onInput={(e) => e.target.value = e.target.value.toUpperCase()}
        />
        <button 
          onClick={validateRfc} 
          className="btn btn-validate"
          disabled={!(rfcText.length === 12 || rfcText.length === 13)}
        >
          Validar
        </button>
      </div>
      
      {rfcError && (
        <p className="rfc-error">{rfcErrorMessage}</p>
      )}
      
      {rfcValidated && (
        <div className="rfc-success">
          <p>Validación exitosa</p>
        </div>
      )}
      
      <div className="popup-buttons">
        <button onClick={() => setShowRfcPopup(false)} className="btn btn-secondary">
          Regresar
        </button>
        <button 
          onClick={continueAfterRfc} 
          className="btn btn-primary"
          disabled={!rfcValidated}
        >
          Continuar
        </button>
      </div>
    </div>
  </div>
);

// Popup de finalización
const renderFinalPopup = () => (
  <div className="popup-overlay" style={{ display: showFinalPopup ? 'flex' : 'none' }}>
    <div className="popup-content">
      <h2>Has finalizado tu proceso de captura!</h2>
      
      <p className="final-instructions">
        Copia el siguiente código y pégalo en tu Sistema 
        Legado o NPV para cargar los datos capturados, no cierres 
        esta ventana hasta no haber cargado los datos.
      </p>
      
      <div className="id-container">
        <span className="id-code">ID: {predictionData.id}</span>
        <button onClick={copyIdToClipboard} className="btn btn-copy">{copyButtonText}</button>
      </div>
      
      {!idCopied && (
        <p className="copy-warning">
          No has copiado el ID todavía. Por favor, copia el ID antes de continuar.
        </p>
      )}
      
      <div className="popup-buttons">
        <button onClick={backToResults} className="btn btn-back">
          Regresar
        </button>
        {idCopied && (
          <button onClick={startNewCapture} className="btn btn-retake-new">
            Nueva Captura
          </button>
        )}
      </div>
    </div>
  </div>
);

// Renderizar la página correspondiente según el estado
  return (
    <div className="App">
      {currentPage === 'captura' ? renderCapturePage() : renderResultPage()}
      {renderRfcPopup()}
      {renderFinalPopup()}
    </div>
  );
}

export default App;