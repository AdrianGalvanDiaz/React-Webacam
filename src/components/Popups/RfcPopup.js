import React from 'react';

const RfcPopup = ({
  showRfcPopup,
  rfcText,
  rfcError,
  rfcValidated,
  rfcErrorMessage,
  handleRfcChange,
  validateRfc,
  closeRfcPopup,
  continueAfterRfc
}) => {
  return (
    <div className="popup-overlay" style={{ display: showRfcPopup ? 'flex' : 'none' }}>
      <div className="popup-content" style={{ position: 'relative' }}>
        <button 
          className="close-btn" 
          onClick={closeRfcPopup}
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
        <h2>Captura y valida el RFC del cliente</h2>
        
        <div className="rfc-input-container">
          <input
            type="text"
            value={rfcText}
            onChange={handleRfcChange}
            placeholder="Ingresa el RFC"
            className={`rfc-input ${(rfcText.length > 0 && rfcText.length < 12) || (rfcError && rfcText.length >= 12) ? 'rfc-input-error' : ''} ${rfcValidated ? 'rfc-input-valid' : ''}`}
            style={{ 
              color: 'black'
            }}
            autoCapitalize="characters"
            onInput={(e) => e.target.value = e.target.value.toUpperCase()}
          />
          <button 
            onClick={validateRfc} 
            className="btn btn-validate"
            disabled={!(rfcText.length === 12 || rfcText.length === 13) || rfcValidated}
          >
            Validar
          </button>
        </div>
        
        {rfcValidated ? (
          <p className="rfc-success">Validación exitosa</p>
        ) : rfcError && (rfcText.length === 12 || rfcText.length === 13) ? (
          <p className="rfc-error">{rfcErrorMessage}</p>
        ) : rfcText.length > 0 && (rfcText.length < 12 || rfcText.length > 13) ? (
          <p className="rfc-error">El RFC debe contener 12 o 13 caracteres alfanuméricos</p>
        ) : null}

        <div className="popup-buttons">
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