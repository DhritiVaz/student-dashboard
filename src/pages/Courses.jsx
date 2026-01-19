console.log('COURSES CSS IMPORT TEST');

import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Edit2, Trash2, FileText, X, List, Grid, BookOpen } from 'lucide-react'
import './Courses.css'

const Courses = () => {
  const { courses, addCourse, updateCourse, deleteCourse, files } = useData()
  const [viewMode, setViewMode] = useState('list') // 'list' or 'card'
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    venue: '',
    faculty: '',
    classNumber: '',
    credits: '3', // Default
    description: ''
  })

  // --- Helpers ---
  const getCourseFiles = (courseId) => {
    return files.filter(f => f.courseId === courseId)
  }

  const resetForm = () => {
    setFormData({
      courseCode: '',
      courseName: '',
      venue: '',
      faculty: '',
      classNumber: '',
      credits: '3',
      description: ''
    })
    setEditingCourse(null)
  }

  // --- Input Handlers with Validation Logic ---
  const handleInputChange = (field, value) => {
    let formattedValue = value

    // 1. Course Code: Capital letters and numbers only
    if (field === 'courseCode') {
      formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    }

    // 2. Course Name & Faculty: First letter capital
    if ((field === 'courseName' || field === 'faculty') && value.length > 0) {
      formattedValue = value.charAt(0).toUpperCase() + value.slice(1)
    }

    // 3. Class Number: Start with CH, followed by numbers only
    if (field === 'classNumber') {
      // Force uppercase
      let clean = value.toUpperCase()

      // If user types numbers directly (e.g. "1"), prepend CH
      if (/^[0-9]/.test(clean)) {
        clean = 'CH' + clean
      }

      // Extract numeric part if 'CH' exists
      if (clean.startsWith('CH')) {
        const numbers = clean.slice(2).replace(/[^0-9]/g, '')
        clean = 'CH' + numbers
      } else if (clean.startsWith('C')) {
        // Allow 'C' as user might be typing 'CH'
        if (clean.length > 1 && clean[1] !== 'H') {
          // If valid number follows C? unlikely, force CH pattern
          clean = 'CH'
        }
      } else {
        // Invalid start character, block it unless empty
        if (clean.length > 0) clean = ''
      }

      formattedValue = clean
    }

    // 4. Venue: Letters, numbers, and hyphens only
    if (field === 'venue') {
      formattedValue = value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase()
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }))
  }

  // --- Actions ---
  const handleSubmit = (e) => {
    e.preventDefault()

    if (editingCourse) {
      updateCourse(editingCourse.id, formData)
    } else {
      addCourse(formData)
    }
    resetForm()
    setShowModal(false)
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      courseCode: course.courseCode || '',
      courseName: course.courseName || '',
      venue: course.venue || '',
      faculty: course.faculty || '',
      classNumber: course.classNumber || '',
      credits: course.credits || '3',
      description: course.description || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this course?')) {
      deleteCourse(id)
    }
  }

  // --- Views ---

  const renderListView = () => (
    <div className="courses-list-view fade-in">
      <div className="list-header-row">
        <span className="col-code">Code</span>
        <span className="col-name">Course Name</span>
        <span className="col-meta">Details</span>
        <span className="col-actions">Actions</span>
      </div>
      <div className="list-body">
        {courses.map(course => (
          <div key={course.id} className="course-list-row">
            <div className="col-code">
              <span className="code-badge">{course.courseCode}</span>
            </div>
            <div className="col-name">
              <span className="name-text">{course.courseName}</span>
              {course.description && <span className="desc-preview">{course.description}</span>}
            </div>
            <div className="col-meta">
              {course.venue && <span className="meta-tag">{course.venue}</span>}
              {course.classNumber && <span className="meta-tag">{course.classNumber}</span>}
              {course.credits && <span className="meta-tag" style={{ color: 'var(--accent-primary)' }}>{course.credits} Cr</span>}
              {course.faculty && <span className="meta-tag">{course.faculty}</span>}
            </div>
            <div className="col-actions">
              <button onClick={() => handleEdit(course)} className="action-btn"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(course.id)} className="action-btn delete"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCardView = () => (
    <div className="courses-grid fade-in">
      {courses.map((course) => {
        const fileCount = getCourseFiles(course.id).length
        return (
          <div key={course.id} className="course-card">
            <div className="course-card-header">
              <div>
                <span className="course-code-sm">{course.courseCode}</span>
                <h3 className="course-name">{course.courseName}</h3>
              </div>
              <div className="card-actions-top">
                <button onClick={() => handleEdit(course)}><Edit2 size={14} /></button>
              </div>
            </div>

            <div className="course-card-details">
              {(course.venue) && (
                <div className="detail-row">
                  <span className="label">Venue</span>
                  <span className="val">{course.venue}</span>
                </div>
              )}
              {(course.faculty) && (
                <div className="detail-row">
                  <span className="label">Faculty</span>
                  <span className="val">{course.faculty}</span>
                </div>
              )}
              {(course.classNumber) && (
                <div className="detail-row">
                  <span className="label">Class</span>
                  <span className="val">{course.classNumber}</span>
                </div>
              )}
            </div>

            <div className="course-card-footer">
              {fileCount > 0 && (
                <div className="file-badge">
                  <FileText size={12} /> {fileCount} Files
                </div>
              )}
              <button onClick={() => handleDelete(course.id)} className="icon-btn-danger"><Trash2 size={14} /></button>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="courses-page">
      <div className="courses-header">
        <div>
          <h1>Courses</h1>
          <p className="subtitle">Overview of your enrolled subjects</p>
        </div>

        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
            <button
              className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              title="Card View"
            >
              <Grid size={18} />
            </button>
          </div>

          <button
            className="btn-primary"
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
          >
            <Plus size={18} />
            Add Course
          </button>
        </div>
      </div>

      <div className="courses-content">
        {courses.length > 0 ? (
          viewMode === 'list' ? renderListView() : renderCardView()
        ) : (
          <div className="empty-state-large">
            <BookOpen size={48} className="text-muted" />
            <h3>Start your academic journey</h3>
            <p>Add your courses to begin tracking classes and grades.</p>
            <button className="btn-text-action" onClick={() => setShowModal(true)}>+ Add First Course</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCourse ? 'Edit Course' : 'Add Course'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="course-form">
              {/* Row 1: Code & Name */}
              <div className="form-row">
                <div className="form-group col-1-3">
                  <label>Code</label>
                  <input
                    type="text"
                    value={formData.courseCode}
                    onChange={(e) => handleInputChange('courseCode', e.target.value)}
                    placeholder="CS101"
                    required
                  />
                </div>
                <div className="form-group col-2-3">
                  <label>Course Name</label>
                  <input
                    type="text"
                    value={formData.courseName}
                    onChange={(e) => handleInputChange('courseName', e.target.value)}
                    placeholder="Intro to Computer Science"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Venue, Class, Credits */}
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    placeholder="ROOM-301"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Credits</label>
                  <select
                    value={formData.credits}
                    onChange={(e) => handleInputChange('credits', e.target.value)}
                    required
                  >
                    <option value="">-</option>
                    <option value="1">1</option>
                    <option value="1.5">1.5</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Class & Faculty */}
              <div className="form-row">
                <div className="form-group">
                  <label>Class #</label>
                  <input
                    type="text"
                    value={formData.classNumber}
                    onChange={(e) => handleInputChange('classNumber', e.target.value)}
                    placeholder="CH101"
                  />
                </div>
                <div className="form-group">
                  <label>Teacher</label>
                  <input
                    type="text"
                    value={formData.faculty}
                    onChange={(e) => handleInputChange('faculty', e.target.value)}
                    placeholder="Dr. Smith"
                  />
                </div>
              </div>

              {/* Row 4: Desc */}
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  placeholder="Add notes about this course..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Courses
