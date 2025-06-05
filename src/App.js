import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import './App.css';

// Importar componentes modulares
import CapturePage from './components/CapturePage/CapturePage';
import ResultPage from './components/ResultPage/ResultPage';
import RfcPopup from './components/Popups/RfcPopup';
import FinalPopup from './components/Popups/FinalPopup';
import QualityWarning from './components/Popups/QualityWarning';

function App() {
  const USE_LOCAL_TEST_MODE = true; // Constante global - cambiar a false para usar API real

  // Estado para la navegación
  const [currentPage, setCurrentPage] = useState('captura'); // 'captura' o 'resultado'
  
  // Estados de la cámara
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [resolution, setResolution] = useState({ width: 0, height: 0 });
  
  // Estado para visibilidad de la guia
  const [showIdGuide, setShowIdGuide] = useState(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [showInitialGuide, setShowInitialGuide] = useState(false);

  // Nuevo estado para el status de resolución
  const [resolutionStatus, setResolutionStatus] = useState('checking'); // 'good', 'suboptimal', 'checking'
  const [isCameraReady, setIsCameraReady] = useState(false);

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
    estado: '',
    curp: ''
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
  
  // Agregar estos estados para la validación de calidad
const [showQualityWarning, setShowQualityWarning] = useState(false);
const [detectionQualityPoor, setDetectionQualityPoor] = useState(false);

  // Lista de campos en el orden que queremos revisar (excluyendo ID)
  const fieldOrder = [
    'nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno',
    'calle', 'numero_ext', 'numero_int', 'colonia', 'codigo_postal', 
    'municipio', 'estado', 'curp'
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
  const [hasEverCopied, setHasEverCopied] = useState(false);
  
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
    setIsCameraReady(false);
    setResolutionStatus('checking');
    setShowInitialGuide(true);
    
    // Iniciar el proceso de búsqueda de resolución óptima
    setTimeout(() => {
      tryNextResolution(0);
    }, 100);
    
    // Esperar 2 segundos antes de habilitar el botón
    setTimeout(() => {
      setIsCameraReady(true);
    }, 2000);
  };

  const confirmInitialGuide = () => {
    setShowInitialGuide(false);
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

// Función para validar la calidad de la detección
const validateDetectionQuality = (data) => {
  // Lista de campos a validar (excluyendo ID)
  const fieldsToCheck = [
    'nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno',
    'direccion1', 'direccion2', 'direccion3', 'calle', 'numero_ext', 
    'numero_int', 'colonia', 'codigo_postal', 'municipio', 'estado', 'curp'
  ];
  
  // Contar campos que tienen contenido
  const fieldsWithContent = fieldsToCheck.filter(field => {
    const value = data[field];
    return value && typeof value === 'string' && value.trim().length > 0;
  }).length;
  
  console.log(`Campos con contenido: ${fieldsWithContent} de ${fieldsToCheck.length}`);
  
  // Si hay 5 o menos campos con contenido, la calidad es pobre
  return fieldsWithContent <= 5;
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
      console.log('*** MODO LOCAL EJECUTÁNDOSE ***');
      
      // Simular retraso de red
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      // Datos dummy
      const dummyData = {
        id: `${Date.now()}`,
        nombre: "AYLEN",
        segundo_nombre: "FERNANDA",
        apellido_paterno: "ANDRADE",
        apellido_materno: "FARIAS",
        direccion1: "CDA XITLALLI 2982",
        direccion2: "FRACC CASA MAYA RESIDENCIAL 21255",
        direccion3: "MEXICALI, B.C.",
        calle: "CDA XITLALLI",
        numero_ext: "2982",
        numero_int: "",
        colonia: "FRACC CASA MAYA RESIDENCIAL",
        codigo_postal: "21255",
        municipio: "MEXICALI",
        estado: "B.C.",
        curp: "AAFA020808MBCHS76J"
      };
      
      setPredictionData(dummyData);
      setEditedData(dummyData);

      // Validar calidad de detección
      const poorQuality = validateDetectionQuality(dummyData);
      setDetectionQualityPoor(poorQuality);
      if (poorQuality) {
        setShowQualityWarning(true);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
    } else {
      console.log('*** MODO API REAL EJECUTÁNDOSE ***');
      console.log('*** EJECUTANDO MODO API REAL ***');
      console.log('1. Imagen capturada, tamaño del data URL:', imageSrc.length);

      // Convertir el data URL a un Blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      console.log('2. Blob creado, tamaño:', blob.size, 'bytes');

      // Crear el FormData
      const formData = new FormData();
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
          estado: resultData.estado || '',
          curp: resultData.curp || ''
        };

        console.log('Datos procesados para el estado:', newPredictionData);

        setPredictionData(newPredictionData);
        setEditedData(newPredictionData);

        // Validar calidad de detección
        const poorQuality = validateDetectionQuality(newPredictionData);
        setDetectionQualityPoor(poorQuality);
        if (poorQuality) {
          setShowQualityWarning(true);
        }
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
          estado: '',
          curp: ''
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
}, [webcamRef, setImgSrc, selectedResolution, selectedDeviceId]);

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

    // Resetear estados de calidad
    setShowQualityWarning(false);
    setDetectionQualityPoor(false);

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
      estado: '',
      curp: ''
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
      const nextIndex = currentFieldIndex + 1;
      setCurrentFieldIndex(nextIndex);
      
      // Auto-scroll al siguiente campo con offset para el footer
      setTimeout(() => {
        const nextField = document.querySelector('.current-field');
        if (nextField) {
          const fieldRect = nextField.getBoundingClientRect();
          const footerHeight = 120; // Altura aproximada del footer
          const offset = fieldRect.top + window.scrollY - footerHeight;
          
          window.scrollTo({
            top: offset,
            behavior: 'smooth'
          });
        }
      }, 100);
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
    // Resetear estados antes de mostrar RFC
    resetAllPopupStates();
    // Mostrar el popup de RFC
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
    // Resetear TODOS los estados de validación cuando el usuario modifica el input
    setRfcError(false);
    setRfcValidated(false);
  }; 

  // Función para resetear todo el flujo de RFC y Final
  const resetAllPopupStates = () => {
    // Estados RFC
    setRfcText('');
    setRfcError(false);
    setRfcValidated(false);
    
    // Estados Final
    setIdCopied(false);
    setHasEverCopied(false);
  };

  // Función para cerrar el popup de RFC
  const closeRfcPopup = () => {
    setShowRfcPopup(false);
    resetAllPopupStates();
  };

  // Función para cerrar el popup final
  const closeFinalPopup = () => {
    setShowFinalPopup(false);
    resetAllPopupStates();
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
    setIdCopied(false);
    
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
    setIdCopied(false);

    // Resetear estados de calidad
    setShowQualityWarning(false);
    setDetectionQualityPoor(false);  
  };

  // Nueva función para regresar a la pantalla de resultados
  const backToResults = () => {
    setShowFinalPopup(false);
    // No reiniciamos todos los estados, solo cerramos el popup
  };

  // Nueva función para iniciar una nueva captura desde el popup
  const startNewCapture = () => {
    setShowFinalPopup(false); // Cerrar el popup
    resetAllPopupStates(); // Resetear estados de popups
    
    // Resetear todos los estados para volver a pantalla 1
    setCurrentPage('captura');
    setIsCameraEnabled(false);
    setDevices([]);
    setImgSrc(null);
    setIsSaved(false);
    setIsReviewingFields(false);
    setCurrentFieldIndex(0);
    setReviewedFields(new Set());
    setIsEditing(false);
    
    // Resetear datos
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
      estado: '',
      curp: ''
    });
    
    // Limpiar estados de upload
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setShowQualityWarning(false);
    setDetectionQualityPoor(false);
  };

  // Función para cerrar el popup de advertencia de calidad
  const closeQualityWarning = () => {
    setShowQualityWarning(false);
  };

  // Función para copiar ID al portapapeles
  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(predictionData.id)
      .then(() => {
        console.log('ID copiado al portapapeles');
        setIdCopied(true);
        setHasEverCopied(true);
        // Volver al estado original después de 5 segundos
        setTimeout(() => {
          setIdCopied(false);
        }, 5000);
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

          setIsCameraReady(true); // Habilitar el botón cuando el video esté listo
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

  // Renderizar la página correspondiente según el estado
  return (
    <div className="App">
      {currentPage === 'captura' ? (
        <CapturePage
          devices={devices}
          isCameraEnabled={isCameraEnabled}
          selectedDeviceId={selectedDeviceId}
          uploading={uploading}
          imgSrc={imgSrc}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
          showIdGuide={showIdGuide}
          selectedResolution={selectedResolution}
          resolution={resolution}
          resolutionStatus={resolutionStatus}
          webcamRef={webcamRef}
          loadDevices={loadDevices}
          enableCamera={enableCamera}
          capture={capture}
          setIsCameraEnabled={setIsCameraEnabled}
          setShowIdGuide={setShowIdGuide}
          setDevices={setDevices}
          showHelpPopup={showHelpPopup}
          setShowHelpPopup={setShowHelpPopup}
          isCameraReady={isCameraReady}
          showInitialGuide={showInitialGuide}
          confirmInitialGuide={confirmInitialGuide}          
          renderResolutionInfo={renderResolutionInfo}
        />     
      ) : (
        <ResultPage
          isReviewingFields={isReviewingFields}
          predictionData={predictionData}
          fieldOrder={fieldOrder}
          currentFieldIndex={currentFieldIndex}
          reviewedFields={reviewedFields}
          isEditingCurrentField={isEditingCurrentField}
          editedData={editedData}
          isEditing={isEditing}
          isSaved={isSaved}
          imgSrc={imgSrc}
          handleFieldChange={handleFieldChange}
          handleInputChange={handleInputChange}
          handleEdit={handleEdit}
          handleDoneEditing={handleDoneEditing}
          handleSave={handleSave}
          retakePhoto={retakePhoto}
          handleContinue={handleContinue}
          handleFieldEdit={handleFieldEdit}
          handleFieldCheck={handleFieldCheck}
        />
      )}
      
      <RfcPopup
        showRfcPopup={showRfcPopup}
        rfcText={rfcText}
        rfcError={rfcError}
        rfcValidated={rfcValidated}
        rfcErrorMessage={rfcErrorMessage}
        handleRfcChange={handleRfcChange}
        validateRfc={validateRfc}
        closeRfcPopup={closeRfcPopup}
        continueAfterRfc={continueAfterRfc}
      />
      
      <FinalPopup
        showFinalPopup={showFinalPopup}
        predictionData={predictionData}
        copyButtonText={copyButtonText}
        idCopied={idCopied}
        hasEverCopied={hasEverCopied}
        copyIdToClipboard={copyIdToClipboard}
        closeFinalPopup={closeFinalPopup}
        startNewCapture={startNewCapture}
      />
      
      <QualityWarning
        showQualityWarning={showQualityWarning}
        closeQualityWarning={closeQualityWarning}
      />
    </div>
  );
}

export default App;