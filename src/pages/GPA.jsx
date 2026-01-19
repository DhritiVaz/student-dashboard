import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Edit2, Trash2, X, Calculator, TrendingUp } from 'lucide-react'
import './GPA.css'

const GPA = () => {
  const { grades, addGrade, updateGrade, deleteGrade, courses, getCourseById } = useData()
  const [showModal, setShowModal] = useState(false)
  const [editingGrade, setEditingGrade] = useState(null)
  const [formData, setFormData] = useState({
    courseId: '',
    grade: '',
    credits: '',
    semester: ''
  })

  const gradePoints = {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'F': 0.0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingGrade) {
      updateGrade(editingGrade.id, formData)
    } else {
      addGrade(formData)
    }
    resetForm()
    setShowModal(false)
  }

  const resetForm = () => {
    setFormData({
      courseId: '',
      grade: '',
      credits: '',
      semester: ''
    })
    setEditingGrade(null)
  }

  const handleEdit = (grade) => {
    setEditingGrade(grade)
    setFormData({
      courseId: grade.courseId || '',
      grade: grade.grade || '',
      credits: grade.credits || '',
      semester: grade.semester || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this grade?')) {
      deleteGrade(id)
    }
  }

  const calculateGPA = () => {
    if (grades.length === 0) return { gpa: 0, totalCredits: 0, totalPoints: 0 }

    let totalPoints = 0
    let totalCredits = 0

    grades.forEach(grade => {
      const points = gradePoints[grade.grade] || 0
      const credits = parseFloat(grade.credits) || 0
      totalPoints += points * credits
      totalCredits += credits
    })

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0
    return { gpa: gpa.toFixed(2), totalCredits, totalPoints }
  }

  const calculateCGPA = () => {
    const semesters = [...new Set(grades.map(g => g.semester).filter(Boolean))]
    if (semesters.length === 0) return { cgpa: 0, semesters: 0 }

    let totalSemesterGPA = 0
    let totalSemesterCredits = 0

    semesters.forEach(semester => {
      const semesterGrades = grades.filter(g => g.semester === semester)
      let semesterPoints = 0
      let semesterCredits = 0

      semesterGrades.forEach(grade => {
        const points = gradePoints[grade.grade] || 0
        const credits = parseFloat(grade.credits) || 0
        semesterPoints += points * credits
        semesterCredits += credits
      })

      if (semesterCredits > 0) {
        totalSemesterGPA += (semesterPoints / semesterCredits) * semesterCredits
        totalSemesterCredits += semesterCredits
      }
    })

    const cgpa = totalSemesterCredits > 0 ? totalSemesterGPA / totalSemesterCredits : 0
    return { cgpa: cgpa.toFixed(2), semesters: semesters.length }
  }

  const { gpa, totalCredits } = calculateGPA()
  const { cgpa, semesters } = calculateCGPA()

  const getGradeColor = (grade) => {
    if (['A+', 'A', 'A-'].includes(grade)) return '#10b981'
    if (['B+', 'B', 'B-'].includes(grade)) return '#3b82f6'
    if (['C+', 'C', 'C-'].includes(grade)) return '#f59e0b'
    return '#ef4444'
  }

  const accentColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>GPA Calculator</h1>
          <p className="subtitle">Track and calculate your GPA and CGPA</p>
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
            Add Grade
          </button>
        </div>
      </div>

      <div className="gpa-stats">
        <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="stat-icon">
            <Calculator size={24} />
          </div>
          <div className="stat-content">
            <h3>Current GPA</h3>
            <p className="stat-value">{gpa}</p>
            <p className="stat-label">{totalCredits} total credits</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>CGPA</h3>
            <p className="stat-value">{cgpa}</p>
            <p className="stat-label">{semesters} semester{semesters !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="grades-list">
        {/* Header Row */}
        <div className="grades-list-header">
          <span>Code</span>
          <span>Course Name</span>
          <span>Grade</span>
          <span>Credits</span>
          <span>Semester</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        {/* Rows */}
        {grades.length > 0 ? (
          grades.map((grade) => {
            const course = grade.courseId ? getCourseById(grade.courseId) : null
            const gradeColor = getGradeColor(grade.grade)

            return (
              <div key={grade.id} className="grade-list-row">
                <div className="col-code">
                  {course ? course.courseCode : '?'}
                </div>

                <div className="col-course">
                  {course ? (
                    <span className="course-title">{course.courseName}</span>
                  ) : (
                    <span className="no-course">Unlinked Course</span>
                  )}
                </div>

                <div className="col-grade">
                  <span
                    className="grade-pill"
                    style={{
                      color: gradeColor,
                      backgroundColor: gradeColor + '15' // 15 = low opacity hex
                    }}
                  >
                    {grade.grade}
                  </span>
                </div>

                <div className="col-credits">
                  {grade.credits} Credits
                </div>

                <div className="col-sem">
                  {grade.semester || '-'}
                </div>

                <div className="col-actions">
                  <button onClick={() => handleEdit(grade)} className="icon-btn">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(grade.id)} className="icon-btn">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="empty-state">
            <p>No grades recorded yet.</p>
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
              <h2>{editingGrade ? 'Edit Grade' : 'Add New Grade'}</h2>
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
                <label>Course *</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Grade *</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    required
                  >
                    <option value="">Select grade</option>
                    {Object.keys(gradePoints).map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Credits *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                    required
                    placeholder="e.g., 3"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Semester</label>
                <input
                  type="text"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  placeholder="e.g., Fall 2024"
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
                  {editingGrade ? 'Update' : 'Add'} Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GPA
