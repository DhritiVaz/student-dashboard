import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Edit2, Trash2, X, Clock, MapPin, Calendar, List, Layout as LayoutIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import './Timetable.css'

const Timetable = () => {
  const { timetable, updateTimetable, courses, getCourseById } = useData()
  const [viewMode, setViewMode] = useState('day') // 'day', 'week', 'list'
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Clean initial state
  const [formData, setFormData] = useState({
    day: 'monday',
    courseId: '',
    startTime: '',
    endTime: '',
    venue: ''
  })

  const days = [
    { key: 'monday', label: 'Mon', fullLabel: 'Monday' },
    { key: 'tuesday', label: 'Tue', fullLabel: 'Tuesday' },
    { key: 'wednesday', label: 'Wed', fullLabel: 'Wednesday' },
    { key: 'thursday', label: 'Thu', fullLabel: 'Thursday' },
    { key: 'friday', label: 'Fri', fullLabel: 'Friday' },
    { key: 'saturday', label: 'Sat', fullLabel: 'Saturday' },
    { key: 'sunday', label: 'Sun', fullLabel: 'Sunday' }
  ]

  // Default to today
  const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const initialDay = days.find(d => d.key === todayKey) ? todayKey : 'monday'
  const [activeDay, setActiveDay] = useState(initialDay)

  // --- Actions ---
  const handleSubmit = (e) => {
    e.preventDefault()
    const dayPeriods = [...(timetable[formData.day] || [])]
    const course = getCourseById(formData.courseId)

    // Use course venue if not explicitly set
    const finalVenue = formData.venue || (course ? course.venue : '')

    if (editingId !== null) {
      const index = dayPeriods.findIndex(p => p.period === editingId)
      if (index !== -1) {
        dayPeriods[index] = {
          ...dayPeriods[index],
          courseId: formData.courseId,
          startTime: formData.startTime,
          endTime: formData.endTime,
          venue: finalVenue
        }
      }
    } else {
      const newId = Date.now()
      dayPeriods.push({
        period: newId,
        courseId: formData.courseId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        venue: finalVenue
      })
    }

    // Sort by start time
    dayPeriods.sort((a, b) => a.startTime.localeCompare(b.startTime))

    updateTimetable(formData.day, dayPeriods)
    resetForm()
    setShowModal(false)
  }

  const resetForm = () => {
    setFormData({
      day: activeDay,
      courseId: '',
      startTime: '',
      endTime: '',
      venue: ''
    })
    setEditingId(null)
  }

  const handleEdit = (day, periodId) => {
    const dayPeriods = timetable[day] || []
    const periodData = dayPeriods.find(p => p.period === periodId)
    if (periodData) {
      const course = getCourseById(periodData.courseId)
      setEditingId(periodId)
      setFormData({
        day,
        courseId: periodData.courseId || '',
        startTime: periodData.startTime || '',
        endTime: periodData.endTime || '',
        venue: periodData.venue || (course ? course.venue : '')
      })
      setShowModal(true)
    }
  }

  const handleDelete = (day, periodId) => {
    if (confirm('Remove this class?')) {
      const dayPeriods = timetable[day] || []
      const updated = dayPeriods.filter(p => p.period !== periodId)
      updateTimetable(day, updated)
    }
  }

  // --- Render Helpers ---

  const getDayClasses = (dayKey) => {
    const classes = timetable[dayKey] || []
    return [...classes].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  }

  // 1. Day View Render
  const renderDayView = () => {
    const sortedClasses = getDayClasses(activeDay)
    const currentDayLabel = days.find(d => d.key === activeDay)?.fullLabel

    return (
      <div className="view-container fade-in">
        {/* Day Navigation */}
        <div className="day-nav-header">
          <button
            className="nav-arrow"
            onClick={() => {
              const idx = days.findIndex(d => d.key === activeDay)
              const prev = days[idx - 1] || days[days.length - 1]
              setActiveDay(prev.key)
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="current-day-title">{currentDayLabel}</h2>
          <button
            className="nav-arrow"
            onClick={() => {
              const idx = days.findIndex(d => d.key === activeDay)
              const next = days[idx + 1] || days[0]
              setActiveDay(next.key)
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {sortedClasses.length > 0 ? (
          <div className="day-list">
            {sortedClasses.map((item) => {
              const course = getCourseById(item.courseId)
              if (!course) return null
              return (
                <div key={item.period} className="day-class-card">
                  <div className="time-strip">
                    <span className="start-time">{item.startTime}</span>
                    <span className="end-time">{item.endTime}</span>
                  </div>
                  <div className="class-details">
                    <h3 className="class-name">{course.courseName}</h3>
                    <div className="class-info-row">
                      <span className="class-code-badge">{course.courseCode}</span>
                      {(item.venue || course.venue) && (
                        <span className="venue-meta">
                          <MapPin size={14} /> {item.venue || course.venue}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => handleEdit(activeDay, item.period)}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(activeDay, item.period)} className="delete-btn"><Trash2 size={16} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-day-placeholder">
            <Clock size={48} className="text-calm" />
            <p>No classes scheduled for {currentDayLabel}</p>
            <button className="btn-text-action" onClick={() => {
              resetForm()
              setFormData(prev => ({ ...prev, day: activeDay }))
              setShowModal(true)
            }}>+ Add Class</button>
          </div>
        )}
      </div>
    )
  }

  // 2. Week View Render
  const renderWeekView = () => {
    return (
      <div className="view-container week-grid-container fade-in">
        <div className="week-grid">
          {days.map(day => {
            const dayClasses = getDayClasses(day.key)
            return (
              <div key={day.key} className="week-col">
                <div className="week-col-header">
                  <span className="day-short">{day.label}</span>
                </div>
                <div className="week-col-body">
                  {dayClasses.map(item => {
                    const course = getCourseById(item.courseId)
                    if (!course) return null
                    return (
                      <div key={item.period} className="week-card-mini" onClick={() => handleEdit(day.key, item.period)}>
                        <span className="mini-time">{item.startTime}</span>
                        <span className="mini-code">{course.courseCode}</span>
                      </div>
                    )
                  })}
                  {dayClasses.length === 0 && (
                    <div className="week-empty-slot"></div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 3. List View Render
  const renderListView = () => {
    // Flatten all classes
    const allDaysWithClasses = days.filter(d => (timetable[d.key] || []).length > 0)

    return (
      <div className="view-container list-view-container fade-in">
        {allDaysWithClasses.length > 0 ? (
          allDaysWithClasses.map(day => (
            <div key={day.key} className="list-day-group">
              <h3 className="list-day-header">{day.fullLabel}</h3>
              <div className="list-group-items">
                {getDayClasses(day.key).map(item => {
                  const course = getCourseById(item.courseId)
                  if (!course) return null
                  return (
                    <div key={item.period} className="list-item-row">
                      <div className="list-time">{item.startTime} - {item.endTime}</div>
                      <div className="list-content">
                        <span className="list-subject">{course.courseName}</span>
                        <span className="list-venue">{item.venue || course.venue}</span>
                      </div>
                      <div className="list-actions">
                        <button onClick={() => handleEdit(day.key, item.period)}><Edit2 size={14} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-day-placeholder">
            <List size={48} className="text-calm" />
            <p>Your timetable is completely empty.</p>
            <button className="btn-text-action" onClick={() => setShowModal(true)}>Start Adding Classes</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="timetable-page">
      {/* Page Header */}
      <div className="timetable-header">
        <div>
          <h1>Timetable</h1>
          <p className="subtitle">Manage your weekly schedule</p>
        </div>

        <div className="header-controls">
          {/* View Switcher */}
          <div className="view-switcher">
            <button
              className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
              title="Day View"
            >
              <LayoutIcon size={18} />
              <span>Day</span>
            </button>
            <button
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
              title="Week View"
            >
              <Calendar size={18} />
              <span>Week</span>
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
              <span>List</span>
            </button>
          </div>

          <button
            className="btn-primary"
            onClick={() => {
              resetForm()
              setFormData(prev => ({ ...prev, day: activeDay }))
              setShowModal(true)
            }}
          >
            <Plus size={18} />
            Add Class
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="timetable-content">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'list' && renderListView()}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Class' : 'Add Class'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Day</label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  required
                >
                  {days.map(day => (
                    <option key={day.key} value={day.key}>{day.fullLabel}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Course</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => {
                    const c = getCourseById(e.target.value)
                    setFormData({
                      ...formData,
                      courseId: e.target.value,
                      venue: c ? c.venue : ''
                    })
                  }}
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
                  <label>Start</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Venue (Room/Lab)</label>
                <input
                  type="text"
                  placeholder="e.g. Room 301 (Optional)"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Class</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Timetable
