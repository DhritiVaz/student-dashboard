import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Edit2, Trash2, FileText, X } from 'lucide-react'
import './Courses.css'

const Courses = () => {
  const { courses, addCourse, updateCourse, deleteCourse, files } = useData()
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    venue: '',
    faculty: '',
    classNumber: '',
    description: ''
  })

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

  const resetForm = () => {
    setFormData({
      courseCode: '',
      courseName: '',
      venue: '',
      faculty: '',
      classNumber: '',
      description: ''
    })
    setEditingCourse(null)
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      courseCode: course.courseCode || '',
      courseName: course.courseName || '',
      venue: course.venue || '',
      faculty: course.faculty || '',
      classNumber: course.classNumber || '',
      description: course.description || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this course?')) {
      deleteCourse(id)
    }
  }

  const getCourseFiles = (courseId) => {
    return files.filter(f => f.courseId === courseId)
  }

  const accentColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // orange
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16'  // lime
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Courses</h1>
          <p>Manage your courses and their details</p>
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

      <div className="courses-grid">
        {courses.map((course, index) => {
          const courseFiles = getCourseFiles(course.id)
          const accentColor = accentColors[index % accentColors.length]
          
          return (
            <div 
              key={course.id} 
              className="course-card"
              style={{ borderLeftColor: accentColor }}
            >
              <div className="course-card-header">
                <div>
                  <h3>{course.courseCode || 'No Code'}</h3>
                  <p className="course-name">{course.courseName || 'Untitled Course'}</p>
                </div>
                <div className="course-actions">
                  <button 
                    className="icon-btn"
                    onClick={() => handleEdit(course)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="icon-btn"
                    onClick={() => handleDelete(course.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="course-details">
                {course.venue && (
                  <div className="detail-item">
                    <span className="detail-label">Venue:</span>
                    <span>{course.venue}</span>
                  </div>
                )}
                {course.faculty && (
                  <div className="detail-item">
                    <span className="detail-label">Faculty:</span>
                    <span>{course.faculty}</span>
                  </div>
                )}
                {course.classNumber && (
                  <div className="detail-item">
                    <span className="detail-label">Class:</span>
                    <span>{course.classNumber}</span>
                  </div>
                )}
                {course.description && (
                  <p className="course-description">{course.description}</p>
                )}
              </div>

              {courseFiles.length > 0 && (
                <div className="course-files">
                  <FileText size={14} />
                  <span>{courseFiles.length} file{courseFiles.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )
        })}

        {courses.length === 0 && (
          <div className="empty-state">
            <p>No courses yet. Add your first course to get started!</p>
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
              <h2>{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
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
                <label>Course Code *</label>
                <input
                  type="text"
                  value={formData.courseCode}
                  onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                  required
                  placeholder="e.g., CS101"
                />
              </div>
              <div className="form-group">
                <label>Course Name *</label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  required
                  placeholder="e.g., Introduction to Computer Science"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g., Room 201"
                  />
                </div>
                <div className="form-group">
                  <label>Faculty</label>
                  <input
                    type="text"
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    placeholder="e.g., Dr. Smith"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Class Number</label>
                <input
                  type="text"
                  value={formData.classNumber}
                  onChange={(e) => setFormData({ ...formData, classNumber: e.target.value })}
                  placeholder="e.g., Section A"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Course description..."
                  rows={3}
                />
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
                <button type="submit" className="btn-primary">
                  {editingCourse ? 'Update' : 'Add'} Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Courses
