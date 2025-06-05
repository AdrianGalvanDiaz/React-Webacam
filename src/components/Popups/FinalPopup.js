import React from 'react';

const FinalPopup = ({
  showFinalPopup,
  predictionData,
  copyButtonText,
  idCopied,
  hasEverCopied,
  copyIdToClipboard,
  closeFinalPopup,
  startNewCapture
}) => {
  return (
    <div className="popup-overlay" style={{ display: showFinalPopup ? 'flex' : 'none' }}>
      <div className="popup-content" style={{ position: 'relative' }}>
        <button 
          onClick={closeFinalPopup}
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: '#666',
            cursor: 'pointer',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
        <h2>Has finalizado tu proceso de captura!</h2>
        
        <p className="final-instructions">
          Copia el siguiente código y pégalo en tu Sistema 
          Legado o NPV para cargar los datos capturados, no cierres 
          esta ventana hasta no haber cargado los datos.
        </p>
        
        <div className="id-container">
          <span className="id-code">ID: {predictionData.id}</span>
          <button 
            onClick={copyIdToClipboard} 
            className={`btn-copy ${idCopied ? 'copied' : ''}`}
          >
            {idCopied ? (
              <>
                <span>✓</span>
                <span>Copiado</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
        
        {!hasEverCopied && (
          <p className="copy-warning">
            No has copiado el ID todavía. Por favor, copia el ID antes de continuar.
          </p>
        )}
        
        <div className="popup-buttons">
          {hasEverCopied && (
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