import React from 'react'
import './PropertyFormFields.css'

const PROPERTY_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' }
]

export function PropertyFormFields({ entityType, definitions, values = {}, onChange }) {
  if (!definitions || definitions.length === 0) return null

  const handleChange = (propName, value) => {
    onChange({ ...values, [propName]: value })
  }

  return (
    <div className="property-form-fields">
      {definitions.map((def) => (
        <div key={def.id} className="property-field-group">
          <label>{def.name}</label>
          {def.type === 'text' && (
            <input
              type="text"
              value={values[def.name] ?? ''}
              onChange={(e) => handleChange(def.name, e.target.value)}
              placeholder={def.name}
            />
          )}
          {def.type === 'number' && (
            <input
              type="number"
              value={values[def.name] ?? ''}
              onChange={(e) => handleChange(def.name, e.target.value)}
              placeholder={def.name}
            />
          )}
          {def.type === 'date' && (
            <input
              type="date"
              value={values[def.name] ?? ''}
              onChange={(e) => handleChange(def.name, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default PropertyFormFields
