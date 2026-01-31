import { useState } from 'react'
import { useData } from '../context/DataContext'
import { 
  BookOpen, Clock, CheckCircle, TrendingUp, Calendar as CalendarIcon, 
  FileText, Plus, X, Target, Zap, ArrowUpRight, ChevronRight
} from 'lucide-react'
import './Dashboard.css'

const Dashboard = () => {
  const { courses, timetable, mindSpaceItems, grades, calendarEvents, addCalendarEvent } = useData()

  // Derived values
    const pendingTasks = mindSpaceItems.filter(i => !i.completed).length
  const completedTasks = mindSpaceItems.filter(i => i.completed).length
  const totalCredits = courses.reduce((acc, c) => acc + (parseFloat(c.credits) || 0), 0)

  // Calculate GPA (10-point scale)
  const gradePoints = {
    'S': 10.0, 'A': 9.0, 'B': 8.0, 'C': 7.0,
    'D': 6.0, 'E': 5.0
  }

  const calculateCGPA = () => {
    if (grades.length === 0) return '0.00'
    let totalPoints = 0
    let totalCredits = 0
    grades.forEach(grade => {
      const points = gradePoints[grade.grade] || 0
      const credits = parseFloat(grade.credits) || 0
      totalPoints += points * credits
      totalCredits += credits
    })
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'
  }

  const cgpa = calculateCGPA()

  // Event Modal State
    const [showEventModal, setShowEventModal] = useState(false)
    const [eventForm, setEventForm] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
    type: 'personal',
        description: ''
    })

  // Filter upcoming events
    const upcomingEvents = calendarEvents
        .filter(e => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
        .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')))
    .slice(0, 6)

    const handleEventSubmit = (e) => {
        e.preventDefault()
        addCalendarEvent(eventForm)
        setShowEventModal(false)
        setEventForm({
            title: '',
            date: new Date().toISOString().split('T')[0],
            time: '',
            type: 'personal',
            description: ''
        })
    }

  // Get today's classes
  const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const todayClasses = (timetable[todayKey] || []).sort((a, b) => a.startTime?.localeCompare(b.startTime))

  // Event type colors
  const eventTypeColors = {
    assignment: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    exam: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
    quiz: { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' },
    presentation: { bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' },
    personal: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' }
  }

    return (
    <div className="dashboard">
      {/* Stats Row */}
      <section className="stats-grid">
        <div className="stat-card stat-cgpa">
          <div className="stat-icon-wrap">
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Current CGPA</span>
            <span className="stat-value">{cgpa}</span>
            <span className="stat-meta">Based on {grades.length} courses</span>
                    </div>
          <div className="stat-glow stat-glow-blue"></div>
                </div>

        <div className="stat-card stat-courses">
          <div className="stat-icon-wrap purple">
            <BookOpen size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Active Courses</span>
            <span className="stat-value">{courses.length}</span>
            <span className="stat-meta">{totalCredits} total credits</span>
                    </div>
          <div className="stat-glow stat-glow-purple"></div>
                </div>

        <div className="stat-card stat-tasks">
          <div className="stat-icon-wrap cyan">
            <Target size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Pending Tasks</span>
            <span className="stat-value">{pendingTasks}</span>
            <span className="stat-meta">{completedTasks} completed</span>
                    </div>
          <div className="stat-glow stat-glow-cyan"></div>
                </div>

        <div className="stat-card stat-events">
          <div className="stat-icon-wrap green">
            <Zap size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Upcoming</span>
            <span className="stat-value">{upcomingEvents.length}</span>
            <span className="stat-meta">events this week</span>
                    </div>
          <div className="stat-glow stat-glow-green"></div>
                </div>
            </section>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Today's Schedule */}
        <section className="dashboard-card schedule-card">
                    <div className="card-header">
            <div className="card-title-group">
              <Clock size={18} className="card-icon" />
              <h3>Today's Schedule</h3>
                    </div>
            <span className="day-badge">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
                                    </div>

          <div className="schedule-list">
            {todayClasses.length > 0 ? (
              todayClasses.map((cls, idx) => {
                                const course = courses.find(c => c.id === cls.courseId)
                                if (!course) return null
                                return (
                  <div key={cls.period} className="schedule-item" style={{ '--delay': `${idx * 0.1}s` }}>
                    <div className="schedule-time">
                      <span className="time-start">{cls.startTime}</span>
                      <span className="time-end">{cls.endTime}</span>
                                        </div>
                    <div className="schedule-divider" style={{ background: course.color }}></div>
                    <div className="schedule-info">
                      <span className="schedule-course">{course.courseName}</span>
                      <div className="schedule-meta">
                        <span className="schedule-code">{course.courseCode}</span>
                        <span className="schedule-venue">{cls.venue || course.venue}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
            ) : (
              <div className="empty-state-small">
                <Clock size={32} className="text-muted" />
                <p>No classes today!</p>
                <span className="text-muted">Enjoy your free day</span>
                    </div>
            )}
                </div>
        </section>

        {/* Upcoming Events */}
        <section className="dashboard-card events-card">
                    <div className="card-header">
            <div className="card-title-group">
              <CalendarIcon size={18} className="card-icon" />
              <h3>Upcoming Events</h3>
            </div>
            <button className="add-btn" onClick={() => setShowEventModal(true)}>
                            <Plus size={16} />
                        </button>
                    </div>

          <div className="events-list">
                        {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, idx) => {
                const eventStyle = eventTypeColors[event.type] || eventTypeColors.personal
                const eventDate = new Date(event.date)
                return (
                  <div 
                    key={event.id} 
                    className="event-item"
                    style={{ '--delay': `${idx * 0.1}s` }}
                  >
                                    <div className="event-date-badge">
                      <span className="event-day">{eventDate.getDate()}</span>
                      <span className="event-month">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                    </div>
                    <div className="event-content">
                                        <span className="event-title">{event.title}</span>
                      <div className="event-meta">
                        <span 
                          className="event-type-badge"
                          style={{ 
                            background: eventStyle.bg, 
                            color: eventStyle.color,
                            borderColor: eventStyle.border 
                          }}
                        >
                          {event.type}
                        </span>
                        {event.time && (
                          <span className="event-time">
                            {new Date(`2000-01-01T${event.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                        )}
                    </div>
                    </div>
                    <ChevronRight size={16} className="event-arrow" />
                                    </div>
                )
              })
                        ) : (
                            <div className="empty-state-small">
                <CalendarIcon size={32} className="text-muted" />
                <p>No upcoming events</p>
                <button className="btn-text-action" onClick={() => setShowEventModal(true)}>
                  + Add Event
                </button>
                            </div>
                        )}
                    </div>
                </section>

        {/* Course Progress */}
        <section className="dashboard-card progress-card">
                    <div className="card-header">
            <div className="card-title-group">
              <BookOpen size={18} className="card-icon" />
              <h3>Course Progress</h3>
            </div>
            <a href="/courses" className="view-all-link">
              View All <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="progress-list">
            {courses.slice(0, 6).map((course, idx) => (
              <div key={course.id} className="progress-item" style={{ '--delay': `${idx * 0.1}s` }}>
                <div className="progress-header">
                  <div className="progress-course">
                    <span className="progress-code" style={{ color: course.color }}>{course.courseCode}</span>
                    <span className="progress-name">{course.courseName}</span>
                  </div>
                  <span className="progress-percent">{course.progress || 0}%</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${course.progress || 0}%`,
                      background: course.color
                    }}
                  ></div>
                </div>
                    </div>
            ))}
          </div>
        </section>

        {/* Quick Tasks */}
        <section className="dashboard-card tasks-card">
          <div className="card-header">
            <div className="card-title-group">
              <CheckCircle size={18} className="card-icon" />
              <h3>Recent Tasks</h3>
            </div>
            <a href="/mindspace" className="view-all-link">
              View All <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="tasks-list">
            {mindSpaceItems.filter(t => !t.completed).slice(0, 6).map((task, idx) => (
              <div 
                key={task.id} 
                className={`task-item ${task.completed ? 'completed' : ''}`}
                style={{ '--delay': `${idx * 0.1}s` }}
              >
                <div className={`task-checkbox ${task.completed ? 'checked' : ''}`}>
                  {task.completed && <CheckCircle size={14} />}
                </div>
                <div className="task-content">
                  <span className="task-title">{task.title}</span>
                  {task.content && <span className="task-desc">{task.content.substring(0, 50)}...</span>}
                </div>
                {task.priority && (
                  <span className={`priority-badge priority-${task.priority}`}>
                    {task.priority}
                  </span>
                )}
              </div>
            ))}
                    </div>
                </section>
            </div>

            {/* Add Event Modal */}
            {showEventModal && (
                <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Event</h2>
              <button className="icon-btn" onClick={() => setShowEventModal(false)}>
                <X size={20} />
              </button>
                        </div>
                        <form onSubmit={handleEventSubmit}>
                            <div className="form-group">
                                <label>Event Name</label>
                                <input
                                    type="text"
                                    required
                                    value={eventForm.title}
                                    onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                    placeholder="e.g. Project Submission"
                                />
                            </div>
                            <div className="form-row">
                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={eventForm.date}
                                        onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                                    />
                                </div>
                <div className="form-group">
                                    <label>Time</label>
                                    <input
                                        type="time"
                                        value={eventForm.time}
                                        onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
                                    />
                                </div>
                            </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={eventForm.type}
                  onChange={e => setEventForm({ ...eventForm, type: e.target.value })}
                >
                  <option value="personal">Personal</option>
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="quiz">Quiz</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>
                            <div className="form-group">
                                <label>Notes (Optional)</label>
                                <textarea
                                    rows="3"
                                    value={eventForm.description}
                                    onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                                    placeholder="Add any relevant details..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Add Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
    </div>
    )
}

export default Dashboard
