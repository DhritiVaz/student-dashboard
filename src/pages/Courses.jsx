import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Edit2, Trash2, X, List, Grid, BookOpen, Users, MapPin, Award } from 'lucide-react'
import './Courses.css'

const Courses = () => {
  const { courses, addCourse, updateCourse, deleteCourse, files } = useData()
  const [viewMode, setViewMode] = useState('card')
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)

  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    venue: '',
    faculty: '',
    classNumber: '',
    credits: '3',
    description: ''
  })

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

  const handleInputChange = (field, value) => {
    let formattedValue = value

    if (field === 'courseCode') {
      formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    }

    if ((field === 'courseName' || field === 'faculty') && value.length > 0) {
      formattedValue = value.charAt(0).toUpperCase() + value.slice(1)
    }

    if (field === 'classNumber') {
      let clean = value.toUpperCase()
      if (/^[0-9]/.test(clean)) {
        clean = 'CH' + clean
      }
      if (clean.startsWith('CH')) {
        const numbers = clean.slice(2).replace(/[^0-9]/g, '')
        clean = 'CH' + numbers
      } else if (clean.startsWith('C')) {
        if (clean.length > 1 && clean[1] !== 'H') {
          clean = 'CH'
        }
      } else {
        if (clean.length > 0) clean = ''
      }
      formattedValue = clean
    }

    if (field === 'venue') {
      formattedValue = value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase()
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }))
  }

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

  const renderListView = () => (
    <div className="courses-list fade-in">
      <div className="list-header">
        <span className="col-code">Code</span>
        <span className="col-name">Course Name</span>
        <span className="col-details">Details</span>
        <span className="col-progress">Progress</span>
        <span className="col-actions">Actions</span>
      </div>
      <div className="list-body">
        {courses.map((course, idx) => (
          <div 
            key={course.id} 
            className="list-row"
            style={{ '--delay': `${idx * 0.05}s` }}
          >
            <div className="col-code">
              <span className="code-badge" style={{ background: `${course.color}20`, color: course.color }}>
                {course.courseCode}
              </span>
            </div>
            <div className="col-name">
              <span className="course-name">{course.courseName}</span>
              {course.faculty && <span className="course-faculty">{course.faculty}</span>}
            </div>
            <div className="col-details">
              {course.venue && (
                <span className="detail-tag">
                  <MapPin size={12} /> {course.venue}
                </span>
              )}
              {course.credits && (
                <span className="detail-tag credit-tag">
                  <Award size={12} /> {course.credits} Cr
                </span>
              )}
            </div>
            <div className="col-progress">
              <div className="mini-progress">
                <div 
                  className="mini-progress-fill" 
                  style={{ width: `${course.progress || 0}%`, background: course.color }}
                ></div>
              </div>
              <span className="progress-text">{course.progress || 0}%</span>
            </div>
            <div className="col-actions">
              <button onClick={() => handleEdit(course)} className="action-btn">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(course.id)} className="action-btn delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCardView = () => (
    <div className="courses-grid fade-in">
      {courses.map((course, idx) => {
        const fileCount = getCourseFiles(course.id).length
        return (
          <div 
            key={course.id} 
            className="course-card"
            style={{ '--delay': `${idx * 0.05}s`, '--accent': course.color }}
          >
            <div className="card-glow-effect" style={{ background: course.color }}></div>
            
            <div className="card-top">
              <div className="card-header">
                <span className="card-code" style={{ color: course.color }}>{course.courseCode}</span>
                <div className="card-actions">
                  <button onClick={() => handleEdit(course)} className="card-action-btn">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(course.id)} className="card-action-btn delete">
                    <Trash2 size={14} />
                  </button>
              </div>
              </div>
              <h3 className="card-title">{course.courseName}</h3>
              {course.description && (
                <p className="card-desc">{course.description}</p>
              )}
            </div>

            <div className="card-details">
              {course.faculty && (
                <div className="detail-item">
                  <Users size={14} />
                  <span>{course.faculty}</span>
                </div>
              )}
              {course.venue && (
                <div className="detail-item">
                  <MapPin size={14} />
                  <span>{course.venue}</span>
                </div>
              )}
            </div>

            <div className="card-footer">
              <div className="card-progress">
                <div className="card-progress-bar">
                  <div 
                    className="card-progress-fill" 
                    style={{ width: `${course.progress || 0}%`, background: course.color }}
                  ></div>
                </div>
                <span className="card-progress-text">{course.progress || 0}%</span>
              </div>
              <div className="card-stats">
                <span className="stat-item" style={{ color: course.color }}>
                  <Award size={14} /> {course.credits} Credits
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="courses-page">
      <div className="page-header">
        <div>
          <h1>Courses</h1>
          <p className="subtitle">{courses.length} active courses • {courses.reduce((acc, c) => acc + (parseFloat(c.credits) || 0), 0)} total credits</p>
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
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>Start your academic journey</h3>
            <p>Add your courses to begin tracking classes and grades.</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Add First Course
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCourse ? 'Edit Course' : 'Add Course'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Code</label>
                  <input
                    type="text"
                    value={formData.courseCode}
                    onChange={(e) => handleInputChange('courseCode', e.target.value)}
                    placeholder="CS101"
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Course Name</label>
                  <input
                    type="text"
                    value={formData.courseName}
                    onChange={(e) => handleInputChange('courseName', e.target.value)}
                    placeholder="Introduction to Computer Science"
                    required
                  />
                </div>
              </div>

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

              <div className="form-row">
                <div className="form-group">
                  <label>Class Number</label>
                  <input
                    type="text"
                    value={formData.classNumber}
                    onChange={(e) => handleInputChange('classNumber', e.target.value)}
                    placeholder="CH101"
                  />
                </div>
                <div className="form-group">
                  <label>Faculty</label>
                  <input
                    type="text"
                    value={formData.faculty}
                    onChange={(e) => handleInputChange('faculty', e.target.value)}
                    placeholder="Dr. Smith"
                  />
                </div>
              </div>

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
