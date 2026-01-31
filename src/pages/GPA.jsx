import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useSemester } from '../context/SemesterContext'
import { Plus, Edit2, Trash2, X, Calculator, TrendingUp, Award, Target, Settings2 } from 'lucide-react'
import PropertyFormFields from '../components/PropertyFormFields'
import PropertyManager from '../components/PropertyManager'
import './GPA.css'

const GPA = () => {
  const {
    grades,
    addGrade,
    updateGrade,
    deleteGrade,
    courses,
    getCourseById,
    getCourseDisplayName,
    getCourseProperty,
    getSemesterById,
    getPropertyDefinitions,
    addPropertyDefinition,
    deletePropertyDefinition
  } = useData()
  const { selectedSemesterId, isViewingAll } = useSemester()

  const selectedSemester = selectedSemesterId ? getSemesterById(selectedSemesterId) : null
  const gradesInScope = isViewingAll
    ? grades
    : grades.filter((g) => selectedSemester && g.semester === selectedSemester.name)
  const [showModal, setShowModal] = useState(false)
  const [showPropertyManager, setShowPropertyManager] = useState(false)
  const [editingGrade, setEditingGrade] = useState(null)
  const [formData, setFormData] = useState({
    courseId: '',
    grade: '',
    credits: '',
    semester: '',
    properties: {}
  })

  const gradePoints = {
    'S': 10.0, 'A': 9.0, 'B': 8.0, 'C': 7.0,
    'D': 6.0, 'E': 5.0
  }

  const gradeDefs = getPropertyDefinitions('grades')

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
    setFormData({ courseId: '', grade: '', credits: '', semester: '', properties: {} })
    setEditingGrade(null)
  }

  const handleEdit = (grade) => {
    setEditingGrade(grade)
    setFormData({
      courseId: grade.courseId || '',
      grade: grade.grade || '',
      credits: grade.credits || '',
      semester: grade.semester || '',
      properties: { ...(grade.properties || {}) }
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
    return { gpa: gpa.toFixed(2), totalCredits, totalPoints: totalPoints.toFixed(1) }
  }

  const calculateCGPA = () => {
    const semesters = [...new Set(grades.map(g => g.semester).filter(Boolean))]
    if (semesters.length === 0) return { cgpa: 0, semesters: 0 }
    let totalPoints = 0
    let totalCredits = 0
    grades.forEach(grade => {
        const points = gradePoints[grade.grade] || 0
        const credits = parseFloat(grade.credits) || 0
      totalPoints += points * credits
      totalCredits += credits
      })
    const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0
    return { cgpa: cgpa.toFixed(2), semesters: semesters.length }
  }

  const gradeListForStats = isViewingAll ? grades : gradesInScope
  const { gpa, totalCredits, totalPoints } = (() => {
    if (gradeListForStats.length === 0) return { gpa: 0, totalCredits: 0, totalPoints: 0 }
    let totalPoints = 0
    let totalCredits = 0
    gradeListForStats.forEach((grade) => {
      const points = gradePoints[grade.grade] || 0
      const credits = parseFloat(grade.credits) || 0
      totalPoints += points * credits
      totalCredits += credits
    })
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0
    return { gpa: gpa.toFixed(2), totalCredits, totalPoints: totalPoints.toFixed(1) }
  })()
  const { cgpa, semesters: semCount } = (() => {
    const semesters = [...new Set(grades.map((g) => g.semester).filter(Boolean))]
    if (semesters.length === 0) return { cgpa: 0, semesters: 0 }
    let totalPoints = 0
    let totalCredits = 0
    grades.forEach((grade) => {
      const points = gradePoints[grade.grade] || 0
      const credits = parseFloat(grade.credits) || 0
      totalPoints += points * credits
      totalCredits += credits
    })
    const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0
    return { cgpa: cgpa.toFixed(2), semesters: semesters.length }
  })()

  const getGradeColor = (grade) => {
    if (['S'].includes(grade)) return '#10b981'
    if (['A', 'B'].includes(grade)) return '#3b82f6'
    if (['C', 'D'].includes(grade)) return '#f59e0b'
    return '#f97316'
  }

  const getGradeGlow = (grade) => {
    if (['S'].includes(grade)) return 'rgba(16, 185, 129, 0.3)'
    if (['A', 'B'].includes(grade)) return 'rgba(59, 130, 246, 0.3)'
    if (['C', 'D'].includes(grade)) return 'rgba(245, 158, 11, 0.3)'
    return 'rgba(249, 115, 22, 0.3)'
  }

  // Group grades by semester
  const gradesBySemester = gradesInScope.reduce((acc, grade) => {
    const sem = grade.semester || 'Unassigned'
    if (!acc[sem]) acc[sem] = []
    acc[sem].push(grade)
    return acc
  }, {})

  return (
    <div className="gpa-page">
      <div className="page-header">
        <div>
          <h1>CGPA Calculator</h1>
          <p className="subtitle">Track your academic performance</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={() => setShowPropertyManager(true)}>
            <Settings2 size={18} /> Properties
          </button>
          <button type="button" className="btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
            <Plus size={18} />
            Add Grade
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="gpa-stats">
        <div className="gpa-stat-card main-stat">
          <div className="stat-visual">
            <div className="stat-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="8"
                  strokeDasharray={`${(parseFloat(isViewingAll ? cgpa : gpa) / 10) * 283} 283`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="stat-ring-value">
                <span className="big-value">{isViewingAll ? cgpa : gpa}</span>
                <span className="label">{isViewingAll ? 'CGPA' : 'Semester GPA'}</span>
              </div>
            </div>
          </div>
          <div className="stat-glow"></div>
        </div>

        <div className="gpa-stat-card">
          <div className="stat-icon-box purple">
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">{isViewingAll ? 'Current GPA' : 'This semester'}</span>
            <span className="stat-number">{gpa}</span>
            <span className="stat-sub">{gradeListForStats.length} grades</span>
          </div>
        </div>

        <div className="gpa-stat-card">
          <div className="stat-icon-box cyan">
            <Award size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Credits</span>
            <span className="stat-number">{totalCredits}</span>
            <span className="stat-sub">{isViewingAll ? `Across ${semCount} semesters` : 'This semester'}</span>
          </div>
        </div>

        <div className="gpa-stat-card">
          <div className="stat-icon-box green">
            <Target size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Grade Points</span>
            <span className="stat-number">{totalPoints}</span>
            <span className="stat-sub">Total earned</span>
          </div>
        </div>
      </div>

      {/* Grades List */}
      <div className="grades-container">
        {Object.keys(gradesBySemester).length > 0 ? (
          Object.entries(gradesBySemester).map(([semester, semGrades]) => (
            <div key={semester} className="semester-section">
              <h3 className="semester-title">{semester}</h3>
              <div className="grades-grid">
                {semGrades.map((grade, idx) => {
            const course = grade.courseId ? getCourseById(grade.courseId) : null
            const gradeColor = getGradeColor(grade.grade)
                  const gradeGlow = getGradeGlow(grade.grade)

            return (
                    <div 
                      key={grade.id} 
                      className="grade-card"
                      style={{ '--delay': `${idx * 0.05}s` }}
                    >
                      <div className="grade-badge" style={{ 
                        background: `${gradeColor}15`, 
                      color: gradeColor,
                        boxShadow: `0 0 20px ${gradeGlow}`
                      }}>
                    {grade.grade}
                </div>
                      <div className="grade-info">
                        <span className="grade-code">{course ? getCourseProperty(course, 'Course Code') || 'N/A' : 'N/A'}</span>
                        <span className="grade-course">{course ? getCourseDisplayName(course) : 'Unknown Course'}</span>
                        <span className="grade-credits">{grade.credits} Credits</span>
                </div>
                      <div className="grade-actions">
                        <button onClick={() => handleEdit(grade)}>
                          <Edit2 size={14} />
                  </button>
                        <button onClick={() => handleDelete(grade.id)} className="delete">
                          <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Calculator size={48} />
            <h3>No grades recorded</h3>
            <p>Add your course grades to calculate your CGPA</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Add First Grade
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showPropertyManager && (
        <PropertyManager
          entityType="grades"
          entityLabel="Grades"
          definitions={gradeDefs}
          onAdd={addPropertyDefinition}
          onDelete={deletePropertyDefinition}
          onClose={() => setShowPropertyManager(false)}
        />
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm() }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingGrade ? 'Edit Grade' : 'Add New Grade'}</h2>
              <button type="button" className="icon-btn" onClick={() => { setShowModal(false); resetForm() }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Course</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {getCourseProperty(course, 'Course Code')} - {getCourseDisplayName(course)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    required
                  >
                    <option value="">Select grade</option>
                    {Object.keys(gradePoints).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Credits</label>
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
                  placeholder="e.g., Fall 2025"
                />
              </div>
              <PropertyFormFields
                entityType="grades"
                definitions={gradeDefs}
                values={formData.properties}
                onChange={(properties) => setFormData({ ...formData, properties })}
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm() }}>
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
