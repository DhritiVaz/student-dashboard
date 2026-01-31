import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Edit2, Trash2, X, Check, FileText, Upload, Brain, CheckCircle2, Settings2 } from 'lucide-react'
import PropertyFormFields from '../components/PropertyFormFields'
import PropertyManager from '../components/PropertyManager'
import './MindSpace.css'

const MindSpace = () => {
  const {
    mindSpaceItems,
    addMindSpaceItem,
    updateMindSpaceItem,
    deleteMindSpaceItem,
    getPropertyDefinitions,
    addPropertyDefinition,
    deletePropertyDefinition
  } = useData()
  const [showModal, setShowModal] = useState(false)
  const [showPropertyManager, setShowPropertyManager] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text',
    priority: 'medium',
    file: null,
    properties: {}
  })

  const noteDefs = getPropertyDefinitions('mind_space_items')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingItem) {
      updateMindSpaceItem(editingItem.id, formData)
    } else {
      addMindSpaceItem(formData)
    }
    resetForm()
    setShowModal(false)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'text',
      priority: 'medium',
      file: null,
      properties: {}
    })
    setEditingItem(null)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      title: item.title || '',
      content: item.content || '',
      type: item.type || 'text',
      priority: item.priority || 'medium',
      file: item.file || null,
      properties: { ...(item.properties || {}) }
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMindSpaceItem(id)
    }
  }

  const handleToggleComplete = (id) => {
    const item = mindSpaceItems.find(i => i.id === id)
    updateMindSpaceItem(id, { completed: !item.completed })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({
          ...formData,
          type: 'file',
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            data: reader.result
          }
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const incompleteItems = mindSpaceItems.filter(i => !i.completed)
  const completedItems = mindSpaceItems.filter(i => i.completed)

  const priorityColors = {
    high: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
    medium: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    low: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' }
  }

  const accentColors = ['#3b82f6', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#f97316', '#84cc16']

  return (
    <div className="mindspace-page">
      <div className="page-header">
        <div>
          <h1>Mind Space</h1>
          <p className="subtitle">{incompleteItems.length} active • {completedItems.length} completed</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={() => setShowPropertyManager(true)}>
            <Settings2 size={18} /> Properties
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
          >
            <Plus size={18} />
            Add Note
          </button>
        </div>
      </div>

      {incompleteItems.length > 0 && (
        <div className="notes-section">
          <h2 className="section-title">
            <span className="title-icon active"></span>
            Active Tasks
          </h2>
          <div className="notes-grid">
            {incompleteItems.map((item, index) => {
              const accentColor = accentColors[index % accentColors.length]
              const priority = priorityColors[item.priority] || priorityColors.medium

              return (
                <div
                  key={item.id}
                  className="note-card"
                  style={{ '--delay': `${index * 0.05}s`, '--accent': accentColor }}
                >
                  <div className="card-accent" style={{ background: accentColor }}></div>
                  
                  <div className="note-header">
                      <button
                      className="check-btn"
                      onClick={() => handleToggleComplete(item.id)}
                    >
                      <div className="check-circle"></div>
                    </button>
                    <h3 className="note-title">{item.title || 'Untitled'}</h3>
                    <div className="note-actions">
                      <button onClick={() => handleEdit(item)}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {item.type === 'file' && item.file && (
                    <div className="note-file">
                      <FileText size={16} />
                      <span>{item.file.name}</span>
                      <span className="file-size">{(item.file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  )}

                  {item.type === 'text' && item.content && (
                    <p className="note-content">{item.content}</p>
                  )}

                  <div className="note-footer">
                    {item.priority && (
                      <span 
                        className="priority-tag"
                        style={{ 
                          background: priority.bg, 
                          color: priority.color,
                          borderColor: priority.border 
                        }}
                      >
                        {item.priority}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {completedItems.length > 0 && (
        <div className="notes-section completed-section">
          <h2 className="section-title">
            <span className="title-icon completed"></span>
            Completed
          </h2>
          <div className="notes-grid">
            {completedItems.map((item, index) => (
                <div
                  key={item.id}
                className="note-card completed"
                style={{ '--delay': `${index * 0.05}s` }}
                >
                <div className="note-header">
                  <button 
                    className="check-btn checked"
                    onClick={() => handleToggleComplete(item.id)}
                  >
                    <div className="check-circle">
                      <Check size={12} />
                    </div>
                      </button>
                  <h3 className="note-title">{item.title || 'Untitled'}</h3>
                  <div className="note-actions">
                    <button onClick={() => handleDelete(item.id)} className="delete">
                      <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                {item.content && (
                  <p className="note-content">{item.content}</p>
                  )}
                </div>
            ))}
          </div>
        </div>
      )}

      {mindSpaceItems.length === 0 && (
        <div className="empty-state">
          <Brain size={48} />
          <h3>Your mind space is empty</h3>
          <p>Add notes and tasks to organize your thoughts</p>
          <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add First Note
          </button>
        </div>
      )}

      {showPropertyManager && (
        <PropertyManager
          entityType="mind_space_items"
          entityLabel="Notes"
          definitions={noteDefs}
          onAdd={addPropertyDefinition}
          onDelete={deletePropertyDefinition}
          onClose={() => setShowPropertyManager(false)}
        />
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm() }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Note' : 'Add New Note'}</h2>
              <button className="icon-btn" onClick={() => { setShowModal(false); resetForm() }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Review lecture notes"
                />
              </div>
              <div className="form-row">
              <div className="form-group">
                  <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="text">Text Note</option>
                  <option value="file">File</option>
                </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              {formData.type === 'text' ? (
                <div className="form-group">
                  <label>Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your note here..."
                    rows={4}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>File</label>
                  <label className="file-upload-area">
                    <Upload size={24} />
                    <span>{formData.file ? formData.file.name : 'Choose file or drag and drop'}</span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
              <PropertyFormFields
                entityType="mind_space_items"
                definitions={noteDefs}
                values={formData.properties}
                onChange={(properties) => setFormData({ ...formData, properties })}
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm() }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Update' : 'Add'} Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MindSpace
