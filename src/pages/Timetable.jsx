import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Edit2, Trash2, X, Clock } from 'lucide-react'
import './Timetable.css'

const Timetable = () => {
  const { timetable, updateTimetable, courses, getCourseById } = useData()
  const [showModal, setShowModal] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState(null)
  const [formData, setFormData] = useState({
    day: 'monday',
    period: 1,
    courseId: '',
    startTime: '',
    endTime: ''
  })

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' }
  ]

  const periods = [1, 2, 3, 4, 5, 6, 7, 8]

  const handleSubmit = (e) => {
    e.preventDefault()
    const dayPeriods = [...(timetable[formData.day] || [])]
    
    if (editingPeriod) {
      const index = dayPeriods.findIndex(p => p.period === editingPeriod.period && p.day === editingPeriod.day)
      if (index !== -1) {
        dayPeriods[index] = {
          ...dayPeriods[index],
          courseId: formData.courseId,
          startTime: formData.startTime,
          endTime: formData.endTime
        }
      }
    } else {
      // Check if period already exists
      const existingIndex = dayPeriods.findIndex(p => p.period === formData.period)
      if (existingIndex !== -1) {
        dayPeriods[existingIndex] = {
          ...dayPeriods[existingIndex],
          courseId: formData.courseId,
          startTime: formData.startTime,
          endTime: formData.endTime
        }
      } else {
        dayPeriods.push({
          period: formData.period,
          courseId: formData.courseId,
          startTime: formData.startTime,
          endTime: formData.endTime
        })
      }
    }
    
    updateTimetable(formData.day, dayPeriods)
    resetForm()
    setShowModal(false)
  }

  const resetForm = () => {
    setFormData({
      day: 'monday',
      period: 1,
      courseId: '',
      startTime: '',
      endTime: ''
    })
    setEditingPeriod(null)
  }

  const handleEdit = (day, period) => {
    const dayPeriods = timetable[day] || []
    const periodData = dayPeriods.find(p => p.period === period)
    if (periodData) {
      setEditingPeriod({ ...periodData, day, period })
      setFormData({
        day,
        period,
        courseId: periodData.courseId || '',
        startTime: periodData.startTime || '',
        endTime: periodData.endTime || ''
      })
      setShowModal(true)
    }
  }

  const handleDelete = (day, period) => {
    if (confirm('Are you sure you want to remove this period?')) {
      const dayPeriods = timetable[day] || []
      const updated = dayPeriods.filter(p => p.period !== period)
      updateTimetable(day, updated)
    }
  }

  const getPeriodData = (day, period) => {
    const dayPeriods = timetable[day] || []
    return dayPeriods.find(p => p.period === period)
  }

  const accentColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Timetable</h1>
          <p>Manage your weekly class schedule</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
        >
          <Plus size={18} />
          Add Period
        </button>
      </div>

      <div className="timetable-container">
        <div className="timetable-grid">
          <div className="timetable-header">
            <div className="time-header">Time</div>
            {days.map(day => (
              <div key={day.key} className="day-header">
                {day.label}
              </div>
            ))}
          </div>

          {periods.map(period => (
            <div key={period} className="timetable-row">
              <div className="period-label">
                Period {period}
              </div>
              {days.map(day => {
                const periodData = getPeriodData(day.key, period)
                const course = periodData?.courseId ? getCourseById(periodData.courseId) : null
                const colorIndex = period % accentColors.length
                
                return (
                  <div 
                    key={`${day.key}-${period}`} 
                    className="timetable-cell"
                    onClick={() => {
                      if (periodData) {
                        handleEdit(day.key, period)
                      } else {
                        setFormData({
                          day: day.key,
                          period,
                          courseId: '',
                          startTime: '',
                          endTime: ''
                        })
                        setShowModal(true)
                      }
                    }}
                  >
                    {periodData && course ? (
                      <div 
                        className="period-card"
                        style={{ borderLeftColor: accentColors[colorIndex] }}
                      >
                        <div className="period-card-header">
                          <h4>{course.courseCode}</h4>
                          <div className="period-actions">
                            <button 
                              className="icon-btn-small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(day.key, period)
                              }}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              className="icon-btn-small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(day.key, period)
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <p className="course-name-small">{course.courseName}</p>
                        {periodData.startTime && periodData.endTime && (
                          <div className="period-time">
                            <Clock size={12} />
                            <span>{periodData.startTime} - {periodData.endTime}</span>
                          </div>
                        )}
                        {course.venue && (
                          <div className="period-venue">{course.venue}</div>
                        )}
                      </div>
                    ) : (
                      <div className="empty-period">
                        <Plus size={16} />
                        <span>Add</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false)
          resetForm()
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPeriod ? 'Edit Period' : 'Add Period'}</h2>
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
                <label>Day *</label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  required
                >
                  {days.map(day => (
                    <option key={day.key} value={day.key}>{day.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Period *</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: parseInt(e.target.value) })}
                  required
                >
                  {periods.map(p => (
                    <option key={p} value={p}>Period {p}</option>
                  ))}
                </select>
              </div>
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
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
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
                  {editingPeriod ? 'Update' : 'Add'} Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Timetable
