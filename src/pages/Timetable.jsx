import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Edit2, Trash2, X, Clock, MapPin, Calendar, List, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react'
import './Timetable.css'

const Timetable = () => {
  const { timetable, updateTimetable, courses, getCourseById } = useData()
  const [viewMode, setViewMode] = useState('day')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

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

  const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const initialDay = days.find(d => d.key === todayKey) ? todayKey : 'monday'
  const [activeDay, setActiveDay] = useState(initialDay)

  const handleSubmit = (e) => {
    e.preventDefault()
    const dayPeriods = [...(timetable[formData.day] || [])]
    const course = getCourseById(formData.courseId)
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

  const getDayClasses = (dayKey) => {
    const classes = timetable[dayKey] || []
    return [...classes].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  }

  const renderDayView = () => {
    const sortedClasses = getDayClasses(activeDay)
    const currentDayLabel = days.find(d => d.key === activeDay)?.fullLabel

    return (
      <div className="view-container fade-in">
        <div className="day-nav">
          <button className="nav-arrow" onClick={() => {
              const idx = days.findIndex(d => d.key === activeDay)
              const prev = days[idx - 1] || days[days.length - 1]
              setActiveDay(prev.key)
          }}>
            <ChevronLeft size={20} />
          </button>
          
          <div className="day-tabs">
            {days.slice(0, 5).map(day => (
          <button
                key={day.key}
                className={`day-tab ${activeDay === day.key ? 'active' : ''} ${day.key === todayKey ? 'today' : ''}`}
                onClick={() => setActiveDay(day.key)}
              >
                <span className="tab-label">{day.label}</span>
                {day.key === todayKey && <span className="today-dot"></span>}
              </button>
            ))}
          </div>
          
          <button className="nav-arrow" onClick={() => {
              const idx = days.findIndex(d => d.key === activeDay)
              const next = days[idx + 1] || days[0]
              setActiveDay(next.key)
          }}>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="classes-container">
        {sortedClasses.length > 0 ? (
            <div className="classes-list">
              {sortedClasses.map((item, idx) => {
              const course = getCourseById(item.courseId)
              if (!course) return null
              return (
                  <div 
                    key={item.period} 
                    className="class-card"
                    style={{ '--delay': `${idx * 0.1}s`, '--accent': course.color }}
                  >
                    <div className="class-time-block">
                      <span className="time-start">{item.startTime}</span>
                      <div className="time-line" style={{ background: course.color }}></div>
                      <span className="time-end">{item.endTime}</span>
                    </div>
                    <div className="class-content">
                      <div className="class-header">
                        <span className="class-code" style={{ color: course.color }}>{course.courseCode}</span>
                        <div className="class-actions">
                          <button onClick={() => handleEdit(activeDay, item.period)}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(activeDay, item.period)} className="delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                  </div>
                    <h3 className="class-name">{course.courseName}</h3>
                      <div className="class-meta">
                        <span className="meta-item">
                          <MapPin size={14} />
                          {item.venue || course.venue || 'TBA'}
                        </span>
                      </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
            <div className="empty-state-small">
              <Clock size={48} />
              <p>No classes on {currentDayLabel}</p>
            <button className="btn-text-action" onClick={() => {
              resetForm()
              setFormData(prev => ({ ...prev, day: activeDay }))
              setShowModal(true)
            }}>+ Add Class</button>
          </div>
        )}
        </div>
      </div>
    )
  }

  // Time slots for the grid
  const timeSlots = [
    { start: '09:00', end: '10:00', label: '09:00 - 10:00' },
    { start: '10:00', end: '11:00', label: '10:00 - 11:00' },
    { start: '11:00', end: '12:00', label: '11:00 - 12:00', isBreak: true },
    { start: '12:00', end: '13:00', label: '12:00 - 01:00' },
    { start: '14:00', end: '15:00', label: '02:00 - 03:00' },
    { start: '15:00', end: '16:00', label: '03:00 - 04:00' },
  ]

  // Find class for a specific day and time slot
  const getClassForSlot = (dayKey, slot) => {
    const dayClasses = timetable[dayKey] || []
    return dayClasses.find(cls => {
      const clsStart = cls.startTime
      return clsStart >= slot.start && clsStart < slot.end
    })
  }

  const renderWeekView = () => {
    const weekDays = days.slice(0, 5)

    return (
      <div className="view-container week-view fade-in">
        <div className="week-table-container">
          <table className="week-table">
            <thead>
              <tr>
                <th className="time-header">Time</th>
                {weekDays.map(day => (
                  <th key={day.key} className={`day-header ${day.key === todayKey ? 'today' : ''}`}>
                    {day.fullLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, slotIdx) => (
                <tr key={slot.label} className={slot.isBreak ? 'break-row' : ''}>
                  <td className="time-cell">{slot.label}</td>
                  {weekDays.map(day => {
                    if (slot.isBreak) {
                      return (
                        <td key={day.key} className="slot-cell break-cell">
                          <span className="break-text">Break</span>
                        </td>
                      )
                    }

                    const classItem = getClassForSlot(day.key, slot)
                    const course = classItem ? getCourseById(classItem.courseId) : null

                    if (course) {
                      return (
                        <td key={day.key} className="slot-cell">
                          <div 
                            className="slot-class"
                            style={{ 
                              '--accent': course.color,
                              backgroundColor: `${course.color}15`,
                              borderColor: `${course.color}30`
                            }}
                            onClick={() => handleEdit(day.key, classItem.period)}
                          >
                            <span className="slot-course-name" style={{ color: course.color }}>
                              {course.courseName}
                            </span>
                            <span className="slot-details">
                              {course.courseCode} • {classItem.venue || course.venue}
                            </span>
                          </div>
                        </td>
                      )
                    }

                    return (
                      <td key={day.key} className="slot-cell empty-cell">
                        <span className="free-text">Free</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderListView = () => {
    const allDaysWithClasses = days.filter(d => (timetable[d.key] || []).length > 0)

    return (
      <div className="view-container list-view fade-in">
        {allDaysWithClasses.length > 0 ? (
          allDaysWithClasses.map(day => (
            <div key={day.key} className="list-day-section">
              <h3 className="list-day-title">{day.fullLabel}</h3>
              <div className="list-classes">
                {getDayClasses(day.key).map((item, idx) => {
                  const course = getCourseById(item.courseId)
                  if (!course) return null
                  return (
                    <div 
                      key={item.period} 
                      className="list-item"
                      style={{ '--delay': `${idx * 0.05}s` }}
                    >
                      <div className="list-time">{item.startTime} - {item.endTime}</div>
                      <div className="list-color" style={{ background: course.color }}></div>
                      <div className="list-info">
                        <span className="list-name">{course.courseName}</span>
                        <span className="list-venue">{item.venue || course.venue}</span>
                      </div>
                      <button className="list-edit" onClick={() => handleEdit(day.key, item.period)}>
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <List size={48} />
            <h3>No classes scheduled</h3>
            <p>Start adding classes to build your timetable</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Add Class
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="timetable-page">
      <div className="page-header">
        <div>
          <h1>Timetable</h1>
          <p className="subtitle">Your weekly class schedule</p>
        </div>

        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              <LayoutGrid size={18} />
              <span>Day</span>
            </button>
            <button
              className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              <Calendar size={18} />
              <span>Week</span>
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
              <span>List</span>
            </button>
          </div>

          <button className="btn-primary" onClick={() => {
              resetForm()
              setFormData(prev => ({ ...prev, day: activeDay }))
              setShowModal(true)
          }}>
            <Plus size={18} />
            Add Class
          </button>
        </div>
      </div>

      <div className="timetable-content">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'list' && renderListView()}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Class' : 'Add Class'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
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
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Venue</label>
                <input
                  type="text"
                  placeholder="Room/Lab (Optional)"
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
