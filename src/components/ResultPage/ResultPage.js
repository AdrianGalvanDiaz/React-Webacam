import React from 'react';

const ResultPage = ({
  isReviewingFields,
  predictionData,
  fieldOrder,
  currentFieldIndex,
  reviewedFields,
  isEditingCurrentField,
  editedData,
  isEditing,
  isSaved,
  imgSrc,
  handleFieldChange,
  handleInputChange,
  handleEdit,
  handleDoneEditing,
  handleSave,
  retakePhoto,
  handleContinue,
  handleFieldEdit,
  handleFieldCheck
}) => {
  return (
    <div className={`result-page ${isReviewingFields ? 'reviewing' : ''}`}>
      <a href="#" onClick={(e) => { e.preventDefault(); retakePhoto(); }} className="back-link">
        Regresar
      </a>
      <h1 className="page-title">Paso 3: Revisión de datos</h1>
      <p className="subtitle">
        Revisa los datos capturados uno por uno, para avanzar haz click en "Continuar". En caso de existir un error, haz click en "Editar", corrige el dato y da click en "guardar" para poder continuar.
      </p>
      <p className="edit-note">
      </p>      
      
      {/* Overlay gris si estamos en modo revisión */}
      {isReviewingFields && <div className="review-overlay"></div>}
      
      <div className="result-container">
        <div className="data-section">
          <h2 className="data-section-divider">Datos Detectados</h2>
          
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
                  Guardar
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
          <h3 className="id-title">ID: {predictionData.id}</h3>
          
          {/* Botón continuar en la sección de imagen */}
          {!isReviewingFields && (
            <div className="image-actions">
              <button 
                onClick={handleContinue} 
                className="btn btn-continue"
                disabled={!isSaved}>
                Continuar
              </button>
            </div>
          )}
        </div>
      </div>
      
      
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
              <span>✓</span> Guardar {isEditingCurrentField}
            </button>
          </div>
          <div className="review-instruction">
            Presiona Enter o haz clic en ✓ para continuar
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPage;