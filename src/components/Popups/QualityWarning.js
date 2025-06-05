import React from 'react';

const QualityWarning = ({
  showQualityWarning,
  closeQualityWarning
}) => {
  return (
    <div className="popup-overlay" style={{ display: showQualityWarning ? 'flex' : 'none' }}>
      <div className="popup-content">
        <h2>⚠️ Detección incompleta</h2>
        
        <p className="quality-warning-text">
          No se pudieron detectar suficientes datos de tu identificación.
        </p>
        
        <div className="quality-tips">
          <p><strong>Verifica que:</strong></p>
          <ul>
            <li>Estés usando tu <strong>INE</strong> (no otra identificación)</li>
            <li>El documento esté en la <strong>orientación correcta</strong></li>
            <li>Toda la identificación sea <strong>visible en la cámara</strong></li>
            <li>La imagen tenga <strong>buena iluminación</strong></li>
            <li>No haya <strong>reflejos o sombras</strong></li>
          </ul>
        </div>
        
        <div className="popup-buttons">
          <button onClick={closeQualityWarning} className="btn btn-primary">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualityWarning;