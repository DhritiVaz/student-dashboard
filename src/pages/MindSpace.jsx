import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Edit2, Trash2, X, Check, FileText, Upload } from 'lucide-react'
import './MindSpace.css'

const MindSpace = () => {
  const {
    mindSpaceItems,
    addMindSpaceItem,
    updateMindSpaceItem,
    deleteMindSpaceItem
  } = useData()
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text',
    file: null
  })

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
      file: null
    })
    setEditingItem(null)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      title: item.title || '',
      content: item.content || '',
      type: item.type || 'text',
      file: item.file || null
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

  const accentColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Mind Space</h1>
          <p className="subtitle">Your personal space for todos, notes, and files</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>
      </div>

      {incompleteItems.length > 0 && (
        <div className="mindspace-section">
          <h2 className="section-title">Active</h2>
          <div className="mindspace-grid">
            {incompleteItems.map((item, index) => {
              const accentColor = accentColors[index % accentColors.length]

              return (
                <div
                  key={item.id}
                  className="mindspace-card"
                  style={{ borderLeftColor: accentColor }}
                >
                  <div className="mindspace-card-header">
                    <div className="mindspace-checkbox" onClick={() => handleToggleComplete(item.id)}>
                      <div className={`checkbox ${item.completed ? 'checked' : ''}`}>
                        {item.completed && <Check size={14} />}
                      </div>
                    </div>
                    <h3>{item.title || 'Untitled'}</h3>
                    <div className="mindspace-actions">
                      <button
                        className="icon-btn"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {item.type === 'file' && item.file && (
                    <div className="mindspace-file">
                      <FileText size={16} />
                      <span>{item.file.name}</span>
                      <span className="file-size">
                        {(item.file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}

                  {item.type === 'text' && item.content && (
                    <p className="mindspace-content">{item.content}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {completedItems.length > 0 && (
        <div className="mindspace-section">
          <h2 className="section-title">Completed</h2>
          <div className="mindspace-grid">
            {completedItems.map((item, index) => {
              const accentColor = accentColors[index % accentColors.length]

              return (
                <div
                  key={item.id}
                  className="mindspace-card completed"
                  style={{ borderLeftColor: accentColor }}
                >
                  <div className="mindspace-card-header">
                    <div className="mindspace-checkbox" onClick={() => handleToggleComplete(item.id)}>
                      <div className="checkbox checked">
                        <Check size={14} />
                      </div>
                    </div>
                    <h3 className="completed-text">{item.title || 'Untitled'}</h3>
                    <div className="mindspace-actions">
                      <button
                        className="icon-btn"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {item.type === 'file' && item.file && (
                    <div className="mindspace-file">
                      <FileText size={16} />
                      <span>{item.file.name}</span>
                    </div>
                  )}

                  {item.type === 'text' && item.content && (
                    <p className="mindspace-content completed-text">{item.content}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {mindSpaceItems.length === 0 && (
        <div className="empty-state">
          <p>Your mind space is empty. Add items to organize your thoughts!</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false)
          resetForm()
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button
                className="icon-btn"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Review lecture notes"
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="text">Text Note</option>
                  <option value="file">File</option>
                </select>
              </div>
              {formData.type === 'text' ? (
                <div className="form-group">
                  <label>Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your note here..."
                    rows={6}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>File</label>
                  <label className="file-upload">
                    <Upload size={18} />
                    <span>{formData.file ? formData.file.name : 'Choose file or drag and drop'}</span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Update' : 'Add'} Item
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
