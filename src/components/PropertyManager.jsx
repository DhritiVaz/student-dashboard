import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import './PropertyManager.css'

const PROPERTY_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' }
]

export function PropertyManager({ entityType, entityLabel, definitions = [], onAdd, onDelete, onClose }) {
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('text')

  const handleAdd = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    onAdd(entityType, { name, type: newType })
    setNewName('')
    setNewType('text')
  }

  return (
    <div className="property-manager-overlay" onClick={onClose}>
      <div className="property-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="property-manager-header">
          <h3>Properties for {entityLabel}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="property-manager-desc">
          Add custom properties. They will appear when adding or editing {entityLabel.toLowerCase()}.
        </p>
        <div className="property-manager-list">
          {definitions.length === 0 ? (
            <p className="property-manager-empty">No properties yet. Add one below.</p>
          ) : (
            <ul>
              {definitions.map((def) => (
                <li key={def.id} className="property-manager-item">
                  <span className="property-manager-item-name">{def.name}</span>
                  <span className="property-manager-item-type">{def.type}</span>
                  <button
                    type="button"
                    className="property-manager-delete"
                    onClick={() => onDelete(entityType, def.id)}
                    aria-label={`Remove ${def.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form onSubmit={handleAdd} className="property-manager-add">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Course Code, Credits"
            required
          />
          <select value={newType} onChange={(e) => setNewType(e.target.value)}>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary btn-sm">
            <Plus size={16} /> Add
          </button>
        </form>
      </div>
    </div>
  )
}

export default PropertyManager
