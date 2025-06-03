import React from 'react';

const FinalPopup = ({
  showFinalPopup,
  predictionData,
  copyButtonText,
  idCopied,
  copyIdToClipboard,
  backToResults,
  startNewCapture
}) => {
  return (
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
};

export default FinalPopup;