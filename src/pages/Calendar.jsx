import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Edit2, Trash2, X, BookOpen } from 'lucide-react'
import './Calendar.css'

const Calendar = () => {
  const { 
    calendarEvents, 
    addCalendarEvent, 
    updateCalendarEvent, 
    deleteCalendarEvent,
    courses,
    getCourseById
  } = useData()
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'assignment',
    courseId: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, formData)
    } else {
      addCalendarEvent(formData)
    }
    resetForm()
    setShowModal(false)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      type: 'assignment',
      courseId: ''
    })
    setEditingEvent(null)
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title || '',
      description: event.description || '',
      date: event.date || '',
      time: event.time || '',
      type: event.type || 'assignment',
      courseId: event.courseId || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteCalendarEvent(id)
    }
  }

  const sortedEvents = [...calendarEvents].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00'}`)
    const dateB = new Date(`${b.date}T${b.time || '00:00'}`)
    return dateA - dateB
  })

  const eventTypeColors = {
    assignment: '#ef4444',
    exam: '#f59e0b',
    lecture: '#3b82f6',
    meeting: '#10b981',
    other: '#8b5cf6'
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Calendar</h1>
          <p>Manage your calendar events and assignments</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
        >
          <Plus size={18} />
          Add Event
        </button>
      </div>

      <div className="calendar-events">
        {sortedEvents.map((event) => {
          const course = event.courseId ? getCourseById(event.courseId) : null
          const eventColor = eventTypeColors[event.type] || eventTypeColors.other
          
          return (
            <div 
              key={event.id} 
              className="event-card"
              style={{ borderLeftColor: eventColor }}
            >
              <div className="event-card-header">
                <div>
                  <h3>{event.title}</h3>
                  <div className="event-meta">
                    <span className="event-date">
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                      {event.time && ` • ${event.time}`}
                    </span>
                    <span 
                      className="event-type"
                      style={{ backgroundColor: eventColor + '20', color: eventColor }}
                    >
                      {event.type}
                    </span>
                  </div>
                </div>
                <div className="event-actions">
                  <button 
                    className="icon-btn"
                    onClick={() => handleEdit(event)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="icon-btn"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {event.description && (
                <p className="event-description">{event.description}</p>
              )}

              {course && (
                <div className="event-course">
                  <BookOpen size={14} />
                  <span>{course.courseCode} - {course.courseName}</span>
                </div>
              )}
            </div>
          )
        })}

        {calendarEvents.length === 0 && (
          <div className="empty-state">
            <p>No calendar events yet. Add your first event to get started!</p>
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
              <h2>{editingEvent ? 'Edit Event' : 'Add New Event'}</h2>
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
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Assignment 1"
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="lecture">Lecture</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Course (Optional)</label>
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
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Event description..."
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
                  {editingEvent ? 'Update' : 'Add'} Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
