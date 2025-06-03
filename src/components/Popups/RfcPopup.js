import React from 'react';

const RfcPopup = ({
  showRfcPopup,
  rfcText,
  rfcError,
  rfcValidated,
  rfcErrorMessage,
  handleRfcChange,
  validateRfc,
  setShowRfcPopup,
  continueAfterRfc
}) => {
  return (
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
              color: 'black'
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
};

export default RfcPopup;