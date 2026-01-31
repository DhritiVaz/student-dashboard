import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useSemester } from '../context/SemesterContext'
import { Plus, Trash2, X, Upload, FileText, Download, BookOpen, Image, Video, Music, FileSpreadsheet, File, Settings2 } from 'lucide-react'
import PropertyFormFields from '../components/PropertyFormFields'
import PropertyManager from '../components/PropertyManager'
import './Files.css'

const Files = () => {
  const {
    files,
    addFile,
    deleteFile,
    courses,
    getCourseById,
    getCourseDisplayName,
    getCourseProperty,
    getPropertyDefinitions,
    addPropertyDefinition,
    deletePropertyDefinition
  } = useData()
  const { selectedSemesterId, isViewingAll } = useSemester()

  const courseIdsInScope = isViewingAll
    ? null
    : new Set(courses.filter((c) => c.semesterId === selectedSemesterId).map((c) => c.id))
  const filesInScope = isViewingAll
    ? files
    : files.filter((f) => !f.courseId || (courseIdsInScope && courseIdsInScope.has(f.courseId)))
  const [showModal, setShowModal] = useState(false)
  const [showPropertyManager, setShowPropertyManager] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    file: null,
    properties: {}
  })

  const fileDefs = getPropertyDefinitions('files')

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
          fileData: reader.result,
          properties: formData.properties || {}
        })
        resetForm()
        setShowModal(false)
      }
      reader.readAsDataURL(formData.file)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', courseId: '', file: null, properties: {} })
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
    if (fileType?.startsWith('image/')) return <Image size={24} />
    if (fileType?.startsWith('video/')) return <Video size={24} />
    if (fileType?.startsWith('audio/')) return <Music size={24} />
    if (fileType?.includes('pdf')) return <FileText size={24} />
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileSpreadsheet size={24} />
    return <File size={24} />
  }

  const getFileColor = (fileType) => {
    if (fileType?.startsWith('image/')) return '#ec4899'
    if (fileType?.startsWith('video/')) return '#f97316'
    if (fileType?.startsWith('audio/')) return '#a855f7'
    if (fileType?.includes('pdf')) return '#ef4444'
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return '#10b981'
    return '#3b82f6'
  }

  const accentColors = ['#3b82f6', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#f97316']

  const filesByCourse = filesInScope.reduce((acc, file) => {
    const courseId = file.courseId || 'uncategorized'
    if (!acc[courseId]) acc[courseId] = []
    acc[courseId].push(file)
    return acc
  }, {})

  return (
    <div className="files-page">
      <div className="page-header">
        <div>
          <h1>Files</h1>
          <p className="subtitle">
          {isViewingAll ? `${files.length} files` : `${filesInScope.length} files in this semester`}
        </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={() => setShowPropertyManager(true)}>
            <Settings2 size={18} /> Properties
          </button>
          <button type="button" className="btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
            <Plus size={18} />
            Upload File
          </button>
        </div>
      </div>

      <div className="files-container">
        {Object.keys(filesByCourse).length > 0 ? (
          Object.entries(filesByCourse).map(([courseId, courseFiles], sectionIdx) => {
          const course = courseId !== 'uncategorized' ? getCourseById(courseId) : null
            const accentColor = accentColors[sectionIdx % accentColors.length]

          return (
            <div key={courseId} className="files-section">
                <div className="section-header" style={{ '--accent': accentColor }}>
                  <div className="section-icon" style={{ background: `${accentColor}20`, color: accentColor }}>
                    {course ? <BookOpen size={20} /> : <FileText size={20} />}
                    </div>
                  <div className="section-info">
                    <h3>{course ? getCourseProperty(course, 'Course Code') || getCourseDisplayName(course) : 'Uncategorized'}</h3>
                    <p>{course ? getCourseDisplayName(course) : 'Files not linked to any course'}</p>
                    </div>
                  <span className="file-count" style={{ background: `${accentColor}20`, color: accentColor }}>
                    {courseFiles.length}
                  </span>
              </div>

              <div className="files-grid">
                  {courseFiles.map((file, idx) => {
                    const fileColor = getFileColor(file.fileType)
                    return (
                      <div 
                        key={file.id} 
                        className="file-card"
                        style={{ '--delay': `${idx * 0.05}s` }}
                      >
                        <div className="file-icon-box" style={{ background: `${fileColor}15`, color: fileColor }}>
                      {getFileIcon(file.fileType)}
                    </div>
                    <div className="file-info">
                          <h4 className="file-name">{file.name}</h4>
                      <p className="file-meta">
                        {formatFileSize(file.fileSize)}
                        {file.fileType && ` • ${file.fileType.split('/')[1]?.toUpperCase() || 'FILE'}`}
                      </p>
                    </div>
                    <div className="file-actions">
                      <button
                            className="file-action-btn download"
                        onClick={() => handleDownload(file)}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                            className="file-action-btn delete"
                        onClick={() => handleDelete(file.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                    )
                  })}
              </div>
            </div>
          )
          })
        ) : (
          <div className="empty-state">
            <Upload size={48} />
            <h3>No files uploaded</h3>
            <p>Upload your course materials, notes, and documents</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Upload First File
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm() }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload File</h2>
              <button className="icon-btn" onClick={() => { setShowModal(false); resetForm() }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>File</label>
                <label className="file-drop-zone">
                  <Upload size={32} />
                  <div className="drop-text">
                    <span className="drop-main">
                      {formData.file ? formData.file.name : 'Click to upload or drag and drop'}
                    </span>
                    <span className="drop-sub">PDF, DOC, Images, Videos up to 50MB</span>
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
                <label>Display Name</label>
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
                  <option value="">No course selected</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {getCourseProperty(course, 'Course Code')} - {getCourseDisplayName(course)}
                    </option>
                  ))}
                </select>
              </div>
              <PropertyFormFields
                entityType="files"
                definitions={fileDefs}
                values={formData.properties}
                onChange={(properties) => setFormData({ ...formData, properties })}
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm() }}>
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

      {showPropertyManager && (
        <PropertyManager
          entityType="files"
          entityLabel="Files"
          definitions={fileDefs}
          onAdd={addPropertyDefinition}
          onDelete={deletePropertyDefinition}
          onClose={() => setShowPropertyManager(false)}
        />
      )}
    </div>
  )
}

export default Files
