import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Trash2, X, Upload, FileText, Download, BookOpen } from 'lucide-react'
import './Files.css'

const Files = () => {
  const { files, addFile, deleteFile, courses, getCourseById } = useData()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    file: null
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        addFile({
          name: formData.name || formData.file.name,
          courseId: formData.courseId || null,
          fileName: formData.file.name,
          fileSize: formData.file.size,
          fileType: formData.file.type,
          fileData: reader.result
        })
        resetForm()
        setShowModal(false)
      }
      reader.readAsDataURL(formData.file)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      courseId: '',
      file: null
    })
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteFile(id)
    }
  }

  const handleDownload = (file) => {
    const link = document.createElement('a')
    link.href = file.fileData
    link.download = file.fileName || file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({
        ...formData,
        file,
        name: formData.name || file.name
      })
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return '🖼️'
    if (fileType?.startsWith('video/')) return '🎥'
    if (fileType?.startsWith('audio/')) return '🎵'
    if (fileType?.includes('pdf')) return '📄'
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝'
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return '📊'
    return '📁'
  }

  const accentColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  const filesByCourse = files.reduce((acc, file) => {
    const courseId = file.courseId || 'uncategorized'
    if (!acc[courseId]) acc[courseId] = []
    acc[courseId].push(file)
    return acc
  }, {})

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>File Management</h1>
          <p className="subtitle">Upload and organize your files by course</p>
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
            Upload File
          </button>
        </div>
      </div>

      <div className="files-container">
        {Object.keys(filesByCourse).map((courseId, index) => {
          const course = courseId !== 'uncategorized' ? getCourseById(courseId) : null
          const courseFiles = filesByCourse[courseId]
          const accentColor = accentColors[index % accentColors.length]

          return (
            <div key={courseId} className="files-section">
              <div className="files-section-header" style={{ borderLeftColor: accentColor }}>
                {course ? (
                  <>
                    <BookOpen size={18} />
                    <div>
                      <h2>{course.courseCode}</h2>
                      <p>{course.courseName}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    <div>
                      <h2>Uncategorized</h2>
                      <p>Files not linked to any course</p>
                    </div>
                  </>
                )}
                <span className="file-count">{courseFiles.length}</span>
              </div>
              <div className="files-grid">
                {courseFiles.map((file) => (
                  <div key={file.id} className="file-card">
                    <div className="file-icon">
                      {getFileIcon(file.fileType)}
                    </div>
                    <div className="file-info">
                      <h3>{file.name}</h3>
                      <p className="file-meta">
                        {formatFileSize(file.fileSize)}
                        {file.fileType && ` • ${file.fileType.split('/')[1]?.toUpperCase() || 'FILE'}`}
                      </p>
                    </div>
                    <div className="file-actions">
                      <button
                        className="icon-btn"
                        onClick={() => handleDownload(file)}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => handleDelete(file.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {files.length === 0 && (
          <div className="empty-state">
            <p>No files uploaded yet. Upload your first file to get started!</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false)
          resetForm()
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload File</h2>
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
                <label>File *</label>
                <label className="file-upload-large">
                  <Upload size={24} />
                  <div>
                    <span className="upload-text">
                      {formData.file ? formData.file.name : 'Choose file or drag and drop'}
                    </span>
                    <span className="upload-hint">Click to browse or drag and drop</span>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    required
                  />
                </label>
              </div>
              <div className="form-group">
                <label>File Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Leave empty to use original filename"
                />
              </div>
              <div className="form-group">
                <label>Link to Course (Optional)</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                >
                  <option value="">None</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </select>
              </div>
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
                <button type="submit" className="btn-primary" disabled={!formData.file}>
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Files
